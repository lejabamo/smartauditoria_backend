"""
bulk_activos_service.py — Servicio de Procesamiento, Normalización y Enriquecimiento
Inteligente de Activos de Información bajo la Guía Integral Función Pública V7 (2025)
y Ley 1712 de 2014.
"""

import io
import csv
import re
from typing import List, Dict, Any, Tuple
import openpyxl
from ..utils.logger import get_logger
from ..models import db, Activo

logger = get_logger(__name__)

# Mapeo de cabeceras comunes a los atributos del modelo Activo DAFP V7
HEADER_MAPPING = {
    # Nombre
    "nombre": "Nombre",
    "nombre del activo": "Nombre",
    "nombre_activo": "Nombre",
    "activo": "Nombre",
    "nombreactivo": "Nombre",

    # Descripción
    "descripcion": "Descripcion",
    "descripción": "Descripcion",
    "detalle": "Descripcion",
    "descripcion del activo": "Descripcion",

    # Tipo de Activo
    "tipo": "Tipo_Activo",
    "tipo de activo": "Tipo_Activo",
    "tipo_activo": "Tipo_Activo",
    "categoria": "Tipo_Activo",
    "categoría": "Tipo_Activo",

    # Subtipo
    "subtipo": "subtipo_activo",
    "subtipo de activo": "subtipo_activo",
    "subtipo_activo": "subtipo_activo",

    # Macroproceso & Proceso
    "macroproceso": "macroproceso",
    "macro proceso": "macroproceso",
    "proceso": "proceso",

    # TRD & Responsable
    "identificador trd": "identificador_trd",
    "identificador_trd": "identificador_trd",
    "codigo trd": "identificador_trd",
    "código trd": "identificador_trd",
    "trd": "identificador_trd",
    "oficina responsable": "oficina_responsable",
    "oficina_responsable": "oficina_responsable",
    "responsable": "oficina_responsable",
    "oficina": "oficina_responsable",

    # Serie & Subserie
    "serie documental": "serie_documental",
    "serie_documental": "serie_documental",
    "serie": "serie_documental",
    "subserie documental": "subserie_documental",
    "subserie_documental": "subserie_documental",
    "subserie": "subserie_documental",

    # Soporte y Medio
    "soporte registro": "soporte_registro",
    "soporte_registro": "soporte_registro",
    "soporte": "soporte_registro",
    "soporte / registro": "soporte_registro",
    "medio conservacion": "medio_conservacion",
    "medio conservación": "medio_conservacion",
    "medio_conservacion": "medio_conservacion",
    "medio": "medio_conservacion",

    # Formato e Idioma
    "formato": "formato",
    "idioma": "idioma",

    # ICCN & Ley 1712
    "es iccn": "es_iccn",
    "es_iccn": "es_iccn",
    "iccn": "es_iccn",
    "es clasificada reservada": "es_clasificada_reservada",
    "es_clasificada_reservada": "es_clasificada_reservada",
    "clasificada reservada": "es_clasificada_reservada",
    "clasificada_reservada": "es_clasificada_reservada",
    "ley 1712": "es_clasificada_reservada",
    "reservada": "es_clasificada_reservada",
    "objeto legitimo excepcion": "objeto_legitimo_excepcion",
    "objeto_legitimo_excepcion": "objeto_legitimo_excepcion",
    "fundamento legal": "fundamento_legal",
    "fundamento_legal": "fundamento_legal",
    "alcance excepcion": "excepcion_alcance",
    "excepcion_alcance": "excepcion_alcance",

    # Valoración CIA / CID
    "confidencialidad": "Nivel_Clasificacion_Confidencialidad",
    "c": "Nivel_Clasificacion_Confidencialidad",
    "integridad": "Nivel_Clasificacion_Integridad",
    "i": "Nivel_Clasificacion_Integridad",
    "disponibilidad": "Nivel_Clasificacion_Disponibilidad",
    "d": "Nivel_Clasificacion_Disponibilidad",

    # Criticidad y Estado
    "criticidad": "nivel_criticidad_negocio",
    "criticidad negocio": "nivel_criticidad_negocio",
    "nivel criticidad": "nivel_criticidad_negocio",
    "nivel_criticidad_negocio": "nivel_criticidad_negocio",
    "estado": "estado_activo",
    "estado activo": "estado_activo",
    "estado_activo": "estado_activo",

    # Ubicación y Backup
    "ubicacion consulta": "ubicacion_consulta",
    "ubicacion_consulta": "ubicacion_consulta",
    "ubicacion": "ubicacion_consulta",
    "requiere backup": "requiere_backup",
    "requiere_backup": "requiere_backup",
    "frecuencia backup": "frecuencia_backup_general",
    "frecuencia_backup_general": "frecuencia_backup_general",
    "tiempo retencion": "tiempo_retencion_general",
    "tiempo_retencion_general": "tiempo_retencion_general",
}

def clean_key(key: str) -> str:
    """Normaliza un texto de encabezado eliminando acentos, espacios extra y símbolos."""
    if not key:
        return ""
    k = str(key).strip().lower()
    k = k.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    k = re.sub(r'[\s_\-]+', ' ', k)
    return k

def parse_bool(val: Any) -> bool:
    """Interpreta valores booleanos comunes en hojas de cálculo."""
    if isinstance(val, bool):
        return val
    if val is None:
        return False
    s = str(val).strip().lower()
    return s in ("si", "sí", "true", "1", "s", "verdadero", "yes", "y")

def normalize_level(val: Any, default="Medio") -> str:
    """Normaliza niveles de criticidad o CIA a Bajo, Medio, Alto, Crítico."""
    if not val:
        return default
    s = str(val).strip().lower()
    s = s.replace("í", "i").replace("á", "a").replace("é", "e").replace("ó", "o").replace("ú", "u")
    if "crit" in s or (s.startswith("cr") and "tic" in s) or "crt" in s:
        return "Crítico"
    if "alt" in s:
        return "Alto"
    if "med" in s:
        return "Medio"
    if "baj" in s:
        return "Bajo"
    return default

class BulkActivosService:

    @classmethod
    def normalize_row(cls, raw_row: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza las llaves y valores de una fila cruda hacia los campos de Activo."""
        normalized: Dict[str, Any] = {}
        for raw_k, raw_v in raw_row.items():
            if raw_v is None:
                continue
            cleaned = clean_key(raw_k)
            mapped_field = HEADER_MAPPING.get(cleaned)
            if not mapped_field:
                # Intento por coincidencia de subcadena
                for h_k, target_col in HEADER_MAPPING.items():
                    if cleaned == h_k or cleaned.startswith(h_k):
                        mapped_field = target_col
                        break
            
            if mapped_field:
                normalized[mapped_field] = raw_v

        # Normalizaciones de tipo
        if "es_iccn" in normalized:
            normalized["es_iccn"] = parse_bool(normalized["es_iccn"])
        if "es_clasificada_reservada" in normalized:
            normalized["es_clasificada_reservada"] = parse_bool(normalized["es_clasificada_reservada"])
        if "requiere_backup" in normalized:
            normalized["requiere_backup"] = parse_bool(normalized["requiere_backup"])

        if "Nivel_Clasificacion_Confidencialidad" in normalized:
            normalized["Nivel_Clasificacion_Confidencialidad"] = normalize_level(normalized["Nivel_Clasificacion_Confidencialidad"])
        if "Nivel_Clasificacion_Integridad" in normalized:
            normalized["Nivel_Clasificacion_Integridad"] = normalize_level(normalized["Nivel_Clasificacion_Integridad"], default="Alto")
        if "Nivel_Clasificacion_Disponibilidad" in normalized:
            normalized["Nivel_Clasificacion_Disponibilidad"] = normalize_level(normalized["Nivel_Clasificacion_Disponibilidad"])
        if "nivel_criticidad_negocio" in normalized:
            normalized["nivel_criticidad_negocio"] = normalize_level(normalized["nivel_criticidad_negocio"])

        # Soporte de registro por defecto
        if "soporte_registro" in normalized:
            s_soporte = str(normalized["soporte_registro"]).strip().capitalize()
            if "fis" in s_soporte.lower():
                normalized["soporte_registro"] = "Físico"
            elif "hib" in s_soporte.lower():
                normalized["soporte_registro"] = "Híbrido"
            else:
                normalized["soporte_registro"] = "Digital"
        else:
            normalized["soporte_registro"] = "Digital"

        # Tipo de Activo por defecto si no está especificado
        if not normalized.get("Tipo_Activo"):
            normalized["Tipo_Activo"] = "Información y datos"

        return normalized

    @classmethod
    def parse_file_content(cls, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """Parsea bytes de un archivo Excel (.xlsx/.xls) o CSV a una lista de diccionarios normalizados."""
        rows: List[Dict[str, Any]] = []
        fn_lower = filename.lower()

        if fn_lower.endswith(('.xlsx', '.xlsm', '.xltx', '.xltm')):
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            ws = wb.active
            iter_rows = ws.iter_rows(values_only=True)
            headers = next(iter_rows, None)
            if not headers:
                return []
            
            clean_headers = [str(h).strip() if h is not None else f"col_{idx}" for idx, h in enumerate(headers)]
            for r in iter_rows:
                if not any(r):
                    continue
                row_dict = {clean_headers[i]: r[i] for i in range(min(len(clean_headers), len(r)))}
                norm = cls.normalize_row(row_dict)
                if norm.get("Nombre"):
                    rows.append(norm)

        elif fn_lower.endswith('.csv') or fn_lower.endswith('.txt'):
            # Detectar encoding y delimitador
            text_data = None
            for enc in ('utf-8-sig', 'utf-8', 'latin-1', 'cp1252'):
                try:
                    text_data = file_bytes.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue
            
            if not text_data:
                raise ValueError("No se pudo decodificar el archivo CSV con los juegos de caracteres soportados.")

            # Detectar delimitador (, o ;)
            sample = text_data[:2048]
            delimiter = ';' if sample.count(';') > sample.count(',') else ','
            
            reader = csv.DictReader(io.StringIO(text_data), delimiter=delimiter)
            for raw_r in reader:
                if not any(raw_r.values()):
                    continue
                norm = cls.normalize_row(raw_r)
                if norm.get("Nombre"):
                    rows.append(norm)
        else:
            raise ValueError(f"Formato de archivo '{filename}' no soportado. Suba un archivo .xlsx o .csv")

        return rows

    @classmethod
    def enrich_rows_with_ai(cls, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enriquece las filas que tengan campos ausentes utilizando el Auditor Copilot (CAG & RAG).
        Infiere: Tipo de Activo, TRD sugerida, valoración CID, Ley 1712 y Criticidad.
        """
        from ..infrastructure.ia_client.rag_client import rag_client

        enriched_list = []
        for row in rows:
            enriched_row = dict(row)
            campos_enriquecidos = []

            # Verificar si amerita enriquecimiento
            needs_type = not enriched_row.get("Tipo_Activo") or enriched_row.get("Tipo_Activo") == "Información y datos"
            needs_trd = not enriched_row.get("identificador_trd") or not enriched_row.get("proceso")
            needs_cid = not enriched_row.get("Nivel_Clasificacion_Confidencialidad") or not enriched_row.get("Nivel_Clasificacion_Integridad")
            needs_ley1712 = enriched_row.get("es_clasificada_reservada") is None or not enriched_row.get("fundamento_legal")
            needs_criticidad = not enriched_row.get("nivel_criticidad_negocio")

            nombre = enriched_row.get("Nombre", "")
            descripcion = enriched_row.get("Descripcion", "")
            tipo_actual = enriched_row.get("Tipo_Activo", "Información y datos")

            try:
                assessment = rag_client.copilot_assess_asset(
                    asset_name=nombre,
                    asset_type=tipo_actual,
                    description=descripcion
                )

                if assessment:
                    # Inferencia de Tipo de Activo
                    if needs_type and assessment.get("tipo_activo_sugerido"):
                        enriched_row["Tipo_Activo"] = assessment["tipo_activo_sugerido"]
                        campos_enriquecidos.append("Tipo_Activo")

                    # Inferencia de TRD
                    trd_info = assessment.get("trd_sugerida", {})
                    if trd_info:
                        if not enriched_row.get("proceso") and trd_info.get("proceso"):
                            enriched_row["proceso"] = trd_info["proceso"]
                            campos_enriquecidos.append("proceso")
                        if not enriched_row.get("identificador_trd") and trd_info.get("identificador_sugerido"):
                            enriched_row["identificador_trd"] = trd_info["identificador_sugerido"]
                            campos_enriquecidos.append("identificador_trd")
                        if not enriched_row.get("serie_documental") and trd_info.get("serie_sugerida"):
                            enriched_row["serie_documental"] = trd_info["serie_sugerida"]
                            campos_enriquecidos.append("serie_documental")
                        if not enriched_row.get("subserie_documental") and trd_info.get("subserie_sugerida"):
                            enriched_row["subserie_documental"] = trd_info["subserie_sugerida"]
                            campos_enriquecidos.append("subserie_documental")

                    # Inferencia de Valoración CID
                    cid_info = assessment.get("valoracion_cid", {})
                    if cid_info:
                        if not enriched_row.get("Nivel_Clasificacion_Confidencialidad") and cid_info.get("confidencialidad"):
                            enriched_row["Nivel_Clasificacion_Confidencialidad"] = normalize_level(cid_info["confidencialidad"])
                            campos_enriquecidos.append("Nivel_Clasificacion_Confidencialidad")
                        if not enriched_row.get("Nivel_Clasificacion_Integridad") and cid_info.get("integridad"):
                            enriched_row["Nivel_Clasificacion_Integridad"] = normalize_level(cid_info["integridad"])
                            campos_enriquecidos.append("Nivel_Clasificacion_Integridad")
                        if not enriched_row.get("Nivel_Clasificacion_Disponibilidad") and cid_info.get("disponibilidad"):
                            enriched_row["Nivel_Clasificacion_Disponibilidad"] = normalize_level(cid_info["disponibilidad"])
                            campos_enriquecidos.append("Nivel_Clasificacion_Disponibilidad")

                    # Inferencia Ley 1712
                    ley_info = assessment.get("analisis_ley_1712", {})
                    if ley_info:
                        if enriched_row.get("es_clasificada_reservada") is None and "es_clasificada_reservada" in ley_info:
                            enriched_row["es_clasificada_reservada"] = bool(ley_info["es_clasificada_reservada"])
                            campos_enriquecidos.append("es_clasificada_reservada")
                        if not enriched_row.get("fundamento_legal") and ley_info.get("fundamento_legal"):
                            enriched_row["fundamento_legal"] = ley_info["fundamento_legal"]
                            campos_enriquecidos.append("fundamento_legal")
                        if not enriched_row.get("objeto_legitimo_excepcion") and ley_info.get("objeto_legitimo"):
                            enriched_row["objeto_legitimo_excepcion"] = ley_info["objeto_legitimo"]
                            campos_enriquecidos.append("objeto_legitimo_excepcion")
                        if not enriched_row.get("nivel_criticidad_negocio") and ley_info.get("nivel_criticidad"):
                            enriched_row["nivel_criticidad_negocio"] = normalize_level(ley_info["nivel_criticidad"])
                            campos_enriquecidos.append("nivel_criticidad_negocio")

            except Exception as e:
                logger.warning("No se pudo enriquecer el activo '%s' con Copilot IA: %s", nombre, str(e))

            if campos_enriquecidos:
                enriched_row["enriquecido_por_ia"] = True
                enriched_row["campos_enriquecidos"] = campos_enriquecidos
            else:
                enriched_row["enriquecido_por_ia"] = False
                enriched_row["campos_enriquecidos"] = []

            enriched_list.append(enriched_row)

        return enriched_list

    @classmethod
    def save_bulk_activos(cls, rows: List[Dict[str, Any]], user_id: int) -> Tuple[int, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Persiste los activos válidos en MariaDB. Retorna (total_creados, creados, errores).
        """
        creados = []
        errores = []

        for idx, row in enumerate(rows):
            nombre = row.get("Nombre")
            if not nombre:
                errores.append({"fila": idx + 1, "error": "El nombre del activo es obligatorio."})
                continue

            try:
                activo = Activo(
                    Nombre=nombre,
                    Descripcion=row.get("Descripcion") or f"Activo registrado vía carga masiva: {nombre}",
                    Tipo_Activo=row.get("Tipo_Activo") or "Información y datos",
                    subtipo_activo=row.get("subtipo_activo"),
                    estado_activo=row.get("estado_activo") or "En produccion",
                    nivel_criticidad_negocio=row.get("nivel_criticidad_negocio") or "Medio",
                    Nivel_Clasificacion_Confidencialidad=row.get("Nivel_Clasificacion_Confidencialidad") or "Medio",
                    Nivel_Clasificacion_Integridad=row.get("Nivel_Clasificacion_Integridad") or "Alto",
                    Nivel_Clasificacion_Disponibilidad=row.get("Nivel_Clasificacion_Disponibilidad") or "Medio",
                    justificacion_clasificacion_cia=row.get("justificacion_clasificacion_cia"),
                    ID_Propietario=user_id,
                    ID_Custodio=user_id,
                    macroproceso=row.get("macroproceso"),
                    proceso=row.get("proceso"),
                    identificador_trd=row.get("identificador_trd"),
                    oficina_responsable=row.get("oficina_responsable"),
                    serie_documental=row.get("serie_documental"),
                    subserie_documental=row.get("subserie_documental"),
                    soporte_registro=row.get("soporte_registro") or "Digital",
                    medio_conservacion=row.get("medio_conservacion"),
                    formato=row.get("formato"),
                    idioma=row.get("idioma") or "Español",
                    es_iccn=bool(row.get("es_iccn", False)),
                    estado_publicacion=row.get("estado_publicacion") or "No Publicada",
                    ubicacion_consulta=row.get("ubicacion_consulta"),
                    es_clasificada_reservada=bool(row.get("es_clasificada_reservada", False)),
                    objeto_legitimo_excepcion=row.get("objeto_legitimo_excepcion"),
                    fundamento_legal=row.get("fundamento_legal"),
                    excepcion_alcance=row.get("excepcion_alcance") or "Total",
                    requiere_backup=bool(row.get("requiere_backup", True)),
                    frecuencia_backup_general=row.get("frecuencia_backup_general"),
                    tiempo_retencion_general=row.get("tiempo_retencion_general"),
                )
                db.session.add(activo)
                db.session.flush()
                creados.append(activo.to_dict())
            except Exception as ex:
                logger.error("Error guardando activo fila %s (%s): %s", idx + 1, nombre, str(ex))
                errores.append({"fila": idx + 1, "nombre": nombre, "error": str(ex)})

        try:
            db.session.commit()
        except Exception as commit_ex:
            db.session.rollback()
            logger.error("Error en commit de carga masiva: %s", str(commit_ex))
            raise commit_ex

        return len(creados), creados, errores

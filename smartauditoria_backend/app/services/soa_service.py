"""
soa_service.py — Servicio de Declaración de Aplicabilidad (SoA ISO/IEC 27001 / 27002:2022)
Calcula métricas de cobertura por tema, gestiona aplicabilidad y ofrece auditoría agéntica.
"""

from typing import List, Dict, Any, Optional
from ..utils.logger import get_logger
from ..models import db
from sqlalchemy import text

logger = get_logger(__name__)

class SoAService:

    TEMAS_ISO = ["Organizacional", "Personas", "Fisico", "Tecnologico"]

    @classmethod
    def calculate_soa_metrics(cls, controls: List[Any]) -> Dict[str, Any]:
        """Calcula métricas globales y por tema para la lista de controles."""
        total = len(controls)
        if total == 0:
            return {
                "total": 0,
                "aplicables": 0,
                "no_aplicables": 0,
                "implementados": 0,
                "parciales": 0,
                "no_implementados": 0,
                "porcentaje_aplicabilidad": 0.0,
                "porcentaje_implementacion": 0.0,
                "por_tema": {t: {"total": 0, "implementados": 0, "parciales": 0, "no_aplica": 0, "no_implementados": 0, "porcentaje": 0.0} for t in cls.TEMAS_ISO}
            }

        aplicables = 0
        no_aplicables = 0
        implementados = 0
        parciales = 0
        no_implementados = 0

        por_tema = {
            t: {"total": 0, "implementados": 0, "parciales": 0, "no_aplica": 0, "no_implementados": 0, "porcentaje": 0.0}
            for t in cls.TEMAS_ISO
        }

        for c in controls:
            tema = getattr(c, "categoria_control_iso", None) or "Organizacional"
            if tema not in por_tema:
                tema = "Organizacional"

            por_tema[tema]["total"] += 1
            estado = getattr(c, "estado_implementacion", "") or ""

            if estado == "No Aplica":
                no_aplicables += 1
                por_tema[tema]["no_aplica"] += 1
            else:
                aplicables += 1
                if estado == "Implementado":
                    implementados += 1
                    por_tema[tema]["implementados"] += 1
                elif estado in ("Parcialmente Implementado", "En Diseno", "En Prueba"):
                    parciales += 1
                    por_tema[tema]["parciales"] += 1
                else:
                    no_implementados += 1
                    por_tema[tema]["no_implementados"] += 1

        pct_aplicabilidad = round((aplicables / total) * 100, 2) if total > 0 else 0.0
        pct_implementacion = round((implementados / aplicables) * 100, 2) if aplicables > 0 else 0.0

        for t in cls.TEMAS_ISO:
            tema_aplicables = por_tema[t]["total"] - por_tema[t]["no_aplica"]
            if tema_aplicables > 0:
                por_tema[t]["porcentaje"] = round((por_tema[t]["implementados"] / tema_aplicables) * 100, 2)
            else:
                por_tema[t]["porcentaje"] = 100.0 if por_tema[t]["total"] > 0 else 0.0

        return {
            "total": total,
            "aplicables": aplicables,
            "no_aplicables": no_aplicables,
            "implementados": implementados,
            "parciales": parciales,
            "no_implementados": no_implementados,
            "porcentaje_aplicabilidad": pct_aplicabilidad,
            "porcentaje_implementacion": pct_implementacion,
            "por_tema": por_tema
        }

    @classmethod
    def get_soa_data(cls, tema: Optional[str] = None) -> Dict[str, Any]:
        """Obtiene la Declaración de Aplicabilidad desde la BD con métricas completas."""
        query_sql = """
            SELECT 
                ID_Control,
                codigo_control_iso,
                Nombre,
                Descripcion,
                Tipo_Control,
                Formalidad_Control,
                categoria_control_iso,
                estado_implementacion,
                justificacion_no_aplicabilidad,
                efectividad_control_evaluada,
                documentacion_asociada_ref
            FROM controles
            ORDER BY 
                CASE categoria_control_iso
                    WHEN 'Organizacional' THEN 1
                    WHEN 'Personas' THEN 2
                    WHEN 'Fisico' THEN 3
                    WHEN 'Tecnologico' THEN 4
                    ELSE 5
                END,
                codigo_control_iso ASC
        """
        all_controls = db.session.execute(text(query_sql)).fetchall()

        # Convertir a objetos o diccionarios
        formatted_all = []
        for row in all_controls:
            formatted_all.append(type("ControlRow", (), {
                "ID_Control": row.ID_Control,
                "codigo_control_iso": row.codigo_control_iso,
                "Nombre": row.Nombre,
                "Descripcion": row.Descripcion,
                "Tipo_Control": row.Tipo_Control,
                "Formalidad_Control": row.Formalidad_Control,
                "categoria_control_iso": row.categoria_control_iso,
                "estado_implementacion": row.estado_implementacion,
                "justificacion_no_aplicabilidad": row.justificacion_no_aplicabilidad,
                "efectividad_control_evaluada": row.efectividad_control_evaluada,
                "documentacion_asociada_ref": row.documentacion_asociada_ref,
                "to_dict": lambda s=row: {
                    "ID_Control": s.ID_Control,
                    "id": s.ID_Control,
                    "codigo_control_iso": s.codigo_control_iso,
                    "Nombre": s.Nombre,
                    "Descripcion": s.Descripcion,
                    "Tipo_Control": s.Tipo_Control,
                    "Formalidad_Control": s.Formalidad_Control,
                    "categoria_control_iso": s.categoria_control_iso,
                    "estado_implementacion": s.estado_implementacion,
                    "aplica": s.estado_implementacion != "No Aplica",
                    "justificacion_no_aplicabilidad": s.justificacion_no_aplicabilidad,
                    "justificacion_inclusion_exclusion": s.justificacion_no_aplicabilidad,
                    "efectividad_control_evaluada": s.efectividad_control_evaluada,
                    "documentacion_asociada_ref": s.documentacion_asociada_ref
                }
            })())

        metrics = cls.calculate_soa_metrics(formatted_all)

        filtered = formatted_all
        if tema and tema in cls.TEMAS_ISO:
            filtered = [c for c in formatted_all if c.categoria_control_iso == tema]

        return {
            "norma": "ISO/IEC 27001:2022 / ISO/IEC 27002:2022",
            "metricas": metrics,
            "total_filtrados": len(filtered),
            "controles": [c.to_dict() for c in filtered]
        }

    @classmethod
    def update_control(cls, id_control: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Actualiza el estado de aplicabilidad y documentación de un control SoA."""
        update_fields = []
        params = {"id": id_control}

        if "estado_implementacion" in data:
            update_fields.append("estado_implementacion = :estado")
            params["estado"] = data["estado_implementacion"]

        if "aplica" in data:
            if not data["aplica"]:
                update_fields.append("estado_implementacion = 'No Aplica'")
            elif data.get("estado_implementacion") == "No Aplica" or "estado_implementacion" not in data:
                update_fields.append("estado_implementacion = 'Parcialmente Implementado'")

        just = data.get("justificacion_no_aplicabilidad")
        if just is None:
            just = data.get("justificacion_inclusion_exclusion")
        if just is not None:
            update_fields.append("justificacion_no_aplicabilidad = :just")
            params["just"] = just

        if "documentacion_asociada_ref" in data:
            update_fields.append("documentacion_asociada_ref = :doc_ref")
            params["doc_ref"] = data["documentacion_asociada_ref"]

        if "efectividad_control_evaluada" in data:
            update_fields.append("efectividad_control_evaluada = :efectividad")
            params["efectividad"] = data["efectividad_control_evaluada"]

        if not update_fields:
            raise ValueError("No se proporcionaron campos para actualizar.")

        sql = f"UPDATE controles SET {', '.join(update_fields)} WHERE ID_Control = :id"
        db.session.execute(text(sql), params)
        db.session.commit()

        # Retornar control actualizado
        row = db.session.execute(
            text("SELECT * FROM controles WHERE ID_Control = :id"),
            {"id": id_control}
        ).fetchone()

        return {
            "ID_Control": row.ID_Control,
            "id": row.ID_Control,
            "codigo_control_iso": row.codigo_control_iso,
            "Nombre": row.Nombre,
            "categoria_control_iso": row.categoria_control_iso,
            "estado_implementacion": row.estado_implementacion,
            "aplica": row.estado_implementacion != "No Aplica",
            "justificacion_no_aplicabilidad": row.justificacion_no_aplicabilidad,
            "justificacion_inclusion_exclusion": row.justificacion_no_aplicabilidad,
            "documentacion_asociada_ref": row.documentacion_asociada_ref,
            "efectividad_control_evaluada": row.efectividad_control_evaluada
        }

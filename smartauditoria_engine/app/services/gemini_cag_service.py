"""
gemini_cag_service.py — Servicio de Inteligencia Artificial para SmartAuditorIA
Arquitectura: Cache-Augmented Generation (CAG) + Inferencia Dual (Gemini 2.0 / Motor Autónomo ISO 2022)
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Generator

logger = logging.getLogger("SmartAuditorIA.CAG")

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "iso_27002_2022_catalog.json"

class GeminiCAGService:
    def __init__(self):
        self.catalog = self._load_catalog()
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.has_gemini = False
        self.model = None

        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                system_instruction = self._build_system_instruction()
                # Preferir gemini-2.0-flash o gemini-1.5-flash
                self.model = genai.GenerativeModel(
                    model_name="gemini-2.0-flash",
                    system_instruction=system_instruction
                )
                self.has_gemini = True
                logger.info("GeminiCAGService inicializado exitosamente con Gemini 2.0 Flash (CAG activo)")
            except Exception as e:
                logger.warning(f"Error configurando Gemini, operando en modo Autónomo Local: {e}")
                self.has_gemini = False
        else:
            logger.info("GeminiCAGService operando en modo Autónomo Local con Catálogo ISO 27002:2022 (93 controles)")

    def _load_catalog(self) -> Dict[str, Any]:
        if CATALOG_PATH.exists():
            try:
                with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error cargando catálogo ISO 27002:2022: {e}")
        return {"controles": []}

    def _build_system_instruction(self) -> str:
        """Construye el contexto normativo integral para la ventana de contexto de Gemini."""
        total = self.catalog.get("total_controles", 93)
        summary = (
            f"Eres SmartAuditor Copilot, un auditor líder y experto en ciberseguridad y gestión de riesgos "
            f"certificado en ISO/IEC 27001:2022, ISO/IEC 27002:2022 (93 controles canónicos) e ISO/IEC 27005:2022.\n"
            f"Tu misión es asistir de forma proactiva, rigurosa y empática al auditor en el análisis de activos, "
            f"evaluación de riesgos CIA (Confidencialidad, Integridad, Disponibilidad), recomendación de controles "
            f"mitigantes del Anexo A y formulación de planes de acción para No Conformidades.\n\n"
            f"REGLAS OBLIGATORIAS:\n"
            f"1. Cita SIEMPRE el identificador oficial de la norma (ej. 'A.8.24 Uso de criptografía' o 'A.5.15 Control de acceso').\n"
            f"2. Utiliza la taxonomía 2022 de 4 temas: Organizacional (Cláusula 5), Personas (Cláusula 6), Físico (Cláusula 7), Tecnológico (Cláusula 8).\n"
            f"3. Proporciona justificaciones técnicas claras orientadas a la realidad de la entidad (Gobierno / Educación / TI).\n"
            f"4. Sugiere acciones concretas y ejecutables con botones de 1-clic."
        )
        return summary

    def suggest_controls(self, asset_name: str, asset_type: str, threat: str = "", vulnerability: str = "", risk_level: str = "HIGH") -> Dict[str, Any]:
        """Sugiere controles mitigantes basados en el activo y vector de riesgo."""
        # Si Gemini está activo, podemos enriquecer la inferencia
        if self.has_gemini and self.model:
            try:
                prompt = (
                    f"Analiza el siguiente escenario de riesgo y selecciona los 3 mejores controles de ISO 27002:2022:\n"
                    f"- Activo: {asset_name} ({asset_type})\n"
                    f"- Amenaza: {threat or 'Exposición a ciberataques'}\n"
                    f"- Vulnerabilidad: {vulnerability or 'Configuración por defecto o desactualizada'}\n"
                    f"- Nivel de Riesgo Inherente: {risk_level}\n\n"
                    f"Responde estrictamente en formato JSON con la siguiente estructura:\n"
                    f'{{"analisis_copilot": "breve resumen de 2 frases", "controles_sugeridos": [{{"id": "A.X.X", "nombre": "...", "tema": "...", "eficacia": 85, "justificacion": "..."}}], "confidence": 0.95}}'
                )
                resp = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                data = json.loads(resp.text)
                return self._enrich_controls_with_chips(data)
            except Exception as e:
                logger.warning(f"Fallback a motor autónomo por error en Gemini: {e}")

        # Motor Autónomo Canónico Local
        return self._autonomous_suggest_controls(asset_name, asset_type, threat, vulnerability, risk_level)

    def _autonomous_suggest_controls(self, asset_name: str, asset_type: str, threat: str, vulnerability: str, risk_level: str) -> Dict[str, Any]:
        """Motor heurístico de alta precisión que busca sobre los 93 controles de ISO 27002:2022."""
        search_terms = f"{asset_name} {asset_type} {threat} {vulnerability}".lower()
        scored_controls = []

        # Reglas contextuales según vector
        priority_map = {
            "ransomware": ["A.8.7", "A.8.13", "A.8.24", "A.8.16"],
            "base de datos": ["A.8.24", "A.8.11", "A.8.2", "A.8.13"],
            "servidor": ["A.8.8", "A.8.9", "A.8.20", "A.8.15"],
            "acceso": ["A.5.15", "A.5.18", "A.8.5", "A.8.2"],
            "nube": ["A.5.23", "A.8.22", "A.5.19", "A.8.24"],
            "desarrollo": ["A.8.25", "A.8.28", "A.8.31", "A.8.4"],
            "personal": ["A.6.1", "A.6.3", "A.6.7", "A.5.10"],
        }

        matched_priority_codes = set()
        for kw, codes in priority_map.items():
            if kw in search_terms:
                matched_priority_codes.update(codes)

        for ctrl in self.catalog.get("controles", []):
            cid = ctrl["id"]
            score = 0
            if cid in matched_priority_codes:
                score += 50
            if ctrl["nombre"].lower() in search_terms:
                score += 30
            # Coincidencia por tipo de activo
            if asset_type in ctrl.get("activo_tipos_aplicables", []):
                score += 15
            # Puntuación por palabras clave
            for word in search_terms.split():
                if len(word) > 3 and word in ctrl["nombre"].lower() or word in ctrl["proposito"].lower():
                    score += 5

            scored_controls.append((score, ctrl))

        scored_controls.sort(key=lambda x: x[0], reverse=True)
        top_controls = [c[1] for c in scored_controls[:4]]

        chips = []
        sugerencias = []
        for c in top_controls:
            sugerencias.append({
                "id": c["id"],
                "codigo": c["codigo"],
                "tema": c["tema"],
                "nombre": c["nombre"],
                "tipo_control": c["tipo_control"],
                "propiedades_cia": c["propiedades_cia"],
                "proposito": c["proposito"],
                "eficacia": c["eficacia_estimada"],
                "justificacion": f"Control mitigante clave según ISO/IEC 27002:2022 para proteger el activo '{asset_name}' frente a amenazas de {threat or 'seguridad'}."
            })
            chips.append({
                "action": "APPLY_CONTROL",
                "label": f"Aplicar {c['id']} ({c['nombre'][:25]}...)",
                "control_id": c["id"],
                "control_nombre": c["nombre"]
            })

        return {
            "analisis_copilot": f"Para el activo '{asset_name}' ({asset_type}) evaluado en nivel {risk_level}, la arquitectura ISO 27002:2022 recomienda enfocar los controles en las dimensiones {', '.join(top_controls[0]['propiedades_cia'] if top_controls else ['C', 'I', 'A'])}.",
            "controles_sugeridos": sugerencias,
            "action_chips": chips,
            "confidence": 0.96,
            "is_cag_grounded": True,
            "version_norma": "ISO/IEC 27002:2022"
        }

    def _enrich_controls_with_chips(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Añade Action Chips estructurados a la respuesta generada por Gemini."""
        chips = []
        for ctrl in data.get("controles_sugeridos", []):
            cid = ctrl.get("id", "")
            cnombre = ctrl.get("nombre", "")
            chips.append({
                "action": "APPLY_CONTROL",
                "label": f"Aplicar {cid}",
                "control_id": cid,
                "control_nombre": cnombre
            })
        data["action_chips"] = chips
        data["is_cag_grounded"] = True
        data["version_norma"] = "ISO/IEC 27002:2022"
        return data

    def evaluate_risk(self, asset_name: str, asset_type: str, cia_levels: Dict[str, str] = None) -> Dict[str, Any]:
        """Evalúa el activo y propone amenazas y vulnerabilidades plausibles con justificación."""
        threat_catalog = {
            "Hardware": [
                {"amenaza": "Fallo físico del servidor o almacenamiento", "vuln": "Ausencia de redundancia de hardware (RAID/Fuente)", "cia": "Disponibilidad"},
                {"amenaza": "Acceso físico no autorizado a consolas", "vuln": "Puertos USB habilitados y sin candados físicos", "cia": "Confidencialidad"}
            ],
            "Software": [
                {"amenaza": "Ejecución de código malicioso o Ransomware", "vuln": "Software base o dependencias sin parchear", "cia": "Integridad"},
                {"amenaza": "Inyección SQL o evasión de autenticación", "vuln": "Falta de validación de entradas en APIs", "cia": "Confidencialidad"}
            ],
            "Datos": [
                {"amenaza": "Fuga o exfiltración de información confidencial", "vuln": "Transmisión y almacenamiento en texto plano sin cifrado", "cia": "Confidencialidad"},
                {"amenaza": "Destrucción o pérdida irrecuperable de datos", "vuln": "Copias de seguridad desactualizadas o sin prueba de restauración", "cia": "Disponibilidad"}
            ],
            "Sistemas de Información": [
                {"amenaza": "Denegación de servicio (DoS) que inhabilita operaciones", "vuln": "Falta de balanceo de carga y rate-limiting", "cia": "Disponibilidad"},
                {"amenaza": "Secuestro de sesiones de usuario o escalada de privilegios", "vuln": "Tokens JWT sin expiración adecuada o almacenamiento inseguro", "cia": "Integridad"}
            ]
        }

        selected_vectors = threat_catalog.get(asset_type, threat_catalog["Sistemas de Información"])
        primary = selected_vectors[0]

        return {
            "activo_nombre": asset_name,
            "activo_tipo": asset_type,
            "analisis_inherente": f"El activo '{asset_name}' presenta superficie de exposición crítica en {primary['cia']}. Siguiendo las directrices de ISO/IEC 27005:2022, el vector primario a documentar es [{primary['amenaza']} / {primary['vuln']}].",
            "amenaza_sugerida": primary["amenaza"],
            "vulnerabilidad_sugerida": primary["vuln"],
            "probabilidad_estimada": "Probable",
            "impacto_estimado": "Alto",
            "nivel_riesgo_sugerido": "ALTO",
            "action_chips": [
                {"action": "APPLY_VECTOR", "label": f"Adoptar Vector: {primary['amenaza'][:25]}...", "threat": primary["amenaza"], "vulnerability": primary["vuln"]},
                {"action": "SET_PROBABILITY_IMPACT", "label": "Calificar Probable × Alto", "probabilidad": "Probable", "impacto": "Alto"}
            ],
            "norma_referencia": "ISO/IEC 27005:2022 Cláusula 8.2"
        }

    def chat_stream(self, message: str, context: Dict[str, Any] = None) -> Generator[str, None, None]:
        """Generador para streaming SSE palabra por palabra hacia el frontend."""
        context = context or {}
        asset_name = context.get("asset_name", "")
        step = context.get("step", 0)

        if self.has_gemini and self.model:
            try:
                system_prompt = (
                    f"Contexto de la sesión actual de auditoría:\n"
                    f"- Activo en evaluación: {asset_name}\n"
                    f"- Paso actual en el Wizard: {step}\n"
                    f"- Consulta del Auditor: {message}\n"
                    f"Responde de forma concisa (máximo 3 párrafos), profesional y citando controles ISO 27002:2022 relevantes."
                )
                response = self.model.generate_content(system_prompt, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                logger.warning(f"Error en streaming de Gemini, usando fallback autónomo: {e}")

        # Fallback de streaming autónomo interactivo
        reply = (
            f"Como SmartAuditor Copilot, he analizado tu consulta sobre '{message}'. "
            f"En relación al activo '{asset_name or 'seleccionado'}' bajo el marco ISO/IEC 27001:2022 y 27002:2022, "
            f"es fundamental asegurar la trazabilidad de los controles preventivos. "
            f"Te sugiero revisar específicamente el control A.8.24 (Criptografía) y el control A.5.15 (Control de acceso) "
            f"para garantizar que la superficie de exposición se mantenga dentro del apetito de riesgo institucional."
        )
        import time
        words = reply.split(" ")
        for i, w in enumerate(words):
            yield w + " "
            time.sleep(0.02) # Efecto de streaming fluido

    def assess_asset(self, asset_name: str, asset_type: str = "", description: str = "") -> Dict[str, Any]:
        """Evalúa un activo de información según la Guía Integral de Riesgos Función Pública V7 (Capítulo V),
        Ley 1712 de 2014 y Controles Documentales ISO 27002:2022."""
        text_corpus = f"{asset_name} {asset_type} {description}".lower()

        if self.has_gemini and self.model:
            try:
                prompt = (
                    f"Actúa como SmartAuditor Copilot experto en la Guía de Riesgos de la Función Pública V7 (2025), "
                    f"Ley 1712 de 2014 e ISO/IEC 27002:2022. Evalúa este activo de información:\n"
                    f"- Nombre: {asset_name}\n"
                    f"- Tipo/Naturaleza: {asset_type or 'No especificado'}\n"
                    f"- Descripción: {description or 'No especificada'}\n\n"
                    f"Responde estrictamente en JSON con la siguiente estructura:\n"
                    f'{{\n'
                    f'  "analisis_copilot": "Breve diagnóstico",\n'
                    f'  "tipo_activo_sugerido": "Información y datos",\n'
                    f'  "trd_sugerida": {{"macroproceso": "...", "proceso": "...", "serie_documental": "...", "subserie_documental": "...", "identificador_sugerido": "TRD-..."}},\n'
                    f'  "caracteristicas_documentales": {{"soporte_registro": "Digital", "formato": "PDF", "medio_conservacion": "...", "idioma": "Español"}},\n'
                    f'  "valoracion_cid": {{"confidencialidad": "Alto", "integridad": "Alto", "disponibilidad": "Medio", "criticidad_general": "Alto", "justificacion": "..."}},\n'
                    f'  "analisis_ley_1712": {{"es_clasificada_reservada": true, "objeto_legitimo": "...", "fundamento_legal": "...", "excepcion_alcance": "Total"}},\n'
                    f'  "es_iccn": false,\n'
                    f'  "controles_documentales_sugeridos": [{{"id": "A.5.12", "nombre": "Clasificación de la información", "justificacion": "..."}}]\n'
                    f'}}'
                )
                resp = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                data = json.loads(resp.text)
                return self._enrich_asset_assessment_with_chips(data)
            except Exception as e:
                logger.warning(f"Error en assess_asset con Gemini, usando motor autónomo: {e}")

        return self._autonomous_assess_asset(asset_name, asset_type, description, text_corpus)

    def _autonomous_assess_asset(self, asset_name: str, asset_type: str, description: str, text: str) -> Dict[str, Any]:
        """Motor autónomo local para evaluación de activos conforme a Función Pública V7."""
        # 1. Detectar tipo de activo según naturaleza Función Pública V7
        if any(k in text for k in ["expediente", "historia", "contrato", "informe", "acta", "archivo", "manual", "documento", "politica", "base de datos", "nomina"]):
            tipo_sugerido = "Información y datos"
        elif any(k in text for k in ["sistema", "aplicaci", "software", "portal", "modulo", "api", "erp", "plataforma"]):
            tipo_sugerido = "Software"
        elif any(k in text for k in ["servidor", "switch", "router", "firewall", "equipo", "computador", "portatil", "disco"]):
            tipo_sugerido = "Hardware"
        elif any(k in text for k in ["usb", "san", "nas", "cinta", "almacenamiento"]):
            tipo_sugerido = "Soporte de almacenamiento"
        elif any(k in text for k in ["internet", "enlace", "vpn", "correo", "directorio"]):
            tipo_sugerido = "Servicios"
        else:
            tipo_sugerido = asset_type or "Información y datos"

        # 2. Inferencia TRD y Macroproceso
        if any(k in text for k in ["salud", "medic", "historia", "ocupacional", "talento", "personal", "empleado"]):
            macroproceso = "Gestión del Talento Humano"
            proceso = "Seguridad y Salud en el Trabajo"
            serie = "Historias Laborales"
            subserie = "Historias Clínicas Ocupacionales"
            id_trd = "TRD-130-015"
            oficina = "Dirección de Talento Humano"
        elif any(k in text for k in ["contrat", "licitaci", "pliego", "adquisic", "proveedor"]):
            macroproceso = "Gestión Jurídica y Contractual"
            proceso = "Contratación Pública"
            serie = "Contratos"
            subserie = "Contratos de Obra y Servicios"
            id_trd = "TRD-210-040"
            oficina = "Oficina de Contratación"
        elif any(k in text for k in ["financ", "presupuest", "contab", "pago", "tesoreria", "factur"]):
            macroproceso = "Gestión Financiera"
            proceso = "Presupuesto y Tesorería"
            serie = "Comprobantes y Libros Contables"
            subserie = "Órdenes de Pago"
            id_trd = "TRD-140-020"
            oficina = "Secretaría de Hacienda / Tesorería"
        elif any(k in text for k in ["disciplin", "juridic", "demanda", "fallo", "tutela"]):
            macroproceso = "Gestión Jurídica"
            proceso = "Defensa Judicial"
            serie = "Procesos Judiciales y Disciplinarios"
            subserie = "Acciones Constitucionales"
            id_trd = "TRD-120-008"
            oficina = "Oficina Asesora Jurídica"
        else:
            macroproceso = "Gestión de Tecnologías de la Información"
            proceso = "Seguridad de la Información"
            serie = "Inventario y Gestión de Activos"
            subserie = "Activos de Información y Software"
            id_trd = "TRD-110-001"
            oficina = "Oficina de Tecnologías y Sistemas"

        # 3. Características Documentales
        es_papel = "papel" in text or "fisico" in text or "físico" in text
        es_digital = "digital" in text or "pdf" in text or "electronico" in text or "electrónico" in text or not es_papel
        soporte = "Híbrido" if (es_papel and es_digital) else ("Físico" if es_papel else "Digital")
        formato = "Papel y PDF/A" if soporte == "Híbrido" else ("Papel / Físico" if soporte == "Físico" else "PDF / Archivos Electrónicos")
        medio_conservacion = "Archivo Central / SGDEA Institucional" if tipo_sugerido == "Información y datos" else "Infraestructura Tecnológica Segura"

        # 4. Valoración CID
        es_sensible = any(k in text for k in ["salud", "medic", "historia", "salario", "disciplin", "penal", "contraseña", "secreto", "personal"])
        es_financiero = any(k in text for k in ["financ", "presupuest", "pago", "banco"])
        
        conf = "Alto" if es_sensible else ("Medio" if not any(k in text for k in ["public", "boletin", "portal"]) else "Bajo")
        integ = "Alto" if (es_sensible or es_financiero or tipo_sugerido in ["Software", "Información y datos"]) else "Medio"
        disp = "Alto" if any(k in text for k in ["transaccional", "operacion", "produccion", "nomina", "portal"]) else "Medio"
        crit_gral = "Alto" if (conf == "Alto" or integ == "Alto") else "Medio"

        # 5. Ley 1712 de 2014
        if es_sensible:
            es_reserva = True
            obj_legitimo = "Protección de los derechos a la intimidad, privacidad y datos sensibles de las personas naturales (Art. 18 lit. a Ley 1712 de 2014)."
            fundamento = "Ley 1712 de 2014 Art. 18 lit. a; Ley 1581 de 2012 Art. 5; Constitución Política de Colombia Art. 15."
            alcance = "Total" if any(k in text for k in ["salud", "medic", "disciplin"]) else "Parcial"
        else:
            es_reserva = False
            obj_legitimo = None
            fundamento = None
            alcance = None

        # 6. Controles Documentales ISO 27002:2022
        controles_doc = [
            {"id": "A.5.12", "codigo": "5.12", "nombre": "Clasificación de la información", "tema": "Organizacional", "justificacion": "Obligatorio para inventariar y etiquetar según la escala de confidencialidad CID y Ley 1712."},
            {"id": "A.5.13", "codigo": "5.13", "nombre": "Etiquetado de la información", "tema": "Organizacional", "justificacion": "Identificación visible de la reserva en soportes físicos y metadatos digitales."},
            {"id": "A.5.33", "codigo": "5.33", "nombre": "Protección de registros", "tema": "Organizacional", "justificacion": "Garantiza retención, custodia y disposición final conforme a la TRD aprobada."},
            {"id": "A.8.11", "codigo": "8.11", "nombre": "Enmascaramiento de datos", "tema": "Tecnológico", "justificacion": "Pseudonimización de datos personales para personal no autorizado o auditorías."},
            {"id": "A.8.12", "codigo": "8.12", "nombre": "Prevención de fuga de datos (DLP)", "tema": "Tecnológico", "justificacion": "Bloquea extracción no autorizada de expedientes y bases de datos institucionales."}
        ]

        if not es_sensible:
            controles_doc = controles_doc[:3]

        data = {
            "analisis_copilot": f"Activo evaluado bajo el marco Función Pública V7 (Capítulo V). Identificado como '{tipo_sugerido}' perteneciente al macroproceso '{macroproceso}'. "
                                f"Criticidad General valorada en {crit_gral} con sujeción a {'reserva legal por Ley 1712' if es_reserva else 'régimen de máxima publicidad'}.",
            "tipo_activo_sugerido": tipo_sugerido,
            "trd_sugerida": {
                "macroproceso": macroproceso,
                "proceso": proceso,
                "serie_documental": serie,
                "subserie_documental": subserie,
                "identificador_sugerido": id_trd,
                "oficina_responsable": oficina
            },
            "caracteristicas_documentales": {
                "soporte_registro": soporte,
                "formato": formato,
                "medio_conservacion": medio_conservacion,
                "idioma": "Español"
            },
            "valoracion_cid": {
                "confidencialidad": conf,
                "integridad": integ,
                "disponibilidad": disp,
                "criticidad_general": crit_gral,
                "justificacion": f"Confidencialidad {conf} fundamentada en el grado de reserva. Integridad {integ} requerida para garantizar fidelidad y valor probatorio institucional."
            },
            "analisis_ley_1712": {
                "es_clasificada_reservada": es_reserva,
                "objeto_legitimo": obj_legitimo,
                "fundamento_legal": fundamento,
                "excepcion_alcance": alcance
            },
            "es_iccn": bool(es_financiero or any(k in text for k in ["critico", "seguridad", "infraestructura", "nacional"])),
            "controles_documentales_sugeridos": controles_doc,
            "norma_referencia": "Guía Función Pública V7 (2025) Cap. V & ISO/IEC 27002:2022"
        }
        return self._enrich_asset_assessment_with_chips(data)

    def _enrich_asset_assessment_with_chips(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Añade los botones de acción rápida de 1-Clic para inyección inmediata en el formulario."""
        trd = data.get("trd_sugerida", {})
        doc = data.get("caracteristicas_documentales", {})
        cid = data.get("valoracion_cid", {})
        ley = data.get("analisis_ley_1712", {})
        tipo = data.get("tipo_activo_sugerido", "Información y datos")

        chips = [
            {
                "action": "APPLY_ASSET_METADATA",
                "label": f"Adoptar TRD: {trd.get('serie_documental', 'Serie')[:20]}",
                "macroproceso": trd.get("macroproceso"),
                "proceso": trd.get("proceso"),
                "identificador_trd": trd.get("identificador_sugerido"),
                "oficina_responsable": trd.get("oficina_responsable"),
                "serie_documental": trd.get("serie_documental"),
                "subserie_documental": trd.get("subserie_documental"),
                "tipo_activo": tipo,
                "soporte_registro": doc.get("soporte_registro"),
                "formato": doc.get("formato"),
                "medio_conservacion": doc.get("medio_conservacion"),
                "idioma": doc.get("idioma", "Español")
            },
            {
                "action": "SET_CID_VALUES",
                "label": f"Calificar CID: C({cid.get('confidencialidad')}) I({cid.get('integridad')}) D({cid.get('disponibilidad')})",
                "confidencialidad": cid.get("confidencialidad"),
                "integridad": cid.get("integridad"),
                "disponibilidad": cid.get("disponibilidad"),
                "criticidad_general": cid.get("criticidad_general"),
                "justificacion": cid.get("justificacion")
            }
        ]

        if ley.get("es_clasificada_reservada"):
            chips.append({
                "action": "APPLY_LEY_1712",
                "label": f"Aplicar Reserva Ley 1712 ({ley.get('excepcion_alcance', 'Total')})",
                "es_clasificada_reservada": True,
                "objeto_legitimo_excepcion": ley.get("objeto_legitimo"),
                "fundamento_legal": ley.get("fundamento_legal"),
                "excepcion_alcance": ley.get("excepcion_alcance")
            })

        for ctrl in data.get("controles_documentales_sugeridos", []):
            chips.append({
                "action": "APPLY_CONTROL",
                "label": f"Control {ctrl['id']} ({ctrl['nombre'][:18]}...)",
                "control_id": ctrl["id"],
                "control_nombre": ctrl["nombre"]
            })

        data["action_chips"] = chips
        return data

# Instancia singleton del servicio CAG
cag_service = GeminiCAGService()

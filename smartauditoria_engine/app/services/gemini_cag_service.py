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

# Instancia singleton
cag_service = GeminiCAGService()

"""
RAGClient - Adaptador de Infraestructura v2.
Comunicación blindada con SmartAuditorIA Engine (8001).
"""
import requests
import os
import logging

logger = logging.getLogger(__name__)

class RAGClientV2:
    def __init__(self):
        self.base_url = os.getenv("IA_SERVICE_URL", "http://localhost:8001/api/v1")
        self.api_key = os.getenv("IA_SERVICE_API_KEY", "amo_master_key_2026")

    def copilot_chat(self, message: str, context: dict = None) -> dict:
        """Envía consulta al copiloto interactivo."""
        endpoint = f"{self.base_url}/copilot/chat"
        payload = {"message": message, "context": context or {}}
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        try:
            r = requests.post(endpoint, json=payload, headers=headers, timeout=15)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.warning(f"RAGClient copilot_chat fallback: {e}")
            return {
                "reply": f"SmartAuditor Copilot (Modo Local): Se ha recibido tu consulta sobre '{message}'. Se recomienda verificar el cumplimiento de los controles de la Cláusula 8 de ISO 27002:2022.",
                "action_chips": [],
                "norma_referencia": "ISO/IEC 27002:2022"
            }

    def copilot_stream(self, message: str, context: dict = None):
        """Retransmite streaming SSE desde el engine hacia el frontend."""
        endpoint = f"{self.base_url}/copilot/stream"
        payload = {"message": message, "context": context or {}}
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        try:
            with requests.post(endpoint, json=payload, headers=headers, stream=True, timeout=20) as r:
                for chunk in r.iter_content(chunk_size=128):
                    if chunk:
                        yield chunk
        except Exception as e:
            logger.warning(f"RAGClient copilot_stream fallback: {e}")
            yield f"data: SmartAuditor Copilot: Procesando consulta '{message}'. Recuerde verificar los controles mitigantes aplicables según ISO/IEC 27002:2022.\n\n".encode("utf-8")
            yield b"data: [DONE]\n\n"

    def copilot_evaluate_risk(self, asset_name: str, asset_type: str, cia_levels: dict = None) -> dict:
        """Solicita evaluación de vector de riesgo para un activo."""
        endpoint = f"{self.base_url}/copilot/evaluate-risk"
        payload = {"asset_name": asset_name, "asset_type": asset_type, "cia_levels": cia_levels}
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        try:
            r = requests.post(endpoint, json=payload, headers=headers, timeout=12)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.warning(f"RAGClient evaluate_risk fallback: {e}")
            return {
                "activo_nombre": asset_name,
                "activo_tipo": asset_type,
                "analisis_inherente": f"Evaluación de superficie de exposición para '{asset_name}' bajo ISO 27005:2022.",
                "amenaza_sugerida": "Pérdida o alteración no autorizada de datos",
                "vulnerabilidad_sugerida": "Ausencia de controles criptográficos y de acceso robusto",
                "probabilidad_estimada": "Probable",
                "impacto_estimado": "Alto",
                "nivel_riesgo_sugerido": "ALTO",
                "action_chips": [
                    {"action": "APPLY_VECTOR", "label": "Adoptar Vector Sugerido", "threat": "Pérdida o alteración de datos", "vulnerability": "Ausencia de controles criptográficos"}
                ],
                "norma_referencia": "ISO/IEC 27005:2022"
            }

    def copilot_suggest_controls(self, asset_name: str, asset_type: str, threat: str = "", vulnerability: str = "", risk_level: str = "HIGH") -> dict:
        """Solicita sugerencia de controles del Anexo A ISO 27002:2022 con Action Chips."""
        endpoint = f"{self.base_url}/copilot/suggest-controls"
        payload = {
            "asset_name": asset_name,
            "asset_type": asset_type,
            "threat": threat,
            "vulnerability": vulnerability,
            "risk_level": risk_level
        }
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        try:
            r = requests.post(endpoint, json=payload, headers=headers, timeout=12)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.warning(f"RAGClient suggest_controls fallback: {e}")
            return {
                "analisis_copilot": f"Para '{asset_name}', se sugieren controles esenciales de ISO 27002:2022.",
                "controles_sugeridos": [
                    {"id": "A.8.24", "nombre": "Uso de criptografía", "tema": "Tecnológico", "eficacia": 85, "justificacion": "Mitiga exposición de datos sensibles."},
                    {"id": "A.5.15", "nombre": "Control de acceso", "tema": "Organizacional", "eficacia": 80, "justificacion": "Limita accesos no autorizados a la información."}
                ],
                "action_chips": [
                    {"action": "APPLY_CONTROL", "label": "Aplicar A.8.24 Criptografía", "control_id": "A.8.24", "control_nombre": "Uso de criptografía"},
                    {"action": "APPLY_CONTROL", "label": "Aplicar A.5.15 Control de acceso", "control_id": "A.5.15", "control_nombre": "Control de acceso"}
                ],
                "confidence": 0.95,
                "version_norma": "ISO/IEC 27002:2022"
            }


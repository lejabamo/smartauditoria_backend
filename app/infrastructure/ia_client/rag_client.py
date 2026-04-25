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

    def analyze_risk(self, asset_name: str, asset_type: str, query_type: str):
        """
        Envía una petición de auditoría al Engine RAG.
        """
        endpoint = f"{self.base_url}/ia/suggestions"
        payload = {
            "activo_nombre": asset_name,
            "activo_tipo": asset_type,
            "tipo": query_type
        }
        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }

        try:
            logger.info(f"RAG_CLIENT: Solicitando análisis para {asset_name}...")
            response = requests.post(endpoint, json=payload, headers=headers, timeout=12)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"RAG_CLIENT_ERROR: {str(e)}")
            return {
                "error": "Motor IA no disponible o rechazo de seguridad.",
                "status": "incident_reported",
                "trace_id": "N/A"
            }

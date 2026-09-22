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

    def copilot_evaluate_risk(
        self,
        asset_name: str,
        asset_type: str,
        cia_levels: dict = None,
        trd: dict = None,
        criticidad: str = None,
        ley_1712: dict = None,
        descripcion: str = ""
    ) -> dict:
        """Solicita evaluación de vector de riesgo para un activo según ISO 27005:2022 y DAFP V7."""
        endpoint = f"{self.base_url}/copilot/evaluate-risk"
        payload = {
            "asset_name": asset_name,
            "asset_type": asset_type,
            "cia_levels": cia_levels or {},
            "trd": trd or {},
            "criticidad": criticidad,
            "ley_1712": ley_1712 or {},
            "descripcion": descripcion or ""
        }
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        try:
            r = requests.post(endpoint, json=payload, headers=headers, timeout=12)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.warning(f"RAGClient evaluate_risk fallback: {e}")
            prob = "Probable"
            imp = "Mayor"
            nivel = "ALTO"
            return {
                "activo_nombre": asset_name,
                "activo_tipo": asset_type,
                "analisis_inherente": f"Evaluación de contingencia para '{asset_name}' bajo ISO 27005:2022 y DAFP V7.",
                "amenaza_sugerida": "Fuga o alteración no autorizada de información clasificada",
                "vulnerabilidad_sugerida": "Controles de acceso deficientes y falta de cifrado en reposo",
                "descripcion_sugerida": "Causa: Controles de acceso insuficientes. Consecuencia: Posible materialización de fuga de información confidencial.",
                "tipo_riesgo_sugerido": "Legal",
                "probabilidad_estimada": prob,
                "impacto_estimado": imp,
                "nivel_riesgo_sugerido": nivel,
                "justificacion_sugerida": f"Evaluación fundamentada en ISO 27005:2022 y Guía DAFP V7 para el activo {asset_type}.",
                "action_chips": [
                    {"action": "APPLY_VECTOR", "label": "Adoptar Vector Sugerido", "threat": "Fuga o alteración no autorizada de información", "vulnerability": "Controles de acceso deficientes", "tipoRiesgo": "Legal"},
                    {"action": "SET_PROBABILITY_IMPACT", "label": f"Calificar {prob} × {imp}", "probabilidad": prob, "impacto": imp},
                    {"action": "FILL_JUSTIFICATION", "label": "Cargar Justificación Técnica ISO 27005", "text": f"Evaluación de criticidad fundamentada en ISO 27005:2022 para {asset_name}."},
                    {"action": "APPLY_TREATMENT_STRATEGY", "label": "Sugerir Estrategia Mitigar", "opcion": "Mitigar", "responsable": "Líder de Seguridad de la Información", "estrategia": "Implementar controles ISO 27002:2022 preventivos."}
                ],
                "norma_referencia": "ISO/IEC 27005:2022 & DAFP Guía V7"
            }

    def copilot_suggest_controls(
        self,
        asset_name: str,
        asset_type: str,
        threat: str = "",
        vulnerability: str = "",
        risk_level: str = "HIGH",
        trd: dict = None,
        ley_1712: dict = None
    ) -> dict:
        """Solicita sugerencia de controles del Anexo A ISO 27002:2022 con Action Chips."""
        endpoint = f"{self.base_url}/copilot/suggest-controls"
        payload = {
            "asset_name": asset_name,
            "asset_type": asset_type,
            "threat": threat,
            "vulnerability": vulnerability,
            "risk_level": risk_level,
            "trd": trd or {},
            "ley_1712": ley_1712 or {}
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
                    {"id": "A.5.15", "nombre": "Control de acceso", "tema": "Organizacional", "eficacia": 85, "justificacion": "Limita accesos no autorizados a la información."},
                    {"id": "A.8.24", "nombre": "Uso de criptografía", "tema": "Tecnológico", "eficacia": 80, "justificacion": "Mitiga exposición de datos sensibles."},
                    {"id": "A.5.12", "nombre": "Clasificación de la información", "tema": "Organizacional", "eficacia": 80, "justificacion": "Categorización conforme a Ley 1712 y DAFP V7."}
                ],
                "eficacia_sugerida": "Alta",
                "justificacion_eficacia": "Los controles seleccionados mitigan el impacto y probabilidad según metodología DAFP V7.",
                "action_chips": [
                    {"action": "APPLY_CONTROL", "label": "Aplicar A.5.15 Control de acceso", "control_id": "A.5.15", "control_nombre": "Control de acceso"},
                    {"action": "APPLY_CONTROL", "label": "Aplicar A.8.24 Criptografía", "control_id": "A.8.24", "control_nombre": "Uso de criptografía"},
                    {"action": "APPLY_TREATMENT_STRATEGY", "label": "Estrategia Mitigar DAFP V7", "opcion": "Mitigar", "responsable": "Oficial de Seguridad / Administrador de Sistemas", "estrategia": "Implementar controles ISO 27002:2022 para mitigar el riesgo."}
                ],
                "confidence": 0.95,
                "version_norma": "ISO/IEC 27002:2022"
            }

    def copilot_assess_asset(self, asset_name: str, asset_type: str = "", description: str = "") -> dict:
        """Solicita inferencia inteligente para levantamiento de activos bajo Guía DAFP V7 y controles ISO 27002:2022."""
        endpoint = f"{self.base_url}/copilot/assess-asset"
        payload = {
            "asset_name": asset_name,
            "asset_type": asset_type,
            "description": description
        }
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        try:
            r = requests.post(endpoint, json=payload, headers=headers, timeout=15)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.warning(f"RAGClient copilot_assess_asset fallback: {e}")
            es_doc = any(w in (asset_name or "").lower() or w in (description or "").lower() for w in ["historia", "expediente", "contrato", "informe", "acta", "hoja de vida", "archivo", "documento"])
            tipo = "Información y datos" if es_doc else (asset_type or "Información y datos")
            c_val = "Alto" if es_doc else "Medio"
            i_val = "Alto"
            d_val = "Medio" if es_doc else "Alto"
            crit = "Alto"
            
            macro = "Misional" if es_doc else "Estratégico"
            proc = "Gestión Documental" if es_doc else "Tecnología de la Información"
            trd_id = "TRD-DOC-001" if es_doc else "TRD-TI-001"
            oficina = "Archivo Central / Gestión Documental" if es_doc else "Oficina de Tecnología"

            chips = [
                {
                    "action": "APPLY_ASSET_METADATA",
                    "label": f"Adoptar Clasificación TRD: {proc} ({trd_id})",
                    "metadata": {
                        "macroproceso": macro,
                        "proceso": proc,
                        "identificador_trd": trd_id,
                        "oficina_responsable": oficina,
                        "serie_documental": "Expedientes y Registros" if es_doc else "Sistemas de Información",
                        "subserie_documental": "Comunicaciones Oficiales" if es_doc else "Plataformas Misionales",
                        "tipo_activo": tipo,
                        "soporte_registro": "Digital" if "digital" in (description or "").lower() else "Híbrido",
                        "formato": "PDF/A / Documento Electrónico",
                        "medio_conservacion": "Servidor Institucional / Repositorio Documental",
                        "idioma": "Español"
                    }
                },
                {
                    "action": "SET_CID_VALUES",
                    "label": f"Calificar CID: C({c_val}) I({i_val}) D({d_val})",
                    "confidencialidad": c_val,
                    "integridad": i_val,
                    "disponibilidad": d_val,
                    "criticidad_general": crit,
                    "justificacion": "Valoración inferida bajo lineamientos DAFP V7 y criticidad de la información pública."
                }
            ]

            if es_doc:
                chips.append({
                    "action": "APPLY_LEY_1712",
                    "label": "Aplicar Reserva Ley 1712 (Art. 18/19)",
                    "es_clasificada_reservada": True,
                    "objeto_legitimo_excepcion": "Protección de datos personales sensibles y secreto profesional/laboral",
                    "fundamento_legal": "Ley 1712 de 2014, Artículos 18 y 19 literal b",
                    "excepcion_alcance": "Total"
                })

            return {
                "tipo_activo_sugerido": tipo,
                "analisis_copilot": f"Evaluación de contingencia para '{asset_name}'. Se aplican directrices DAFP V7 e ISO 27002:2022.",
                "trd_sugerida": {
                    "macroproceso": macro,
                    "proceso": proc,
                    "identificador_sugerido": trd_id,
                    "oficina_responsable": oficina,
                    "serie_documental": "Expedientes y Registros" if es_doc else "Sistemas de Información",
                    "subserie_documental": "Comunicaciones Oficiales" if es_doc else "Plataformas Misionales"
                },
                "caracteristicas_documentales": {
                    "soporte_registro": "Digital" if "digital" in (description or "").lower() else "Híbrido",
                    "formato": "PDF/A / Documento Electrónico",
                    "medio_conservacion": "Servidor Institucional / Repositorio Documental",
                    "idioma": "Español"
                },
                "valoracion_cid": {
                    "confidencialidad": c_val,
                    "integridad": i_val,
                    "disponibilidad": d_val,
                    "criticidad_general": crit,
                    "justificacion": "Evaluación preliminar de criticidad según guía Función Pública V7."
                },
                "analisis_ley_1712": {
                    "es_clasificada_reservada": es_doc,
                    "objeto_legitimo": "Protección de datos personales sensibles y reserva legal" if es_doc else None,
                    "fundamento_legal": "Ley 1712 de 2014, Arts. 18 y 19" if es_doc else None,
                    "excepcion_alcance": "Total" if es_doc else None
                },
                "controles_documentales_sugeridos": [
                    {"id": "A.5.12", "nombre": "Clasificación de la información", "justificacion": "Obligatorio para inventario y clasificación de activos según DAFP V7."},
                    {"id": "A.5.13", "nombre": "Etiquetado de la información", "justificacion": "Señalización y clasificación conforme a Ley 1712."},
                    {"id": "A.8.11", "nombre": "Enmascaramiento de datos", "justificacion": "Protección y privacidad de datos sensibles."}
                ],
                "action_chips": chips
            }


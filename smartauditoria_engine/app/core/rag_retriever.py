from typing import Dict, Any, List
import random

class RAGRetrieverEngine:
    """
    Motor Híbrido RAG/SQL con enrutamiento de umbrales.
    Aplica las fases de evaluación: Target Isolation, Fallback, Confidence Measurement y Exploración.
    """
    
    def __init__(self, vector_db_client, sql_db_client):
        self.vdb = vector_db_client
        self.sql = sql_db_client
        self.MIN_SIMILARITY_THRESHOLD = 0.75

    def _query_vector_db_with_metadata(self, sanitized_query: str, filters: Dict) -> Dict:
        """
        Mock: Recupera embeddings usando la métrica Cosine Similarity de ChromaDB.
        Aquí se aplica el Target Isolation.
        """
        # Simulamos que buscamos usando la DB vectorial, usando `filters` para 'norm' y 'context'
        # Simula MMR (Maximal Marginal Relevance) y Perturbation resistance
        score = random.uniform(0.60, 0.95)
        
        return {
            "score": score,
            "lineage_metadata": {"source": f"Normativa_{filters.get('norm', 'General')}.pdf", "chapter": "1.0"},
            "content": f"El contexto extraído sugiere protección estricta según {filters.get('norm')}."
        }

    def _query_static_sql_fallback(self, target_threat: str) -> Dict:
        """Heurística base: Regresa a SQL transaccional si falla la Inteligencia."""
        return {
            "fallback_engaged": True,
            "controls": ["Cifrado simétrico AES-256", "MFA"],
            "vulnerability_source": "SQL Relacional Histórica"
        }

    def get_evaluacion_riesgo(self, step: str, asset_clean_info: Dict, target_threat: str) -> Dict[str, Any]:
        """
        Punto de entrada principal orquestando el DAG de arquitectura.
        """
        # 1. Enrutador Semántico (Target Isolation)
        rag_filters = {}
        if step == "wizard_step_2": # ISO 27005 (Metodología de Riesgos)
            rag_filters = {"norm": "ISO27005"}
        elif step == "wizard_step_3": # ISO 27002 (Controles)
            rag_filters = {"norm": "ISO27002"}
            
        if asset_clean_info.get("criticidad") == "Alto":
            rag_filters["norm"] = "MSDI" # Inyecta MinTIC 
            
        # 2. Invocación Vectorial (Caja Negra Sanitizada)
        sanitized_query = f"{asset_clean_info.get('tipo')} expuesto a {target_threat}"
        rag_response = self._query_vector_db_with_metadata(sanitized_query, rag_filters)
        
        # 3. Confidence Measurement & Fallback
        similarity_score = rag_response["score"]
        if similarity_score < self.MIN_SIMILARITY_THRESHOLD:
            # Activación de Fallback Heurístico
            fallback = self._query_static_sql_fallback(target_threat)
            return {
                "status": "FALLBACK_SQL",
                "ui_flag": "AMARILLO_CERTEZA_MEDIANA",
                "ui_message": "⚠️ Nivel de Certeza Mediano: El orquestador difiere. Retornando a línea base relacional.",
                "data": fallback,
                "confidence_score": similarity_score
            }
            
        # 4. Multi-Query Exploratorio (Bucle Anti-Degenerativo)
        # Inyecta opciones de OWASP o Zero Trust para evitar sesgos de popularidad
        top_3_suggestions = [
            f"Control Estándar dictado por {rag_response['lineage_metadata']['source']}",
            "Microsegmentación de Red Zero-Trust (Sugerencia Exploratoria)",
            "Políticas de Hardening CIS Nivel 2"
        ]

        return {
            "status": "RAG_SUCCESS",
            "ui_flag": "VERDE_CERTEZA_ALTA",
            "ui_message": "Análisis Normativo Generado Exitosamente.",
            "data": {
                "top_suggestions": top_3_suggestions,
                "lineage": rag_response["lineage_metadata"],
                "justificacion": rag_response["content"]
            },
            "confidence_score": similarity_score
        }

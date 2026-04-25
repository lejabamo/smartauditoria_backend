import pytest
from app.core.rag_retriever import RAGRetrieverEngine

def test_restructured_rag_engine_routing_and_fallback():
    """ 
    Valida el comportamiento integral del RAGRetrieverEngine 
    con Enrutamiento Semántico y activación de Thresholds (TDD).
    """
    engine = RAGRetrieverEngine(vector_db_client=None, sql_db_client=None)

    # 1. Simular Evaluación HW Alto Criticidad (Debe Inyectar MSDI)
    dummy_asset = {"tipo": "Servidor Linux", "criticidad": "Alto"}
    response_p2 = engine.get_evaluacion_riesgo("wizard_step_2", dummy_asset, "Infección Malware")

    # Aserciones de DAG Routing y Arquitectura
    assert "status" in response_p2
    assert "confidence_score" in response_p2
    
    # 2. Re-simular fallos de métrica (Threshold < 0.75 vía mock artificial o lógica de red)
    # Como usamos números aleatorios en el mock, sobreescribimos la db interna para test duro
    def failing_db(query, filters):
        return {"score": 0.50, "lineage_metadata": {}, "content": ""}
    
    engine._query_vector_db_with_metadata = failing_db
    response_fallback = engine.get_evaluacion_riesgo("wizard_step_3", dummy_asset, "Ataque DDoS")
    
    # Validamos activación de Fallback
    assert response_fallback["status"] == "FALLBACK_SQL"
    assert response_fallback["ui_flag"] == "AMARILLO_CERTEZA_MEDIANA"
    assert "Cifrado simétrico AES-256" in response_fallback["data"]["controls"]
    print("Fallback TDD Test Pasado Exitosamente!")

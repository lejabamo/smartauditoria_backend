"""
IA Routes v2 - Endpoint de Auditoría RAG.
"""
from flask import Blueprint, request, jsonify
from ..infrastructure.ia_client.rag_client import RAGClientV2

ia_v2_bp = Blueprint('ia_v2', __name__)
rag_client = RAGClientV2()

@ia_v2_bp.route('/analyze', methods=['POST'])
def analyze_asset():
    """
    Endpoint de prueba para el Auditor Maestro (Amo).
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    asset_name = data.get("activo_nombre", "Activo Genérico")
    asset_type = data.get("activo_tipo", "Servidor")
    query_type = data.get("tipo", "controls")
    
    # Llamada al Engine v2
    result = rag_client.analyze_risk(asset_name, asset_type, query_type)
    
    return jsonify({
        "status": "success",
        "engine_response": result,
        "auditor_note": "Análisis realizado bajo protocolo PING-PONG Ciclo 3"
    })

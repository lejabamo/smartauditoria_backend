"""
copilot.py — Blueprint de SmartAuditor Copilot (Flask)
Intermediario seguro entre el Frontend React y el Engine de IA.
"""

from flask import Blueprint, request, jsonify, Response, stream_with_context
from app.auth.decorators import require_auth
from ..infrastructure.ia_client.rag_client import RAGClientV2
import json
from pathlib import Path

copilot_bp = Blueprint('copilot', __name__)
rag_client = RAGClientV2()

CATALOG_PATH = Path(__file__).resolve().parent.parent / "services" / "predictive" / "iso_27002_2022_catalog.json"

@copilot_bp.route('/message', methods=['POST'])
@require_auth
def copilot_message():
    """Envía consulta al Copilot y recibe respuesta estructurada."""
    data = request.get_json() or {}
    message = data.get('message', '')
    context = data.get('context', {})
    
    # Enriquecer contexto con usuario actual
    current_user = getattr(request, 'current_user', None)
    context['username'] = getattr(current_user, 'nombre_usuario', 'Auditor') if current_user else 'Auditor'
    context['user_role'] = getattr(current_user.rol, 'nombre_rol', 'ADMIN') if current_user and current_user.rol else 'ADMIN'

    res = rag_client.copilot_chat(message, context)
    return jsonify(res), 200

@copilot_bp.route('/stream', methods=['POST'])
@require_auth
def copilot_stream():
    """Streaming de respuesta Server-Sent Events (SSE) hacia el frontend."""
    data = request.get_json() or {}
    message = data.get('message', '')
    context = data.get('context', {})

    def generate():
        for chunk in rag_client.copilot_stream(message, context):
            yield chunk

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )

@copilot_bp.route('/evaluate-risk', methods=['POST'])
@require_auth
def copilot_evaluate_risk():
    """Evalúa activo y genera propuesta de vector de riesgo según ISO 27005:2022."""
    data = request.get_json() or {}
    asset_name = data.get('asset_name', 'Activo')
    asset_type = data.get('asset_type', 'Hardware')
    cia_levels = data.get('cia_levels', {})

    res = rag_client.copilot_evaluate_risk(asset_name, asset_type, cia_levels)
    return jsonify(res), 200

@copilot_bp.route('/suggest-controls', methods=['POST'])
@require_auth
def copilot_suggest_controls():
    """Sugiere controles mitigantes del Anexo A ISO 27002:2022 con Action Chips."""
    data = request.get_json() or {}
    asset_name = data.get('asset_name', '')
    asset_type = data.get('asset_type', '')
    threat = data.get('threat', '')
    vulnerability = data.get('vulnerability', '')
    risk_level = data.get('risk_level', 'HIGH')

    res = rag_client.copilot_suggest_controls(
        asset_name=asset_name,
        asset_type=asset_type,
        threat=threat,
        vulnerability=vulnerability,
        risk_level=risk_level
    )
    return jsonify(res), 200

@copilot_bp.route('/assess-asset', methods=['POST'])
@require_auth
def copilot_assess_asset():
    """Inferencia de activo, TRD, valoración CID, Ley 1712 y controles ISO 27002:2022."""
    data = request.get_json() or {}
    asset_name = data.get('asset_name', '')
    asset_type = data.get('asset_type', '')
    description = data.get('description', '')

    res = rag_client.copilot_assess_asset(
        asset_name=asset_name,
        asset_type=asset_type,
        description=description
    )
    return jsonify(res), 200

@copilot_bp.route('/catalog', methods=['GET'])
@require_auth
def copilot_get_catalog():
    """Retorna los 93 controles oficiales de ISO 27002:2022."""
    if CATALOG_PATH.exists():
        try:
            with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f)), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Catálogo no encontrado'}), 404

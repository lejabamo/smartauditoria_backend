from flask import Blueprint, request, jsonify
from ..models import db, Auditoria, HallazgoAuditoria, PlanAccionCorreccion
from datetime import datetime

auditorias_bp = Blueprint('auditorias', __name__)

@auditorias_bp.route('/', methods=['GET'])
def get_auditorias():
    auditorias = Auditoria.query.all()
    return jsonify([a.to_dict() for a in auditorias])

@auditorias_bp.route('/', methods=['POST'])
def crear_auditoria():
    data = request.json
    nueva_audit = Auditoria(
        titulo=data.get('titulo'),
        descripcion=data.get('descripcion'),
        fecha_inicio=datetime.utcnow(),
        estado='Planificada',
        id_auditor_responsable=data.get('id_auditor')
    )
    db.session.add(nueva_audit)
    db.session.commit()
    return jsonify(nueva_audit.to_dict()), 201

@auditorias_bp.route('/hallazgos', methods=['GET'])
def get_hallazgos():
    hallazgos = HallazgoAuditoria.query.all()
    return jsonify([h.to_dict() for h in hallazgos])

@auditorias_bp.route('/hallazgos', methods=['POST'])
def crear_hallazgo():
    data = request.json
    nuevo_hallazgo = HallazgoAuditoria(
        id_auditoria=data.get('id_auditoria'),
        descripcion=data.get('descripcion'),
        tipo_hallazgo=data.get('tipo_hallazgo'),
        severidad=data.get('severidad'),
        requisito_iso=data.get('requisito_iso'),
        estado='Pendiente'
    )
    db.session.add(nuevo_hallazgo)
    db.session.commit()
    return jsonify(nuevo_hallazgo.to_dict()), 201

@auditorias_bp.route('/planes-accion', methods=['POST'])
def crear_plan_accion():
    data = request.json
    nuevo_plan = PlanAccionCorreccion(
        id_hallazgo=data.get('id_hallazgo'),
        descripcion_accion=data.get('descripcion_accion'),
        responsable=data.get('responsable'),
        fecha_compromiso=datetime.strptime(data.get('fecha_compromiso'), '%Y-%m-%d').date() if data.get('fecha_compromiso') else None,
        estado='Abierto'
    )
    db.session.add(nuevo_plan)
    db.session.commit()
    return jsonify(nuevo_plan.to_dict()), 201


# ============================================================================
# DECLARACIÓN DE APLICABILIDAD (SoA ISO/IEC 27001 / 27002:2022)
# ============================================================================

@auditorias_bp.route('/soa', methods=['GET'])
def get_statement_of_applicability():
    """Consulta la Declaración de Aplicabilidad con métricas oficiales."""
    try:
        from ..services.soa_service import SoAService
        tema = request.args.get('tema')
        soa_data = SoAService.get_soa_data(tema=tema)
        return jsonify(soa_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auditorias_bp.route('/soa/<int:id_control>', methods=['PUT'])
def update_control_soa(id_control):
    """Actualiza la aplicabilidad, justificación o evidencia de un control en el SoA."""
    try:
        from ..services.soa_service import SoAService
        data = request.get_json() or {}
        updated = SoAService.update_control(id_control, data)
        return jsonify({
            'message': 'Control SoA actualizado exitosamente',
            'control': updated
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auditorias_bp.route('/soa/copilot-audit', methods=['POST'])
def copilot_audit_soa():
    """Auditoría agéntica de la Declaración de Aplicabilidad con Auditor Copilot."""
    try:
        from ..services.soa_service import SoAService
        from ..infrastructure.ia_client.rag_client import rag_client
        
        # Obtener métricas actuales del SoA
        soa_data = SoAService.get_soa_data()
        metrics = soa_data.get("metricas", {})
        
        audit_reply = (
            f"Dictamen de Auditoría SoA ISO/IEC 27002:2022:\n"
            f"• Cobertura de Aplicabilidad: {metrics.get('porcentaje_aplicabilidad')}%\n"
            f"• Madurez de Implementación: {metrics.get('porcentaje_implementacion')}%\n"
            f"• Controles Implementados: {metrics.get('implementados')} de {metrics.get('aplicables')} aplicables.\n"
            f"Se recomienda focalizar esfuerzos de auditoría en los controles de la Cláusula 8 (Tecnológicos) "
            f"asociados a la protección de datos reservados según la Ley 1712 de 2014 y la Guía DAFP V7."
        )

        chips = [
            {
                "label": "Descargar SoA Oficial (.xlsx)",
                "action": "EXPORT_SOA_EXCEL"
            },
            {
                "label": "Revisar Controles Parciales",
                "action": "FILTER_PARTIAL_CONTROLS"
            }
        ]

        return jsonify({
            "dictamen_auditor": audit_reply,
            "metricas": metrics,
            "action_chips": chips,
            "norma_referencia": "ISO/IEC 27001:2022 Anexo A & DAFP V7"
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


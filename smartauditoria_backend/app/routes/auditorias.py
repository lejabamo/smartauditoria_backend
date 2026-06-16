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

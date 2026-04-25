from flask import Blueprint, request, jsonify
from ..models import db, Incidente, Activo
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

incidentes_bp = Blueprint('incidentes', __name__)

@incidentes_bp.route('/', methods=['GET'])
def get_incidentes():
    """Obtener todos los incidentes con filtros opcionales"""
    try:
        # Parámetros de filtrado
        tipo_incidente = request.args.get('tipo_incidente')
        severidad = request.args.get('severidad')
        estado = request.args.get('estado')
        activo_id = request.args.get('activo_id')
        
        query = Incidente.query
        
        if tipo_incidente:
            query = query.filter(Incidente.tipo_incidente == tipo_incidente)
        if severidad:
            query = query.filter(Incidente.severidad == severidad)
        if estado:
            query = query.filter(Incidente.estado == estado)
        if activo_id:
            query = query.filter(Incidente.ID_Activo == activo_id)
        
        incidentes = query.order_by(Incidente.fecha_incidente.desc()).all()
        return jsonify([incidente.to_dict() for incidente in incidentes]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/<int:incidente_id>', methods=['GET'])
def get_incidente(incidente_id):
    """Obtener un incidente específico por ID"""
    try:
        incidente = Incidente.query.get_or_404(incidente_id)
        return jsonify(incidente.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/', methods=['POST'])
def create_incidente():
    """Crear un nuevo incidente"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validaciones básicas
        if not data.get('titulo'):
            return jsonify({'error': 'El título del incidente es obligatorio'}), 400
        
        # Verificar si el activo existe
        if data.get('ID_Activo'):
            activo = Activo.query.get(data['ID_Activo'])
            if not activo:
                return jsonify({'error': 'El activo especificado no existe'}), 400
        
        incidente = Incidente(
            titulo=data.get('titulo'),
            descripcion=data.get('descripcion'),
            tipo_incidente=data.get('tipo_incidente'),
            severidad=data.get('severidad', 'Media'),
            estado=data.get('estado', 'Abierto'),
            ID_Activo=data.get('ID_Activo'),
            responsable=data.get('responsable'),
            acciones_correctivas=data.get('acciones_correctivas'),
            fecha_incidente=datetime.strptime(data['fecha_incidente'], '%Y-%m-%dT%H:%M:%S') if data.get('fecha_incidente') else datetime.utcnow()
        )
        
        db.session.add(incidente)
        db.session.commit()
        
        return jsonify(incidente.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': f'Error en formato de fecha: {str(e)}'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/<int:incidente_id>', methods=['PUT'])
def update_incidente(incidente_id):
    """Actualizar un incidente existente"""
    try:
        incidente = Incidente.query.get_or_404(incidente_id)
        data = request.json
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Actualizar campos
        if 'titulo' in data:
            incidente.titulo = data['titulo']
        if 'descripcion' in data:
            incidente.descripcion = data['descripcion']
        if 'tipo_incidente' in data:
            incidente.tipo_incidente = data['tipo_incidente']
        if 'severidad' in data:
            incidente.severidad = data['severidad']
        if 'estado' in data:
            incidente.estado = data['estado']
        if 'responsable' in data:
            incidente.responsable = data['responsable']
        if 'acciones_correctivas' in data:
            incidente.acciones_correctivas = data['acciones_correctivas']
        if 'ID_Activo' in data:
            if data['ID_Activo']:
                activo = Activo.query.get(data['ID_Activo'])
                if not activo:
                    return jsonify({'error': 'El activo especificado no existe'}), 400
            incidente.ID_Activo = data['ID_Activo']
        if 'fecha_resolucion' in data:
            incidente.fecha_resolucion = datetime.strptime(data['fecha_resolucion'], '%Y-%m-%dT%H:%M:%S') if data['fecha_resolucion'] else None
        
        db.session.commit()
        return jsonify(incidente.to_dict()), 200
    except ValueError as e:
        return jsonify({'error': f'Error en formato de fecha: {str(e)}'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/<int:incidente_id>', methods=['DELETE'])
def delete_incidente(incidente_id):
    """Eliminar un incidente"""
    try:
        incidente = Incidente.query.get_or_404(incidente_id)
        db.session.delete(incidente)
        db.session.commit()
        return jsonify({'message': 'Incidente eliminado correctamente'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/tipos', methods=['GET'])
def get_tipos_incidente():
    """Obtener todos los tipos de incidente únicos"""
    try:
        tipos = db.session.query(Incidente.tipo_incidente).distinct().all()
        return jsonify([tipo[0] for tipo in tipos if tipo[0]]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/severidades', methods=['GET'])
def get_severidades():
    """Obtener todas las severidades únicas"""
    try:
        severidades = db.session.query(Incidente.severidad).distinct().all()
        return jsonify([sev[0] for sev in severidades if sev[0]]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/estados', methods=['GET'])
def get_estados_incidente():
    """Obtener todos los estados de incidente únicos"""
    try:
        estados = db.session.query(Incidente.estado).distinct().all()
        return jsonify([estado[0] for estado in estados if estado[0]]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/<int:incidente_id>/resolver', methods=['PUT'])
def resolver_incidente(incidente_id):
    """Marcar un incidente como resuelto"""
    try:
        incidente = Incidente.query.get_or_404(incidente_id)
        data = request.json
        
        incidente.estado = 'Resuelto'
        incidente.fecha_resolucion = datetime.utcnow()
        
        if data and data.get('acciones_correctivas'):
            incidente.acciones_correctivas = data['acciones_correctivas']
        
        db.session.commit()
        return jsonify(incidente.to_dict()), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@incidentes_bp.route('/estadisticas', methods=['GET'])
def get_estadisticas_incidentes():
    """Obtener estadísticas de incidentes"""
    try:
        # Total de incidentes
        total_incidentes = Incidente.query.count()
        
        # Incidentes por estado
        incidentes_por_estado = db.session.query(
            Incidente.estado, 
            db.func.count(Incidente.id_incidente)
        ).group_by(Incidente.estado).all()
        
        # Incidentes por severidad
        incidentes_por_severidad = db.session.query(
            Incidente.severidad, 
            db.func.count(Incidente.id_incidente)
        ).group_by(Incidente.severidad).all()
        
        # Incidentes por tipo
        incidentes_por_tipo = db.session.query(
            Incidente.tipo_incidente, 
            db.func.count(Incidente.id_incidente)
        ).group_by(Incidente.tipo_incidente).all()
        
        # Incidentes del último mes
        from datetime import timedelta
        un_mes_atras = datetime.utcnow() - timedelta(days=30)
        incidentes_ultimo_mes = Incidente.query.filter(
            Incidente.fecha_incidente >= un_mes_atras
        ).count()
        
        return jsonify({
            'total_incidentes': total_incidentes,
            'incidentes_por_estado': dict(incidentes_por_estado),
            'incidentes_por_severidad': dict(incidentes_por_severidad),
            'incidentes_por_tipo': dict(incidentes_por_tipo),
            'incidentes_ultimo_mes': incidentes_ultimo_mes
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 

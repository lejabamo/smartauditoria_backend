from flask import Blueprint, request, jsonify
from ..models import db, UsuarioSistema, Activo
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from ..auth.decorators import consultant_required, write_required
from ..utils.logger import get_logger

logger = get_logger(__name__)
usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/', methods=['GET'])
@consultant_required
def get_usuarios():
    """Obtener todos los usuarios con filtros opcionales"""
    try:
        # Parámetros de filtrado
        puesto = request.args.get('puesto')
        estado = request.args.get('estado')
        
        query = UsuarioSistema.query
        
        if puesto:
            query = query.filter(UsuarioSistema.puesto_organizacion == puesto)
        if estado:
            query = query.filter(UsuarioSistema.estado_usuario == estado)
        
        usuarios = query.all()
        return jsonify([{
            'id': u.id_usuario,  # Agregar 'id' para compatibilidad con DataGrid
            'id_usuario': u.id_usuario,
            'nombre_completo': u.nombre_completo,
            'email_institucional': u.email_institucional,
            'puesto_organizacion': u.puesto_organizacion,
            'estado_usuario': u.estado_usuario,
            'fecha_creacion_registro': u.fecha_creacion_registro.isoformat() if u.fecha_creacion_registro else None
        } for u in usuarios]), 200
    except Exception as e:
        logger.error("Error en get_usuarios: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<int:usuario_id>', methods=['GET'])
@consultant_required
def get_usuario(usuario_id):
    """Obtener un usuario específico por ID"""
    try:
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        return jsonify({
            'id_usuario': usuario.id_usuario,
            'nombre_completo': usuario.nombre_completo,
            'email_institucional': usuario.email_institucional,
            'puesto_organizacion': usuario.puesto_organizacion,
            'estado_usuario': usuario.estado_usuario,
            'fecha_creacion_registro': usuario.fecha_creacion_registro.isoformat() if usuario.fecha_creacion_registro else None
        }), 200
    except Exception as e:
        logger.error("Error en get_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/', methods=['POST'])
@write_required
def create_usuario():
    """Crear un nuevo usuario"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validaciones básicas
        if not data.get('nombre_completo'):
            return jsonify({'error': 'El nombre completo del usuario es obligatorio'}), 400
        if not data.get('email_institucional'):
            return jsonify({'error': 'El email institucional del usuario es obligatorio'}), 400
        
        # Verificar si el email ya existe
        usuario_existente = UsuarioSistema.query.filter_by(email_institucional=data['email_institucional']).first()
        if usuario_existente:
            return jsonify({'error': 'Ya existe un usuario con ese email institucional'}), 400
        
        usuario = UsuarioSistema(
            nombre_completo=data.get('nombre_completo'),
            email_institucional=data.get('email_institucional'),
            puesto_organizacion=data.get('puesto_organizacion'),
            estado_usuario=data.get('estado_usuario', 'Activo')
        )
        
        db.session.add(usuario)
        db.session.commit()
        
        return jsonify({
            'id_usuario': usuario.id_usuario,
            'nombre_completo': usuario.nombre_completo,
            'email_institucional': usuario.email_institucional,
            'puesto_organizacion': usuario.puesto_organizacion,
            'estado_usuario': usuario.estado_usuario,
            'fecha_creacion_registro': usuario.fecha_creacion_registro.isoformat() if usuario.fecha_creacion_registro else None
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Error de base de datos en create_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error("Error en create_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<int:usuario_id>', methods=['PUT'])
@write_required
def update_usuario(usuario_id):
    """Actualizar un usuario existente"""
    try:
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        data = request.json
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Actualizar campos
        if 'nombre_completo' in data:
            usuario.nombre_completo = data['nombre_completo']
        if 'email_institucional' in data:
            # Verificar si el nuevo email ya existe en otro usuario
            usuario_existente = UsuarioSistema.query.filter_by(email_institucional=data['email_institucional']).first()
            if usuario_existente and usuario_existente.id_usuario != usuario_id:
                return jsonify({'error': 'Ya existe un usuario con ese email institucional'}), 400
            usuario.email_institucional = data['email_institucional']
        if 'puesto_organizacion' in data:
            usuario.puesto_organizacion = data['puesto_organizacion']
        if 'estado_usuario' in data:
            usuario.estado_usuario = data['estado_usuario']
        
        db.session.commit()
        return jsonify({
            'id_usuario': usuario.id_usuario,
            'nombre_completo': usuario.nombre_completo,
            'email_institucional': usuario.email_institucional,
            'puesto_organizacion': usuario.puesto_organizacion,
            'estado_usuario': usuario.estado_usuario,
            'fecha_creacion_registro': usuario.fecha_creacion_registro.isoformat() if usuario.fecha_creacion_registro else None
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Error de base de datos en update_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error("Error en update_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<int:usuario_id>', methods=['DELETE'])
@write_required
def delete_usuario(usuario_id):
    """Eliminar un usuario"""
    try:
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        
        # Verificar si el usuario tiene activos asociados
        activos_propietario = Activo.query.filter_by(ID_Propietario=usuario_id).count()
        activos_custodio = Activo.query.filter_by(ID_Custodio=usuario_id).count()
        
        if activos_propietario > 0 or activos_custodio > 0:
            return jsonify({
                'error': 'No se puede eliminar el usuario porque tiene activos asociados',
                'activos_como_propietario': activos_propietario,
                'activos_como_custodio': activos_custodio
            }), 400
        
        db.session.delete(usuario)
        db.session.commit()
        return jsonify({'message': 'Usuario eliminado correctamente'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Error de base de datos en delete_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error("Error en delete_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/puestos', methods=['GET'])
@consultant_required
def get_puestos():
    """Obtener todos los puestos únicos"""
    try:
        puestos = db.session.query(UsuarioSistema.puesto_organizacion).distinct().all()
        return jsonify([puesto[0] for puesto in puestos if puesto[0]]), 200
    except Exception as e:
        logger.error("Error en get_puestos: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/estados', methods=['GET'])
@consultant_required
def get_estados():
    """Obtener todos los estados únicos"""
    try:
        estados = db.session.query(UsuarioSistema.estado_usuario).distinct().all()
        return jsonify([estado[0] for estado in estados if estado[0]]), 200
    except Exception as e:
        logger.error("Error en get_estados: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<int:usuario_id>/detalle', methods=['GET'])
@consultant_required
def get_detalle_usuario(usuario_id):
    """Obtener detalle completo del usuario con procesos y oficina"""
    try:
        from sqlalchemy import text
        
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        usuario_dict = {
            'id_usuario': usuario.id_usuario,
            'nombre_completo': usuario.nombre_completo,
            'email_institucional': usuario.email_institucional,
            'puesto_organizacion': usuario.puesto_organizacion,
            'estado_usuario': usuario.estado_usuario,
            'fecha_creacion_registro': usuario.fecha_creacion_registro.isoformat() if usuario.fecha_creacion_registro else None,
            'fecha_ultima_actualizacion': usuario.fecha_ultima_actualizacion.isoformat() if usuario.fecha_ultima_actualizacion else None,
            'fecha_ultimo_login': usuario.fecha_ultimo_login.isoformat() if usuario.fecha_ultimo_login else None,
        }
        
        # Obtener activos como propietario y custodio
        activos_propietario = Activo.query.filter_by(ID_Propietario=usuario_id).all()
        activos_custodio = Activo.query.filter_by(ID_Custodio=usuario_id).all()
        
        # Intentar obtener información de proceso y oficina desde otras tablas
        # Si existen tablas de procesos u oficinas, se pueden consultar aquí
        proceso_info = None
        oficina_info = None
        
        try:
            # Buscar proceso relacionado (si existe tabla procesos)
            proceso_result = db.session.execute(
                text("""
                    SELECT 
                        p.ID_Proceso,
                        p.Nombre_Proceso,
                        p.Descripcion_Proceso,
                        p.Responsable_Proceso
                    FROM procesos p
                    WHERE p.Responsable_Proceso = :usuario_id
                    LIMIT 1
                """),
                {'usuario_id': usuario_id}
            ).fetchone()
            
            if proceso_result:
                proceso_info = {
                    'id': proceso_result.ID_Proceso,
                    'nombre': proceso_result.Nombre_Proceso,
                    'descripcion': proceso_result.Descripcion_Proceso,
                    'responsable': proceso_result.Responsable_Proceso
                }
        except Exception:
            # Si no existe la tabla, usar información del puesto como referencia
            proceso_info = {
                'nombre': usuario.puesto_organizacion or 'No definido',
                'descripcion': f'Proceso asociado al puesto: {usuario.puesto_organizacion}',
                'nota': 'Información derivada del puesto organizacional'
            }
        
        try:
            # Buscar oficina relacionada (si existe tabla oficinas)
            oficina_result = db.session.execute(
                text("""
                    SELECT 
                        o.ID_Oficina,
                        o.Nombre_Oficina,
                        o.Descripcion_Oficina,
                        o.Direccion
                    FROM oficinas o
                    JOIN usuarios_oficinas uo ON o.ID_Oficina = uo.ID_Oficina
                    WHERE uo.id_usuario = :usuario_id
                    LIMIT 1
                """),
                {'usuario_id': usuario_id}
            ).fetchone()
            
            if oficina_result:
                oficina_info = {
                    'id': oficina_result.ID_Oficina,
                    'nombre': oficina_result.Nombre_Oficina,
                    'descripcion': oficina_result.Descripcion_Oficina,
                    'direccion': oficina_result.Direccion
                }
        except Exception:
            # Si no existe la tabla, usar información del email como referencia
            if usuario.email_institucional:
                dominio = usuario.email_institucional.split('@')[1] if '@' in usuario.email_institucional else None
                oficina_info = {
                    'nombre': dominio or 'No definido',
                    'descripcion': f'Oficina derivada del dominio: {dominio}',
                    'nota': 'Información derivada del email institucional'
                }
        
        return jsonify({
            'usuario': usuario_dict,
            'proceso': proceso_info,
            'oficina': oficina_info,
            'activos': {
                'como_propietario': [activo.to_dict() for activo in activos_propietario],
                'como_custodio': [activo.to_dict() for activo in activos_custodio],
                'total_propietario': len(activos_propietario),
                'total_custodio': len(activos_custodio),
                'total': len(activos_propietario) + len(activos_custodio)
            }
        }), 200
        
    except Exception as e:
        logger.error("Error en get_detalle_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<int:usuario_id>/activos', methods=['GET'])
@consultant_required
def get_activos_usuario(usuario_id):
    """Obtener los activos asociados a un usuario (como propietario o custodio)"""
    try:
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        
        # Obtener activos como propietario
        activos_propietario = Activo.query.filter_by(ID_Propietario=usuario_id).all()
        
        # Obtener activos como custodio
        activos_custodio = Activo.query.filter_by(ID_Custodio=usuario_id).all()
        
        return jsonify({
            'usuario': {
                'id_usuario': usuario.id_usuario,
                'nombre': usuario.nombre,
                'email': usuario.email,
                'departamento': usuario.departamento,
                'rol': usuario.rol
            },
            'activos_como_propietario': [activo.to_dict() for activo in activos_propietario],
            'activos_como_custodio': [activo.to_dict() for activo in activos_custodio],
            'total_activos_propietario': len(activos_propietario),
            'total_activos_custodio': len(activos_custodio)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/estadisticas', methods=['GET'])
def get_estadisticas_usuarios():
    """Obtener estadísticas de usuarios"""
    try:
        # Total de usuarios
        total_usuarios = UsuarioSistema.query.count()
        
        # Usuarios por departamento
        usuarios_por_departamento = db.session.query(
            UsuarioSistema.departamento, 
            db.func.count(UsuarioSistema.id_usuario)
        ).group_by(UsuarioSistema.departamento).all()
        
        # Usuarios por rol
        usuarios_por_rol = db.session.query(
            UsuarioSistema.rol, 
            db.func.count(UsuarioSistema.id_usuario)
        ).group_by(UsuarioSistema.rol).all()
        
        # Usuarios creados en el último mes
        from datetime import timedelta
        un_mes_atras = datetime.utcnow() - timedelta(days=30)
        usuarios_ultimo_mes = UsuarioSistema.query.filter(
            UsuarioSistema.fecha_creacion >= un_mes_atras
        ).count()
        
        return jsonify({
            'total_usuarios': total_usuarios,
            'usuarios_por_departamento': dict(usuarios_por_departamento),
            'usuarios_por_rol': dict(usuarios_por_rol),
            'usuarios_ultimo_mes': usuarios_ultimo_mes
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 

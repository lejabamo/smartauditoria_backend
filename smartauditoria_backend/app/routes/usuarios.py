from flask import Blueprint, request, jsonify
from ..models import db, UsuarioSistema, UsuarioAuth, Rol, Activo
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from ..auth.decorators import consultant_required, write_required, admin_required
from ..utils.logger import get_logger
import secrets
import string

logger = get_logger(__name__)
usuarios_bp = Blueprint('usuarios', __name__)

def _ensure_default_roles():
    """Asegura que los roles estándar del sistema existan en roles_auth"""
    roles_def = [
        ('ADMIN', 'Administrador del sistema con acceso completo', '["*"]'),
        ('OPERADOR', 'Operador SGSI con gestión de activos, riesgos y auditorías', '["activos:read", "activos:write", "riesgos:read", "riesgos:write", "auditorias:read", "auditorias:write", "usuarios:read"]'),
        ('AUXILIAR', 'Auxiliar de Auditoría operativo para wizard y recolección de evidencias (sin aprobación)', '["activos:read", "riesgos:read", "auditorias:read", "auditorias:write", "wizard:execute"]'),
        ('CONSULTOR', 'Consultor con permisos de solo lectura (modo consulta)', '["activos:read", "riesgos:read", "auditorias:read", "usuarios:read"]')
    ]
    for nombre, desc, perms in roles_def:
        rol = Rol.query.filter_by(nombre_rol=nombre).first()
        if not rol:
            rol = Rol(nombre_rol=nombre, descripcion=desc, permisos=perms, activo=True)
            db.session.add(rol)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

@usuarios_bp.route('/roles', methods=['GET'])
@consultant_required
def get_roles_list():
    """Obtener el catálogo completo de roles del sistema con sus permisos (HU-003 / SCRUM-27)"""
    try:
        _ensure_default_roles()
        roles = Rol.query.filter_by(activo=True).all()
        return jsonify([rol.to_dict() for rol in roles]), 200
    except Exception as e:
        logger.error("Error en get_roles_list: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/', methods=['GET'])
@consultant_required
def get_usuarios():
    """Obtener todos los usuarios con información de autenticación y roles RBAC (HU-009 / SCRUM-36)"""
    try:
        puesto = request.args.get('puesto')
        estado = request.args.get('estado')
        rol_filtro = request.args.get('rol')
        
        query = UsuarioSistema.query
        
        if puesto:
            query = query.filter(UsuarioSistema.puesto_organizacion == puesto)
        if estado:
            query = query.filter(UsuarioSistema.estado_usuario == estado)
        
        usuarios = query.all()
        resultado = []
        
        for u in usuarios:
            auth = u.usuarios_auth.first() if hasattr(u, 'usuarios_auth') else None
            
            rol_nombre = None
            id_rol = None
            if auth and auth.rol:
                rol_nombre = auth.rol.nombre_rol
                id_rol = auth.id_rol
            elif u.puesto_organizacion in ['ADMIN', 'OPERADOR', 'CONSULTOR', 'AUXILIAR', 'Administrador', 'Auditor']:
                rol_nombre = u.puesto_organizacion
            else:
                rol_nombre = 'CONSULTOR'
            
            # Filtro por rol si fue solicitado
            if rol_filtro and rol_nombre.upper() != rol_filtro.upper():
                continue
            
            is_blocked = bool(auth and auth.bloqueado_hasta and datetime.utcnow() < auth.bloqueado_hasta)
            is_active = auth.activo if auth else (u.estado_usuario == 'Activo')
            
            resultado.append({
                'id': u.id_usuario,
                'id_usuario': u.id_usuario,
                'nombre': u.nombre_completo,
                'nombre_completo': u.nombre_completo,
                'email': u.email_institucional,
                'email_institucional': u.email_institucional,
                'puesto': u.puesto_organizacion or 'Usuario del Sistema',
                'puesto_organizacion': u.puesto_organizacion or 'Usuario del Sistema',
                'rol': rol_nombre,
                'rol_nombre': rol_nombre,
                'id_rol': id_rol,
                'username': auth.username if auth else (u.email_institucional.split('@')[0] if u.email_institucional else f"user_{u.id_usuario}"),
                'tiene_auth': auth is not None,
                'id_usuario_auth': auth.id_usuario_auth if auth else None,
                'activo': is_active,
                'bloqueado': is_blocked,
                'intentos_fallidos': auth.intentos_fallidos if auth else 0,
                'estado': 'Bloqueado' if is_blocked else ('Activo' if is_active else 'Inactivo'),
                'estado_usuario': 'Bloqueado' if is_blocked else ('Activo' if is_active else 'Inactivo'),
                'fecha_creacion': u.fecha_creacion_registro.isoformat() if u.fecha_creacion_registro else None,
                'fecha_creacion_registro': u.fecha_creacion_registro.isoformat() if u.fecha_creacion_registro else None,
                'fecha_ultimo_login': auth.fecha_ultimo_login.isoformat() if (auth and auth.fecha_ultimo_login) else None
            })
            
        return jsonify(resultado), 200
    except Exception as e:
        logger.error("Error en get_usuarios: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<int:usuario_id>', methods=['GET'])
@consultant_required
def get_usuario(usuario_id):
    """Obtener un usuario específico por ID con datos de rol y autenticación"""
    try:
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        auth = usuario.usuarios_auth.first() if hasattr(usuario, 'usuarios_auth') else None
        
        rol_nombre = auth.rol.nombre_rol if (auth and auth.rol) else (usuario.puesto_organizacion or 'CONSULTOR')
        id_rol = auth.id_rol if auth else None
        is_blocked = bool(auth and auth.bloqueado_hasta and datetime.utcnow() < auth.bloqueado_hasta)
        is_active = auth.activo if auth else (usuario.estado_usuario == 'Activo')
        
        return jsonify({
            'id': usuario.id_usuario,
            'id_usuario': usuario.id_usuario,
            'nombre': usuario.nombre_completo,
            'nombre_completo': usuario.nombre_completo,
            'email': usuario.email_institucional,
            'email_institucional': usuario.email_institucional,
            'puesto': usuario.puesto_organizacion or 'Usuario del Sistema',
            'puesto_organizacion': usuario.puesto_organizacion or 'Usuario del Sistema',
            'rol': rol_nombre,
            'rol_nombre': rol_nombre,
            'id_rol': id_rol,
            'username': auth.username if auth else None,
            'tiene_auth': auth is not None,
            'id_usuario_auth': auth.id_usuario_auth if auth else None,
            'activo': is_active,
            'bloqueado': is_blocked,
            'intentos_fallidos': auth.intentos_fallidos if auth else 0,
            'estado': 'Bloqueado' if is_blocked else ('Activo' if is_active else 'Inactivo'),
            'estado_usuario': 'Bloqueado' if is_blocked else ('Activo' if is_active else 'Inactivo'),
            'fecha_creacion': usuario.fecha_creacion_registro.isoformat() if usuario.fecha_creacion_registro else None,
            'fecha_creacion_registro': usuario.fecha_creacion_registro.isoformat() if usuario.fecha_creacion_registro else None,
            'fecha_ultimo_login': auth.fecha_ultimo_login.isoformat() if (auth and auth.fecha_ultimo_login) else None
        }), 200
    except Exception as e:
        logger.error("Error en get_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/', methods=['POST'])
@write_required
def create_usuario():
    """Crear un nuevo usuario con cuenta de autenticación y asignación de rol (HU-009 / SCRUM-36)"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        _ensure_default_roles()
        
        nombre = data.get('nombre_completo') or data.get('nombre')
        email = data.get('email_institucional') or data.get('email')
        puesto = data.get('puesto_organizacion') or data.get('puesto') or 'Usuario del Sistema'
        estado = data.get('estado_usuario') or data.get('estado') or 'Activo'
        rol_solicitado = data.get('rol_nombre') or data.get('rol') or 'CONSULTOR'
        id_rol_solicitado = data.get('id_rol')
        
        username = data.get('username') or (email.split('@')[0] if email else None)
        password = data.get('password')
        
        # Validaciones
        if not nombre:
            return jsonify({'error': 'El nombre completo del usuario es obligatorio'}), 400
        if not email:
            return jsonify({'error': 'El email institucional del usuario es obligatorio'}), 400
        
        # Verificar si el email ya existe
        usuario_existente = UsuarioSistema.query.filter_by(email_institucional=email).first()
        if usuario_existente:
            return jsonify({'error': 'Ya existe un usuario con ese email institucional'}), 400
        
        # Resolver rol en la BD
        rol = None
        if id_rol_solicitado:
            rol = Rol.query.get(id_rol_solicitado)
        if not rol and rol_solicitado:
            rol = Rol.query.filter(Rol.nombre_rol.ilike(rol_solicitado)).first()
        if not rol:
            rol = Rol.query.filter_by(nombre_rol='CONSULTOR').first() or Rol.query.first()
        
        # Crear UsuarioSistema
        usuario = UsuarioSistema(
            nombre_completo=nombre,
            email_institucional=email,
            puesto_organizacion=puesto,
            estado_usuario=estado
        )
        db.session.add(usuario)
        db.session.flush() # Obtener id_usuario generado
        
        # Crear cuenta de autenticación si se requiere o si se proveen credenciales
        auth_created = None
        if username or password:
            if not username:
                username = f"user_{usuario.id_usuario}"
            
            # Verificar username único
            existing_auth = UsuarioAuth.query.filter_by(username=username).first()
            if existing_auth:
                username = f"{username}_{usuario.id_usuario}"
            
            if not password:
                password = "User@2026!"
            
            auth_created = UsuarioAuth(
                id_usuario_sistema=usuario.id_usuario,
                username=username,
                id_rol=rol.id_rol if rol else 3,
                activo=(estado == 'Activo')
            )
            auth_created.set_password(password)
            db.session.add(auth_created)
        
        db.session.commit()
        
        return jsonify({
            'id': usuario.id_usuario,
            'id_usuario': usuario.id_usuario,
            'nombre': usuario.nombre_completo,
            'nombre_completo': usuario.nombre_completo,
            'email': usuario.email_institucional,
            'email_institucional': usuario.email_institucional,
            'puesto': usuario.puesto_organizacion,
            'puesto_organizacion': usuario.puesto_organizacion,
            'rol': rol.nombre_rol if rol else 'CONSULTOR',
            'rol_nombre': rol.nombre_rol if rol else 'CONSULTOR',
            'id_rol': rol.id_rol if rol else None,
            'username': auth_created.username if auth_created else None,
            'activo': auth_created.activo if auth_created else True,
            'estado': usuario.estado_usuario,
            'estado_usuario': usuario.estado_usuario,
            'fecha_creacion': usuario.fecha_creacion_registro.isoformat() if usuario.fecha_creacion_registro else None,
            'password_generado': password if not data.get('password') and auth_created else None
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
    """Actualizar un usuario existente, incluyendo asignación de roles y estados RBAC"""
    try:
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        data = request.json or {}
        
        nombre = data.get('nombre_completo') or data.get('nombre')
        email = data.get('email_institucional') or data.get('email')
        puesto = data.get('puesto_organizacion') or data.get('puesto')
        estado = data.get('estado_usuario') or data.get('estado')
        
        rol_solicitado = data.get('rol_nombre') or data.get('rol')
        id_rol_solicitado = data.get('id_rol')
        activo_solicitado = data.get('activo')
        desbloquear = data.get('desbloquear', False)
        
        # Validar email duplicado
        if email and email != usuario.email_institucional:
            usuario_existente = UsuarioSistema.query.filter_by(email_institucional=email).first()
            if usuario_existente and usuario_existente.id_usuario != usuario_id:
                return jsonify({'error': 'Ya existe un usuario con ese email institucional'}), 400
            usuario.email_institucional = email
        
        if nombre:
            usuario.nombre_completo = nombre
        if puesto:
            usuario.puesto_organizacion = puesto
        if estado:
            usuario.estado_usuario = estado
        
        # Actualizar cuenta de autenticación asociada
        auth = usuario.usuarios_auth.first() if hasattr(usuario, 'usuarios_auth') else None
        
        # Resolver nuevo rol
        nuevo_rol = None
        if id_rol_solicitado:
            nuevo_rol = Rol.query.get(id_rol_solicitado)
        elif rol_solicitado:
            nuevo_rol = Rol.query.filter(Rol.nombre_rol.ilike(rol_solicitado)).first()
            
        if auth:
            if nuevo_rol:
                auth.id_rol = nuevo_rol.id_rol
            if activo_solicitado is not None:
                auth.activo = bool(activo_solicitado)
            elif estado:
                auth.activo = (estado == 'Activo')
                
            if desbloquear:
                auth.intentos_fallidos = 0
                auth.bloqueado_hasta = None
        elif nuevo_rol or activo_solicitado is not None:
            # Si no tenía cuenta UsuarioAuth y se le asigna rol, se la creamos
            default_username = usuario.email_institucional.split('@')[0] if usuario.email_institucional else f"user_{usuario.id_usuario}"
            auth = UsuarioAuth(
                id_usuario_sistema=usuario.id_usuario,
                username=default_username,
                id_rol=nuevo_rol.id_rol if nuevo_rol else 3,
                activo=True
            )
            auth.set_password("User@2026!")
            db.session.add(auth)
            
        db.session.commit()
        
        rol_final = auth.rol.nombre_rol if (auth and auth.rol) else (usuario.puesto_organizacion or 'CONSULTOR')
        is_blocked = bool(auth and auth.bloqueado_hasta and datetime.utcnow() < auth.bloqueado_hasta)
        is_active = auth.activo if auth else (usuario.estado_usuario == 'Activo')
        
        return jsonify({
            'id': usuario.id_usuario,
            'id_usuario': usuario.id_usuario,
            'nombre': usuario.nombre_completo,
            'nombre_completo': usuario.nombre_completo,
            'email': usuario.email_institucional,
            'email_institucional': usuario.email_institucional,
            'puesto': usuario.puesto_organizacion,
            'puesto_organizacion': usuario.puesto_organizacion,
            'rol': rol_final,
            'rol_nombre': rol_final,
            'id_rol': auth.id_rol if auth else None,
            'username': auth.username if auth else None,
            'activo': is_active,
            'bloqueado': is_blocked,
            'estado': 'Bloqueado' if is_blocked else ('Activo' if is_active else 'Inactivo'),
            'estado_usuario': 'Bloqueado' if is_blocked else ('Activo' if is_active else 'Inactivo'),
            'fecha_creacion': usuario.fecha_creacion_registro.isoformat() if usuario.fecha_creacion_registro else None
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Error de base de datos en update_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error("Error en update_usuario: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<int:usuario_id>/reset-password', methods=['POST'])
@write_required
def admin_reset_password(usuario_id):
    """Restablecimiento directo de contraseña por parte del administrador (HU-010 / SCRUM-37)"""
    try:
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        auth = usuario.usuarios_auth.first() if hasattr(usuario, 'usuarios_auth') else None
        
        data = request.json or {}
        new_password = data.get('new_password') or data.get('password')
        
        if not new_password:
            # Generar contraseña temporal segura
            alphabet = string.ascii_letters + string.digits + "!@#$%&*"
            new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
            
        if len(new_password) < 8:
            return jsonify({'error': 'La contraseña debe tener al menos 8 caracteres'}), 400
        
        if not auth:
            # Crear cuenta de autenticación si no existía
            default_username = usuario.email_institucional.split('@')[0] if usuario.email_institucional else f"user_{usuario.id_usuario}"
            auth = UsuarioAuth(
                id_usuario_sistema=usuario.id_usuario,
                username=default_username,
                id_rol=3, # CONSULTOR
                activo=True
            )
            db.session.add(auth)
            
        auth.set_password(new_password)
        auth.intentos_fallidos = 0
        auth.bloqueado_hasta = None
        
        if hasattr(usuario, 'password_hash'):
            usuario.password_hash = auth.password_hash
            
        db.session.commit()
        
        return jsonify({
            'message': f'Contraseña restablecida exitosamente para el usuario {usuario.nombre_completo}',
            'username': auth.username,
            'password_temporal': new_password
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error("Error en admin_reset_password: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/<int:usuario_id>/toggle-status', methods=['POST'])
@write_required
def toggle_usuario_status(usuario_id):
    """Activar, desactivar o desbloquear un usuario"""
    try:
        usuario = UsuarioSistema.query.get_or_404(usuario_id)
        auth = usuario.usuarios_auth.first() if hasattr(usuario, 'usuarios_auth') else None
        
        nuevo_estado = 'Inactivo' if usuario.estado_usuario == 'Activo' else 'Activo'
        usuario.estado_usuario = nuevo_estado
        
        if auth:
            auth.activo = (nuevo_estado == 'Activo')
            auth.intentos_fallidos = 0
            auth.bloqueado_hasta = None
            
        db.session.commit()
        return jsonify({
            'message': f'Estado del usuario actualizado a {nuevo_estado}',
            'estado': nuevo_estado,
            'activo': (nuevo_estado == 'Activo')
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
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
                'nombre': usuario.nombre_completo,
                'email': usuario.email_institucional,
                'departamento': usuario.puesto_organizacion,
                'rol': usuario.puesto_organizacion
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
            UsuarioSistema.puesto_organizacion, 
            db.func.count(UsuarioSistema.id_usuario)
        ).group_by(UsuarioSistema.puesto_organizacion).all()
        
        # Usuarios por rol (usando puesto_organizacion como fallback)
        usuarios_por_rol = db.session.query(
            UsuarioSistema.puesto_organizacion, 
            db.func.count(UsuarioSistema.id_usuario)
        ).group_by(UsuarioSistema.puesto_organizacion).all()
        
        # Usuarios creados en el último mes
        from datetime import timedelta
        un_mes_atras = datetime.utcnow() - timedelta(days=30)
        usuarios_ultimo_mes = UsuarioSistema.query.filter(
            UsuarioSistema.fecha_creacion_registro >= un_mes_atras
        ).count()
        
        return jsonify({
            'total_usuarios': total_usuarios,
            'usuarios_por_departamento': dict(usuarios_por_departamento),
            'usuarios_por_rol': dict(usuarios_por_rol),
            'usuarios_ultimo_mes': usuarios_ultimo_mes
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 

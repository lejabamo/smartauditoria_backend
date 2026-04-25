"""
Rutas de autenticación y autorización
"""

from flask import Blueprint, request, jsonify, current_app
from .. import db
from .models import UsuarioAuth, Rol, SesionUsuario
from .. import models as models_module
UsuarioSistema = models_module.UsuarioSistema
from datetime import datetime, timedelta
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Iniciar sesión"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username y password son requeridos'}), 400
        
        # Buscar usuario con relación de rol cargada
        from sqlalchemy.orm import joinedload
        usuario = UsuarioAuth.query.options(joinedload(UsuarioAuth.rol)).filter_by(username=username).first()
        
        if not usuario:
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        if not usuario.activo:
            return jsonify({'error': 'Usuario inactivo'}), 401
        
        # Verificar si está bloqueado
        if usuario.bloqueado_hasta and datetime.utcnow() < usuario.bloqueado_hasta:
            return jsonify({'error': 'Usuario bloqueado temporalmente'}), 401
        
        # Verificar contraseña
        if not usuario.check_password(password):
            # Incrementar intentos fallidos
            usuario.intentos_fallidos += 1
            
            # Bloquear después de 5 intentos fallidos
            if usuario.intentos_fallidos >= 5:
                usuario.bloqueado_hasta = datetime.utcnow() + timedelta(minutes=30)
            
            db.session.commit()
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        # Login exitoso - resetear intentos fallidos
        usuario.intentos_fallidos = 0
        usuario.bloqueado_hasta = None
        usuario.fecha_ultimo_login = datetime.utcnow()
        
        # Generar token
        token = usuario.generate_token()
        
        # Crear sesión
        sesion = SesionUsuario(
            id_usuario_auth=usuario.id_usuario_auth,
            token=token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            fecha_expiracion=datetime.utcnow() + timedelta(hours=8)
        )
        
        db.session.add(sesion)
        db.session.commit()
        
        return jsonify({
            'message': 'Login exitoso',
            'token': token,
            'user': usuario.to_dict(),
            'expires_in': 28800
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Error en login: {str(e)}")
        print(error_trace)
        # En desarrollo, devolver el traceback completo para debugging
        if current_app.config.get('DEBUG', False):
            return jsonify({'error': str(e), 'traceback': error_trace}), 500
        return jsonify({'error': 'Error interno del servidor'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Cerrar sesión"""
    try:
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Token malformado'}), 401
        
        if token:
            # Marcar sesión como inactiva
            sesion = SesionUsuario.query.filter_by(token=token, activa=True).first()
            if sesion:
                sesion.activa = False
                db.session.commit()
        
        return jsonify({'message': 'Logout exitoso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar nuevo usuario (solo admin)"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validar datos requeridos
        required_fields = ['username', 'password', 'id_usuario_sistema', 'id_rol']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        username = data['username']
        password = data['password']
        id_usuario_sistema = data['id_usuario_sistema']
        id_rol = data['id_rol']
        
        # Validar formato de username
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
            return jsonify({'error': 'Username debe tener entre 3-20 caracteres alfanuméricos'}), 400
        
        # Validar fortaleza de contraseña
        if len(password) < 8:
            return jsonify({'error': 'La contraseña debe tener al menos 8 caracteres'}), 400
        
        # Verificar si el username ya existe
        if UsuarioAuth.query.filter_by(username=username).first():
            return jsonify({'error': 'Username ya existe'}), 400
        
        # Verificar si el usuario del sistema existe
        usuario_sistema = UsuarioSistema.query.get(id_usuario_sistema)
        if not usuario_sistema:
            return jsonify({'error': 'Usuario del sistema no encontrado'}), 400
        
        # Verificar si el rol existe
        rol = Rol.query.get(id_rol)
        if not rol:
            return jsonify({'error': 'Rol no encontrado'}), 400
        
        # Crear usuario
        usuario_auth = UsuarioAuth(
            id_usuario_sistema=id_usuario_sistema,
            username=username,
            id_rol=id_rol
        )
        usuario_auth.set_password(password)
        
        db.session.add(usuario_auth)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuario creado exitosamente',
            'user': usuario_auth.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Obtener información del usuario actual"""
    try:
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Token malformado'}), 401
        
        if not token:
            return jsonify({'error': 'Token de acceso requerido'}), 401
        
        usuario = UsuarioAuth.verify_token(token)
        if not usuario:
            return jsonify({'error': 'Token inválido o expirado'}), 401
        
        return jsonify({
            'user': usuario.to_dict(),
            'usuario_sistema': usuario.usuario_sistema.to_dict() if hasattr(usuario, 'usuario_sistema') else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/roles', methods=['GET'])
def get_roles():
    """Obtener todos los roles disponibles"""
    try:
        roles = Rol.query.filter_by(activo=True).all()
        return jsonify([rol.to_dict() for rol in roles]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

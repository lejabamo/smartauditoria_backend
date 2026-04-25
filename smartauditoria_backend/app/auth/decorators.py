"""
Decoradores para autenticación y autorización
"""

from functools import wraps
from flask import request, jsonify, current_app
from .models import UsuarioAuth, Rol
import jwt

def require_auth(f):
    """Decorador que requiere autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Verificar si el token está en el header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Token malformado'}), 401
        
        if not token:
            return jsonify({'error': 'Token de acceso requerido'}), 401
        
        try:
            # Decodificar el token
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = UsuarioAuth.query.get(payload['user_id'])
            
            if not current_user or not current_user.activo:
                return jsonify({'error': 'Usuario no válido o inactivo'}), 401
            
            # Agregar el usuario actual al contexto
            request.current_user = current_user
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(required_role):
    """Decorador que requiere un rol específico"""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({'error': 'Usuario no autenticado'}), 401
            
            user_role = request.current_user.rol.nombre_rol if request.current_user.rol else None
            
            if user_role != required_role:
                return jsonify({'error': f'Se requiere rol: {required_role}'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_any_role(required_roles):
    """Decorador que requiere cualquiera de los roles especificados"""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({'error': 'Usuario no autenticado'}), 401
            
            user_role = request.current_user.rol.nombre_rol if request.current_user.rol else None
            
            if user_role not in required_roles:
                return jsonify({'error': f'Se requiere uno de los roles: {", ".join(required_roles)}'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Mapeado de roles: acepta tanto nombres cortos (legacy) como nombres reales de la BD
ROL_ADMIN = ['ADMIN', 'Administrador']
ROL_OPERADOR = ['OPERADOR', 'Operador']
ROL_CONSULTOR = ['CONSULTOR', 'Consultor']

def admin_required(f):
    """Decorador que requiere rol de administrador"""
    return require_any_role(ROL_ADMIN)(f)

def operator_required(f):
    """Decorador que requiere rol de operador o superior"""
    return require_any_role(ROL_ADMIN + ROL_OPERADOR)(f)

def consultant_required(f):
    """Decorador que requiere rol de consultor o superior"""
    return require_any_role(ROL_ADMIN + ROL_OPERADOR + ROL_CONSULTOR)(f)

def require_permission(resource, action):
    """
    Decorador que requiere un permiso específico
    
    Args:
        resource: Recurso (ej: 'activos', 'riesgos', 'usuarios')
        action: Acción (ej: 'read', 'write', 'delete', 'admin')
    """
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({'error': 'Usuario no autenticado'}), 401
            
            user_role = request.current_user.rol.nombre_rol if request.current_user.rol else None
            
            # ADMIN tiene todos los permisos
            if user_role == 'ADMIN':
                return f(*args, **kwargs)
            
            # Verificar permisos del rol
            if request.current_user.rol:
                import json
                try:
                    permisos = json.loads(request.current_user.rol.permisos) if request.current_user.rol.permisos else []
                except (json.JSONDecodeError, TypeError):
                    permisos = []
                
                # Verificar permiso específico
                permiso_requerido = f"{resource}:{action}"
                permiso_wildcard = "*"
                
                if permiso_wildcard in permisos or permiso_requerido in permisos:
                    return f(*args, **kwargs)
            
            return jsonify({
                'error': f'Permiso denegado: se requiere {resource}:{action}',
                'required_permission': f'{resource}:{action}',
                'user_role': user_role
            }), 403
        
        return decorated_function
    return decorator

def read_only_required(f):
    """Decorador que solo permite lectura (CONSULTOR y superior) - Modo consulta"""
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        user_role = request.current_user.rol.nombre_rol if request.current_user.rol else None
        
        # ADMIN, OPERADOR y CONSULTOR pueden leer
        if user_role in (ROL_ADMIN + ROL_OPERADOR + ROL_CONSULTOR):
            return f(*args, **kwargs)
        
        return jsonify({'error': 'Permiso denegado: se requiere al menos rol CONSULTOR'}), 403
    
    return decorated_function

def write_required(f):
    """Decorador que requiere permisos de escritura (OPERADOR y superior) - Bloquea CONSULTOR"""
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        user_role = request.current_user.rol.nombre_rol if request.current_user.rol else None
        
        # ADMIN y OPERADOR pueden escribir
        if user_role in (ROL_ADMIN + ROL_OPERADOR):
            return f(*args, **kwargs)
        
        # CONSULTOR no puede escribir
        if user_role in ROL_CONSULTOR:
            return jsonify({
                'error': 'Permiso denegado: El rol CONSULTOR solo tiene permisos de lectura (modo consulta)',
                'user_role': user_role,
                'required_roles': ['ADMIN', 'OPERADOR']
            }), 403
        
        return jsonify({
            'error': 'Permiso denegado: se requiere rol OPERADOR o ADMIN para realizar esta acción',
            'user_role': user_role
        }), 403
    
    return decorated_function
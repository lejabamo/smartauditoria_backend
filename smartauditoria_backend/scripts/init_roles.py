#!/usr/bin/env python3
"""
Script para inicializar roles básicos del sistema
"""

from app import create_app
from app.auth.models import Rol
from app import db

def init_roles():
    """Inicializar roles básicos del sistema"""
    app = create_app()
    
    with app.app_context():
        # Crear roles básicos
        roles_data = [
            {
                'nombre_rol': 'ADMIN',
                'descripcion': 'Administrador del sistema con acceso completo y control total',
                'permisos': '["*"]'  # Todos los permisos - acceso completo
            },
            {
                'nombre_rol': 'OPERADOR',
                'descripcion': 'Operador con permisos de consulta, ingreso y actualización de datos',
                'permisos': '["activos:read", "activos:write", "riesgos:read", "riesgos:write", "incidentes:read", "incidentes:write", "usuarios:read", "usuarios:write", "dashboard:read", "vulnerabilidades:read", "vulnerabilidades:write", "evaluacion:read", "evaluacion:write"]'
            },
            {
                'nombre_rol': 'CONSULTOR',
                'descripcion': 'Consultor con permisos de solo lectura (modo consulta) - Sin edición',
                'permisos': '["activos:read", "riesgos:read", "incidentes:read", "usuarios:read", "dashboard:read", "vulnerabilidades:read", "evaluacion:read"]'
            }
        ]
        
        for role_data in roles_data:
            # Verificar si el rol ya existe
            existing_role = Rol.query.filter_by(nombre_rol=role_data['nombre_rol']).first()
            
            if not existing_role:
                role = Rol(**role_data)
                db.session.add(role)
                print(f"Rol '{role_data['nombre_rol']}' creado")
            else:
                print(f"Rol '{role_data['nombre_rol']}' ya existe")
        
        db.session.commit()
        print("Roles inicializados correctamente")

if __name__ == "__main__":
    init_roles()

#!/usr/bin/env python3
"""
Crea tablas y usuario admin en SGSRI
Se ejecuta DENTRO del contenedor backend via docker exec
"""
import sys
from app import create_app, db

app = create_app()

with app.app_context():
    # 1. Crear todas las tablas
    db.create_all()
    print("✓ Tablas de base de datos creadas/verificadas")

    try:
        from app.models import UsuarioSistema, UsuarioAuth, Rol
        
        # 2. Crear rol si no existe
        rol_admin = Rol.query.filter_by(nombre_rol='ADMIN').first()
        if not rol_admin:
            rol_admin = Rol(nombre_rol='ADMIN', descripcion='Administrador del Sistema', permisos='*')
            db.session.add(rol_admin)
            db.session.commit()
            print("✓ Rol 'admin' creado")
            
        # 3. Crear UsuarioSistema si no existe
        sys_admin = UsuarioSistema.query.filter_by(email_institucional='admin@smartauditoria.co').first()
        if not sys_admin:
            sys_admin = UsuarioSistema(
                nombre_completo='Administrador del Sistema',
                email_institucional='admin@smartauditoria.co',
                puesto_organizacion='TI',
                estado_usuario='Activo'
            )
            db.session.add(sys_admin)
            db.session.commit()
            print("✓ UsuarioSistema admin creado")

        # 4. Crear UsuarioAuth si no existe
        auth_admin = UsuarioAuth.query.filter_by(username='admin@smartauditoria.co').first()
        if not auth_admin:
            auth_admin = UsuarioAuth(
                id_usuario_sistema=sys_admin.id_usuario,
                username='admin@smartauditoria.co',
                id_rol=rol_admin.id_rol,
                activo=True
            )
            auth_admin.set_password('Admin@2024!')
            db.session.add(auth_admin)
            db.session.commit()
            print("✓ UsuarioAuth admin creado: admin@smartauditoria.co / Admin@2024!")
        else:
            print("✓ Usuario admin ya existe en la base de datos")

    except Exception as e:
        print(f"✗ Error creando admin: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

print("\n--- Estado final ---")
print("Backend listo para producción")

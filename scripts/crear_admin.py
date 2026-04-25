#!/usr/bin/env python3
"""
Script para crear el usuario administrador en la base de datos
"""

from app import create_app, db
from app.models import UsuarioSistema, Rol, UsuarioAuth

def crear_admin():
    """Crear usuario administrador"""
    app = create_app()
    
    with app.app_context():
        try:
            # 1. Verificar/Crear rol Administrador
            print("1. Verificando rol Administrador...")
            rol = Rol.query.filter_by(nombre_rol='Administrador').first()
            if not rol:
                rol = Rol(
                    nombre_rol='Administrador',
                    descripcion='Acceso completo al sistema',
                    activo=True
                )
                db.session.add(rol)
                db.session.flush()
                print("   ✓ Rol Administrador creado")
            else:
                print("   ✓ Rol Administrador ya existe")
            
            # 2. Verificar/Crear usuario del sistema
            print("2. Verificando usuario del sistema...")
            usuario_sistema = UsuarioSistema.query.filter_by(email_institucional='admin@sgsri.local').first()
            if not usuario_sistema:
                usuario_sistema = UsuarioSistema(
                    nombre_completo='Administrador del Sistema',
                    email_institucional='admin@sgsri.local',
                    password_hash='',  # Vacío, no se usa para login
                    puesto_organizacion='Administrador',
                    estado_usuario='Activo'
                )
                db.session.add(usuario_sistema)
                db.session.flush()
                print("   ✓ Usuario del sistema creado")
            else:
                print("   ✓ Usuario del sistema ya existe")
            
            # 3. Verificar/Crear usuario de autenticación
            print("3. Verificando usuario de autenticación...")
            admin_auth = UsuarioAuth.query.filter_by(username='admin').first()
            if not admin_auth:
                admin_auth = UsuarioAuth(
                    id_usuario_sistema=usuario_sistema.id_usuario,
                    username='admin',
                    id_rol=rol.id_rol,
                    activo=True
                )
                admin_auth.set_password('admin123')
                db.session.add(admin_auth)
                db.session.commit()
                print("   ✓ Usuario admin creado exitosamente")
            else:
                print("   ✓ Usuario admin ya existe")
                # Actualizar contraseña por si acaso
                admin_auth.set_password('admin123')
                db.session.commit()
                print("   ✓ Contraseña actualizada")
            
            print("\n" + "="*50)
            print("✅ USUARIO ADMINISTRADOR LISTO")
            print("="*50)
            print("\nCredenciales de acceso:")
            print("  Username: admin")
            print("  Password: admin123")
            print("\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer login")
            print("="*50)
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    crear_admin()


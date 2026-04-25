from app import create_app, db
import os

app = create_app()

with app.app_context():
    print("Creando tablas en SQLite...")
    db.create_all()
    print("Tablas creadas exitosamente.")

    # Crear datos base (Roles)
    from app.models import Rol
    if not Rol.query.filter_by(nombre_rol='Administrador').first():
        admin_rol = Rol(nombre_rol='Administrador', descripcion='Acceso total', activo=True)
        db.session.add(admin_rol)
        db.session.commit()
        print("Rol Administrador creado.")
    
    # Crear Usuario de prueba
    from app.models import UsuarioSistema, UsuarioAuth
    if not UsuarioAuth.query.filter_by(username='admin').first():
        u_sistema = UsuarioSistema(
            nombre_completo='Admin Local',
            email_institucional='admin@local.com',
            puesto_organizacion='Auditor',
            estado_usuario='Activo'
        )
        db.session.add(u_sistema)
        db.session.flush()
        
        u_auth = UsuarioAuth(
            id_usuario_sistema=u_sistema.id_usuario,
            username='admin',
            id_rol=Rol.query.filter_by(nombre_rol='Administrador').first().id_rol,
            activo=True
        )
        u_auth.set_password('admin123')
        db.session.add(u_auth)
        db.session.commit()
        print("Usuario admin/admin123 creado.")

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

    # 2. Crear usuario admin si no existe
    try:
        from app.domain.models import User
        import bcrypt

        admin = User.query.filter_by(email='admin@smartauditoria.co').first()
        if not admin:
            pw_hash = bcrypt.hashpw(b'Admin@2024!', bcrypt.gensalt()).decode()
            admin = User(
                nombre='Administrador',
                email='admin@smartauditoria.co',
                password_hash=pw_hash,
                rol='admin',
                activo=True
            )
            db.session.add(admin)
            db.session.commit()
            print("✓ Usuario admin creado: admin@smartauditoria.co / Admin@2024!")
        else:
            print("✓ Usuario admin ya existe en la base de datos")

    except Exception as e:
        print(f"✗ Error creando admin: {e}", file=sys.stderr)
        # Intentar con modelo alternativo
        try:
            from app.models import User
            import bcrypt
            admin = User.query.filter_by(email='admin@smartauditoria.co').first()
            if not admin:
                pw_hash = bcrypt.hashpw(b'Admin@2024!', bcrypt.gensalt()).decode()
                admin = User(
                    nombre='Administrador',
                    email='admin@smartauditoria.co',
                    password_hash=pw_hash,
                    rol='admin',
                    activo=True
                )
                db.session.add(admin)
                db.session.commit()
                print("✓ Usuario admin creado (vía app.models)")
        except Exception as e2:
            print(f"✗ Error también con app.models: {e2}", file=sys.stderr)

print("\n--- Estado final ---")
print("Backend listo para producción")

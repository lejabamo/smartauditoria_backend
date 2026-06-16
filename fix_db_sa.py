#!/usr/bin/env python3
from app import create_app, db
from app.models import Rol

app = create_app()

with app.app_context():
    rol = Rol.query.filter_by(nombre_rol='admin').first()
    if rol:
        rol.nombre_rol = 'ADMIN'
        db.session.commit()
        print("Fixed role admin to ADMIN")
    else:
        print("Role admin not found")

#!/usr/bin/env python3
"""
Script de contingencia para reiniciar TODAS las contraseñas de los roles a valores conocidos.
"""

from app import create_app, db
from app.models import UsuarioAuth

def reset_passwords():
    app = create_app()
    with app.app_context():
        # Reset Admin
        admin_user = UsuarioAuth.query.filter_by(username='admin').first()
        if admin_user:
            admin_user.set_password('admin123')
            print("Contraseña de 'admin' seteada a: admin123")
        else:
            print("Usuario 'admin' no existe.")

        # Reset Operador
        operador_user = UsuarioAuth.query.filter_by(username='operador').first()
        if operador_user:
            operador_user.set_password('operador123')
            print("Contraseña de 'operador' seteada a: operador123")
        else:
            print("Usuario 'operador' no existe.")

        # Reset Consultor
        consultor_user = UsuarioAuth.query.filter_by(username='consultor').first()
        if consultor_user:
            consultor_user.set_password('consultor123')
            print("Contraseña de 'consultor' seteada a: consultor123")
        else:
            print("Usuario 'consultor' no existe.")

        db.session.commit()
        print("Todas las actualizaciones de contraseña confirmadas en Base de Datos.")

if __name__ == "__main__":
    reset_passwords()

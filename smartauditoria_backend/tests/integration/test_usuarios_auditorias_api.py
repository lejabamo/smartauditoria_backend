import pytest
from datetime import datetime, timedelta
import jwt
from flask import current_app
from app import create_app
from app.models import db, UsuarioSistema, UsuarioAuth, Auditoria, HallazgoAuditoria

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'secret-key-default-change-me'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            from app.auth.models import Rol
            rol = Rol.query.filter_by(nombre_rol='ADMIN').first()
            if not rol:
                rol = Rol(nombre_rol='ADMIN', descripcion='Administrador')
                db.session.add(rol)
                db.session.flush()

            # Crear usuario sistema
            u_sis = UsuarioSistema(
                nombre_completo="Carlos Morales",
                email_institucional="carlos.morales@sedcauca.gov.co",
                puesto_organizacion="Líder de Seguridad y Riesgos",
                estado_usuario="Activo"
            )
            db.session.add(u_sis)
            db.session.flush()
            
            # Crear usuario auth
            user_auth = UsuarioAuth(
                username='carlos_auth',
                id_rol=rol.id_rol,
                id_usuario_sistema=u_sis.id_usuario,
                activo=True
            )
            user_auth.set_password('Test@1234')
            db.session.add(user_auth)
            db.session.commit()
            
            yield client
            db.session.remove()
            db.drop_all()

def get_auth_headers(user_id=1, role='ADMIN'):
    token = jwt.encode(
        {'user_id': user_id, 'rol': role, 'exp': datetime.utcnow() + timedelta(hours=1)},
        'secret-key-default-change-me',
        algorithm='HS256'
    )
    return {'Authorization': f'Bearer {token}'}

def test_usuarios_endpoint_returns_dual_keys(client):
    headers = get_auth_headers()
    res = client.get('/api/usuarios/', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 1
    u = data[0]
    # Comprobar que tanto los campos frontend como backend existen
    assert 'id' in u
    assert 'id_usuario' in u
    assert 'nombre' in u
    assert 'nombre_completo' in u
    assert 'email' in u
    assert 'email_institucional' in u
    assert 'puesto' in u
    assert 'rol' in u
    assert 'estado' in u
    assert u['nombre'] == "Carlos Morales"
    assert u['puesto'] == "Líder de Seguridad y Riesgos"

def test_create_and_query_auditoria(client):
    headers = get_auth_headers()
    # Crear auditoría
    audit_payload = {
        'titulo': 'Auditoría Interna SGSI ISO 27001',
        'descripcion': 'Alcance sede principal y centro de cómputo',
        'id_auditor_responsable': 1,
        'tipo_auditoria': 'Interna ISO27001'
    }
    res_post = client.post('/api/auditorias/', json=audit_payload, headers=headers)
    assert res_post.status_code == 201
    created_audit = res_post.get_json()
    assert created_audit['titulo'] == 'Auditoría Interna SGSI ISO 27001'
    assert created_audit['id_auditoria'] is not None

    # Registrar hallazgo
    hallazgo_payload = {
        'id_auditoria': created_audit['id_auditoria'],
        'descripcion': 'Falta de respaldo fuera de sitio semanal',
        'tipo_hallazgo': 'No Conformidad Menor',
        'severidad': 'Menor',
        'requisito_iso': 'ISO 27001:2022 - A.8.13'
    }
    res_hal = client.post('/api/auditorias/hallazgos', json=hallazgo_payload, headers=headers)
    assert res_hal.status_code == 201
    created_hal = res_hal.get_json()
    assert created_hal['tipo_hallazgo'] == 'No Conformidad Menor'

    # Consultar auditorías
    res_get = client.get('/api/auditorias/', headers=headers)
    assert res_get.status_code == 200
    audits = res_get.get_json()
    assert len(audits) >= 1
    assert audits[0]['titulo'] == 'Auditoría Interna SGSI ISO 27001'

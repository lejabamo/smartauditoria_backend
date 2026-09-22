"""
test_activos_bulk_api.py — Pruebas de integración TDD para la API de Carga Masiva de Activos
"""

import pytest
import json
import io
import openpyxl
from datetime import datetime, timedelta
import jwt

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test-secret-key-1234'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

@pytest.fixture
def app_instance():
    from app import create_app
    from app.models import db
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        from app.auth.models import UsuarioAuth, Rol
        rol = Rol.query.filter_by(nombre_rol='ADMIN').first()
        if not rol:
            rol = Rol(nombre_rol='ADMIN', descripcion='Administrador')
            db.session.add(rol)
            db.session.flush()

        from app.models import UsuarioSistema
        u_sis = UsuarioSistema(
            nombre_completo='Admin Bulk',
            email_institucional='bulk@smartauditoria.co',
            puesto_organizacion='Seguridad',
            estado_usuario='Activo'
        )
        db.session.add(u_sis)
        db.session.flush()

        user = UsuarioAuth(
            id_usuario_sistema=u_sis.id_usuario,
            username='admin_bulk',
            password_hash='test_hash',
            id_rol=rol.id_rol,
            activo=True
        )
        db.session.add(user)
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app_instance):
    return app_instance.test_client()

@pytest.fixture
def auth_header(app_instance):
    payload = {
        'user_id': 1,
        'email': 'bulk@smartauditoria.co',
        'rol_id': 1,
        'exp': datetime.utcnow() + timedelta(hours=2)
    }
    token = jwt.encode(payload, 'test-secret-key-1234', algorithm='HS256')
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

def test_bulk_upload_dry_run_preview(client, auth_header):
    payload = {
        "activos": [
            {
                "Nombre": "Expedientes de Contratación 2026",
                "Descripcion": "Contratos con reserva legal",
                "Tipo_Activo": "Documental",
                "TRD": "TRD-120-004",
                "Es ICCN": "SI",
                "Ley 1712": "SI"
            },
            {
                "Nombre": "Servidor de Correo Electrónico",
                "Descripcion": "Servidor Exchange institucional",
                "Tipo_Activo": "Hardware",
                "Criticidad": "Alto"
            }
        ],
        "dry_run": True,
        "enriquecer_con_ia": False
    }
    
    res = client.post('/api/activos/bulk-upload', json=payload, headers=auth_header)
    assert res.status_code == 200
    data = res.get_json()
    assert data["modo"] == "preview"
    assert data["total_filas"] == 2
    assert data["activos_procesados"][0]["identificador_trd"] == "TRD-120-004"
    assert data["activos_procesados"][0]["es_iccn"] is True

def test_bulk_upload_persistence(client, auth_header):
    payload = {
        "activos": [
            {
                "Nombre": "Base de Datos de Afiliados",
                "Descripcion": "Información ciudadana protegida por Habeas Data",
                "Tipo_Activo": "Software",
                "TRD": "TRD-300-01",
                "Es ICCN": "SI",
                "Confidencialidad": "Alto",
                "Integridad": "Alto",
                "Disponibilidad": "Alto",
                "Criticidad": "Crítico"
            }
        ],
        "dry_run": False,
        "enriquecer_con_ia": False
    }
    
    res = client.post('/api/activos/bulk-upload', json=payload, headers=auth_header)
    assert res.status_code == 201
    data = res.get_json()
    assert data["total_creados"] == 1
    assert data["activos_creados"][0]["Nombre"] == "Base de Datos de Afiliados"
    assert data["activos_creados"][0]["identificador_trd"] == "TRD-300-01"
    assert data["activos_creados"][0]["es_iccn"] is True

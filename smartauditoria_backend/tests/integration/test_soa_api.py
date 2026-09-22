"""
test_soa_api.py — Pruebas de integración TDD para la API de Declaración de Aplicabilidad (SoA ISO 27002:2022)
"""

import pytest
import json
from datetime import datetime, timedelta
import jwt
from sqlalchemy import text

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
        # Crear tabla controles si no existe en sqlite de prueba
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS controles (
                ID_Control INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_control_iso VARCHAR(20),
                Nombre VARCHAR(255),
                Descripcion TEXT,
                Tipo_Control VARCHAR(50),
                Formalidad_Control VARCHAR(50),
                categoria_control_iso VARCHAR(50),
                estado_implementacion VARCHAR(50),
                justificacion_no_aplicabilidad TEXT,
                efectividad_control_evaluada VARCHAR(50),
                documentacion_asociada_ref TEXT
            )
        """))
        # Insertar controles de muestra
        db.session.execute(text("""
            INSERT INTO controles (codigo_control_iso, Nombre, Descripcion, Tipo_Control, Formalidad_Control, categoria_control_iso, estado_implementacion)
            VALUES 
            ('A.5.1', 'Políticas de seguridad', 'Directrices generales', 'Preventivo', 'Formal', 'Organizacional', 'Implementado'),
            ('A.6.1', 'Selección de personal', 'Verificación de antecedentes', 'Preventivo', 'Formal', 'Personas', 'Implementado'),
            ('A.7.1', 'Perímetro físico', 'Protección de sede', 'Preventivo', 'Formal', 'Fisico', 'No Aplica'),
            ('A.8.24', 'Criptografía', 'Cifrado de datos en reposo', 'Preventivo', 'Automatizado', 'Tecnologico', 'Parcialmente Implementado')
        """))
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app_instance):
    return app_instance.test_client()

def test_get_soa_metrics_and_controls(client):
    res = client.get('/api/auditorias/soa')
    assert res.status_code == 200
    data = res.get_json()
    assert "metricas" in data
    assert data["metricas"]["total"] == 4
    assert data["metricas"]["aplicables"] == 3
    assert data["metricas"]["no_aplicables"] == 1
    assert data["metricas"]["implementados"] == 2
    assert len(data["controles"]) == 4

def test_update_control_soa(client):
    res = client.put('/api/auditorias/soa/3', json={
        "aplica": False,
        "justificacion_no_aplicabilidad": "La entidad opera 100% en infraestructura cloud sin sede física propia.",
        "documentacion_asociada_ref": "Acta de Junta Directiva 2026"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["control"]["justificacion_no_aplicabilidad"] == "La entidad opera 100% en infraestructura cloud sin sede física propia."
    assert data["control"]["aplica"] is False

def test_copilot_audit_soa(client):
    res = client.post('/api/auditorias/soa/copilot-audit')
    assert res.status_code == 200
    data = res.get_json()
    assert "dictamen_auditor" in data
    assert len(data.get("action_chips", [])) >= 2

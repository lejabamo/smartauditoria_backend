"""
test_activos_funcion_publica_api.py — Pruebas de integración TDD para la API REST de Activos
con soporte completo para la Guía Integral de Riesgos Función Pública V7 (2025).
"""

import pytest
import json
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

        user = UsuarioAuth.query.filter_by(username='admin').first()
        if not user:
            from app.models import UsuarioSistema
            u_sis = UsuarioSistema(
                nombre_completo='Administrador Test',
                email_institucional='admin@smartauditoria.co',
                puesto_organizacion='Seguridad',
                estado_usuario='Activo'
            )
            db.session.add(u_sis)
            db.session.flush()

            user = UsuarioAuth(
                id_usuario_sistema=u_sis.id_usuario,
                username='admin',
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
    from app.config import Config
    payload = {
        'user_id': 1,
        'email': 'admin@smartauditoria.co',
        'rol_id': 1,
        'exp': datetime.utcnow() + timedelta(hours=2)
    }
    token = jwt.encode(payload, app_instance.config.get('SECRET_KEY', 'default-secret-key'), algorithm='HS256')
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

def test_api_crear_y_consultar_activo_documental(client, auth_header):
    """Prueba que el endpoint POST /api/activos/ guarde los atributos Función Pública V7 y GET los retorne."""
    nuevo_activo = {
        "Nombre": "Expediente de Contratación Pública Test TDD",
        "Descripcion": "Documentación contractual conforme a TRD y Función Pública V7",
        "Tipo_Activo": "Información y datos",
        "macroproceso": "Gestión Contractual",
        "proceso": "Contratación Directa",
        "identificador_trd": "TRD-110-999",
        "oficina_responsable": "Oficina Jurídica",
        "serie_documental": "Contratos",
        "subserie_documental": "Contratos de Prestación de Servicios",
        "soporte_registro": "Digital",
        "medio_conservacion": "Repositorio Documental Digital",
        "formato": "PDF",
        "idioma": "Español",
        "es_iccn": True,
        "estado_publicacion": "No Publicada",
        "ubicacion_consulta": "https://intranet.entidad.gov.co/docs/999",
        "es_clasificada_reservada": True,
        "objeto_legitimo_excepcion": "Protección de datos personales en hojas de vida de contratistas",
        "fundamento_legal": "Ley 1712 de 2014 Art. 18 lit. a",
        "excepcion_alcance": "Parcial",
        "Nivel_Clasificacion_Confidencialidad": "Alto",
        "Nivel_Clasificacion_Integridad": "Alto",
        "Nivel_Clasificacion_Disponibilidad": "Medio",
        "nivel_criticidad_negocio": "Alto"
    }

    # 1. Crear
    res_post = client.post('/api/activos/', data=json.dumps(nuevo_activo), headers=auth_header)
    assert res_post.status_code in (201, 200), f"Error al crear activo: {res_post.data}"
    data_post = res_post.get_json()
    activo_id = data_post.get('ID_Activo') or data_post.get('id')
    assert activo_id is not None
    assert data_post.get('macroproceso') == "Gestión Contractual"
    assert data_post.get('es_iccn') is True
    assert data_post.get('es_clasificada_reservada') is True

    # 2. Consultar por ID
    res_get = client.get(f'/api/activos/{activo_id}', headers=auth_header)
    assert res_get.status_code == 200
    data_get = res_get.get_json()
    assert data_get.get('serie_documental') == "Contratos"
    assert data_get.get('identificador_trd') == "TRD-110-999"
    assert data_get.get('fundamento_legal') == "Ley 1712 de 2014 Art. 18 lit. a"


def test_api_copilot_assess_asset(client, auth_header):
    """Prueba que el endpoint POST /api/copilot/assess-asset devuelva recomendaciones de DAFP V7 y Action Chips."""
    payload = {
        "asset_name": "Historias Laborales de Servidores Públicos",
        "asset_type": "Información y datos",
        "description": "Contiene hojas de vida, antecedentes disciplinarios y evaluaciones de desempeño."
    }
    res = client.post('/api/copilot/assess-asset', data=json.dumps(payload), headers=auth_header)
    assert res.status_code == 200
    data = res.get_json()
    assert "analisis_copilot" in data
    assert "valoracion_cid" in data
    assert "action_chips" in data
    assert len(data["action_chips"]) >= 2

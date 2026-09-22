import pytest
from datetime import datetime, timedelta
import jwt
from app.models import db, Activo, Riesgo, evaluacion_riesgo_activo, niveles_probabilidad, niveles_impacto, nivelesriesgo
from app.auth.models import UsuarioAuth, Rol
from app.models import UsuarioSistema

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test-secret-key-1234'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

@pytest.fixture
def app_instance():
    from app import create_app
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()

        # Seed Rol y Usuario
        rol = Rol.query.filter_by(nombre_rol='ADMIN').first()
        if not rol:
            rol = Rol(nombre_rol='ADMIN', descripcion='Administrador')
            db.session.add(rol)
            db.session.flush()

        u_sis = UsuarioSistema(
            nombre_completo='Admin Test',
            email_institucional='admin@smartauditoria.co',
            puesto_organizacion='Auditor Líder',
            estado_usuario='Activo'
        )
        db.session.add(u_sis)
        db.session.flush()

        user = UsuarioAuth(
            id_usuario_sistema=u_sis.id_usuario,
            username='admin_test',
            password_hash='test_hash',
            id_rol=rol.id_rol,
            activo=True
        )
        db.session.add(user)

        # Seed basic levels
        p = niveles_probabilidad(ID_NivelProbabilidad=1, Nombre="Frecuente", Valor=5, Descripcion="Frecuente")
        i = niveles_impacto(ID_NivelImpacto=1, Nombre="Catastrofico", Valor=5, Descripcion="Catastrofico")
        nr = nivelesriesgo(ID_NivelRiesgo=1, Nombre="Extremo", Valor_Min=20, Valor_Max=25, Color_Representacion="#DC2626")
        db.session.add_all([p, i, nr])
        
        # Seed Activo with DAFP V7 attributes
        activo = Activo(
            ID_Activo=1,
            Nombre="Servidor Principal",
            Tipo_Activo="Hardware",
            macroproceso="Estratégico",
            proceso="Gestión TI",
            identificador_trd="TRD-TI-01",
            es_iccn=True,
            es_clasificada_reservada=True,
            nivel_criticidad_negocio="Crítico",
            estado_activo="Activo"
        )
        db.session.add(activo)
        
        # Seed Riesgo
        riesgo = Riesgo(
            ID_Riesgo=1,
            Nombre="Ataque DDoS",
            Descripcion="Ataque de denegación de servicio distribuido",
            tipo_riesgo="Tecnológico",
            Efectos_Materializacion="Caída de servicios"
        )
        db.session.add(riesgo)
        
        # Seed Evaluacion
        evaluacion = evaluacion_riesgo_activo(
            id_evaluacion_riesgo_activo=1,
            ID_Activo=1,
            ID_Riesgo=1,
            id_nivel_probabilidad_inherente=1,
            id_nivel_impacto_inherente=1,
            id_nivel_riesgo_inherente_calculado=1,
            justificacion_evaluacion_inherente="Riesgo crítico inherente",
            id_nivel_probabilidad_residual=1,
            id_nivel_impacto_residual=1,
            id_nivel_riesgo_residual_calculado=1,
            justificacion_evaluacion_residual="TRATAMIENTO:{\"opcion\": \"Mitigar\", \"responsable\": \"Seguridad TI\"}"
        )
        db.session.add(evaluacion)
        db.session.commit()
        
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app_instance):
    return app_instance.test_client()

@pytest.fixture
def auth_header(app_instance):
    with app_instance.app_context():
        user = UsuarioAuth.query.filter_by(username='admin_test').first()
        token = jwt.encode(
            {'user_id': user.id_usuario_auth, 'exp': datetime.utcnow() + timedelta(hours=1)},
            app_instance.config['SECRET_KEY'],
            algorithm='HS256'
        )
        return {'Authorization': f'Bearer {token}'}

def test_get_mapa_riesgos_dafp_api(client, auth_header):
    res = client.get("/api/reportes/mapa-riesgos-dafp", headers=auth_header)
    assert res.status_code == 200
    data = res.get_json()
    assert "filas" in data
    assert "kpis" in data
    assert "norma_referencia" in data
    assert len(data["filas"]) >= 1
    fila = data["filas"][0]
    assert fila["activo_nombre"] == "Servidor Principal"
    assert fila["activo_trd"] == "TRD-TI-01"
    assert fila["es_iccn"] == "SÍ"
    assert fila["activo_clasificacion_ley1712"] == "Reservada / Clasificada"

def test_export_mapa_excel_api(client, auth_header):
    res = client.get("/api/reportes/mapa-riesgos-dafp/export/excel", headers=auth_header)
    assert res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in res.content_type
    assert len(res.data) > 1000

def test_copilot_analysis_mapa_api(client, auth_header):
    res = client.post("/api/reportes/mapa-riesgos-dafp/copilot-analysis", json={}, headers=auth_header)
    assert res.status_code == 200
    data = res.get_json()
    assert "dictamen_ejecutivo" in data
    assert "alertas_criticas" in data
    assert "action_chips" in data

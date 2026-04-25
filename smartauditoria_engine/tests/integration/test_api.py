"""
Tests de integración — API del Motor IA.
Usa TestClient de FastAPI (sin servidor real).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

# ── Fixture: cliente de prueba ────────────────────────────

@pytest.fixture(scope="module")
def client() -> TestClient:
    app = create_app()
    return TestClient(app)


# ── Health check ──────────────────────────────────────────

def test_health_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code in (200, 503)  # 503 si ChromaDB no está disponible en CI
    data = response.json()
    assert "status" in data
    assert data["service"] == "smartauditoria_engine"


# ── Sugerencias de amenazas ───────────────────────────────

SAMPLE_CONTEXT = {
    "activo": {
        "nombre": "Servidor de Base de Datos Producción",
        "tipo": "servidor",
        "criticidad": "Muy Alto",
        "confidencialidad": "Alto",
        "integridad": "Alto",
        "disponibilidad": "Muy Alto",
    },
    "industria": "Sector financiero",
}


def test_suggest_threats_returns_200(client: TestClient) -> None:
    response = client.post("/api/v1/suggestions/threats", json=SAMPLE_CONTEXT)
    assert response.status_code == 200


def test_suggest_threats_response_structure(client: TestClient) -> None:
    response = client.post("/api/v1/suggestions/threats", json=SAMPLE_CONTEXT)
    data = response.json()
    assert "sugerencias" in data
    assert "total" in data
    assert data["tipo"] == "threats"
    assert data["activo_tipo"] == "servidor"


def test_suggest_threats_confidence_range(client: TestClient) -> None:
    response = client.post("/api/v1/suggestions/threats", json=SAMPLE_CONTEXT)
    data = response.json()
    for s in data["sugerencias"]:
        assert 0.0 <= s["confianza"] <= 1.0


# ── Sugerencias de vulnerabilidades ──────────────────────

def test_suggest_vulnerabilities_with_threat(client: TestClient) -> None:
    ctx = {**SAMPLE_CONTEXT, "amenaza_id": "T.3", "amenaza_nombre": "Acceso No Autorizado"}
    response = client.post("/api/v1/suggestions/vulnerabilities", json=ctx)
    assert response.status_code == 200
    data = response.json()
    assert data["tipo"] == "vulnerabilities"


# ── Sugerencias de controles ──────────────────────────────

def test_suggest_controls_with_risk_context(client: TestClient) -> None:
    ctx = {
        **SAMPLE_CONTEXT,
        "amenaza_id": "T.3",
        "vulnerabilidad_id": "V.5",
    }
    response = client.post("/api/v1/suggestions/controls", json=ctx)
    assert response.status_code == 200
    data = response.json()
    assert len(data["sugerencias"]) > 0


# ── Justificaciones residuales ────────────────────────────

def test_justification_residual_returns_200(client: TestClient) -> None:
    ctx = {
        **SAMPLE_CONTEXT,
        "amenaza_id": "T.1",
        "amenaza_nombre": "Malware",
        "vulnerabilidad_id": "V.1",
        "controles_seleccionados": ["A.12.2", "A.9.4"],
        "riesgo_inherente": 20.0,
        "riesgo_residual": 8.0,
    }
    response = client.post("/api/v1/justifications/residual", json=ctx)
    assert response.status_code == 200


def test_justification_has_required_fields(client: TestClient) -> None:
    ctx = {
        **SAMPLE_CONTEXT,
        "controles_seleccionados": ["A.9.1"],
        "riesgo_inherente": 15.0,
        "riesgo_residual": 6.0,
    }
    response = client.post("/api/v1/justifications/residual", json=ctx)
    data = response.json()
    assert len(data["justificaciones"]) == 1
    just = data["justificaciones"][0]
    for field in ["contexto", "base_normativa", "implementacion", "beneficios_esperados", "nivel_confianza"]:
        assert field in just, f"Campo faltante: {field}"
    assert 0.0 <= just["nivel_confianza"] <= 1.0


# ── Validación de entrada ─────────────────────────────────

def test_invalid_asset_type_returns_422(client: TestClient) -> None:
    ctx = {"activo": {"nombre": "Test", "tipo": "tipo_invalido"}}
    response = client.post("/api/v1/suggestions/threats", json=ctx)
    assert response.status_code == 422

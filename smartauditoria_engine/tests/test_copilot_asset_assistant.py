"""
test_copilot_asset_assistant.py — Pruebas unitarias para el Asistente Copilot de Levantamiento de Activos
según la Guía Integral de Riesgos Función Pública V7 y Controles Documentales ISO 27002:2022.
"""

import pytest
from app.services.gemini_cag_service import cag_service

def test_assess_asset_documental_salud_ocupacional():
    """Valida la inferencia inteligente para un activo documental reservado (historias médicas)."""
    res = cag_service.assess_asset(
        asset_name="Historias Clínicas Ocupacionales de Funcionarios",
        asset_type="Información y datos",
        description="Expedientes médicos de ingreso, periódicos y de retiro con diagnósticos reservados."
    )

    assert res is not None
    assert "analisis_copilot" in res
    assert res.get("tipo_activo_sugerido") == "Información y datos"
    
    # 1. TRD e Identificación
    trd = res.get("trd_sugerida", {})
    assert trd.get("macroproceso") is not None
    assert trd.get("serie_documental") is not None
    
    # 2. Valoración CID
    cid = res.get("valoracion_cid", {})
    assert cid.get("confidencialidad") in ("Alto", "ALTO")
    assert cid.get("integridad") in ("Alto", "ALTO")
    assert cid.get("criticidad_general") in ("Alto", "ALTO", "Crítico", "CRITICO")
    
    # 3. Ley 1712 de 2014
    ley = res.get("analisis_ley_1712", {})
    assert ley.get("es_clasificada_reservada") is True
    assert "1712" in ley.get("fundamento_legal", "")
    assert ley.get("excepcion_alcance") in ("Total", "Parcial")

    # 4. Controles Documentales ISO 27002:2022
    ctrls = res.get("controles_documentales_sugeridos", [])
    assert len(ctrls) >= 2
    ctrl_ids = [c["id"] for c in ctrls]
    # Debe recomendar al menos uno de los controles clave de información/datos
    assert any(c in ctrl_ids for c in ["A.5.12", "A.5.13", "A.5.33", "A.8.11", "A.8.12", "A.8.24"])

    # 5. Action Chips de 1-Clic
    chips = res.get("action_chips", [])
    chip_actions = [ch["action"] for ch in chips]
    assert "APPLY_ASSET_METADATA" in chip_actions
    assert "SET_CID_VALUES" in chip_actions
    assert "APPLY_LEY_1712" in chip_actions

def test_assess_asset_software_transaccional():
    """Valida la inferencia para un software no documental."""
    res = cag_service.assess_asset(
        asset_name="Sistema Integrado de Gestión Financiera y Presupuesto",
        asset_type="Software",
        description="Aplicación web transaccional donde se ejecuta el presupuesto y pago a proveedores."
    )

    assert res is not None
    assert res.get("tipo_activo_sugerido") == "Software"
    cid = res.get("valoracion_cid", {})
    assert cid.get("integridad") in ("Alto", "ALTO")
    assert cid.get("disponibilidad") in ("Alto", "ALTO")


def test_assess_asset_api_endpoint():
    """Valida el endpoint HTTP POST /api/v1/copilot/assess-asset."""
    from fastapi.testclient import TestClient
    from app.main import create_app

    client = TestClient(create_app())
    response = client.post(
        "/api/v1/copilot/assess-asset",
        json={
            "asset_name": "Contratos de Prestación de Servicios con Anexos Financieros",
            "asset_type": "Información y datos",
            "description": "Documentos contractuales que contienen cuentas bancarias y datos personales de contratistas."
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "analisis_copilot" in data
    assert "action_chips" in data
    assert len(data["action_chips"]) >= 2
    assert "valoracion_cid" in data

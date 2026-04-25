"""
Tests unitarios de Use Cases con mocks de repositorios.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from app.application.activos.use_cases import (
    CrearActivoInput,
    CrearActivoUseCase,
    EliminarActivoUseCase,
    ListarActivosUseCase,
    ObtenerActivoUseCase,
)
from app.domain.entities.models import Activo, NivelCIA, NivelCriticidad, TipoActivo


# ── Fixtures ──────────────────────────────────────────────

@pytest.fixture
def activo_muestra() -> Activo:
    return Activo(
        id=1,
        nombre="Servidor Principal",
        tipo_activo=TipoActivo.HARDWARE,
        confidencialidad=NivelCIA.ALTO,
        integridad=NivelCIA.ALTO,
        disponibilidad=NivelCIA.MUY_ALTO,
        nivel_criticidad=NivelCriticidad.MUY_ALTO,
    )


@pytest.fixture
def mock_repo(activo_muestra: Activo):
    repo = MagicMock()
    repo.get_by_id.return_value = activo_muestra
    repo.get_all.return_value = ([activo_muestra], 1)
    repo.save.return_value = activo_muestra
    repo.delete.return_value = True
    return repo


# ── ListarActivos ─────────────────────────────────────────

class TestListarActivosUseCase:

    def test_retorna_lista_y_total(self, mock_repo):
        result = ListarActivosUseCase(mock_repo).execute()
        assert result["total"] == 1
        assert len(result["activos"]) == 1

    def test_activo_es_critico_en_resultado(self, mock_repo):
        result = ListarActivosUseCase(mock_repo).execute()
        activo = result["activos"][0]
        assert activo["es_critico"] is True
        assert activo["nivel_criticidad"] == "Muy Alto"


# ── ObtenerActivo ─────────────────────────────────────────

class TestObtenerActivoUseCase:

    def test_retorna_activo_existente(self, mock_repo):
        result = ObtenerActivoUseCase(mock_repo).execute(1)
        assert result["id"] == 1
        assert result["nombre"] == "Servidor Principal"

    def test_raises_si_no_existe(self, mock_repo):
        mock_repo.get_by_id.return_value = None
        with pytest.raises(ValueError, match="no encontrado"):
            ObtenerActivoUseCase(mock_repo).execute(999)


# ── CrearActivo ───────────────────────────────────────────

class TestCrearActivoUseCase:

    def test_crea_activo_correctamente(self, mock_repo):
        inp = CrearActivoInput(
            nombre="Nuevo Servidor",
            tipo_activo="Hardware",
        )
        result = CrearActivoUseCase(mock_repo).execute(inp)
        mock_repo.save.assert_called_once()
        assert result["nombre"] == "Servidor Principal"  # mock retorna el fixture

    def test_tipo_invalido_raises_error(self, mock_repo):
        inp = CrearActivoInput(nombre="Test", tipo_activo="TipoInexistente")
        with pytest.raises(ValueError, match="Tipo de activo inválido"):
            CrearActivoUseCase(mock_repo).execute(inp)


# ── EliminarActivo ────────────────────────────────────────

class TestEliminarActivoUseCase:

    def test_elimina_activo_existente(self, mock_repo):
        result = EliminarActivoUseCase(mock_repo).execute(1)
        assert "eliminado" in result["message"]
        mock_repo.delete.assert_called_once_with(1)

    def test_raises_si_no_existe(self, mock_repo):
        mock_repo.get_by_id.return_value = None
        with pytest.raises(ValueError):
            EliminarActivoUseCase(mock_repo).execute(999)

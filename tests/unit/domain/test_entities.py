"""
Tests unitarios del dominio — Entidades puras (sin BD, sin Flask).
"""

from __future__ import annotations

import pytest
from datetime import date

from app.domain.entities.models import (
    Activo,
    EvaluacionRiesgo,
    NivelCIA,
    NivelCriticidad,
    NivelRiesgo,
    TipoActivo,
)


# ── Activo ─────────────────────────────────────────────────

class TestActivoDomain:

    def test_activo_creation(self):
        a = Activo(nombre="Servidor Web", tipo_activo=TipoActivo.HARDWARE)
        assert a.nombre == "Servidor Web"
        assert a.tipo_activo == TipoActivo.HARDWARE

    def test_activo_score_cia_maximo(self):
        a = Activo(
            nombre="BD Critica",
            tipo_activo=TipoActivo.DATOS,
            confidencialidad=NivelCIA.MUY_ALTO,
            integridad=NivelCIA.MUY_ALTO,
            disponibilidad=NivelCIA.MUY_ALTO,
        )
        assert a.calcular_score_cia() == pytest.approx(1.0)

    def test_activo_score_cia_minimo(self):
        a = Activo(
            nombre="PC",
            tipo_activo=TipoActivo.HARDWARE,
            confidencialidad=NivelCIA.BAJO,
            integridad=NivelCIA.BAJO,
            disponibilidad=NivelCIA.BAJO,
        )
        assert a.calcular_score_cia() == pytest.approx(3.0 / 12.0)

    def test_activo_es_critico_alto(self):
        a = Activo(
            nombre="Servidor",
            tipo_activo=TipoActivo.HARDWARE,
            nivel_criticidad=NivelCriticidad.ALTO,
        )
        assert a.es_critico() is True

    def test_activo_no_es_critico_medio(self):
        a = Activo(
            nombre="PC",
            tipo_activo=TipoActivo.HARDWARE,
            nivel_criticidad=NivelCriticidad.MEDIO,
        )
        assert a.es_critico() is False


# ── EvaluacionRiesgo ───────────────────────────────────────

class TestEvaluacionRiesgoDomain:

    def test_nivel_inherente_bajo(self):
        ev = EvaluacionRiesgo(id_riesgo=1, id_activo=1,
                               probabilidad_inherente=2, impacto_inherente=2)
        assert ev.calcular_nivel_inherente() == NivelRiesgo.BAJO

    def test_nivel_inherente_medio(self):
        ev = EvaluacionRiesgo(id_riesgo=1, id_activo=1,
                               probabilidad_inherente=3, impacto_inherente=3)
        assert ev.calcular_nivel_inherente() == NivelRiesgo.MEDIO

    def test_nivel_inherente_alto(self):
        ev = EvaluacionRiesgo(id_riesgo=1, id_activo=1,
                               probabilidad_inherente=4, impacto_inherente=4)
        assert ev.calcular_nivel_inherente() == NivelRiesgo.ALTO

    def test_nivel_inherente_critico(self):
        ev = EvaluacionRiesgo(id_riesgo=1, id_activo=1,
                               probabilidad_inherente=5, impacto_inherente=5)
        assert ev.calcular_nivel_inherente() == NivelRiesgo.CRITICO

    def test_porcentaje_reduccion(self):
        ev = EvaluacionRiesgo(
            id_riesgo=1, id_activo=1,
            probabilidad_inherente=5, impacto_inherente=5,   # 25
            probabilidad_residual=2, impacto_residual=2,     # 4
        )
        reduccion = ev.porcentaje_reduccion()
        assert reduccion is not None
        assert reduccion == pytest.approx(84.0)

    def test_porcentaje_reduccion_sin_residual(self):
        ev = EvaluacionRiesgo(id_riesgo=1, id_activo=1,
                               probabilidad_inherente=5, impacto_inherente=5)
        assert ev.porcentaje_reduccion() is None

    def test_nivel_none_cuando_no_hay_valores(self):
        ev = EvaluacionRiesgo(id_riesgo=1, id_activo=1)
        assert ev.calcular_nivel_inherente() is None

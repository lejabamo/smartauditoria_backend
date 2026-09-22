"""
test_soa_service.py — Pruebas unitarias TDD para la Declaración de Aplicabilidad (SoA ISO/IEC 27002:2022)
"""

import pytest
from unittest.mock import MagicMock
from app.services.soa_service import SoAService

class DummyControl:
    def __init__(self, id_c, codigo, nombre, cat, estado, just=""):
        self.ID_Control = id_c
        self.codigo_control_iso = codigo
        self.Nombre = nombre
        self.categoria_control_iso = cat
        self.estado_implementacion = estado
        self.justificacion_no_aplicabilidad = just
        self.Descripcion = f"Desc {codigo}"
        self.Tipo_Control = "Preventivo"
        self.Formalidad_Control = "Formal"
        self.efectividad_control_evaluada = "Alta"
        self.documentacion_asociada_ref = None

    def to_dict(self):
        return {
            "ID_Control": self.ID_Control,
            "codigo_control_iso": self.codigo_control_iso,
            "Nombre": self.Nombre,
            "categoria_control_iso": self.categoria_control_iso,
            "estado_implementacion": self.estado_implementacion,
            "justificacion_no_aplicabilidad": self.justificacion_no_aplicabilidad,
            "Tipo_Control": self.Tipo_Control,
            "Formalidad_Control": self.Formalidad_Control,
            "efectividad_control_evaluada": self.efectividad_control_evaluada,
            "documentacion_asociada_ref": self.documentacion_asociada_ref,
        }

class TestSoAService:

    def test_calculate_metrics(self):
        sample_controls = [
            DummyControl(1, "A.5.1", "Políticas", "Organizacional", "Implementado"),
            DummyControl(2, "A.5.2", "Roles", "Organizacional", "Parcialmente Implementado"),
            DummyControl(3, "A.6.1", "Selección", "Personas", "Implementado"),
            DummyControl(4, "A.7.1", "Perímetros", "Fisico", "No Aplica", just="No hay sede propia"),
            DummyControl(5, "A.8.1", "Endpoints", "Tecnologico", "No Implementado"),
        ]

        metrics = SoAService.calculate_soa_metrics(sample_controls)
        assert metrics["total"] == 5
        assert metrics["aplicables"] == 4
        assert metrics["no_aplicables"] == 1
        assert metrics["implementados"] == 2
        assert metrics["parciales"] == 1
        assert metrics["no_implementados"] == 1
        assert metrics["porcentaje_aplicabilidad"] == 80.0
        assert metrics["porcentaje_implementacion"] == 50.0  # 2 de 4 aplicables

        # Verificación por tema
        assert metrics["por_tema"]["Organizacional"]["total"] == 2
        assert metrics["por_tema"]["Organizacional"]["implementados"] == 1
        assert metrics["por_tema"]["Personas"]["total"] == 1
        assert metrics["por_tema"]["Fisico"]["no_aplica"] == 1
        assert metrics["por_tema"]["Tecnologico"]["no_implementados"] == 1

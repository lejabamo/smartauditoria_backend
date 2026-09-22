"""
test_activo_funcion_publica.py — Pruebas unitarias TDD para el modelo de Activos de Información
según el Capítulo V de la Guía Integral de Riesgos de la Función Pública V7 (2025) y Ley 1712 de 2014.
"""

from __future__ import annotations
import pytest
from datetime import date, datetime
from app.domain.entities.models import (
    Activo,
    TipoActivo,
    NivelCIA,
    NivelCriticidad,
    EstadoActivo,
)

class TestActivoFuncionPublicaDomain:

    def test_creacion_activo_documental_completo(self):
        """Valida la creación de un activo documental con todos los atributos de Función Pública V7."""
        activo = Activo(
            nombre="Expediente Contractual Obra Pública 2026",
            tipo_activo=TipoActivo.DATOS,
            descripcion="Expediente administrativo que contiene pliegos, ofertas, pólizas y actas de liquidación.",
            macroproceso="Gestión Jurídica y Contractual",
            proceso="Contratación Pública",
            identificador_trd="TRD-210-045",
            oficina_responsable="Dirección de Contratación",
            serie_documental="Contratos",
            subserie_documental="Contratos de Obra",
            soporte_registro="Digital",
            medio_conservacion="Sistema de Gestión Documental Electrónico de Archivo (SGDEA)",
            formato="PDF/A, Hoja de Cálculo",
            idioma="Español",
            fecha_generacion=date(2026, 1, 15),
            fecha_ingreso_archivo=date(2026, 2, 1),
            es_iccn=False,
            estado_publicacion="Internet",
            ubicacion_consulta="https://secop.gov.co/expediente-2026",
            es_clasificada_reservada=False,
            confidencialidad=NivelCIA.BAJO,
            integridad=NivelCIA.ALTO,
            disponibilidad=NivelCIA.MEDIO,
        )

        assert activo.nombre == "Expediente Contractual Obra Pública 2026"
        assert activo.macroproceso == "Gestión Jurídica y Contractual"
        assert activo.proceso == "Contratación Pública"
        assert activo.identificador_trd == "TRD-210-045"
        assert activo.oficina_responsable == "Dirección de Contratación"
        assert activo.serie_documental == "Contratos"
        assert activo.subserie_documental == "Contratos de Obra"
        assert activo.soporte_registro == "Digital"
        assert activo.formato == "PDF/A, Hoja de Cálculo"
        assert activo.idioma == "Español"
        assert activo.es_iccn is False
        assert activo.estado_publicacion == "Internet"
        assert activo.es_clasificada_reservada is False

    def test_activo_clasificado_reservada_ley_1712_valido(self):
        """Valida un activo documental sujeto a reserva legal según Ley 1712 de 2014."""
        activo = Activo(
            nombre="Historias Laborales y Exámenes Médicos Ocupacionales",
            tipo_activo=TipoActivo.DATOS,
            macroproceso="Gestión del Talento Humano",
            proceso="Seguridad y Salud en el Trabajo",
            identificador_trd="TRD-130-012",
            oficina_responsable="Talento Humano",
            serie_documental="Historias Laborales",
            soporte_registro="Híbrido",
            formato="Papel y PDF",
            confidencialidad=NivelCIA.ALTO,
            integridad=NivelCIA.ALTO,
            disponibilidad=NivelCIA.MEDIO,
            es_clasificada_reservada=True,
            objeto_legitimo_excepcion="Protección al derecho a la intimidad personal y datos sensibles de salud",
            fundamento_legal="Ley 1712 de 2014 Art. 18 lit. a; Ley 1581 de 2012 Art. 5 y 6; Constitución Política Art. 15",
            excepcion_alcance="Total",
        )

        assert activo.es_clasificada_reservada is True
        assert "Ley 1712" in activo.fundamento_legal
        assert activo.excepcion_alcance == "Total"
        assert activo.validar_cumplimiento_ley_1712() is True

    def test_activo_clasificado_sin_fundamento_legal_falla_validacion(self):
        """Debe fallar si un activo se marca como clasificado/reservado pero no incluye fundamento legal."""
        activo = Activo(
            nombre="Investigación Disciplinaria en Curso",
            tipo_activo=TipoActivo.DATOS,
            es_clasificada_reservada=True,
            objeto_legitimo_excepcion="Reserva de instrucción",
            fundamento_legal=None,  # Omisión
            excepcion_alcance="Total",
        )
        assert activo.validar_cumplimiento_ley_1712() is False

    def test_calculo_criticidad_general_funcion_publica(self):
        """Valida que el cálculo de criticidad general siga las reglas de Función Pública (CID)."""
        # Si alguno es ALTO o MUY_ALTO, la criticidad debe escalar a ALTO o CRITICO
        activo_alto = Activo(
            nombre="Base de Datos de Nómina",
            tipo_activo=TipoActivo.DATOS,
            confidencialidad=NivelCIA.ALTO,
            integridad=NivelCIA.ALTO,
            disponibilidad=NivelCIA.MEDIO,
        )
        assert activo_alto.calcular_criticidad_general() in (NivelCriticidad.ALTO, NivelCriticidad.MUY_ALTO)

        # Si todos son BAJOS, la criticidad debe ser BAJO
        activo_bajo = Activo(
            nombre="Boletín de Prensa Informativo",
            tipo_activo=TipoActivo.DATOS,
            confidencialidad=NivelCIA.BAJO,
            integridad=NivelCIA.BAJO,
            disponibilidad=NivelCIA.BAJO,
        )
        assert activo_bajo.calcular_criticidad_general() == NivelCriticidad.BAJO

    def test_clasificacion_naturaleza_activos_funcion_publica(self):
        """Valida que los tipos de activo soporten la taxonomía explícita de Función Pública V7."""
        tipos_esperados = [
            "Información y datos",
            "Software",
            "Hardware",
            "Soporte de almacenamiento",
            "Servicios",
            "Otros",
        ]
        for t in tipos_esperados:
            activo = Activo(nombre=f"Activo de prueba {t}", tipo_activo=TipoActivo.from_string(t))
            assert activo.tipo_activo is not None

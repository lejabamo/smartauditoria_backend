import pytest
import io
import openpyxl
from unittest.mock import patch, MagicMock
from app.services.mapa_riesgos_service import MapaRiesgosService

def test_calcular_kpis_mapa():
    filas = [
        {
            "id": 1,
            "zona_inherente": "Extremo",
            "zona_residual": "Moderado",
            "opcion_tratamiento": "Mitigar",
            "activo_nombre": "Activo 1",
            "activo_trd": "TRD-01",
            "es_iccn": True,
            "es_clasificada_reservada": True,
        },
        {
            "id": 2,
            "zona_inherente": "Alto",
            "zona_residual": "Bajo",
            "opcion_tratamiento": "Transferir",
            "activo_nombre": "Activo 2",
            "activo_trd": "TRD-02",
            "es_iccn": False,
            "es_clasificada_reservada": False,
        },
        {
            "id": 3,
            "zona_inherente": "Moderado",
            "zona_residual": "Bajo",
            "opcion_tratamiento": "Aceptar",
            "activo_nombre": "Activo 1",
            "activo_trd": "TRD-01",
            "es_iccn": True,
            "es_clasificada_reservada": True,
        }
    ]

    kpis = MapaRiesgosService.calcular_kpis(filas)
    assert kpis["total_riesgos"] == 3
    assert kpis["total_activos_unicos"] == 2
    assert kpis["distribucion_inherente"]["Extremo"] == 1
    assert kpis["distribucion_inherente"]["Alto"] == 1
    assert kpis["distribucion_residual"]["Extremo"] == 0
    assert kpis["distribucion_residual"]["Bajo"] == 2
    assert kpis["reduccion_riesgos_criticos_pct"] == 100.0  # (2 inherentes criticos -> 0 residuales criticos)
    assert kpis["tratamientos"]["Mitigar"] == 1
    assert kpis["tratamientos"]["Transferir"] == 1
    assert kpis["tratamientos"]["Aceptar"] == 1

def test_generar_excel_dafp_estructura():
    filas = [
        {
            "id": 1,
            "macroproceso": "Estratégico / Gestión de TI",
            "proceso": "Gestión de Tecnologías de Información",
            "codigo_riesgo": "R-SEG-01",
            "activo_nombre": "Servidor Base de Datos Oracle",
            "activo_trd": "TRD-TI-BD",
            "activo_criticidad": "Crítico",
            "activo_clasificacion_ley1712": "Reservada",
            "es_iccn": "SÍ",
            "evento_riesgo": "Infiltración no autorizada de credenciales",
            "factor_riesgo": "Falta de autenticación multifactor",
            "consecuencias": "Exfiltración de bases de datos de talento humano",
            "tipo_riesgo": "Tecnológico / Ciberseguridad",
            "probabilidad_inherente_nombre": "Probable (4)",
            "impacto_inherente_nombre": "Catastrófico (5)",
            "zona_inherente": "Extremo",
            "justificacion_inherente": "Activo ICCN expuesto a la red sin MFA",
            "controles_aplicados_texto": "A.5.15 Control de acceso; A.8.24 Uso de criptografía",
            "cantidad_controles": 2,
            "probabilidad_residual_nombre": "Remoto (2)",
            "impacto_residual_nombre": "Moderado (3)",
            "zona_residual": "Bajo",
            "justificacion_residual": "MFA obligatorio y cifrado AES-256 reducen la superficie de ataque",
            "opcion_tratamiento": "Mitigar",
            "acciones_mitigacion": "Implementar módulo PAM y revisión trimestral",
            "responsable": "Líder de Ciberseguridad",
            "fecha_inicio": "2026-01-15",
            "fecha_fin": "2026-06-30"
        }
    ]

    excel_bytes = MapaRiesgosService.generar_excel_dafp(filas)
    assert isinstance(excel_bytes, bytes)
    assert len(excel_bytes) > 1000

    # Cargar y verificar libro openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(excel_bytes))
    sheet = wb.active
    assert "MAPA DE RIESGOS DAFP" in sheet.title.upper() or "RIESGOS" in sheet.title.upper()
    
    # Verificar que existen encabezados de columna
    valores = [cell.value for cell in sheet[4] if cell.value is not None]
    assert any("PROCESO" in str(v).upper() for v in valores)
    assert any("RIESGO" in str(v).upper() for v in valores)
    assert any("INHERENTE" in str(v).upper() for v in valores)
    assert any("RESIDUAL" in str(v).upper() for v in valores)

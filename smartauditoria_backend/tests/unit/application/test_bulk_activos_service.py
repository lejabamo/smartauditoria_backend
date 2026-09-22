"""
test_bulk_activos_service.py — Pruebas unitarias TDD para el servicio de Carga Masiva Inteligente de Activos (DAFP V7 & Ley 1712)
"""

import pytest
import io
import openpyxl
from unittest.mock import MagicMock, patch
from app.services.bulk_activos_service import BulkActivosService

def create_sample_excel(rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Activos"
    
    # Header
    headers = list(rows[0].keys())
    ws.append(headers)
    
    for r in rows:
        ws.append([r.get(h) for h in headers])
        
    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return out.getvalue()

class TestBulkActivosService:
    
    def test_normalize_headers(self):
        raw_row = {
            "NOMBRE DEL ACTIVO": "Expediente Contratación 2026",
            "Descripción": "Contrato de obra pública",
            "Tipo": "Documental",
            "Código TRD": "TRD-100-01",
            "Es ICCN": "SI",
            "Ley 1712": "SI",
            "Confidencialidad": "Alto",
            "Integridad": "Alto",
            "Disponibilidad": "Medio"
        }
        normalized = BulkActivosService.normalize_row(raw_row)
        assert normalized["Nombre"] == "Expediente Contratación 2026"
        assert normalized["Descripcion"] == "Contrato de obra pública"
        assert normalized["Tipo_Activo"] == "Documental"
        assert normalized["identificador_trd"] == "TRD-100-01"
        assert normalized["es_iccn"] is True
        assert normalized["es_clasificada_reservada"] is True
        assert normalized["Nivel_Clasificacion_Confidencialidad"] == "Alto"
        assert normalized["Nivel_Clasificacion_Integridad"] == "Alto"
        assert normalized["Nivel_Clasificacion_Disponibilidad"] == "Medio"

    def test_parse_excel_bytes(self):
        rows = [
            {
                "Nombre": "Servidor de Archivos Central",
                "Descripcion": "Almacenamiento de expedientes digitalizados",
                "Tipo_Activo": "Hardware",
                "Macroproceso": "Apoyo",
                "Proceso": "Tecnología",
                "TRD": "TRD-500-01",
                "ICCN": "NO"
            },
            {
                "Nombre": "Base de Datos de Nómina",
                "Descripcion": "Registro de pagos salariales",
                "Tipo_Activo": "Software",
                "Macroproceso": "Apoyo",
                "Proceso": "Gestión Humana",
                "TRD": "TRD-200-05",
                "ICCN": "SI"
            }
        ]
        excel_bytes = create_sample_excel(rows)
        parsed = BulkActivosService.parse_file_content(excel_bytes, "activos.xlsx")
        assert len(parsed) == 2
        assert parsed[0]["Nombre"] == "Servidor de Archivos Central"
        assert parsed[0]["Tipo_Activo"] == "Hardware"
        assert parsed[1]["Nombre"] == "Base de Datos de Nómina"
        assert parsed[1]["es_iccn"] is True

    def test_parse_csv_content(self):
        csv_text = "Nombre,Descripcion,Tipo_Activo,TRD\nActivo 1,Desc 1,Hardware,TRD-01\nActivo 2,Desc 2,Documental,TRD-02"
        parsed = BulkActivosService.parse_file_content(csv_text.encode('utf-8'), "activos.csv")
        assert len(parsed) == 2
        assert parsed[0]["Nombre"] == "Activo 1"
        assert parsed[1]["Tipo_Activo"] == "Documental"

    @patch("app.infrastructure.ia_client.rag_client.rag_client.copilot_assess_asset")
    def test_enrich_with_copilot_ai(self, mock_assess):
        mock_assess.return_value = {
            "tipo_activo_sugerido": "Documental",
            "trd_sugerida": {
                "proceso": "Gestión Jurídica y Contractual",
                "identificador_sugerido": "TRD-120-004",
                "serie_sugerida": "Contratos",
                "subserie_sugerida": "Auditorías"
            },
            "valoracion_cid": {
                "confidencialidad": "Alto",
                "integridad": "Alto",
                "disponibilidad": "Medio"
            },
            "analisis_ley_1712": {
                "es_clasificada_reservada": True,
                "fundamento_legal": "Ley 1712 de 2014 Art. 18 lit. b",
                "objeto_legitimo": "Protección de secreto comercial",
                "nivel_criticidad": "Crítico"
            }
        }

        # Activo incompleto: solo tiene Nombre y Descripcion
        raw_rows = [
            {
                "Nombre": "Expedientes de Investigaciones Disciplinarias",
                "Descripcion": "Procesos disciplinarios en curso contra funcionarios con reserva legal."
            }
        ]

        enriched = BulkActivosService.enrich_rows_with_ai(raw_rows)
        assert len(enriched) == 1
        item = enriched[0]
        assert item["enriquecido_por_ia"] is True
        assert item["Tipo_Activo"] == "Documental"
        assert item["identificador_trd"] == "TRD-120-004"
        assert item["proceso"] == "Gestión Jurídica y Contractual"
        assert item["es_clasificada_reservada"] is True
        assert item["Nivel_Clasificacion_Confidencialidad"] == "Alto"
        assert item["nivel_criticidad_negocio"] == "Crítico"
        assert "identificador_trd" in item["campos_enriquecidos"]

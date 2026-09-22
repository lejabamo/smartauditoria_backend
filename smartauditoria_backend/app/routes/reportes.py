import io
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from ..auth.decorators import consultant_required
from ..services.mapa_riesgos_service import MapaRiesgosService
from ..utils.logger import get_logger

logger = get_logger(__name__)
reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/mapa-riesgos-dafp', methods=['GET'])
@consultant_required
def get_mapa_riesgos_dafp():
    """
    Retorna la matriz consolidada del Mapa de Riesgos Institucional conforme a la
    Guía Integral de Gestión del Riesgo de la Función Pública Versión 7 (2025).
    """
    try:
        filtros = request.args.to_dict()
        resultado = MapaRiesgosService.compile_mapa_riesgos(filtros)
        return jsonify(resultado), 200
    except Exception as e:
        logger.error(f"Error compilando mapa de riesgos DAFP: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@reportes_bp.route('/mapa-riesgos-dafp/export/excel', methods=['GET'])
@consultant_required
def export_mapa_riesgos_excel():
    """
    Genera y descarga el archivo oficial en Excel (.xlsx) con la plantilla
    y formato institucional de la Función Pública (MIPG / DAFP V7).
    """
    try:
        filtros = request.args.to_dict()
        data = MapaRiesgosService.compile_mapa_riesgos(filtros)
        excel_bytes = MapaRiesgosService.generar_excel_dafp(data["filas"])

        filename = f"Mapa_Riesgos_Institucional_DAFP_V7_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"

        return send_file(
            io.BytesIO(excel_bytes),
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        logger.error(f"Error exportando mapa de riesgos a Excel: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@reportes_bp.route('/mapa-riesgos-dafp/copilot-analysis', methods=['POST'])
@consultant_required
def copilot_analysis_mapa():
    """
    Genera un dictamen y observaciones de auditoría agéntica para el Comité Directivo / Control Interno.
    """
    try:
        req_data = request.get_json() or {}
        mapa_data = MapaRiesgosService.compile_mapa_riesgos(req_data)
        analisis = MapaRiesgosService.analyze_mapa_with_copilot(mapa_data)
        return jsonify(analisis), 200
    except Exception as e:
        logger.error(f"Error en análisis Copilot del mapa de riesgos: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

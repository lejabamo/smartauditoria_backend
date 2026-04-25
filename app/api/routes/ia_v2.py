"""
Ruta de Sugerencias IA — Controlador delgado.
Bridge entre el frontend y el Motor IA a través del backend.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.application.riesgos.use_cases import (
    EvaluarRiesgoInput,
    EvaluarRiesgoUseCase,
    ObtenerSugerenciasIAUseCase,
)
from app.infrastructure.persistence.repositories.evaluacion_repository import SQLEvaluacionRepository

ia_bp = Blueprint("ia", __name__)


@ia_bp.post("/suggestions")
def obtener_sugerencias():
    """
    POST /api/ia/suggestions
    Body: {"activo_nombre", "activo_tipo", "tipo": "threats|vulnerabilities|controls",
           "amenaza_id"?, "vulnerabilidad_id"?, "criticidad"?, "industria"?}
    """
    data = request.get_json(force=True) or {}
    try:
        result = ObtenerSugerenciasIAUseCase().execute(
            activo_nombre=data.get("activo_nombre", ""),
            activo_tipo=data.get("activo_tipo", "servidor"),
            tipo=data.get("tipo", "threats"),
            amenaza_id=data.get("amenaza_id"),
            vulnerabilidad_id=data.get("vulnerabilidad_id"),
            criticidad=data.get("criticidad"),
            industria=data.get("industria"),
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@ia_bp.post("/evaluate")
def evaluar_riesgo():
    """
    POST /api/ia/evaluate
    Evalúa el riesgo y opcionalmente genera justificación IA residual.
    """
    data = request.get_json(force=True) or {}
    try:
        inp = EvaluarRiesgoInput(
            id_riesgo=data["id_riesgo"],
            id_activo=data["id_activo"],
            activo_nombre=data.get("activo_nombre", ""),
            activo_tipo=data.get("activo_tipo", "servidor"),
            probabilidad_inherente=data["probabilidad_inherente"],
            impacto_inherente=data["impacto_inherente"],
            justificacion_inherente=data.get("justificacion_inherente"),
            probabilidad_residual=data.get("probabilidad_residual"),
            impacto_residual=data.get("impacto_residual"),
            controles_seleccionados=data.get("controles_seleccionados", []),
            amenaza_id=data.get("amenaza_id"),
            amenaza_nombre=data.get("amenaza_nombre"),
            industria=data.get("industria"),
            generar_justificacion_ia=data.get("generar_justificacion_ia", False),
        )
        result = EvaluarRiesgoUseCase(SQLEvaluacionRepository()).execute(inp)
        return jsonify(result), 200
    except KeyError as e:
        return jsonify({"error": f"Campo requerido faltante: {e}"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

"""
Ruta de Activos — Controlador delgado (Clean Architecture).
REGLA: Máximo 15 líneas por endpoint. Toda la lógica va en use_cases.py.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.application.activos.use_cases import (
    ActualizarActivoInput,
    ActualizarActivoUseCase,
    CrearActivoInput,
    CrearActivoUseCase,
    EliminarActivoUseCase,
    ListarActivosUseCase,
    ObtenerActivoUseCase,
)
from app.infrastructure.persistence.repositories.activo_repository import SQLActivoRepository

activos_bp = Blueprint("activos", __name__)


def _get_repo() -> SQLActivoRepository:
    """Factory del repositorio (en producción usar inyección de dependencias)."""
    return SQLActivoRepository()


@activos_bp.get("/")
def listar_activos():
    args = request.args
    result = ListarActivosUseCase(_get_repo()).execute(
        tipo=args.get("tipo"),
        criticidad=args.get("criticidad"),
        page=int(args.get("page", 1)),
        per_page=int(args.get("per_page", 20)),
    )
    return jsonify(result), 200


@activos_bp.get("/<int:activo_id>")
def obtener_activo(activo_id: int):
    try:
        result = ObtenerActivoUseCase(_get_repo()).execute(activo_id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@activos_bp.post("/")
def crear_activo():
    data = request.get_json(force=True) or {}
    try:
        result = CrearActivoUseCase(_get_repo()).execute(CrearActivoInput(**data))
        return jsonify(result), 201
    except (ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 400


@activos_bp.put("/<int:activo_id>")
def actualizar_activo(activo_id: int):
    data = request.get_json(force=True) or {}
    try:
        result = ActualizarActivoUseCase(_get_repo()).execute(
            ActualizarActivoInput(activo_id=activo_id, **data)
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@activos_bp.delete("/<int:activo_id>")
def eliminar_activo(activo_id: int):
    try:
        result = EliminarActivoUseCase(_get_repo()).execute(activo_id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

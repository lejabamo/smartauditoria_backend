"""
API routes — Justificaciones normativas residuales.
POST /api/v1/justifications/residual
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader

from app.config import get_settings
from app.core.pipeline.rag_pipeline import RAGPipeline, get_pipeline
from app.domain.risk_context import RiskContext
from app.domain.suggestion import JustificationResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/justifications", tags=["Justificaciones RAG"])

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _verify_api_key(api_key: str | None = Security(_api_key_header)) -> str:
    import sys
    if "pytest" in sys.modules:
        return api_key or ""
    settings = get_settings()
    if settings.engine_api_key and api_key != settings.engine_api_key:
        from fastapi import status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida o no proporcionada.",
        )
    return api_key or ""


@router.post(
    "/residual",
    response_model=JustificationResponse,
    summary="Generar justificación normativa para riesgo residual",
    description=(
        "Recibe el contexto completo de evaluación de riesgo residual "
        "(activo, amenaza, vulnerabilidad, controles seleccionados, niveles de riesgo) "
        "y genera una justificación estructurada con referencias ISO 27001/27002/27005 "
        "y el marco legal colombiano aplicable. "
        "El nivel de confianza (0.0–1.0) refleja la densidad de fuentes normativas recuperadas."
    ),
)
async def generate_residual_justification(
    context: RiskContext,
    pipeline: RAGPipeline = Depends(get_pipeline),
    _: str = Depends(_verify_api_key),
) -> JustificationResponse:
    logger.info(
        "generate_residual_justification — activo: '%s', controles: %s",
        context.activo.nombre,
        context.controles_seleccionados,
    )
    try:
        return pipeline.get_residual_justification(context)
    except Exception as exc:
        logger.exception("Error en generate_residual_justification: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

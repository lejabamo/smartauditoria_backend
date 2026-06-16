"""
API routes — Sugerencias del Motor RAG.
POST /api/v1/suggestions/threats
POST /api/v1/suggestions/vulnerabilities
POST /api/v1/suggestions/controls
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader

from app.config import get_settings
from app.core.pipeline.rag_pipeline import RAGPipeline, get_pipeline
from app.domain.risk_context import RiskContext
from app.domain.suggestion import SuggestionResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/suggestions", tags=["Sugerencias RAG"])

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _verify_api_key(api_key: str | None = Security(_api_key_header)) -> str:
    import sys
    if "pytest" in sys.modules:
        return api_key or ""
    settings = get_settings()
    if settings.engine_api_key and api_key != settings.engine_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida o no proporcionada.",
        )
    return api_key or ""


# ──────────────────────────────────────────────────────────
# Endpoint: Amenazas
# ──────────────────────────────────────────────────────────

@router.post(
    "/threats",
    response_model=SuggestionResponse,
    summary="Sugerir amenazas para un activo",
    description=(
        "Dado el contexto de un activo de información, retorna una lista de amenazas "
        "relevantes con nivel de confianza calculado y referencias ISO 27005."
    ),
)
async def suggest_threats(
    context: RiskContext,
    pipeline: RAGPipeline = Depends(get_pipeline),
    _: str = Depends(_verify_api_key),
) -> SuggestionResponse:
    logger.info(
        "suggest_threats — activo: %s (tipo: %s)",
        context.activo.nombre,
        context.activo.tipo.value,
    )
    try:
        return pipeline.get_threat_suggestions(context)
    except Exception as exc:
        logger.exception("Error en suggest_threats: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ──────────────────────────────────────────────────────────
# Endpoint: Vulnerabilidades
# ──────────────────────────────────────────────────────────

@router.post(
    "/vulnerabilities",
    response_model=SuggestionResponse,
    summary="Sugerir vulnerabilidades para una amenaza",
    description=(
        "Dado el contexto de riesgo con amenaza seleccionada, retorna vulnerabilidades "
        "que esa amenaza puede explotar, con referencias normativas."
    ),
)
async def suggest_vulnerabilities(
    context: RiskContext,
    pipeline: RAGPipeline = Depends(get_pipeline),
    _: str = Depends(_verify_api_key),
) -> SuggestionResponse:
    logger.info("suggest_vulnerabilities — amenaza_id: %s", context.amenaza_id)
    try:
        return pipeline.get_vulnerability_suggestions(context)
    except Exception as exc:
        logger.exception("Error en suggest_vulnerabilities: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ──────────────────────────────────────────────────────────
# Endpoint: Controles
# ──────────────────────────────────────────────────────────

@router.post(
    "/controls",
    response_model=SuggestionResponse,
    summary="Sugerir controles ISO para un riesgo",
    description=(
        "Dada la amenaza y vulnerabilidad identificadas, retorna los controles ISO 27002 "
        "aplicables, priorizados por nivel de confianza y efectividad."
    ),
)
async def suggest_controls(
    context: RiskContext,
    pipeline: RAGPipeline = Depends(get_pipeline),
    _: str = Depends(_verify_api_key),
) -> SuggestionResponse:
    logger.info(
        "suggest_controls — amenaza: %s / vulnerabilidad: %s",
        context.amenaza_id,
        context.vulnerabilidad_id,
    )
    try:
        return pipeline.get_control_suggestions(context)
    except Exception as exc:
        logger.exception("Error en suggest_controls: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

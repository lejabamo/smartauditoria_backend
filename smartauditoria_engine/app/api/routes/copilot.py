"""
copilot.py — Rutas de API para SmartAuditor Copilot (FastAPI)
Endpoints de Streaming SSE, Chat y Sugerencias de Riesgo / Controles ISO 27002:2022
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.gemini_cag_service import cag_service

router = APIRouter(prefix="/copilot", tags=["SmartAuditor Copilot"])

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class RiskEvalRequest(BaseModel):
    asset_name: str
    asset_type: str
    cia_levels: Optional[Dict[str, str]] = None

class SuggestControlsRequest(BaseModel):
    asset_name: str
    asset_type: str
    threat: Optional[str] = ""
    vulnerability: Optional[str] = ""
    risk_level: Optional[str] = "HIGH"

@router.post("/chat")
async def copilot_chat(req: ChatRequest):
    """Chat interactivo con SmartAuditor Copilot."""
    # Recoger el stream completo o respuesta estructurada
    chunks = list(cag_service.chat_stream(req.message, req.context))
    full_text = "".join(chunks)
    
    # Generar action chips según el contexto
    chips = []
    if req.context and req.context.get("asset_name"):
        chips.append({
            "action": "ANALYZE_ASSET",
            "label": f"Evaluar Controles para {req.context.get('asset_name')[:20]}",
            "asset_name": req.context.get("asset_name")
        })

    return {
        "reply": full_text,
        "action_chips": chips,
        "norma_referencia": "ISO/IEC 27002:2022 & ISO/IEC 27005:2022"
    }

@router.post("/stream")
async def copilot_stream(req: ChatRequest):
    """Streaming Server-Sent Events (SSE) palabra por palabra."""
    def event_generator():
        for chunk in cag_service.chat_stream(req.message, req.context):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/evaluate-risk")
async def copilot_evaluate_risk(req: RiskEvalRequest):
    """Evaluación de superficie de exposición y propuesta de vector de riesgo."""
    result = cag_service.evaluate_risk(req.asset_name, req.asset_type, req.cia_levels)
    return result

@router.post("/suggest-controls")
async def copilot_suggest_controls(req: SuggestControlsRequest):
    """Sugerencia de controles del Anexo A ISO 27002:2022 con Action Chips."""
    result = cag_service.suggest_controls(
        asset_name=req.asset_name,
        asset_type=req.asset_type,
        threat=req.threat,
        vulnerability=req.vulnerability,
        risk_level=req.risk_level
    )
    return result

@router.get("/catalog")
async def copilot_get_catalog():
    """Retorna el catálogo completo de los 93 controles de ISO 27002:2022."""
    return cag_service.catalog

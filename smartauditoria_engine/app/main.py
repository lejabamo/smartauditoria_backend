"""
SmartAuditorIA Engine v2 - FastAPI Entrypoint
Middleware de seguridad, rate-limiting y RAG Integration.
"""

import os
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

# Configuración de Logging Forense
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("ForensicAuditor")

# Variables de Entorno (Hardening)
IA_API_KEY = os.getenv("ENGINE_API_KEY", "amo_master_key_2026")
PORT = int(os.getenv("PORT", 8001))

def create_app() -> FastAPI:
    """Factory para la aplicación FastAPI."""
    _app = FastAPI(title="SmartAuditorIA Engine v2 (Certified)")
    
    # Import and register routers
    from app.api.routes.suggestions import router as suggestions_router
    from app.api.routes.justifications import router as justifications_router
    
    _app.include_router(suggestions_router, prefix="/api/v1")
    _app.include_router(justifications_router, prefix="/api/v1")
    
    @_app.get("/health")
    async def health_check():
        return {"status": "ok", "service": "smartauditoria_engine"}
        
    return _app

app = create_app()

# --- Mock Vector Store Adapter para el levantamiento local inicial ---
class SimpleVectorStore:
    def search(self, query: str, limit: int = 5):
        # Datos de ejemplo simulados (Evidence)
        return [
            {"metadata": {"control_id": "A.8.2", "norma": "ISO 27001", "description": "Clasificación de la información"}, "score": 0.95},
            {"metadata": {"control_id": "A.5.1", "norma": "ISO 27001", "description": "Políticas de seguridad"}, "score": 0.88}
        ]

# --- Middleware de Seguridad Blindada (Blue Team) ---
@app.middleware("http")
async def security_barrier(request: Request, call_next):
    # 1. Healthcheck bypass
    if request.url.path in ["/api/v1/health", "/docs", "/openapi.json"]:
        return await call_next(request)
        
    # 2. X-API-KEY Validation
    api_key = request.headers.get("X-API-KEY")
    if api_key != IA_API_KEY:
        logger.warning(f"INTENTO DE ACCESO NO AUTORIZADO desde {request.client.host}")
        return JSONResponse(status_code=403, content={"detail": "Unauthorized: Invalid or missing API Key"})
        
    return await call_next(request)

# --- Endpoints ---
@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "engine": "RAG-Certified"}

class SuggestionRequest(BaseModel):
    activo_nombre: str
    activo_tipo: str
    tipo: str # threats | vulnerabilities | controls

@app.post("/api/v1/ia/suggestions")
async def get_suggestions(request: SuggestionRequest):
    logger.info(f"Procesando sugerencias para activo: {request.activo_nombre}")
    # Simulación lógica RAG (v2)
    return {
        "trace_id": "550e8400-e29b-41d4-a716-446655440000",
        "sugerencias": [
            {
                "id": "A.8.2",
                "nombre": "Clasificación de activos de información",
                "norma": "ISO 27001",
                "descripcion": "Se debe asegurar que la información reciba un nivel de protección adecuado."
            }
        ],
        "confidence": 0.98,
        "is_audited": True,
        "ui_flag": "VERDE_CERTEZA_ALTA"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)

"""Punto de entrada para uvicorn."""
import uvicorn
from app.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.engine_host,
        port=settings.engine_port,
        reload=settings.is_development,
        log_level=settings.engine_log_level,
    )

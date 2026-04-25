"""
SmartAuditorIA Engine — Configuración centralizada con Pydantic Settings.
Lee variables desde .env o entorno del sistema.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración del Motor IA (Pydantic v2 Settings)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Servidor ──────────────────────────────────────────
    engine_host: str = "0.0.0.0"
    engine_port: int = 8001
    engine_env: str = "development"
    engine_log_level: str = "info"

    # ── Seguridad ─────────────────────────────────────────
    engine_api_key: str = ""

    # ── ChromaDB ──────────────────────────────────────────
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    chroma_mode: str = "local"  # local | server
    chroma_persist_dir: str = "./data/chromadb"

    # ── Colecciones ───────────────────────────────────────
    chroma_collection_iso: str = "iso_documents"
    chroma_collection_legal: str = "marco_legal_co"

    # ── Embeddings ────────────────────────────────────────
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"

    # ── Pipeline RAG ──────────────────────────────────────
    rag_top_k: int = 5
    rag_min_score: float = 0.5
    rag_max_suggestions: int = 10

    @property
    def is_production(self) -> bool:
        return self.engine_env == "production"

    @property
    def is_development(self) -> bool:
        return self.engine_env == "development"


@lru_cache
def get_settings() -> Settings:
    """Singleton de configuración — se crea una sola vez."""
    return Settings()

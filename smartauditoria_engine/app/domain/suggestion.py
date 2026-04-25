"""
DTOs de salida del Motor IA.
Contratos de respuesta: Sugerencias y Justificaciones.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────
# Sugerencias (amenazas, vulnerabilidades, controles)
# ──────────────────────────────────────────────────────────

class Suggestion(BaseModel):
    """Sugerencia individual generada por el motor RAG."""
    id: str = Field(..., description="Identificador único (ej: T.1, V.2, A.8.1)")
    nombre: str
    descripcion: str
    categoria: Optional[str] = None
    confianza: float = Field(..., ge=0.0, le=1.0, description="Nivel de confianza 0.0 – 1.0")
    referencias_iso: list[str] = Field(
        default_factory=list,
        description="Artículos ISO relevantes (ej: ['ISO 27005:2022 §8.3', 'A.12.1'])"
    )
    referencias_legales: list[str] = Field(
        default_factory=list,
        description="Referencias al marco legal colombiano"
    )
    controles_relacionados: list[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class SuggestionResponse(BaseModel):
    """Respuesta de sugerencias del motor RAG."""
    sugerencias: list[Suggestion]
    total: int
    tipo: str = Field(..., description="threats | vulnerabilities | controls")
    activo_tipo: str
    tiempo_ms: Optional[float] = None


# ──────────────────────────────────────────────────────────
# Justificaciones normativas
# ──────────────────────────────────────────────────────────

class JustificationSection(BaseModel):
    """Sección individual de una justificación estructurada."""
    titulo: str
    contenido: str
    referencias: list[str] = Field(default_factory=list)


class Justification(BaseModel):
    """Justificación normativa completa generada por el motor RAG."""
    control_id: str
    control_nombre: str
    activo_nombre: str
    riesgo_descripcion: str

    # Secciones estructuradas
    contexto: str
    base_normativa: str
    implementacion: str
    beneficios_esperados: str
    evidencia_adicional: Optional[str] = None
    recomendacion: str

    # Calidad
    nivel_confianza: float = Field(..., ge=0.0, le=1.0)
    articulos_iso_citados: list[str] = Field(default_factory=list)
    normas_colombianas_citadas: list[str] = Field(default_factory=list)
    fuentes_recuperadas: int = Field(0, description="Número de documentos RAG utilizados")

    def to_markdown(self) -> str:
        """Exportar justificación como texto Markdown."""
        md = f"## Justificación — Control {self.control_id}: {self.control_nombre}\n\n"
        md += f"### Contexto\n{self.contexto}\n\n"
        md += f"### Base Normativa\n{self.base_normativa}\n\n"
        md += f"### Implementación\n{self.implementacion}\n\n"
        md += f"### Beneficios Esperados\n{self.beneficios_esperados}\n\n"
        if self.evidencia_adicional:
            md += f"### Evidencia\n{self.evidencia_adicional}\n\n"
        md += f"### Recomendación\n{self.recomendacion}\n\n"
        md += f"---\n*Nivel de confianza: {self.nivel_confianza:.0%}*"
        return md


class JustificationResponse(BaseModel):
    """Respuesta de justificaciones del motor RAG."""
    justificaciones: list[Justification]
    total: int
    tiempo_ms: Optional[float] = None

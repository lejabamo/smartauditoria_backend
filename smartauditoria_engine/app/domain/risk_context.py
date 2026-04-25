"""
DTOs del dominio del Motor IA.
Pydantic v2 — contratos de entrada y salida del servicio.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────
# Enums de dominio
# ──────────────────────────────────────────────────────────

class AssetType(str, Enum):
    """Tipos de activos de información (ISO 27001)."""
    SERVIDOR = "servidor"
    BASE_DATOS = "base_datos"
    APLICACION = "aplicacion"
    RED = "red"
    DISPOSITIVO_MOVIL = "dispositivo_movil"
    INFRAESTRUCTURA = "infraestructura"
    DATOS = "datos"
    USUARIO = "usuario"


class CIALevel(str, Enum):
    """Niveles CIA (Confidencialidad, Integridad, Disponibilidad)."""
    BAJO = "Bajo"
    MEDIO = "Medio"
    ALTO = "Alto"
    MUY_ALTO = "Muy Alto"


# ──────────────────────────────────────────────────────────
# DTO de entrada — Contexto de Riesgo
# El backend envía este payload al Motor IA.
# ──────────────────────────────────────────────────────────

class AssetContext(BaseModel):
    """Información del activo bajo evaluación."""
    id: Optional[int] = None
    nombre: str = Field(..., description="Nombre del activo")
    tipo: AssetType = Field(..., description="Tipo de activo según clasificación ISO")
    criticidad: Optional[str] = Field(None, description="Muy Alto | Alto | Medio | Bajo")
    confidencialidad: Optional[CIALevel] = None
    integridad: Optional[CIALevel] = None
    disponibilidad: Optional[CIALevel] = None
    descripcion: Optional[str] = None


class RiskContext(BaseModel):
    """Contexto completo de evaluación de riesgo enviado al Motor IA."""
    activo: AssetContext
    amenaza_id: Optional[str] = Field(None, description="ID de amenaza seleccionada (ej: T.1)")
    amenaza_nombre: Optional[str] = None
    vulnerabilidad_id: Optional[str] = Field(None, description="ID de vulnerabilidad seleccionada")
    vulnerabilidad_nombre: Optional[str] = None
    controles_seleccionados: list[str] = Field(
        default_factory=list,
        description="Lista de códigos ISO de controles seleccionados (ej: ['A.8.1', 'A.12.1'])"
    )
    riesgo_inherente: Optional[float] = Field(None, ge=1, le=25)
    riesgo_residual: Optional[float] = Field(None, ge=1, le=25)
    industria: Optional[str] = Field(None, description="Sector organizacional")
    contexto_adicional: Optional[str] = Field(None, description="Contexto libre del auditor")

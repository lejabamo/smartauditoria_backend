"""
Interfaces de Repositorios — Contratos abstractos del dominio.
Patrón: Abstract Factory / Repository Interface

REGLA: Solo trabajan con entidades de dominio puras.
Las implementaciones concretas viven en infrastructure/persistence/repositories/.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.domain.entities.models import (
    Activo,
    ControlSeguridad,
    EvaluacionRiesgo,
    Incidente,
    NivelCriticidad,
    NivelRiesgo,
    Riesgo,
    TipoActivo,
)


class IActivoRepository(ABC):
    """Contrato para persistencia de Activos."""

    @abstractmethod
    def get_by_id(self, activo_id: int) -> Optional[Activo]:
        ...

    @abstractmethod
    def get_all(
        self,
        tipo: Optional[TipoActivo] = None,
        criticidad: Optional[NivelCriticidad] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Activo], int]:
        """Retorna (lista_activos, total)."""
        ...

    @abstractmethod
    def save(self, activo: Activo) -> Activo:
        """Crea o actualiza. Retorna la entidad con ID asignado."""
        ...

    @abstractmethod
    def delete(self, activo_id: int) -> bool:
        ...

    @abstractmethod
    def count_by_criticidad(self) -> dict[str, int]:
        """Estadísticas para dashboard."""
        ...


class IRiesgoRepository(ABC):
    """Contrato para persistencia de Riesgos."""

    @abstractmethod
    def get_by_id(self, riesgo_id: int) -> Optional[Riesgo]:
        ...

    @abstractmethod
    def get_all(self, page: int = 1, per_page: int = 20) -> tuple[list[Riesgo], int]:
        ...

    @abstractmethod
    def save(self, riesgo: Riesgo) -> Riesgo:
        ...

    @abstractmethod
    def delete(self, riesgo_id: int) -> bool:
        ...


class IEvaluacionRepository(ABC):
    """Contrato para persistencia de EvaluacionRiesgo."""

    @abstractmethod
    def get_by_id(self, eval_id: int) -> Optional[EvaluacionRiesgo]:
        ...

    @abstractmethod
    def get_by_activo(self, activo_id: int) -> list[EvaluacionRiesgo]:
        ...

    @abstractmethod
    def get_by_riesgo(self, riesgo_id: int) -> list[EvaluacionRiesgo]:
        ...

    @abstractmethod
    def save(self, evaluacion: EvaluacionRiesgo) -> EvaluacionRiesgo:
        ...

    @abstractmethod
    def get_top_riesgos_criticos(self, limit: int = 10) -> list[dict]:
        """Para el dashboard ejecutivo."""
        ...

    @abstractmethod
    def get_distribucion_niveles(self) -> dict[str, int]:
        """Conteo por NivelRiesgo para gráficos de dashboard."""
        ...


class IControlRepository(ABC):
    """Contrato para persistencia de Controles de Seguridad."""

    @abstractmethod
    def get_by_id(self, control_id: int) -> Optional[ControlSeguridad]:
        ...

    @abstractmethod
    def get_all(self) -> list[ControlSeguridad]:
        ...

    @abstractmethod
    def get_by_codigo_iso(self, codigo: str) -> Optional[ControlSeguridad]:
        ...

    @abstractmethod
    def save(self, control: ControlSeguridad) -> ControlSeguridad:
        ...


class IIncidenteRepository(ABC):
    """Contrato para persistencia de Incidentes."""

    @abstractmethod
    def get_by_id(self, incidente_id: int) -> Optional[Incidente]:
        ...

    @abstractmethod
    def get_all(self, page: int = 1, per_page: int = 20) -> tuple[list[Incidente], int]:
        ...

    @abstractmethod
    def get_by_activo(self, activo_id: int) -> list[Incidente]:
        ...

    @abstractmethod
    def save(self, incidente: Incidente) -> Incidente:
        ...

    @abstractmethod
    def count_by_estado(self) -> dict[str, int]:
        """Para dashboard."""
        ...

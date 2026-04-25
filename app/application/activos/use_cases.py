"""
Casos de Uso — Módulo Activos.
Patrón: Application Services / Use Cases (Clean Architecture)

Cada clase tiene UNA sola responsabilidad. Las rutas Flask son controladores delgados
que solo llaman estos casos de uso.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.domain.entities.models import Activo, NivelCIA, NivelCriticidad, TipoActivo, EstadoActivo
from app.domain.repositories.interfaces import IActivoRepository


# ──────────────────────────────────────────────────────────
# DTOs de entrada (no son las entidades de dominio)
# ──────────────────────────────────────────────────────────

@dataclass
class CrearActivoInput:
    nombre: str
    tipo_activo: str
    descripcion: Optional[str] = None
    confidencialidad: str = "Medio"
    integridad: str = "Medio"
    disponibilidad: str = "Medio"
    nivel_criticidad: str = "Medio"
    id_propietario: Optional[int] = None
    id_custodio: Optional[int] = None
    id_externo_glpi: Optional[str] = None


@dataclass
class ActualizarActivoInput:
    activo_id: int
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    confidencialidad: Optional[str] = None
    integridad: Optional[str] = None
    disponibilidad: Optional[str] = None
    nivel_criticidad: Optional[str] = None
    estado_activo: Optional[str] = None


# ──────────────────────────────────────────────────────────
# Caso de Uso: Listar Activos
# ──────────────────────────────────────────────────────────

class ListarActivosUseCase:
    """UC-ACT-01: Obtener lista paginada de activos con filtros opcionales."""

    def __init__(self, repo: IActivoRepository) -> None:
        self._repo = repo

    def execute(
        self,
        tipo: Optional[str] = None,
        criticidad: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        tipo_enum = TipoActivo(tipo) if tipo else None
        crit_enum = NivelCriticidad(criticidad) if criticidad else None

        activos, total = self._repo.get_all(
            tipo=tipo_enum,
            criticidad=crit_enum,
            page=page,
            per_page=per_page,
        )

        return {
            "activos": [self._to_dict(a) for a in activos],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page,
        }

    @staticmethod
    def _to_dict(a: Activo) -> dict:
        return {
            "id": a.id,
            "nombre": a.nombre,
            "tipo_activo": a.tipo_activo.value,
            "descripcion": a.descripcion,
            "confidencialidad": a.confidencialidad.value,
            "integridad": a.integridad.value,
            "disponibilidad": a.disponibilidad.value,
            "nivel_criticidad": a.nivel_criticidad.value,
            "estado_activo": a.estado_activo.value,
            "es_critico": a.es_critico(),
            "score_cia": round(a.calcular_score_cia(), 2),
            "id_propietario": a.id_propietario,
            "id_custodio": a.id_custodio,
            "fecha_creacion": a.fecha_creacion.isoformat() if a.fecha_creacion else None,
        }


# ──────────────────────────────────────────────────────────
# Caso de Uso: Obtener Activo por ID
# ──────────────────────────────────────────────────────────

class ObtenerActivoUseCase:
    """UC-ACT-02: Obtener detalle de un activo por ID."""

    def __init__(self, repo: IActivoRepository) -> None:
        self._repo = repo

    def execute(self, activo_id: int) -> dict:
        activo = self._repo.get_by_id(activo_id)
        if not activo:
            raise ValueError(f"Activo {activo_id} no encontrado.")
        return ListarActivosUseCase._to_dict(activo)


# ──────────────────────────────────────────────────────────
# Caso de Uso: Crear Activo
# ──────────────────────────────────────────────────────────

class CrearActivoUseCase:
    """UC-ACT-03: Registrar un nuevo activo de información."""

    def __init__(self, repo: IActivoRepository) -> None:
        self._repo = repo

    def execute(self, data: CrearActivoInput) -> dict:
        # Validación de dominio
        try:
            tipo = TipoActivo(data.tipo_activo)
        except ValueError:
            raise ValueError(f"Tipo de activo inválido: '{data.tipo_activo}'. "
                             f"Tipos válidos: {[t.value for t in TipoActivo]}")

        activo = Activo(
            nombre=data.nombre.strip(),
            tipo_activo=tipo,
            descripcion=data.descripcion,
            confidencialidad=NivelCIA(data.confidencialidad),
            integridad=NivelCIA(data.integridad),
            disponibilidad=NivelCIA(data.disponibilidad),
            nivel_criticidad=NivelCriticidad(data.nivel_criticidad),
            id_propietario=data.id_propietario,
            id_custodio=data.id_custodio,
            id_externo_glpi=data.id_externo_glpi,
        )

        saved = self._repo.save(activo)
        return ListarActivosUseCase._to_dict(saved)


# ──────────────────────────────────────────────────────────
# Caso de Uso: Actualizar Activo
# ──────────────────────────────────────────────────────────

class ActualizarActivoUseCase:
    """UC-ACT-04: Actualizar campos de un activo existente."""

    def __init__(self, repo: IActivoRepository) -> None:
        self._repo = repo

    def execute(self, data: ActualizarActivoInput) -> dict:
        activo = self._repo.get_by_id(data.activo_id)
        if not activo:
            raise ValueError(f"Activo {data.activo_id} no encontrado.")

        if data.nombre is not None:
            activo.nombre = data.nombre.strip()
        if data.descripcion is not None:
            activo.descripcion = data.descripcion
        if data.confidencialidad is not None:
            activo.confidencialidad = NivelCIA(data.confidencialidad)
        if data.integridad is not None:
            activo.integridad = NivelCIA(data.integridad)
        if data.disponibilidad is not None:
            activo.disponibilidad = NivelCIA(data.disponibilidad)
        if data.nivel_criticidad is not None:
            activo.nivel_criticidad = NivelCriticidad(data.nivel_criticidad)
        if data.estado_activo is not None:
            activo.estado_activo = EstadoActivo(data.estado_activo)

        saved = self._repo.save(activo)
        return ListarActivosUseCase._to_dict(saved)


# ──────────────────────────────────────────────────────────
# Caso de Uso: Eliminar Activo
# ──────────────────────────────────────────────────────────

class EliminarActivoUseCase:
    """UC-ACT-05: Eliminar un activo (soft delete en infraestructura)."""

    def __init__(self, repo: IActivoRepository) -> None:
        self._repo = repo

    def execute(self, activo_id: int) -> dict:
        if not self._repo.get_by_id(activo_id):
            raise ValueError(f"Activo {activo_id} no encontrado.")
        self._repo.delete(activo_id)
        return {"message": f"Activo {activo_id} eliminado correctamente."}

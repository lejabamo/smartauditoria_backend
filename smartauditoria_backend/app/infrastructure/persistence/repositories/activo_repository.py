"""
SQLActivoRepository — Implementación concreta del IActivoRepository.
Patrón: Repository (Infrastructure Layer)

Traduce entre entidades de dominio y modelos SQLAlchemy existentes.
"""

from __future__ import annotations

from typing import Optional

from app import db
from app.domain.entities.models import (
    Activo,
    EstadoActivo,
    NivelCIA,
    NivelCriticidad,
    TipoActivo,
)
from app.domain.repositories.interfaces import IActivoRepository
from app.models import Activo as ActivoORM  # Modelo SQLAlchemy existente


class SQLActivoRepository(IActivoRepository):
    """
    Implementación del repositorio de activos usando SQLAlchemy.
    Mapea entre Activo (dominio) ↔ Activo ORM (infraestructura).
    """

    def get_by_id(self, activo_id: int) -> Optional[Activo]:
        orm = db.session.get(ActivoORM, activo_id)
        return self._to_domain(orm) if orm else None

    def get_all(
        self,
        tipo: Optional[TipoActivo] = None,
        criticidad: Optional[NivelCriticidad] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Activo], int]:
        query = ActivoORM.query
        if tipo:
            query = query.filter(ActivoORM.Tipo_Activo == tipo.value)
        if criticidad:
            query = query.filter(ActivoORM.nivel_criticidad_negocio == criticidad.value)

        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        return [self._to_domain(a) for a in paginated.items], paginated.total

    def save(self, activo: Activo) -> Activo:
        if activo.id:
            orm = db.session.get(ActivoORM, activo.id)
            if not orm:
                raise ValueError(f"Activo {activo.id} no encontrado en BD.")
        else:
            orm = ActivoORM()
            db.session.add(orm)

        orm.Nombre = activo.nombre
        orm.Descripcion = activo.descripcion
        orm.Tipo_Activo = activo.tipo_activo.value
        orm.Nivel_Clasificacion_Confidencialidad = activo.confidencialidad.value
        orm.Nivel_Clasificacion_Integridad = activo.integridad.value
        orm.Nivel_Clasificacion_Disponibilidad = activo.disponibilidad.value
        orm.nivel_criticidad_negocio = activo.nivel_criticidad.value
        orm.estado_activo = activo.estado_activo.value
        orm.ID_Propietario = activo.id_propietario
        orm.ID_Custodio = activo.id_custodio
        orm.id_externo_glpi = activo.id_externo_glpi

        db.session.commit()
        activo.id = orm.ID_Activo
        return activo

    def delete(self, activo_id: int) -> bool:
        orm = db.session.get(ActivoORM, activo_id)
        if orm:
            # Soft delete: cambiar estado a Inactivo en vez de borrar físicamente
            orm.estado_activo = "Inactivo"
            db.session.commit()
            return True
        return False

    def count_by_criticidad(self) -> dict[str, int]:
        rows = (
            db.session.query(ActivoORM.nivel_criticidad_negocio, db.func.count())
            .group_by(ActivoORM.nivel_criticidad_negocio)
            .all()
        )
        return {nivel or "Sin clasificar": count for nivel, count in rows}

    # ── Mapeo dominio ↔ ORM ──────────────────────────────

    @staticmethod
    def _to_domain(orm: ActivoORM) -> Activo:
        def safe_cia(val: str | None) -> NivelCIA:
            try:
                return NivelCIA(val) if val else NivelCIA.MEDIO
            except ValueError:
                return NivelCIA.MEDIO

        def safe_crit(val: str | None) -> NivelCriticidad:
            try:
                return NivelCriticidad(val) if val else NivelCriticidad.MEDIO
            except ValueError:
                return NivelCriticidad.MEDIO

        def safe_tipo(val: str | None) -> TipoActivo:
            try:
                return TipoActivo(val) if val else TipoActivo.HARDWARE
            except ValueError:
                return TipoActivo.HARDWARE

        return Activo(
            id=orm.ID_Activo,
            nombre=orm.Nombre,
            descripcion=orm.Descripcion,
            tipo_activo=safe_tipo(orm.Tipo_Activo),
            confidencialidad=safe_cia(orm.Nivel_Clasificacion_Confidencialidad),
            integridad=safe_cia(orm.Nivel_Clasificacion_Integridad),
            disponibilidad=safe_cia(orm.Nivel_Clasificacion_Disponibilidad),
            nivel_criticidad=safe_crit(orm.nivel_criticidad_negocio),
            estado_activo=EstadoActivo(orm.estado_activo) if orm.estado_activo else EstadoActivo.ACTIVO,
            id_propietario=orm.ID_Propietario,
            id_custodio=orm.ID_Custodio,
            id_externo_glpi=orm.id_externo_glpi,
            fecha_creacion=orm.fecha_creacion_registro,
            fecha_actualizacion=orm.fecha_ultima_actualizacion_sgsi,
        )

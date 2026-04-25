"""
SQLEvaluacionRepository — Implementación concreta de IEvaluacionRepository.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from app import db
from app.domain.entities.models import EvaluacionRiesgo, NivelRiesgo
from app.domain.repositories.interfaces import IEvaluacionRepository
from app.models import evaluacion_riesgo_activo as EvalORM


class SQLEvaluacionRepository(IEvaluacionRepository):
    """Repositorio de evaluaciones de riesgo sobre SQLAlchemy."""

    def get_by_id(self, eval_id: int) -> Optional[EvaluacionRiesgo]:
        orm = db.session.get(EvalORM, eval_id)
        return self._to_domain(orm) if orm else None

    def get_by_activo(self, activo_id: int) -> list[EvaluacionRiesgo]:
        rows = EvalORM.query.filter_by(ID_Activo=activo_id).all()
        return [self._to_domain(r) for r in rows]

    def get_by_riesgo(self, riesgo_id: int) -> list[EvaluacionRiesgo]:
        rows = EvalORM.query.filter_by(ID_Riesgo=riesgo_id).all()
        return [self._to_domain(r) for r in rows]

    def save(self, evaluacion: EvaluacionRiesgo) -> EvaluacionRiesgo:
        if evaluacion.id:
            orm = db.session.get(EvalORM, evaluacion.id)
            if not orm:
                raise ValueError(f"Evaluación {evaluacion.id} no encontrada.")
        else:
            orm = EvalORM()
            db.session.add(orm)

        orm.ID_Riesgo = evaluacion.id_riesgo
        orm.ID_Activo = evaluacion.id_activo
        orm.id_nivel_probabilidad_inherente = evaluacion.probabilidad_inherente
        orm.id_nivel_impacto_inherente = evaluacion.impacto_inherente
        orm.justificacion_evaluacion_inherente = evaluacion.justificacion_inherente
        orm.fecha_evaluacion_inherente = evaluacion.fecha_evaluacion_inherente
        orm.id_nivel_probabilidad_residual = evaluacion.probabilidad_residual
        orm.id_nivel_impacto_residual = evaluacion.impacto_residual
        orm.justificacion_evaluacion_residual = evaluacion.justificacion_residual
        orm.fecha_evaluacion_residual = evaluacion.fecha_evaluacion_residual
        orm.fecha_ultima_actualizacion = datetime.utcnow()

        db.session.commit()
        evaluacion.id = orm.id_evaluacion_riesgo_activo
        return evaluacion

    def get_top_riesgos_criticos(self, limit: int = 10) -> list[dict]:
        """Top riesgos por score inherente para el dashboard."""
        rows = EvalORM.query.order_by(
            (EvalORM.id_nivel_probabilidad_inherente * EvalORM.id_nivel_impacto_inherente).desc()
        ).limit(limit).all()

        return [
            {
                "id_evaluacion": r.id_evaluacion_riesgo_activo,
                "id_riesgo": r.ID_Riesgo,
                "id_activo": r.ID_Activo,
                "score_inherente": (r.id_nivel_probabilidad_inherente or 0)
                                   * (r.id_nivel_impacto_inherente or 0),
                "score_residual": (r.id_nivel_probabilidad_residual or 0)
                                  * (r.id_nivel_impacto_residual or 0),
                "fecha_evaluacion": r.fecha_evaluacion_inherente.isoformat()
                                    if r.fecha_evaluacion_inherente else None,
            }
            for r in rows
        ]

    def get_distribucion_niveles(self) -> dict[str, int]:
        """Distribución de niveles de riesgo calculados para gráficos."""
        evaluaciones = EvaluacionRiesgo.__subclasshook__  # placeholder
        rows = EvalORM.query.all()
        conteo: dict[str, int] = {"Bajo": 0, "Medio": 0, "Alto": 0, "Crítico": 0}
        for row in rows:
            prob = row.id_nivel_probabilidad_inherente
            imp = row.id_nivel_impacto_inherente
            if prob and imp:
                nivel = EvaluacionRiesgo(
                    id_riesgo=row.ID_Riesgo,
                    id_activo=row.ID_Activo,
                    probabilidad_inherente=prob,
                    impacto_inherente=imp,
                ).calcular_nivel_inherente()
                if nivel:
                    conteo[nivel.value] = conteo.get(nivel.value, 0) + 1
        return conteo

    @staticmethod
    def _to_domain(orm: EvalORM) -> EvaluacionRiesgo:
        return EvaluacionRiesgo(
            id=orm.id_evaluacion_riesgo_activo,
            id_riesgo=orm.ID_Riesgo,
            id_activo=orm.ID_Activo,
            probabilidad_inherente=orm.id_nivel_probabilidad_inherente,
            impacto_inherente=orm.id_nivel_impacto_inherente,
            justificacion_inherente=orm.justificacion_evaluacion_inherente,
            fecha_evaluacion_inherente=orm.fecha_evaluacion_inherente,
            probabilidad_residual=orm.id_nivel_probabilidad_residual,
            impacto_residual=orm.id_nivel_impacto_residual,
            justificacion_residual=orm.justificacion_evaluacion_residual,
            fecha_evaluacion_residual=orm.fecha_evaluacion_residual,
            fecha_creacion=orm.fecha_creacion_registro,
        )

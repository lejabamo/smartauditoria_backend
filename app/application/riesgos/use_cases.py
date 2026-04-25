"""
Casos de Uso — Módulo Riesgos + Evaluación de Riesgos.
Incluye integración con el Motor IA (RAGClient) para justificaciones residuales.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date
from typing import Optional

from app.domain.entities.models import EvaluacionRiesgo, NivelRiesgo, Riesgo
from app.domain.repositories.interfaces import IEvaluacionRepository, IRiesgoRepository
from app.infrastructure.ia_client.rag_client import RAGClient, RAGClientUnavailableError

logger = logging.getLogger(__name__)


@dataclass
class EvaluarRiesgoInput:
    """DTO para crear o actualizar una evaluación de riesgo."""
    id_riesgo: int
    id_activo: int
    activo_nombre: str
    activo_tipo: str
    probabilidad_inherente: int
    impacto_inherente: int
    justificacion_inherente: Optional[str] = None
    fecha_evaluacion_inherente: Optional[date] = None
    probabilidad_residual: Optional[int] = None
    impacto_residual: Optional[int] = None
    controles_seleccionados: list[str] = field(default_factory=list)
    amenaza_id: Optional[str] = None
    amenaza_nombre: Optional[str] = None
    industria: Optional[str] = None
    # Si True, el caso de uso llama al Motor IA para generar la justificación residual
    generar_justificacion_ia: bool = False


# ──────────────────────────────────────────────────────────
# UC: Evaluar Riesgo (inherente + residual + IA opcional)
# ──────────────────────────────────────────────────────────

class EvaluarRiesgoUseCase:
    """
    UC-RISK-01: Evaluar el riesgo inherente y residual de un activo.

    Si generar_justificacion_ia=True y el Motor IA está disponible,
    genera automáticamente la justificación residual normativa.
    """

    def __init__(
        self,
        eval_repo: IEvaluacionRepository,
        rag_client: RAGClient | None = None,
    ) -> None:
        self._repo = eval_repo
        self._rag = rag_client or RAGClient()

    def execute(self, data: EvaluarRiesgoInput) -> dict:
        # 1. Calcular niveles en dominio puro
        evaluacion = EvaluacionRiesgo(
            id_riesgo=data.id_riesgo,
            id_activo=data.id_activo,
            probabilidad_inherente=data.probabilidad_inherente,
            impacto_inherente=data.impacto_inherente,
            justificacion_inherente=data.justificacion_inherente,
            fecha_evaluacion_inherente=data.fecha_evaluacion_inherente or date.today(),
            probabilidad_residual=data.probabilidad_residual,
            impacto_residual=data.impacto_residual,
        )

        nivel_inherente = evaluacion.calcular_nivel_inherente()
        nivel_residual = evaluacion.calcular_nivel_residual()
        porcentaje_reduccion = evaluacion.porcentaje_reduccion()

        # 2. Justificación IA (opcional y degradable)
        justificacion_ia: dict = {}
        if data.generar_justificacion_ia and data.probabilidad_residual is not None:
            try:
                inherente_score = float(data.probabilidad_inherente * data.impacto_inherente)
                residual_score = float(data.probabilidad_residual * (data.impacto_residual or data.impacto_inherente))
                justificacion_ia = self._rag.get_residual_justification(
                    activo_nombre=data.activo_nombre,
                    activo_tipo=data.activo_tipo,
                    amenaza_id=data.amenaza_id,
                    amenaza_nombre=data.amenaza_nombre,
                    controles_seleccionados=data.controles_seleccionados,
                    riesgo_inherente=inherente_score,
                    riesgo_residual=residual_score,
                    industria=data.industria,
                )
                # Persiste la justificación generada
                evaluacion.justificacion_residual = justificacion_ia.get("contexto", "")
            except RAGClientUnavailableError:
                logger.warning(
                    "Motor IA no disponible — justificación residual omitida para activo %s",
                    data.activo_nombre,
                )
            except Exception as exc:
                logger.error("Error inesperado del Motor IA: %s", exc)

        # 3. Persistir evaluación
        saved = self._repo.save(evaluacion)

        return {
            "id_evaluacion": saved.id,
            "id_riesgo": saved.id_riesgo,
            "id_activo": saved.id_activo,
            "nivel_inherente": nivel_inherente.value if nivel_inherente else None,
            "nivel_residual": nivel_residual.value if nivel_residual else None,
            "score_inherente": data.probabilidad_inherente * data.impacto_inherente,
            "score_residual": (data.probabilidad_residual or 0) * (data.impacto_residual or 0),
            "porcentaje_reduccion": round(porcentaje_reduccion, 1) if porcentaje_reduccion else None,
            "justificacion_ia": justificacion_ia,
            "motor_ia_disponible": bool(justificacion_ia),
        }


# ──────────────────────────────────────────────────────────
# UC: Obtener sugerencias de amenazas IA para un activo
# ──────────────────────────────────────────────────────────

class ObtenerSugerenciasIAUseCase:
    """
    UC-RISK-02: Obtener sugerencias del Motor IA para un activo dado.
    Tipo: threats | vulnerabilities | controls
    """

    def __init__(self, rag_client: RAGClient | None = None) -> None:
        self._rag = rag_client or RAGClient()

    def execute(
        self,
        activo_nombre: str,
        activo_tipo: str,
        tipo: str = "threats",
        amenaza_id: str | None = None,
        vulnerabilidad_id: str | None = None,
        criticidad: str | None = None,
        industria: str | None = None,
    ) -> dict:
        try:
            if tipo == "threats":
                sugerencias = self._rag.get_threat_suggestions(
                    activo_nombre=activo_nombre,
                    activo_tipo=activo_tipo,
                    criticidad=criticidad,
                    industria=industria,
                )
            elif tipo == "vulnerabilities":
                sugerencias = self._rag.get_vulnerability_suggestions(
                    activo_nombre=activo_nombre,
                    activo_tipo=activo_tipo,
                    amenaza_id=amenaza_id,
                    industria=industria,
                )
            elif tipo == "controls":
                sugerencias = self._rag.get_control_suggestions(
                    activo_nombre=activo_nombre,
                    activo_tipo=activo_tipo,
                    amenaza_id=amenaza_id,
                    vulnerabilidad_id=vulnerabilidad_id,
                )
            else:
                raise ValueError(f"Tipo de sugerencia inválido: {tipo}")

            return {
                "sugerencias": sugerencias,
                "total": len(sugerencias),
                "tipo": tipo,
                "motor_ia_disponible": True,
            }

        except RAGClientUnavailableError:
            logger.warning("Motor IA no disponible para sugerencias tipo=%s", tipo)
            return {
                "sugerencias": [],
                "total": 0,
                "tipo": tipo,
                "motor_ia_disponible": False,
                "mensaje": "Motor IA temporalmente no disponible. Intente más tarde.",
            }

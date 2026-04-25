"""
Casos de Uso — Dashboard Ejecutivo.
Refactorización de dashboard.py (106KB → 1 clase por métrica).

Patrón: Facade sobre los repositorios + Template Method para métricas.
"""

from __future__ import annotations

import logging
from typing import Any

from app.domain.repositories.interfaces import (
    IActivoRepository,
    IEvaluacionRepository,
    IIncidenteRepository,
)

logger = logging.getLogger(__name__)


class ObtenerResumenDashboardUseCase:
    """
    UC-DASH-01: Resumen ejecutivo del estado de seguridad.
    Consolida activos, riesgos e incidentes en un solo response.
    """

    def __init__(
        self,
        activo_repo: IActivoRepository,
        eval_repo: IEvaluacionRepository,
        incidente_repo: IIncidenteRepository,
    ) -> None:
        self._activos = activo_repo
        self._evaluaciones = eval_repo
        self._incidentes = incidente_repo

    def execute(self) -> dict[str, Any]:
        try:
            activos_por_criticidad = self._activos.count_by_criticidad()
        except Exception as exc:
            logger.error("Error obteniendo activos para dashboard: %s", exc)
            activos_por_criticidad = {}

        try:
            riesgos_por_nivel = self._evaluaciones.get_distribucion_niveles()
        except Exception as exc:
            logger.error("Error obteniendo distribución de riesgos: %s", exc)
            riesgos_por_nivel = {}

        try:
            incidentes_por_estado = self._incidentes.count_by_estado()
        except Exception as exc:
            logger.error("Error obteniendo incidentes para dashboard: %s", exc)
            incidentes_por_estado = {}

        try:
            top_riesgos = self._evaluaciones.get_top_riesgos_criticos(limit=5)
        except Exception as exc:
            logger.error("Error obteniendo top riesgos: %s", exc)
            top_riesgos = []

        total_activos = sum(activos_por_criticidad.values())
        total_riesgos = sum(riesgos_por_nivel.values())
        total_incidentes = sum(incidentes_por_estado.values())

        # Indicador de salud: % activos con riesgo bajo/medio respecto al total
        riesgos_controlados = riesgos_por_nivel.get("Bajo", 0) + riesgos_por_nivel.get("Medio", 0)
        indice_salud = round((riesgos_controlados / total_riesgos * 100), 1) if total_riesgos > 0 else 100.0

        return {
            "resumen": {
                "total_activos": total_activos,
                "total_riesgos": total_riesgos,
                "total_incidentes": total_incidentes,
                "indice_salud_seguridad": indice_salud,
            },
            "activos_por_criticidad": activos_por_criticidad,
            "riesgos_por_nivel": riesgos_por_nivel,
            "incidentes_por_estado": incidentes_por_estado,
            "top_riesgos_criticos": top_riesgos,
        }


class ObtenerMapaRiesgoUseCase:
    """
    UC-DASH-02: Datos para la matriz de calor de riesgos (probabilidad × impacto).
    """

    def __init__(self, eval_repo: IEvaluacionRepository) -> None:
        self._repo = eval_repo

    def execute(self) -> dict[str, Any]:
        try:
            evaluaciones = self._repo.get_top_riesgos_criticos(limit=50)
        except Exception as exc:
            logger.error("Error generando mapa de riesgos: %s", exc)
            return {"matriz": [], "error": str(exc)}

        return {
            "matriz": evaluaciones,
            "total": len(evaluaciones),
        }

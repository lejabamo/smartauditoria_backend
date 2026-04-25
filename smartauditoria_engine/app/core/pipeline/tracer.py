"""
Tracer Módulo — Trazabilidad Forense.
Registra el camino de decisión y evidencia normativa.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

class ForensicTracer:
    """
    Componente de Trazabilidad y Seguridad Forense.
    Permite auditar el motor RAG en tiempo real.
    """

    def __init__(self):
        self._current_trace = {}

    def start_trace(self, input_context: dict[str, Any]) -> str:
        """Inicia una nueva traza de auditoría."""
        trace_id = str(uuid.uuid4())
        self._current_trace = {
            "trace_id": trace_id,
            "timestamp": datetime.utcnow().isoformat(),
            "input_context": input_context,
            "steps": [],
            "decision_path": []
        }
        return trace_id

    def add_step(self, step_name: str, data: Any):
        """Registra un paso en la traza."""
        self._current_trace["steps"].append({
            "step": step_name,
            "timestamp": datetime.utcnow().timestamp(),
            "data": data
        })
        self._current_trace["decision_path"].append(step_name)

    def finalize_trace(self, final_output: dict[str, Any], validation_status: dict[str, Any]) -> dict[str, Any]:
        """Finaliza la traza y empaqueta el reporte de decisión."""
        self._current_trace["final_output"] = final_output
        self._current_trace["validation"] = validation_status
        self._current_trace["completed_at"] = datetime.utcnow().isoformat()
        
        # Log para auditoría externa / ELK / Splunk
        logger.info("AUDITORIA RAG [trace_id=%s]: Validada=%s, Confianza=%s",
                    self._current_trace["trace_id"], 
                    validation_status.get("valid"), 
                    validation_status.get("confidence"))
        
        return self._current_trace

    @property
    def trace_data(self) -> dict[str, Any]:
        return self._current_trace

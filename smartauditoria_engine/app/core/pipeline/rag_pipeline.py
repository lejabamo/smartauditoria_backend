"""
RAGPipeline — Orquestador Blindado.
Facade del Motor SmartAuditorIA con capas de seguridad activa.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.pipeline.sanitizer import PromptSanitizer, SecurityViolationError
from app.core.pipeline.retriever import HybridRetriever, IVectorStoreAdapter
from app.core.pipeline.filter import HardFilter
from app.core.pipeline.validator import Validator
from app.core.pipeline.tracer import ForensicTracer

logger = logging.getLogger(__name__)

class RAGPipeline:
    """
    Orquestador principal del Motor IA.
    Pipeline: Sanitizer -> Retriever -> HardFilter -> Generator -> Validator -> Tracer.
    """

    def __init__(self, vector_store: IVectorStoreAdapter, generator: Any):
        self._sanitizer = PromptSanitizer()
        self._retriever = HybridRetriever(vector_store)
        self._filter = HardFilter()
        self._generator = generator  # Injected LLM generator
        self._validator = Validator()
        self._tracer = ForensicTracer()

    def process(self, risk_context: dict[str, Any], query: str) -> dict[str, Any]:
        """
        Ejecución segura del pipeline RAG con Evidence Lock.
        """
        # 1. Start Trace
        trace_id = self._tracer.start_trace({**risk_context, "query": query})
        
        try:
            # 2. Sanitización (Blue Team Protection)
            sanitized_query = self._sanitizer.sanitize(query)
            if not self._sanitizer.validate_context(risk_context):
                raise ValueError("Contexto de riesgo malformado o incompleto.")
            self._tracer.add_step("sanitization", {"query": sanitized_query})

            # 3. Recuperación Híbrida (Vector + Normativo)
            raw_chunks = self._retriever.retrieve(sanitized_query, quota=5)
            self._tracer.add_step("retrieval", {"chunks_count": len(raw_chunks)})

            # 4. Hard Filter (Dominios de control coherentes)
            activo_tipo = risk_context.get("activo", {}).get("tipo", "generic")
            filtered_chunks = self._filter.filter(raw_chunks, activo_tipo)
            self._tracer.add_step("hard_filter", {"chunks_kept": len(filtered_chunks)})
            
            if not filtered_chunks:
                # Evidence Lock: No hay evidencia normativa suficiente
                return self._abort_process(trace_id, "No se encontró evidencia normativa ISO coherente con el activo.")

            # 5. Generación (LLM) con Evidence Lock
            # El prompt debe inyectar filtered_chunks explícitamente
            generation_result = self._generator.generate(sanitized_query, filtered_chunks, risk_context)
            output_text = generation_result.get("text", "")
            self._tracer.add_step("generation", {"llm_response_length": len(output_text)})

            # 6. Validación (Anti-Alucinaciones)
            validation_report = self._validator.validate_integrity(output_text, filtered_chunks)
            if not validation_report.get("valid"):
                logger.error("ALERTA: Detectada posible alucinación en trace %s", trace_id)
                output_text = "[BLOQUEADO POR FALLA DE INTEGRIDAD NORMATIVA] Reintente con consulta específica."
            self._tracer.add_step("validation", validation_report)

            # 7. Finalize Trace & Return Response
            final_response = {
                "text": output_text,
                "trace_id": trace_id,
                "iso_controls": [c.get("metadata", {}).get("control_id") for c in filtered_chunks],
                "confidence": validation_report.get("confidence", 0.0),
                "is_audited": True,
                "normative_evidence": [c.get("metadata", {}).get("norma") for c in filtered_chunks]
            }
            
            trace_report = self._tracer.finalize_trace(final_response, validation_report)
            final_response["decision_path"] = trace_report.get("decision_path")
            
            return final_response

        except SecurityViolationError as err:
            return self._abort_process(trace_id, f"Violación de seguridad detectada: {err}", "ATACADO")
        except Exception as err:
            logger.exception("Error crítico en pipeline RAG")
            return self._abort_process(trace_id, f"Error interno en el motor de auditoría: {err}")

    def _abort_process(self, trace_id: str, message: str, status: str = "ERROR") -> dict[str, Any]:
        result = {
            "text": message,
            "trace_id": trace_id,
            "status": status,
            "is_audited": True,
            "confidence": 0.0
        }
        self._tracer.add_step("abort", {"reason": message})
        return result

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

    def get_threat_suggestions(self, context) -> Any:
        from app.core.pipeline.augmenter import Augmenter
        from app.core.pipeline.generator import SuggestionGenerator
        from app.domain.suggestion import SuggestionResponse
        
        query = f"Amenazas comunes para activo tipo {context.activo.tipo.value if hasattr(context.activo.tipo, 'value') else context.activo.tipo}"
        retrieved_docs = self._retriever.retrieve(query, quota=5)
        aug_ctx = Augmenter().augment(context, retrieved_docs)
        
        generator = SuggestionGenerator()
        suggestions = generator.generate_threat_suggestions(aug_ctx)
        
        return SuggestionResponse(
            sugerencias=suggestions,
            total=len(suggestions),
            tipo="threats",
            activo_tipo=context.activo.tipo.value if hasattr(context.activo.tipo, 'value') else str(context.activo.tipo)
        )

    def get_vulnerability_suggestions(self, context) -> Any:
        from app.core.pipeline.augmenter import Augmenter
        from app.core.pipeline.generator import SuggestionGenerator
        from app.domain.suggestion import SuggestionResponse
        
        query = f"Vulnerabilidades que habilitan la amenaza {context.amenaza_nombre or ''}"
        retrieved_docs = self._retriever.retrieve(query, quota=5)
        aug_ctx = Augmenter().augment(context, retrieved_docs)
        
        generator = SuggestionGenerator()
        suggestions = generator.generate_vulnerability_suggestions(aug_ctx)
        
        return SuggestionResponse(
            sugerencias=suggestions,
            total=len(suggestions),
            tipo="vulnerabilities",
            activo_tipo=context.activo.tipo.value if hasattr(context.activo.tipo, 'value') else str(context.activo.tipo)
        )

    def get_control_suggestions(self, context) -> Any:
        from app.core.pipeline.augmenter import Augmenter
        from app.core.pipeline.generator import SuggestionGenerator
        from app.domain.suggestion import SuggestionResponse
        
        query = f"Controles para mitigar {context.amenaza_nombre or ''} y {context.vulnerabilidad_id or ''}"
        retrieved_docs = self._retriever.retrieve(query, quota=5)
        aug_ctx = Augmenter().augment(context, retrieved_docs)
        
        generator = SuggestionGenerator()
        suggestions = generator.generate_control_suggestions(aug_ctx)
        
        return SuggestionResponse(
            sugerencias=suggestions,
            total=len(suggestions),
            tipo="controls",
            activo_tipo=context.activo.tipo.value if hasattr(context.activo.tipo, 'value') else str(context.activo.tipo)
        )

    def get_residual_justification(self, context) -> Any:
        from app.core.pipeline.augmenter import Augmenter
        from app.core.pipeline.generator import JustificationBuilder
        from app.domain.suggestion import JustificationResponse
        
        query = f"Justificación técnica y normativa de controles para {context.activo.tipo.value if hasattr(context.activo.tipo, 'value') else context.activo.tipo}"
        retrieved_docs = self._retriever.retrieve(query, quota=5)
        aug_ctx = Augmenter().augment(context, retrieved_docs)
        
        builder = JustificationBuilder()
        justification = builder.build(aug_ctx)
        
        return JustificationResponse(
            justificaciones=[justification],
            total=1
        )


class LocalTestVectorStore:
    def search(self, query: str, limit: int = 5):
        return [
            {"metadata": {"control_id": "A.8.2", "norma": "ISO 27001", "description": "Clasificación de la información"}, "score": 0.95},
            {"metadata": {"control_id": "A.5.1", "norma": "ISO 27001", "description": "Políticas de seguridad"}, "score": 0.88}
        ]


_pipeline_instance = None

def get_pipeline() -> RAGPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = RAGPipeline(vector_store=LocalTestVectorStore(), generator=None)
    return _pipeline_instance


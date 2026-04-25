"""
Augmenter — Paso 2 del pipeline RAG.
Patrón: Chain of Responsibility (segundo eslabón).

Responsabilidad única: enriquecer el contexto del riesgo con
los documentos recuperados, preparando la entrada para el Generator.
"""

from __future__ import annotations

import logging
from typing import Any

from app.domain.risk_context import RiskContext

logger = logging.getLogger(__name__)

# ── Mapeo estático de controles ISO: código → dominio ─────
ISO_CONTROL_DOMAINS: dict[str, str] = {
    "A.5": "Políticas de seguridad",
    "A.6": "Organización de la seguridad",
    "A.7": "Seguridad de los recursos humanos",
    "A.8": "Gestión de activos",
    "A.9": "Control de acceso",
    "A.10": "Criptografía",
    "A.11": "Seguridad física y del entorno",
    "A.12": "Seguridad en las operaciones",
    "A.13": "Seguridad en las comunicaciones",
    "A.14": "Adquisición, desarrollo y mantenimiento",
    "A.15": "Relaciones con los proveedores",
    "A.16": "Gestión de incidentes",
    "A.17": "Continuidad del negocio",
    "A.18": "Cumplimiento",
}

# ── Artículos del marco legal colombiano relevantes ───────
COLOMBIAN_LEGAL_CONTEXT: dict[str, str] = {
    "Ley 1581/2012": "Protección de datos personales — Habeas Data",
    "Ley 1273/2009": "Delitos informáticos — protección de datos y sistemas",
    "Decreto 767/2022": "Política de Gobierno Digital",
    "CONPES 3995/2020": "Política Nacional de Confianza y Seguridad Digital",
    "Resolución 500/2021": "Controles mínimos de seguridad — MINTIC",
    "Resolución 2277/2025": "Requisitos de evaluación de riesgo residual",
}


class AugmentedContext:
    """Resultado del Augmenter: contexto enriquecido listo para el Generator."""

    def __init__(
        self,
        risk_context: RiskContext,
        retrieved_docs: list[dict[str, Any]],
    ) -> None:
        self.risk_context = risk_context
        self.retrieved_docs = retrieved_docs
        self.iso_references: list[str] = []
        self.legal_references: list[str] = []
        self.relevant_text_chunks: list[str] = []
        self.confidence_base: float = 0.0

        self._augment()

    def _augment(self) -> None:
        """Procesa los documentos recuperados y extrae referencias normativas."""
        if not self.retrieved_docs:
            logger.warning("Augmenter: sin documentos recuperados — confianza mínima")
            self.confidence_base = 0.4
            return

        for doc in self.retrieved_docs:
            meta = doc.get("metadata", {})
            text = doc.get("text", "")
            score = doc.get("score", 0.0)

            # Extraer referencias ISO
            norma = meta.get("norma", "")
            if norma and norma not in self.iso_references:
                self.iso_references.append(norma)

            # Extraer referencias legales colombianas
            for legal_key in COLOMBIAN_LEGAL_CONTEXT:
                if legal_key.lower() in text.lower() or legal_key in meta.get("fuente", ""):
                    ref = f"{legal_key} — {COLOMBIAN_LEGAL_CONTEXT[legal_key]}"
                    if ref not in self.legal_references:
                        self.legal_references.append(ref)

            # Agregar chunks de texto relevantes (truncados)
            if score >= 0.6 and text:
                self.relevant_text_chunks.append(text[:300])

        # Añadir dominios de controles seleccionados
        for ctrl_code in self.risk_context.controles_seleccionados:
            for prefix, domain in ISO_CONTROL_DOMAINS.items():
                if ctrl_code.startswith(prefix):
                    ref = f"{ctrl_code} — {domain}"
                    if ref not in self.iso_references:
                        self.iso_references.append(ref)

        # Calcular confianza base según documentos recuperados y scores
        if self.retrieved_docs:
            avg_score = sum(d["score"] for d in self.retrieved_docs) / len(self.retrieved_docs)
            self.confidence_base = min(0.5 + avg_score * 0.5, 1.0)

        logger.debug(
            "Augmenter: %d docs → %d refs ISO, %d legales, confianza_base=%.2f",
            len(self.retrieved_docs),
            len(self.iso_references),
            len(self.legal_references),
            self.confidence_base,
        )


class Augmenter:
    """Enriquece el contexto de riesgo con los documentos recuperados."""

    def augment(
        self,
        context: RiskContext,
        retrieved_docs: list[dict[str, Any]],
    ) -> AugmentedContext:
        """Construye el contexto augmentado."""
        return AugmentedContext(context, retrieved_docs)

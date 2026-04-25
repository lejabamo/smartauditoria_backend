"""
Retriever Híbrido — Core RAG.
Combina búsqueda semántica con prioridad normativa ISO.
"""

from __future__ import annotations

import logging
from typing import Any, Protocol

logger = logging.getLogger(__name__)

class IVectorStoreAdapter(Protocol):
    """Interfaz para desacoplamiento del Vector Store (ChromaDB)."""
    def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        ...

class HybridRetriever:
    """
    Retriever Híbrido con scoring compuesto.
    
    Peso Normativo Sugerido:
    - ISO 27001 (0.5)
    - ISO 27002 (0.3)
    - ISO 27005 (0.1)
    - Ley 1581 / Otros (0.1)
    """

    WEIGHTS = {
        "ISO27001": 0.5,
        "ISO27002": 0.3,
        "ISO27005": 0.1,
        "Ley1581": 0.1,
        "Default": 0.05
    }

    def __init__(self, vector_store: IVectorStoreAdapter):
        self.vector_store = vector_store

    def retrieve(self, query: str, quota: int = 5) -> list[dict[str, Any]]:
        """
        Búsqueda híbrida. Recupera chunks y recalcula score normativo.
        """
        # 1. Recuperación Semántica Base (limit=quota*2)
        try:
            raw_results = self.vector_store.search(query, limit=quota * 2)
        except Exception as exc:
            logger.error("Error en Vector Store: %s", exc)
            return []
        
        # 2. Re-scoring Normativo
        scored_results = []
        for res in raw_results:
            meta = res.get("metadata", {})
            norma = meta.get("norma", "Default")
            semantic_score = res.get("score", 0.0)
            
            normative_weight = self.WEIGHTS.get(norma, self.WEIGHTS["Default"])
            
            # Algoritmo de scoring híbrido (0.7 semántico + 0.3 normativo)
            hybrid_score = (semantic_score * 0.7) + (normative_weight * 0.3)
            
            # Evidence Lock: Marcamos por qué se incluyó
            res["hybrid_score"] = hybrid_score
            res["normative_priority"] = normative_weight
            scored_results.append(res)

        # 3. Ordenar por score híbrido y truncar a quota
        final_results = sorted(scored_results, key=lambda x: x["hybrid_score"], reverse=True)
        
        return final_results[:quota]

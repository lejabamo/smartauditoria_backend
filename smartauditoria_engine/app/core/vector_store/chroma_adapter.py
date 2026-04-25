"""
ChromaDB Adapter — Adapter pattern sobre el VectorStore del lab.
Encapsula ChromaDB detrás de una interfaz limpia e intercambiable.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False
    logger.warning("ChromaDB no disponible. Instala con: pip install chromadb")

try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except ImportError:
    ST_AVAILABLE = False
    logger.warning("sentence-transformers no disponible.")


class VectorStoreAdapter:
    """
    Adapter sobre ChromaDB.
    Patrón Adapter: el resto del sistema no sabe si usa ChromaDB, Pinecone u otro.
    """

    def __init__(self, collection_name: str | None = None) -> None:
        settings = get_settings()

        if not CHROMA_AVAILABLE:
            raise ImportError("ChromaDB no está instalado.")

        self.collection_name = collection_name or settings.chroma_collection_iso
        persist_dir = Path(settings.chroma_persist_dir)
        persist_dir.mkdir(parents=True, exist_ok=True)

        self._client = chromadb.PersistentClient(
            path=str(persist_dir),
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True,
            ),
        )

        try:
            self._collection = self._client.get_collection(self.collection_name)
            logger.info(
                "Colección '%s' cargada — %d documentos",
                self.collection_name,
                self._collection.count(),
            )
        except Exception:
            self._collection = self._client.create_collection(
                name=self.collection_name,
                metadata={"description": "Base de conocimiento ISO y normativa colombiana"},
            )
            logger.info("Colección '%s' creada (vacía)", self.collection_name)

        # Modelo de embeddings
        self._model: SentenceTransformer | None = None
        if ST_AVAILABLE:
            model_name = settings.embedding_model
            try:
                self._model = SentenceTransformer(model_name)
                logger.info("Modelo de embeddings cargado: %s", model_name)
            except Exception as exc:
                logger.warning("No se pudo cargar el modelo de embeddings: %s", exc)

    # ──────────────────────────────────────────────────────
    # Interfaz pública
    # ──────────────────────────────────────────────────────

    def similarity_search(
        self,
        query: str,
        top_k: int | None = None,
        metadata_filter: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Búsqueda semántica por similitud coseno.

        Returns:
            Lista de resultados ordenados por relevancia:
            [{"id", "text", "metadata", "score"}]
        """
        if not self._model:
            logger.warning("Modelo de embeddings no disponible — retornando lista vacía")
            return []

        settings = get_settings()
        k = top_k or settings.rag_top_k

        query_embedding = self._model.encode(query, convert_to_numpy=True).tolist()

        try:
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=k,
                where=metadata_filter or None,
            )
        except Exception as exc:
            logger.error("Error en búsqueda semántica: %s", exc)
            return []

        formatted: list[dict[str, Any]] = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                distance = results["distances"][0][i] if "distances" in results else 0.0
                score = max(0.0, 1.0 - distance)
                formatted.append(
                    {
                        "id": doc_id,
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "score": score,
                    }
                )

        return formatted

    def add_texts(
        self,
        texts: list[str],
        ids: list[str],
        metadatas: list[dict[str, Any]] | None = None,
    ) -> bool:
        """Indexar textos en la colección."""
        if not self._model:
            logger.warning("No se pueden indexar documentos sin modelo de embeddings")
            return False

        embeddings = self._model.encode(texts, convert_to_numpy=True).tolist()
        metas = metadatas or [{} for _ in texts]

        try:
            self._collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metas,
            )
            logger.info("%d documentos indexados en '%s'", len(ids), self.collection_name)
            return True
        except Exception as exc:
            logger.error("Error al indexar documentos: %s", exc)
            return False

    def count(self) -> int:
        """Número de documentos en la colección."""
        return self._collection.count()

    def reset(self) -> None:
        """Limpiar y recrear la colección."""
        self._client.delete_collection(self.collection_name)
        self._collection = self._client.create_collection(
            name=self.collection_name,
            metadata={"description": "Base de conocimiento ISO y normativa colombiana"},
        )
        logger.info("Colección '%s' reiniciada", self.collection_name)

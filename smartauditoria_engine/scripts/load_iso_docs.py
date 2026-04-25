"""
Script de carga de documentos ISO en ChromaDB.
Migrado y refactorizado desde sgsri/backend/procesar_documentos_vector.py
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Agregar la raíz al path para importar app/
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.core.vector_store.chroma_adapter import VectorStoreAdapter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_from_json(filepath: Path, adapter: VectorStoreAdapter) -> int:
    """Carga documentos desde un archivo JSON."""
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)

    docs = data if isinstance(data, list) else data.get("documentos", [])
    ids, texts, metas = [], [], []

    for i, doc in enumerate(docs):
        doc_id = doc.get("id", f"{filepath.stem}_{i}")
        text = doc.get("text", doc.get("contenido", ""))
        metadata = {k: v for k, v in doc.items() if k not in ("text", "contenido")}
        if text:
            ids.append(str(doc_id))
            texts.append(text)
            metas.append(metadata)

    if ids:
        adapter.add_texts(texts, ids, metas)
        logger.info("Cargados %d documentos desde %s", len(ids), filepath.name)

    return len(ids)


def load_from_directory(directory: Path, adapter: VectorStoreAdapter) -> int:
    """Carga todos los JSONs de un directorio."""
    total = 0
    for json_file in sorted(directory.glob("*.json")):
        total += load_from_json(json_file, adapter)
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description="Cargar documentos ISO en ChromaDB")
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("./data/knowledge"),
        help="Archivo JSON o directorio con JSONs de documentos",
    )
    parser.add_argument(
        "--collection",
        default=None,
        help="Nombre de la colección ChromaDB (default: del .env)",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Limpiar la colección antes de cargar",
    )
    args = parser.parse_args()

    settings = get_settings()
    collection = args.collection or settings.chroma_collection_iso

    logger.info("Iniciando carga — colección: %s", collection)
    adapter = VectorStoreAdapter(collection_name=collection)

    if args.reset:
        logger.warning("Reiniciando colección '%s'...", collection)
        adapter.reset()

    source = args.source
    if source.is_file():
        count = load_from_json(source, adapter)
    elif source.is_dir():
        count = load_from_directory(source, adapter)
    else:
        logger.error("Fuente no encontrada: %s", source)
        sys.exit(1)

    logger.info("✅ Carga completada — %d documentos procesados", count)
    logger.info("Total en colección: %d", adapter.count())


if __name__ == "__main__":
    main()

"""
Servicio de Base de Datos Vectorial para RAG
Utiliza ChromaDB para almacenar embeddings de documentos ISO y normativa colombiana
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import json

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("ChromaDB no está instalado. Instala con: pip install chromadb")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers no está instalado. Instala con: pip install sentence-transformers")

class VectorStore:
    """Gestor de Base de Datos Vectorial usando ChromaDB"""
    
    def __init__(self, persist_directory: str = "backend/vector_store", collection_name: str = "iso_documents"):
        """
        Inicializar Vector Store
        
        Args:
            persist_directory: Directorio donde se persisten los datos de ChromaDB
            collection_name: Nombre de la colección en ChromaDB
        """
        if not CHROMADB_AVAILABLE:
            raise ImportError("ChromaDB no está disponible. Instala con: pip install chromadb")
        
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        
        self.collection_name = collection_name
        
        # Inicializar ChromaDB con configuración optimizada
        self.client = chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
                # Nota: chroma_api_impl="rest" no es válido para PersistentClient
                # PersistentClient usa automáticamente la implementación local
            )
        )
        
        # Obtener o crear colección
        try:
            self.collection = self.client.get_collection(name=collection_name)
            logger.info(f"Colección '{collection_name}' cargada. Documentos: {self.collection.count()}")
        except Exception:
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"description": "Base de conocimiento ISO y normativa colombiana"}
            )
            logger.info(f"Colección '{collection_name}' creada")
        
        # Inicializar modelo de embeddings
        self.embedding_model = None
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                # Usar modelo optimizado: ligero, rápido y multilingüe
                # Alternativas más rápidas si necesitas:
                # - 'all-MiniLM-L6-v2' (más rápido, inglés)
                # - 'paraphrase-multilingual-MiniLM-L12-v2' (multilingüe, balanceado)
                model_name = os.getenv('EMBEDDING_MODEL', 'paraphrase-multilingual-MiniLM-L12-v2')
                self.embedding_model = SentenceTransformer(model_name)
                logger.info(f"Modelo de embeddings cargado: {model_name}")
            except Exception as e:
                logger.warning(f"No se pudo cargar el modelo de embeddings: {e}")
                self.embedding_model = None
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generar embedding para un texto
        
        Args:
            text: Texto a convertir en embedding
            
        Returns:
            Lista de números flotantes (vector embedding)
        """
        if not self.embedding_model:
            raise RuntimeError("Modelo de embeddings no está disponible")
        
        embedding = self.embedding_model.encode(text, convert_to_numpy=True).tolist()
        return embedding
    
    def add_document(self, document_id: str, text: str, metadata: Dict[str, Any] = None):
        """
        Agregar un documento a la base vectorial
        
        Args:
            document_id: ID único del documento
            text: Texto del documento
            metadata: Metadatos adicionales (norma, sección, tipo, etc.)
        """
        if not self.embedding_model:
            logger.warning("No se puede agregar documento: modelo de embeddings no disponible")
            return False
        
        try:
            # Generar embedding
            embedding = self.generate_embedding(text)
            
            # Preparar metadatos
            if metadata is None:
                metadata = {}
            
            metadata["text_length"] = len(text)
            metadata["document_id"] = document_id
            
            # Agregar a ChromaDB
            self.collection.add(
                ids=[document_id],
                embeddings=[embedding],
                documents=[text],
                metadatas=[metadata]
            )
            
            logger.info(f"Documento '{document_id}' agregado a la base vectorial")
            return True
            
        except Exception as e:
            logger.error(f"Error al agregar documento '{document_id}': {e}")
            return False
    
    def add_documents_batch(self, documents: List[Dict[str, Any]]):
        """
        Agregar múltiples documentos en lote
        
        Args:
            documents: Lista de diccionarios con 'id', 'text', 'metadata'
        """
        if not self.embedding_model:
            logger.warning("No se pueden agregar documentos: modelo de embeddings no disponible")
            return False
        
        try:
            ids = []
            texts = []
            embeddings = []
            metadatas = []
            
            for doc in documents:
                doc_id = doc.get('id')
                text = doc.get('text', '')
                metadata = doc.get('metadata', {})
                
                if not doc_id or not text:
                    continue
                
                embedding = self.generate_embedding(text)
                
                ids.append(doc_id)
                texts.append(text)
                embeddings.append(embedding)
                metadata["text_length"] = len(text)
                metadata["document_id"] = doc_id
                metadatas.append(metadata)
            
            if ids:
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=metadatas
                )
                logger.info(f"{len(ids)} documentos agregados a la base vectorial")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error al agregar documentos en lote: {e}")
            return False
    
    def search(self, query: str, top_k: int = 5, filter_metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Buscar documentos similares usando búsqueda semántica
        
        Args:
            query: Texto de búsqueda
            top_k: Número de resultados a retornar
            filter_metadata: Filtros de metadatos (ej: {"norma": "ISO 27005"})
            
        Returns:
            Lista de documentos relevantes con scores
        """
        if not self.embedding_model:
            logger.warning("No se puede buscar: modelo de embeddings no disponible")
            return []
        
        try:
            # Generar embedding de la query
            query_embedding = self.generate_embedding(query)
            
            # Construir filtro de metadatos
            where = None
            if filter_metadata:
                where = filter_metadata
            
            # Buscar en ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where
            )
            
            # Formatear resultados
            formatted_results = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    formatted_results.append({
                        'id': results['ids'][0][i],
                        'text': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i],
                        'distance': results['distances'][0][i] if 'distances' in results else None,
                        'score': 1 - results['distances'][0][i] if 'distances' in results and results['distances'][0][i] else 1.0
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error en búsqueda semántica: {e}")
            return []
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Obtener información de la colección"""
        try:
            count = self.collection.count()
            return {
                "collection_name": self.collection_name,
                "document_count": count,
                "persist_directory": str(self.persist_directory),
                "embedding_model_available": self.embedding_model is not None
            }
        except Exception as e:
            logger.error(f"Error al obtener información: {e}")
            return {}
    
    def delete_document(self, document_id: str):
        """Eliminar un documento de la base vectorial"""
        try:
            self.collection.delete(ids=[document_id])
            logger.info(f"Documento '{document_id}' eliminado")
            return True
        except Exception as e:
            logger.error(f"Error al eliminar documento: {e}")
            return False
    
    def clear_collection(self):
        """Limpiar toda la colección"""
        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Base de conocimiento ISO y normativa colombiana"}
            )
            logger.info(f"Colección '{self.collection_name}' limpiada")
            return True
        except Exception as e:
            logger.error(f"Error al limpiar colección: {e}")
            return False


"""
Procesador de documentos PDF para generar embeddings y almacenarlos en Vector DB
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
    import PyPDF2
    PDF_AVAILABLE = True
    PDF_LIBRARY = "PyPDF2"
except ImportError:
    try:
        import pdfplumber
        PDF_AVAILABLE = True
        PDF_LIBRARY = "pdfplumber"
    except ImportError:
        PDF_AVAILABLE = False
        PDF_LIBRARY = None
        logger.warning("No hay biblioteca PDF disponible. Instala PyPDF2 o pdfplumber")

from .vector_store import VectorStore

class DocumentProcessor:
    """Procesador de documentos para extraer texto y generar embeddings"""
    
    def __init__(self, docs_path: str = "Docs", vector_store: VectorStore = None, recursive: bool = True):
        """
        Inicializar procesador de documentos
        
        Args:
            docs_path: Ruta a la carpeta con documentos PDF
            vector_store: Instancia de VectorStore (se crea una nueva si no se proporciona)
            recursive: Buscar PDFs en subcarpetas recursivamente
        """
        self.docs_path = Path(docs_path)
        self.recursive = recursive
        
        if vector_store is None:
            self.vector_store = VectorStore()
        else:
            self.vector_store = vector_store
        
        # Mapeo de documentos ISO y normativa (por nombre de archivo o patrón)
        self.document_mapping = {
            # ISO 27002
            "NTC 27002.pdf": {"norma": "ISO 27002", "tipo": "control", "año": "2022", "pais": "Colombia"},
            "ISO_27002_2022_Espa_.pdf": {"norma": "ISO 27002", "tipo": "control", "año": "2022", "pais": "España"},
            "ISO_27002": {"norma": "ISO 27002", "tipo": "control", "año": "2022", "pais": "Internacional"},
            
            # ISO 27005
            "NTC-ISO-IEC-27005 (1).pdf": {"norma": "ISO 27005", "tipo": "riesgo", "año": "2022", "pais": "Colombia"},
            "ISO_27005_2022_Espa_.pdf": {"norma": "ISO 27005", "tipo": "riesgo", "año": "2022", "pais": "España"},
            "ISO_27005": {"norma": "ISO 27005", "tipo": "riesgo", "año": "2022", "pais": "Internacional"},
            
            # ISO 27001
            "Norma Pegagogica-ISO-IEC 27001-2022 (1).pdf": {"norma": "ISO 27001", "tipo": "sistema", "año": "2022", "pais": "Colombia"},
            "ISO_27001_2022_Espa_.pdf": {"norma": "ISO 27001", "tipo": "sistema", "año": "2022", "pais": "España"},
            "ISO_27001": {"norma": "ISO 27001", "tipo": "sistema", "año": "2022", "pais": "Internacional"},
            
            # ISO 27032
            "ISO_27032_2023_Espa_.pdf": {"norma": "ISO 27032", "tipo": "ciberseguridad", "año": "2023", "pais": "España"},
            
            # ISO 22301
            "ISO_22301_2019_Espa_.pdf": {"norma": "ISO 22301", "tipo": "continuidad", "año": "2019", "pais": "España"},
            
            # ISO 20000
            "ISO_20000-1_2012_Espa_.pdf": {"norma": "ISO 20000", "tipo": "servicios", "año": "2012", "pais": "España"},
            
            # Normativa Colombia
            "Resolucion_2277_2025.pdf": {"norma": "Resolución 2277", "tipo": "normativa", "año": "2025", "pais": "Colombia"},
            "Resolucion_500_2021.pdf": {"norma": "Resolución 500", "tipo": "normativa", "año": "2021", "pais": "Colombia"},
            "CONPES_3995_2020.pdf": {"norma": "CONPES 3995", "tipo": "normativa", "año": "2020", "pais": "Colombia"},
        }
    
    def _get_document_metadata(self, pdf_path: Path) -> Dict[str, Any]:
        """
        Obtener metadatos de un documento basado en su nombre
        
        Args:
            pdf_path: Ruta al archivo PDF
            
        Returns:
            Diccionario con metadatos
        """
        filename = pdf_path.name
        
        # Buscar coincidencia exacta
        if filename in self.document_mapping:
            return self.document_mapping[filename].copy()
        
        # Buscar por patrón (contiene)
        for pattern, metadata in self.document_mapping.items():
            if pattern in filename:
                return metadata.copy()
        
        # Metadatos por defecto
        return {
            "norma": "Desconocida",
            "tipo": "documento",
            "año": "Desconocido",
            "pais": "Colombia",
            "source_folder": pdf_path.parent.name
        }
    
    def extract_text_from_pdf(self, pdf_path: Path) -> str:
        """
        Extraer texto de un archivo PDF
        
        Args:
            pdf_path: Ruta al archivo PDF
            
        Returns:
            Texto extraído del PDF
        """
        if not PDF_AVAILABLE:
            raise ImportError("No hay biblioteca PDF disponible")
        
        text = ""
        
        try:
            if PDF_LIBRARY == "pdfplumber":
                import pdfplumber
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            else:
                # Usar PyPDF2
                import PyPDF2
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            
            logger.info(f"Texto extraído de {pdf_path.name}: {len(text)} caracteres")
            return text
            
        except Exception as e:
            logger.error(f"Error al extraer texto de {pdf_path}: {e}")
            return ""
    
    def split_text_into_chunks(self, text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
        """
        Dividir texto en chunks para procesamiento
        
        Args:
            text: Texto completo
            chunk_size: Tamaño de cada chunk en caracteres
            overlap: Solapamiento entre chunks
            
        Returns:
            Lista de chunks de texto
        """
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Intentar cortar en un punto lógico (punto, salto de línea)
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                cut_point = max(last_period, last_newline)
                
                if cut_point > chunk_size * 0.5:  # Si el punto de corte es razonable
                    chunk = chunk[:cut_point + 1]
                    end = start + cut_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap  # Solapamiento
        
        return chunks
    
    def process_pdf_document(self, pdf_path: Path, metadata: Dict[str, Any] = None) -> bool:
        """
        Procesar un documento PDF completo
        
        Args:
            pdf_path: Ruta al archivo PDF
            metadata: Metadatos adicionales
            
        Returns:
            True si se procesó correctamente
        """
        if not pdf_path.exists():
            logger.error(f"Archivo no encontrado: {pdf_path}")
            return False
        
        try:
            # Extraer texto
            text = self.extract_text_from_pdf(pdf_path)
            
            if not text:
                logger.warning(f"No se pudo extraer texto de {pdf_path.name}")
                return False
            
            # Dividir en chunks
            chunks = self.split_text_into_chunks(text)
            
            logger.info(f"Documento dividido en {len(chunks)} chunks")
            
            # Preparar metadatos base
            base_metadata = metadata or {}
            base_metadata["source_file"] = pdf_path.name
            base_metadata["total_chunks"] = len(chunks)
            
            # Agregar cada chunk a la base vectorial
            documents = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = base_metadata.copy()
                chunk_metadata["chunk_index"] = i
                chunk_metadata["chunk_id"] = f"{pdf_path.stem}_chunk_{i}"
                
                documents.append({
                    "id": f"{pdf_path.stem}_chunk_{i}",
                    "text": chunk,
                    "metadata": chunk_metadata
                })
            
            # Agregar en lote
            success = self.vector_store.add_documents_batch(documents)
            
            if success:
                logger.info(f"✅ Documento '{pdf_path.name}' procesado y agregado a Vector DB")
                logger.info(f"   - Chunks: {len(chunks)}")
                logger.info(f"   - Total caracteres: {len(text)}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error al procesar documento {pdf_path}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def process_all_documents(self) -> Dict[str, Any]:
        """
        Procesar todos los documentos PDF en la carpeta Docs (recursivamente)
        
        Returns:
            Diccionario con estadísticas del procesamiento
        """
        if not self.docs_path.exists():
            logger.error(f"Directorio de documentos no encontrado: {self.docs_path}")
            return {"success": False, "error": "Directorio no encontrado"}
        
        stats = {
            "success": True,
            "processed": 0,
            "failed": 0,
            "total_chunks": 0,
            "documents": []
        }
        
        # Buscar todos los PDFs (recursivamente si está habilitado)
        if self.recursive:
            pdf_files = list(self.docs_path.rglob("*.pdf"))
        else:
            pdf_files = list(self.docs_path.glob("*.pdf"))
        
        if not pdf_files:
            logger.warning(f"No se encontraron archivos PDF en {self.docs_path}")
            return stats
        
        logger.info(f"Encontrados {len(pdf_files)} archivos PDF")
        
        for pdf_file in pdf_files:
            # Obtener metadatos del mapeo
            metadata = self._get_document_metadata(pdf_file)
            metadata["file_path"] = str(pdf_file.relative_to(self.docs_path))
            
            logger.info(f"Procesando: {pdf_file.relative_to(self.docs_path)}")
            
            if self.process_pdf_document(pdf_file, metadata):
                stats["processed"] += 1
                stats["documents"].append({
                    "file": str(pdf_file.relative_to(self.docs_path)),
                    "norma": metadata.get("norma", "Desconocida"),
                    "status": "success"
                })
            else:
                stats["failed"] += 1
                stats["documents"].append({
                    "file": str(pdf_file.relative_to(self.docs_path)),
                    "status": "failed"
                })
        
        # Obtener total de chunks al final
        collection_info = self.vector_store.get_collection_info()
        stats["total_chunks"] = collection_info.get("document_count", 0)
        
        logger.info(f"✅ Procesamiento completado: {stats['processed']} exitosos, {stats['failed']} fallidos")
        
        return stats
    
    def search_documents(self, query: str, top_k: int = 5, filter_norma: str = None) -> List[Dict[str, Any]]:
        """
        Buscar documentos relevantes usando búsqueda semántica
        
        Args:
            query: Texto de búsqueda
            top_k: Número de resultados
            filter_norma: Filtrar por norma específica (ej: "ISO 27005")
            
        Returns:
            Lista de documentos relevantes
        """
        filter_metadata = None
        if filter_norma:
            filter_metadata = {"norma": filter_norma}
        
        return self.vector_store.search(query, top_k=top_k, filter_metadata=filter_metadata)

def main():
    """Función principal para procesar documentos"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Procesar documentos PDF y crear embeddings")
    parser.add_argument("--docs-path", default="Docs", help="Ruta a la carpeta con documentos PDF")
    parser.add_argument("--clear", action="store_true", help="Limpiar base vectorial antes de procesar")
    
    args = parser.parse_args()
    
    # Crear procesador
    processor = DocumentProcessor(docs_path=args.docs_path)
    
    # Limpiar si se solicita
    if args.clear:
        logger.info("Limpiando base vectorial...")
        processor.vector_store.clear_collection()
    
    # Procesar todos los documentos
    stats = processor.process_all_documents()
    
    # Mostrar estadísticas
    print("\n" + "="*50)
    print("RESUMEN DEL PROCESAMIENTO")
    print("="*50)
    print(f"Documentos procesados: {stats['processed']}")
    print(f"Documentos fallidos: {stats['failed']}")
    print(f"Total de chunks en Vector DB: {stats['total_chunks']}")
    print("\nDocumentos:")
    for doc in stats['documents']:
        status_icon = "✅" if doc['status'] == 'success' else "❌"
        print(f"  {status_icon} {doc['file']}")
    
    # Mostrar información de la colección
    collection_info = processor.vector_store.get_collection_info()
    print(f"\nInformación de Vector DB:")
    print(f"  - Colección: {collection_info.get('collection_name')}")
    print(f"  - Documentos: {collection_info.get('document_count')}")
    print(f"  - Ubicación: {collection_info.get('persist_directory')}")
    print(f"  - Modelo disponible: {collection_info.get('embedding_model_available')}")

if __name__ == "__main__":
    main()


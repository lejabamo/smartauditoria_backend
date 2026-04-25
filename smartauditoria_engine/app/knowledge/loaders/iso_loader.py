import os
from typing import List
from langchain_core.documents import Document

class ISOAgnosticLoader:
    """
    Cargador de documentos compatible con múltiples normas bajo el concepto de "Data Lineage".
    Genera metadatos estrictos para aislamiento de consultas.
    """
    def __init__(self, norm_tag: str, context_tag: str, source_name: str):
        self.norm_tag = norm_tag
        self.context_tag = context_tag
        self.source_name = source_name

    def process_text_to_chunks(self, text: str, chunk_size=500, chunk_overlap=50) -> List[Document]:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ".", " "]
        )
        
        # Envolviendo texto básico para simulación
        docs = [Document(page_content=text)]
        chunks = splitter.split_documents(docs)
        
        # Inyección Trazabilidad (Data Lineage)
        for chunk in chunks:
            chunk.metadata = {
                "norm": self.norm_tag,
                "context": self.context_tag,
                "source": self.source_name
            }
            
        return chunks

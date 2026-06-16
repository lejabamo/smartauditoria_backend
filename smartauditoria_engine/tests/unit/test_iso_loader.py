import pytest
from app.knowledge.loaders.iso_loader import ISOAgnosticLoader

def test_iso_loader_metadata_injection():
    """
    TDD Test: Verifica que el particionado del texto incluya los metadatos de Trazabilidad 
    (Data Lineage Tracking) necesarios para evitar 'Data Leakage' y atrofia.
    """
    # 1. Arrange (Preparar datos)
    test_text = "La organización debe establecer controles criptográficos para proteger los datos en reposo y en tránsito."
    loader = ISOAgnosticLoader(norm_tag="ISO27002", context_tag="Controles", source_name="iso27002.pdf")
    
    # 2. Act (Ejecutar)
    chunks = loader.process_text_to_chunks(test_text, chunk_size=50)
    
    # 3. Assert (Validar)
    assert len(chunks) > 0, "Debe generar al menos un chunk."
    first_chunk = chunks[0]
    
    # Debe contener la estructura LangChain
    assert hasattr(first_chunk, "page_content")
    assert hasattr(first_chunk, "metadata")
    
    # Validación de Data Lineage estricto
    assert first_chunk.metadata["norm"] == "ISO27002"
    assert first_chunk.metadata["context"] == "Controles"
    assert first_chunk.metadata["source"] == "iso27002.pdf"
    
def test_iso_loader_semantic_chunking():
    """Valida la integridad semántica del Chunking"""
    test_text = "Fase 1. \n\n Fase 2. \n\n Fase 3."
    loader = ISOAgnosticLoader("Test", "Test", "Test")
    chunks = loader.process_text_to_chunks(test_text, chunk_size=10, chunk_overlap=0)
    
    # RecursiveCharacterTextSplitter debería dividir en los dobles saltos de línea
    assert len(chunks) == 3

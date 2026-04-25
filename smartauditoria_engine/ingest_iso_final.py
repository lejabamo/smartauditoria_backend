import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_chroma import Chroma

# Rutas ASCII puras
PDF_PATH = r"C:\Users\Administrador1\Desktop\Riesgos\sgsri\Docs\presentacinsemana1ynormativasiso\ISO_27001_2022_Espa_.pdf.pdf"
CHROMA_PATH = "./chroma_db"

print("--- INICIANDO INGESTA ISO 27001 ---")

if not os.path.exists(PDF_PATH):
    print("FATAL: Archivo no encontrado")
else:
    loader = PyPDFLoader(PDF_PATH)
    docs = loader.load()
    
    # Chunking agresivo (Brechas Cero)
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)
    
    embeddings = SentenceTransformerEmbeddings(model_name='all-MiniLM-L6-v2')
    
    # Crear DB
    db = Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_PATH)
    
    print(f"--- EXITO TOTAL ---")
    print(f"Total Chunks: {len(chunks)}")
    print(f"Estado: CEREBRO CARGADO")

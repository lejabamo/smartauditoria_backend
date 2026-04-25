import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma

# Configuración
PDF_PATH = r"C:\Users\Administrador1\Desktop\Riesgos\sgsri\Docs\presentacinsemana1ynormativasiso\ISO_27001_2022_Espa_.pdf.pdf"
CHROMA_PATH = "./chroma_db"

print(f"--- Iniciando Ingesta de {PDF_PATH} ---")

if not os.path.exists(PDF_PATH):
    print("ERROR: Archivo no encontrado")
else:
    loader = PyPDFLoader(PDF_PATH)
    documents = loader.load()
    
    setter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = setter.split_documents(documents)
    
    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    
    db = Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_PATH)
    print(f"--- Éxito: {len(chunks)} fragmentos ISO 27001 vectorizados ---")

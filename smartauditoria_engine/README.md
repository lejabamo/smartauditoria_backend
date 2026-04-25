# 🧠 SmartAuditorIA Engine

Motor de Inteligencia Artificial para **SmartAuditorIA** — Sistema de Gestión de Riesgos de Información.

[![CI](https://github.com/lejabamo/smartauditoria_engine/actions/workflows/ci.yml/badge.svg)](https://github.com/lejabamo/smartauditoria_engine/actions)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)](https://fastapi.tiangolo.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-0.4-purple)](https://www.trychroma.com)
[![ISO 27001](https://img.shields.io/badge/ISO-27001%2F27002%2F27005-red)](https://www.iso.org)

---

## ¿Qué hace?

El Engine implementa el pipeline **RAG (Retrieval-Augmented Generation)**:

```
RiskContext (payload del backend)
    │
    ▼ [1] RETRIEVER
    │  Búsqueda semántica en ChromaDB
    │  (documentos ISO 27001/27002/27005 + Marco Legal CO)
    │
    ▼ [2] AUGMENTER
    │  Extrae referencias ISO y normativa colombiana
    │  Calcula confianza base
    │
    ▼ [3] GENERATOR
    │  Genera sugerencias (amenazas / vulnerabilidades / controles)
    │  Construye justificaciones normativas estructuradas
    │
    ▼
SuggestionResponse | JustificationResponse (→ backend)
```

**Patrón arquitectónico**: Chain of Responsibility (pipeline) + Adapter (ChromaDB) + Builder (justificaciones) + Facade (RAGPipeline)

---

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Estado del servicio y counts de la BD vectorial |
| `POST` | `/api/v1/suggestions/threats` | Sugerencias de amenazas para un activo |
| `POST` | `/api/v1/suggestions/vulnerabilities` | Sugerencias de vulnerabilidades para una amenaza |
| `POST` | `/api/v1/suggestions/controls` | Sugerencias de controles ISO 27002 |
| `POST` | `/api/v1/justifications/residual` | Justificación normativa de riesgo residual |

📖 **Documentación interactiva**: `http://localhost:8001/docs` (Swagger UI)

---

## Inicio Rápido

### Requisitos
- Python 3.11+
- Docker & Docker Compose (recomendado para ChromaDB)

### Con Docker Compose (recomendado)

```bash
# 1. Clonar y configurar
git clone https://github.com/lejabamo/smartauditoria_engine.git
cd smartauditoria_engine
cp .env.example .env

# 2. Levantar todo (Engine + ChromaDB)
docker-compose up -d

# 3. Verificar
curl http://localhost:8001/health
```

### Sin Docker (desarrollo local)

```bash
# 1. Entorno virtual
python -m venv .venv
.venv\Scripts\activate    # Windows
source .venv/bin/activate # Linux/Mac

# 2. Instalar dependencias
pip install -e ".[dev]"

# 3. Configurar
cp .env.example .env
# Editar .env con tus valores

# 4. Iniciar (ChromaDB en modo local/embedded)
python run.py
```

### Cargar documentos ISO

```bash
# Cargar desde directorio de JSONs
python scripts/load_iso_docs.py --source ./data/knowledge/

# Cargar desde archivo específico
python scripts/load_iso_docs.py --source ./data/knowledge/iso27005.json

# Limpiar y recargar
python scripts/load_iso_docs.py --source ./data/knowledge/ --reset
```

---

## Estructura del Proyecto

```
smartauditoria_engine/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── suggestions.py      # Endpoints de sugerencias
│   │       └── justifications.py  # Endpoint de justificaciones
│   ├── core/
│   │   ├── pipeline/
│   │   │   ├── retriever.py       # Paso 1: Búsqueda semántica
│   │   │   ├── augmenter.py       # Paso 2: Enriquecimiento de contexto
│   │   │   ├── generator.py       # Paso 3: Generación de respuestas
│   │   │   └── rag_pipeline.py    # Facade del pipeline
│   │   └── vector_store/
│   │       └── chroma_adapter.py  # Adapter sobre ChromaDB
│   ├── domain/
│   │   ├── risk_context.py        # DTO entrada (del backend)
│   │   └── suggestion.py          # DTOs salida (al backend)
│   ├── config.py                  # Pydantic Settings
│   └── main.py                    # FastAPI app factory
├── scripts/
│   └── load_iso_docs.py           # Carga de documentos ISO
├── tests/
│   ├── unit/test_pipeline.py      # Tests con mocks
│   └── integration/test_api.py   # Tests con TestClient
├── docker-compose.yml
├── Dockerfile
└── pyproject.toml
```

---

## Tests

```bash
# Unit tests (sin ChromaDB)
pytest tests/unit/ -v

# Tests de integración
pytest tests/integration/ -v

# Con cobertura
pytest --cov=app --cov-report=term-missing
```

---

## Repositorios del Ecosistema

| Repositorio | Descripción |
|-------------|-------------|
| [`smartauditoria_frontend`](https://github.com/lejabamo/smartauditoria_frontend) | React 18 + TypeScript + MUI |
| [`smartauditoria_backend`](https://github.com/lejabamo/smartauditoria_backend) | Flask + SQLAlchemy + MySQL + Clean Architecture |
| **`smartauditoria_engine`** | **Este repo** — Motor RAG FastAPI |

---

## Autor

**Ing. Leonardo Javier Bastidas Moreno**  
Maestría en Computación para el Desarrollo de Aplicaciones Inteligentes  
Universidad del Valle — Escuela de Ingeniería de Sistemas y Computación

# SmartAuditoria Backend

API REST en Flask para el Sistema de Gestión de Riesgos de Información (SGRI).

## Requisitos
- Python 3.10+
- MySQL 8.0+

## Instalación

```bash
# 1. Crear entorno virtual
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate     # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
copy .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar (desarrollo)
python run.py
```

## Estructura

```
sgsri_backend/
├── app/
│   ├── __init__.py         # Inicialización Flask
│   ├── models.py           # Modelos de BD (SQLAlchemy)
│   ├── config.py           # Configuración
│   ├── auth/               # Autenticación JWT y decoradores
│   ├── routes/             # Endpoints de la API
│   ├── services/           # Lógica de negocio
│   └── utils/              # Utilidades comunes
├── scripts/                # Scripts de setup inicial
├── run.py                  # Punto de entrada
└── requirements.txt
```

## Endpoints principales

- `POST /api/auth/login` — Autenticación
- `GET  /api/activos/` — Activos de información
- `GET  /api/riesgos/` — Catálogo de riesgos
- `GET  /api/usuarios/` — Usuarios del sistema
- `GET  /api/dashboard/` — Métricas del dashboard
- `GET  /api/evaluaciones/` — Evaluaciones de riesgo

Ver `API_DOCUMENTATION.md` para detalles completos.

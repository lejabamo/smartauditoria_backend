# Sistema Predictivo de Riesgos ISO

## 📋 Descripción

Sistema predictivo basado en las normas ISO 27001, ISO 27002 e ISO 27005 para sugerir amenazas, vulnerabilidades y controles de seguridad de la información.

## 🏗️ Arquitectura

### Componentes Principales

1. **PDF Processor** (`pdf_processor.py`)
   - Procesa documentos PDF de normas ISO
   - Extrae controles, amenazas y vulnerabilidades
   - Crea base de conocimiento estructurada

2. **Suggestion Service** (`suggestion_service.py`)
   - Genera sugerencias predictivas
   - Calcula niveles de confianza
   - Establece relaciones entre controles, amenazas y vulnerabilidades

3. **API Routes** (`../routes/predictive.py`)
   - Endpoints REST para el sistema predictivo
   - Integración con autenticación JWT
   - Manejo de errores y logging

## 🚀 Funcionalidades

### Sugerencias Predictivas

- **Amenazas**: Sugiere amenazas basadas en el tipo de activo
- **Vulnerabilidades**: Sugiere vulnerabilidades relacionadas con amenazas
- **Controles**: Sugiere controles de mitigación basados en ISO 27002

### Tipos de Activos Soportados

- Servidor
- Base de Datos
- Aplicación
- Red
- Dispositivo Móvil
- Infraestructura
- Datos
- Usuario

### Niveles de Confianza

- **Alto (≥80%)**: Verde
- **Medio (60-79%)**: Amarillo
- **Bajo (<60%)**: Rojo

## 📁 Estructura de Archivos

```
backend/app/services/predictive/
├── pdf_processor.py          # Procesador de documentos ISO
├── suggestion_service.py     # Servicio de sugerencias
└── README.md                # Este archivo

backend/app/routes/
└── predictive.py            # Rutas de la API

frontend/src/components/predictive/
└── PredictiveSuggestionPanel.tsx  # Componente React
```

## 🔧 Configuración

### 1. Procesar Documentos ISO

```python
from app.services.predictive.pdf_processor import ISOPDFProcessor

processor = ISOPDFProcessor()
processed_data = processor.process_all_documents()
processor.save_processed_data()
```

### 2. Generar Sugerencias

```python
from app.services.predictive.suggestion_service import PredictiveSuggestionService

service = PredictiveSuggestionService()
suggestions = service.get_risk_assessment_suggestions(
    asset_type="servidor",
    context="Servidor crítico de producción"
)
```

### 3. Usar en Frontend

```tsx
import PredictiveSuggestionPanel from '../../components/predictive/PredictiveSuggestionPanel';

<PredictiveSuggestionPanel
  assetType="servidor"
  context="Servidor crítico"
  onSuggestionSelect={(suggestion) => {
    console.log('Sugerencia seleccionada:', suggestion);
  }}
/>
```

## 🌐 API Endpoints

### Sugerencias

- `POST /api/predictive/suggestions/threats` - Sugerir amenazas
- `POST /api/predictive/suggestions/vulnerabilities` - Sugerir vulnerabilidades
- `POST /api/predictive/suggestions/controls` - Sugerir controles
- `POST /api/predictive/suggestions/complete` - Sugerencias completas

### Base de Conocimiento

- `GET /api/predictive/knowledge-base/status` - Estado de la base de conocimiento
- `POST /api/predictive/knowledge-base/refresh` - Actualizar base de conocimiento

### Utilidades

- `GET /api/predictive/asset-types` - Tipos de activos disponibles
- `POST /api/predictive/risk-level/calculate` - Calcular nivel de riesgo

## 📊 Ejemplo de Uso

### Request

```json
POST /api/predictive/suggestions/complete
{
  "asset_type": "servidor",
  "context": "Servidor crítico de producción"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "amenazas": [
      {
        "id": "T.1",
        "nombre": "Malware",
        "descripcion": "Software malicioso que puede dañar sistemas y datos",
        "categoria": "Tecnológica",
        "confianza": 0.85,
        "controles_sugeridos": ["A.8.1", "A.8.2"],
        "vulnerabilidades_relacionadas": ["V.1", "V.2"]
      }
    ],
    "vulnerabilidades": [...],
    "controles": [...],
    "metadata": {
      "asset_type": "servidor",
      "context": "Servidor crítico de producción",
      "total_suggestions": 15
    }
  }
}
```

## 🧪 Pruebas

### Ejecutar Pruebas del Sistema

```bash
cd backend
python test_predictive_system.py
```

### Pruebas Manuales

1. **Procesar Documentos ISO**:
   ```python
   from app.services.predictive.pdf_processor import ISOPDFProcessor
   processor = ISOPDFProcessor()
   processor.process_all_documents()
   ```

2. **Probar Sugerencias**:
   ```python
   from app.services.predictive.suggestion_service import PredictiveSuggestionService
   service = PredictiveSuggestionService()
   service.get_risk_assessment_suggestions("servidor", "Servidor crítico")
   ```

## 🔄 Actualización de Normas

Cuando se actualicen las normas ISO:

1. Reemplazar los PDFs en la carpeta `Docs/`
2. Ejecutar el procesador de PDFs
3. Actualizar la base de conocimiento
4. Probar el sistema

```bash
# Actualizar base de conocimiento
curl -X POST http://localhost:5000/api/predictive/knowledge-base/refresh \
  -H "Authorization: Bearer <token>"
```

## 📈 Métricas de Calidad

- **Precisión de Sugerencias**: ≥85%
- **Tiempo de Respuesta**: <2 segundos
- **Cobertura de Normas**: ISO 27001, 27002, 27005
- **Tipos de Activos**: 8 categorías

## 🛠️ Mantenimiento

### Logs

Los logs se almacenan en:
- `backend/logs/predictive_system.log`
- Nivel de logging: INFO

### Monitoreo

- Verificar estado de la base de conocimiento
- Monitorear tiempos de respuesta
- Revisar precisión de sugerencias

## 🚨 Troubleshooting

### Problemas Comunes

1. **Base de conocimiento no encontrada**:
   - Ejecutar `python test_predictive_system.py`
   - Verificar que los PDFs estén en `Docs/`

2. **Sugerencias no aparecen**:
   - Verificar que el activo esté seleccionado
   - Revisar logs del backend

3. **Errores de API**:
   - Verificar autenticación JWT
   - Revisar formato de requests

### Contacto

Para soporte técnico, contactar al equipo de desarrollo.

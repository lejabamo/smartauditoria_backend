# API Documentation - Risk Matrix 4x5

## Endpoint: GET /api/matriz-riesgo

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `periodo` | string | No | Período de análisis (ej: "2025-Q3", "2025-01") |
| `activo` | string | No | Filtro por activo específico |
| `propietario` | string | No | Filtro por propietario del riesgo |
| `proceso` | string | No | Filtro por proceso |
| `fechaInicio` | string | No | Fecha de inicio del rango (YYYY-MM-DD) |
| `fechaFin` | string | No | Fecha de fin del rango (YYYY-MM-DD) |

### Example Request

```http
GET /api/matriz-riesgo?periodo=2025-Q3&activo=Servidor%20Web&propietario=Juan%20Pérez
```

### Response Format

```json
{
  "cells": [
    {
      "probabilidad_key": "Frecuente",
      "impacto_key": "Insignificante",
      "count": 3,
      "risks": [
        {
          "id": 1,
          "nombre": "Falla de sistema menor",
          "nivel": "MEDIUM",
          "propietario": "Juan Pérez",
          "fecha": "2025-01-15",
          "activo": "Servidor Web",
          "proceso": "Operaciones",
          "descripcion": "Descripción detallada del riesgo",
          "estado": "ACTIVO",
          "tratamiento": "MITIGAR"
        }
      ]
    }
  ],
  "health": {
    "low": 40,
    "medium": 35,
    "high": 25,
    "score": 71
  },
  "metadata": {
    "total_risks": 47,
    "periodo": "2025-Q3",
    "last_updated": "2025-01-17T10:30:00Z"
  }
}
```

### Response Fields

#### Cell Object
- `probabilidad_key`: Nivel de probabilidad (Frecuente, Ocasional, Posible, Improbable)
- `impacto_key`: Nivel de impacto (Insignificante, Menor, Moderado, Mayor, Catastrófico)
- `count`: Número total de riesgos en esta celda
- `risks`: Array de objetos Risk

#### Risk Object
- `id`: Identificador único del riesgo
- `nombre`: Nombre del riesgo
- `nivel`: Nivel de riesgo (LOW, MEDIUM, HIGH)
- `propietario`: Responsable del riesgo
- `fecha`: Fecha de identificación (YYYY-MM-DD)
- `activo`: Activo asociado
- `proceso`: Proceso asociado
- `descripcion`: Descripción detallada
- `estado`: Estado actual (ACTIVO, MITIGADO, CERRADO)
- `tratamiento`: Tipo de tratamiento (MITIGAR, TRANSFERIR, ACEPTAR, EVITAR)

#### Health Object
- `low`: Porcentaje de riesgos bajos
- `medium`: Porcentaje de riesgos medios
- `high`: Porcentaje de riesgos altos
- `score`: Puntuación de salud institucional (0-100)

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid parameters",
  "message": "Invalid date format for fechaInicio"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Database Schema

### Tabla: matrizriesgodefinicion
```sql
CREATE TABLE matrizriesgodefinicion (
  id INT PRIMARY KEY,
  probabilidad_key VARCHAR(50),
  impacto_key VARCHAR(50),
  nivel_riesgo_id INT,
  FOREIGN KEY (nivel_riesgo_id) REFERENCES nivelesriesgo(id)
);
```

### Tabla: nivelesriesgo
```sql
CREATE TABLE nivelesriesgo (
  id INT PRIMARY KEY,
  nombre VARCHAR(50),
  color_representacion VARCHAR(7),
  acciones_sugeridas TEXT
);
```

## Fallback Logic

Si no se puede conectar con la base de datos, el componente utiliza lógica de fallback:

### Cálculo de Nivel de Riesgo
```javascript
const calculateRiskLevel = (probabilidad, impacto) => {
  const probValues = {
    'Improbable': 1,
    'Posible': 2,
    'Ocasional': 3,
    'Frecuente': 4
  };
  
  const impactoValues = {
    'Insignificante': 1,
    'Menor': 2,
    'Moderado': 3,
    'Mayor': 4,
    'Catastrófico': 5
  };
  
  const score = probValues[probabilidad] * impactoValues[impacto];
  
  if (score <= 6) return 'BAJO';
  if (score <= 11) return 'MEDIO';
  return 'ALTO';
};
```

### Thresholds
- **BAJO**: score <= 6
- **MEDIO**: score 7-11
- **ALTO**: score >= 12

## Recommendations

### Automáticas por Nivel
- **BAJO**: "Monitoreo periódico"
- **MEDIO**: "Evaluar controles y planificar tratamiento"
- **ALTO**: "Priorizar plan de mitigación y asignar responsable"

### Por Salud Institucional
- **Salud Buena** (score >= 70): Mantener controles actuales
- **Salud Moderada** (40 <= score < 70): Revisar procesos críticos
- **Salud Crítica** (score < 40): Implementar plan de emergencia





















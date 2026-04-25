# 📊 Guía de Uso: Matriz de Referencia de Riesgo

## 🎯 ¿Qué es la Matriz de Referencia?

La **Matriz de Referencia de Riesgo** es una herramienta visual que muestra todas las combinaciones posibles entre **Probabilidad** (filas) e **Impacto** (columnas), y el **Nivel de Riesgo** resultante de cada combinación.

## 🔍 ¿Qué Aporta la Matriz?

### 1. **Visualización Completa**
- Muestra todas las 25 combinaciones posibles (5 probabilidades × 5 impactos)
- Permite ver de un vistazo el panorama completo de riesgos
- Facilita la comprensión de cómo se calcula el nivel de riesgo

### 2. **Validación de Evaluación**
- Permite verificar que tu evaluación manual sea correcta
- Ayuda a identificar inconsistencias en la evaluación
- Proporciona una referencia objetiva para comparar

### 3. **Selección Rápida**
- Para usuarios experimentados que ya conocen los valores
- Permite seleccionar directamente desde la matriz
- Ahorra tiempo al saltarse los sliders paso a paso

### 4. **Educación y Aprendizaje**
- Ayuda a entender la relación entre probabilidad e impacto
- Muestra ejemplos de cada nivel
- Facilita el aprendizaje de la metodología de evaluación

## 📖 ¿Cómo Interpretar la Matriz?

### Estructura
```
                    IMPACTO (Columnas)
                    ↓
PROBABILIDAD →  [Celda con Nivel de Riesgo]
(Filas)
```

### Colores y Significados

| Color | Nivel | Significado | Acción Recomendada |
|-------|-------|-------------|-------------------|
| 🟢 Verde | **BAJO** | Riesgo aceptable | Monitoreo rutinario |
| 🟠 Naranja | **MEDIO** | Riesgo moderado | Plan de mitigación y monitoreo |
| 🔴 Rojo | **ALTO** | Riesgo crítico | Acción inmediata requerida |

### Ejemplo de Interpretación

**Celda: Frecuente (Probabilidad) × Catastrófico (Impacto)**
- **Resultado:** Riesgo ALTO (🔴)
- **Interpretación:** Si un riesgo ocurre frecuentemente Y tiene un impacto catastrófico, el nivel de riesgo es ALTO
- **Acción:** Se requiere acción inmediata para mitigar este riesgo

## 🖱️ ¿Cómo Usar la Matriz?

### Opción 1: Selección Directa (Rápida)
1. **Identifica** la combinación que deseas evaluar
2. **Haz clic** en la celda correspondiente
3. El sistema automáticamente:
   - Establece la probabilidad seleccionada
   - Establece el impacto seleccionado
   - Calcula el nivel de riesgo
   - Te lleva al paso de justificación

### Opción 2: Validación (Después de usar sliders)
1. **Usa los sliders** para seleccionar probabilidad e impacto
2. **Observa** la celda resaltada en la matriz
3. **Verifica** que el nivel de riesgo mostrado coincida con tus expectativas
4. Si no coincide, **revisa** tu evaluación o haz clic en otra celda

### Opción 3: Exploración y Aprendizaje
1. **Pasa el mouse** sobre las celdas para ver tooltips informativos
2. **Pasa el mouse** sobre los encabezados para ver descripciones
3. **Observa** cómo cambian los colores según la combinación
4. **Aprende** la relación entre probabilidad, impacto y nivel de riesgo

## 💡 Características Mejoradas

### 1. **Tooltips Informativos**
- **Encabezados:** Muestra descripción y ejemplos de cada nivel
- **Celdas:** Muestra probabilidad, impacto, nivel de riesgo y recomendación
- **Ayuda:** Botón de ayuda con guía completa de uso

### 2. **Indicadores Visuales**
- **Celda seleccionada:** Borde azul grueso y checkmark
- **Hover:** Efecto de escala y sombra
- **Colores:** Sistema de colores intuitivo (verde/naranja/rojo)

### 3. **Leyenda Mejorada**
- Descripción de cada nivel de riesgo
- Acción recomendada para cada nivel
- Diseño más claro y legible

### 4. **Alertas Contextuales**
- Tip sobre cómo usar la matriz
- Explicación de la funcionalidad de clic
- Guía visual de la selección actual

## 🎓 Casos de Uso

### Caso 1: Usuario Nuevo
**Situación:** Primera vez evaluando riesgos
**Uso:** 
- Usa los sliders paso a paso (método recomendado)
- Observa la matriz para entender cómo se calcula
- Usa los tooltips para aprender sobre cada nivel

### Caso 2: Usuario Experimentado
**Situación:** Ya conoce los valores de probabilidad e impacto
**Uso:**
- Selecciona directamente desde la matriz
- Valida rápidamente la combinación
- Procede a la justificación

### Caso 3: Revisión de Evaluación
**Situación:** Necesita verificar una evaluación existente
**Uso:**
- Observa la celda resaltada
- Verifica que el nivel de riesgo sea correcto
- Compara con otras combinaciones similares

### Caso 4: Exploración de Escenarios
**Situación:** Quiere ver diferentes combinaciones
**Uso:**
- Pasa el mouse sobre diferentes celdas
- Observa los tooltips con información detallada
- Compara niveles de riesgo de diferentes combinaciones

## ⚠️ Puntos Importantes

1. **La matriz es una herramienta de apoyo**, no reemplaza el análisis detallado
2. **La justificación es obligatoria**, incluso si seleccionas desde la matriz
3. **Los valores son orientativos**, siempre debes considerar el contexto específico
4. **La matriz sigue estándares ISO 27005**, pero puede adaptarse según políticas internas

## 🔄 Flujo de Trabajo Recomendado

```
1. Identificar el riesgo
   ↓
2. Evaluar probabilidad (Slider o Matriz)
   ↓
3. Evaluar impacto (Slider o Matriz)
   ↓
4. Validar en la matriz
   ↓
5. Justificar la evaluación
   ↓
6. Continuar con controles
```

## 📚 Referencias

- **ISO 27005:** Gestión de riesgos de seguridad de la información
- **ISO 27001:** Sistema de gestión de seguridad de la información
- **NTC-ISO/IEC 27005:** Adaptación colombiana del estándar

---

**Nota:** Esta matriz está diseñada para facilitar la evaluación de riesgos inherentes. Para riesgos residuales (después de controles), se utiliza una evaluación similar pero considerando la eficacia de los controles implementados.


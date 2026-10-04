# Product Backlog - SmartAuditorIA
**Proyecto:** Gobernanza y Auditoría de Activos de Información (Trabajo Integrador 2)
**Metodología:** Scrum / Prácticas Ágiles

Este documento contiene las Historias de Usuario (User Stories) priorizadas y con sus respectivos **Criterios de Aceptación (DoD)**, requeridos para la evaluación de la rúbrica de la asignatura.

---

## Épica 1: Gobernanza e Integración de Servicios (Smart BPM y GLPI)
*Correspondiente a la Integración de Servicios evaluada en la Sesión 2.*

### HU-001: Integración GLPI
**Como** Administrador del Sistema
**Quiero** configurar una conexión REST hacia GLPI para sincronizar activos y tickets
**Para** mantener un inventario de información base actualizado para las auditorías.
* **Criterios de Aceptación:**
  1. El sistema debe poder autenticarse contra la API de GLPI usando un Token de aplicación.
  2. Los activos importados deben mapearse correctamente al modelo de base de datos local (`id`, `nombre`, `tipo`).
  3. Se debe generar un log de éxito o error al finalizar la sincronización.

### HU-002: Clasificación Automática MSIP/MIPG
**Como** Auditor
**Quiero** que los activos sincronizados se clasifiquen según confidencialidad, integridad y disponibilidad
**Para** cumplir con el modelo MSIP y MIPG automáticamente.
* **Criterios de Aceptación:**
  1. Al guardar un activo, el sistema debe asignarle niveles Alto/Medio/Bajo en C-I-D según reglas predefinidas.
  2. Debe ser posible modificar manualmente la clasificación si el auditor lo considera necesario.

---

## Épica 2: Sistema Experto RAG/CAG y Rol Auxiliar
*Correspondiente a las funcionalidades desplegadas en la Nube (Sesión 3).*

### HU-003: Gestión del Rol "Auxiliar de Auditoría"
**Como** Administrador
**Quiero** crear el perfil de "Auxiliar de Auditoría"
**Para** delegar tareas operativas de recolección de evidencias sin otorgar permisos de cierre de auditoría.
* **Criterios de Aceptación:**
  1. El perfil debe existir en la base de datos y tener su propio esquema de permisos JWT.
  2. El Auxiliar no debe ver el botón de "Aprobar Auditoría Definitiva".

### HU-004: Motor de Base de Datos Vectorial Histórica
**Como** Arquitecto de Software
**Quiero** indexar las evaluaciones históricas y la normatividad (ISO 27001)
**Para** alimentar el sistema RAG (Retrieval-Augmented Generation).
* **Criterios de Aceptación:**
  1. El sistema debe inicializar el cliente vectorial (ej. ChromaDB/Pinecone).
  2. Al cerrar una auditoría, los hallazgos deben guardarse como vectores (embeddings) automáticamente.

### HU-005: Sugerencia Inteligente de Controles
**Como** Auxiliar de Auditoría
**Quiero** que el sistema experto analice un activo y me sugiera los controles de seguridad aplicables
**Para** asegurar la cobertura total de la norma.
* **Criterios de Aceptación:**
  1. El sistema debe consultar la IA enviando las características del activo.
  2. La respuesta de la IA debe listarse en la interfaz como controles seleccionables (checkbox).

### HU-006: Generación Aumentada por Contexto (CAG) para Justificaciones
**Como** Auxiliar de Auditoría
**Quiero** que la IA redacte un borrador de justificación técnica al evaluar un control
**Para** agilizar mi trabajo basándose en auditorías pasadas.
* **Criterios de Aceptación:**
  1. Debe existir un botón "Autocompletar con IA" en la caja de justificación.
  2. El texto generado debe tener congruencia con el nivel de riesgo evaluado.
  3. El usuario debe poder editar el texto generado antes de guardarlo.

---

## Épica 3: Usabilidad, Interfaz y Cierre en la Nube
*Correspondiente a la versión final desplegada en la Nube (Sesión 3).*

### HU-007: Wizard de Evaluación Interactivo
**Como** Auxiliar de Auditoría
**Quiero** navegar por un Wizard paso a paso para ejecutar mi evaluación
**Para** evitar perder el hilo del proceso y asegurar la completitud de la información.
* **Criterios de Aceptación:**
  1. El Wizard debe tener al menos 3 pasos: Selección de Activo, Evaluación de Controles, Carga de Evidencia.
  2. No se debe poder avanzar de paso si hay campos obligatorios vacíos.

### HU-008: Despliegue en Producción (Cloud)
**Como** Profesor Evaluador
**Quiero** acceder a la aplicación mediante una URL pública en la nube
**Para** validar el funcionamiento de todo el flujo en un entorno real.
* **Criterios de Aceptación:**
  1. El frontend debe estar servido por Nginx y el backend por Gunicorn/Flask en un VPS/Cloud.
  2. La base de datos debe ser persistente (MariaDB).
  3. Se debe configurar un certificado SSL válido para acceso por HTTPS.

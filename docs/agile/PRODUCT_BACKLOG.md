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

---

## Épica 4: Gestión de Identidades, Seguridad y Autoservicio de Acceso
*Correspondiente a la administración centralizada de usuarios, control de acceso RBAC y recuperación de credenciales.*

### HU-009: Módulo de Gestión de Usuarios y Roles RBAC (Jira: SCRUM-36)
**Como** Administrador del Sistema
**Quiero** gestionar de forma integral el ciclo de vida de los usuarios (crear, editar, activar, inactivar, desbloquear y asignar roles RBAC)
**Para** asegurar que cada integrante de la organización (ADMIN, OPERADOR, CONSULTOR) acceda únicamente a las funcionalidades que le corresponden según el principio de mínimo privilegio.
* **Criterios de Aceptación (DoD):**
  1. Sincronización bidireccional entre la identidad institucional (`usuarios_sistema`) y la cuenta de credenciales (`usuarios_auth`).
  2. Catálogo dinámico de roles (`ADMIN`, `OPERADOR`, `CONSULTOR`) con filtro interactivo en la UI y tarjetas de conteo por rol.
  3. Visualización clara en DataGrid de estado de cuenta (Activo, Inactivo, Bloqueado) y fecha de último login.
  4. Capacidad administrativa para activar/desactivar cuentas y desbloquear usuarios bloqueados por intentos fallidos.
  5. Acción de restablecimiento forzado de contraseña por el Administrador con generación de clave temporal segura.
  6. **Panel de Control de Roles:** Botones de acción rápida en cabecera (`+ Agregar Operador`, `+ Agregar Consultor`, `+ Nuevo Usuario`) y selección visual segmentada de roles RBAC en modal.
  7. **Gestión de Responsables en Activos:** Selector de *Usuario Responsable / Propietario del Activo (SGSI)* en `/activos`, columna en tabla y modal integrado `+ Crear Nuevo Responsable` al vuelo.
  8. **Evaluación Directa de Activos:** Acción `Evaluar Riesgo en Wizard` en tabla y detalle de activo con precarga automática del activo mediante query param (`/wizard?activoId=...`).
* **Evidencias Registradas:**
  - **Prueba E2E en VPS:** Superada 8/8 flujos en vivo (`e2e_vps_validation.py`).
  - **Verificación Visual:** Capturas `gestion_usuarios_panel_1792620723085.png`, `modal_usuario_rbac_1792620742518.png`, `activos_table_responsable_1792620819383.png`, `modal_activo_responsable_1792620907595.png`, `modal_quick_responsible_1792620941079.png`.
  - **Video Sesión Navegador:** `roles_management_demo_1792620676166.webp`.
  - **Despliegue Activo en Producción:** [https://riesgosti.tics.sedcauca.gov.co/usuarios](https://riesgosti.tics.sedcauca.gov.co/usuarios) y [/activos](https://riesgosti.tics.sedcauca.gov.co/activos).

### HU-010: Autoservicio y Recuperación Segura de Contraseñas (Jira: SCRUM-37)
**Como** Usuario del Sistema
**Quiero** solicitar la recuperación de mi contraseña de forma autónoma mediante un token criptográfico seguro
**Para** restablecer mi acceso a la plataforma sin demoras operativas ni intervención manual insegura.
* **Criterios de Aceptación (DoD):**
  1. Solicitud de recuperación mediante nombre de usuario o correo electrónico institucional en endpoint `POST /api/auth/forgot-password`.
  2. Generación de token JWT firmado con expiración estricta de 1 hora y código de verificación numérico de 6 dígitos.
  3. Endpoint seguro `POST /api/auth/reset-password` que valida la firma criptográfica del token, actualiza el hash de la contraseña usando bcrypt y desbloquea la cuenta.
  4. Invalidación automática de sesiones previas activas por motivos de seguridad.
  5. Componente interactivo en el frontend (Modal "¿Olvidaste tu contraseña?") con medidor de fortaleza de clave y retroalimentación en tiempo real.
* **Evidencias Registradas:**
  - **Commit:** `791b8e8` (`[SCRUM-37][HU-010] feat(auth): implementar autoservicio y recuperacion de contrasena con token seguro`)
  - **Prueba E2E en VPS:** Aprobada (Pasos 5, 6 y 7 en `e2e_vps_validation.py`).

---

## Épica 5: Identidad Institucional, Experiencia de Usuario y PWA Responsivo
*Correspondiente a la alineación visual gubernamental, cumplimiento de identidad institucional y experiencia móvil/PWA.*

### HU-011: Alineación Estética e Identidad Institucional Gobernación del Cauca (Jira: SCRUM-38)
**Como** Usuario y Auditor de la Entidad
**Quiero** que la plataforma SmartAuditorIA adopte la línea gráfica, colores y elementos visuales oficiales del portal de la Gobernación del Cauca / Secretaría de Educación y Cultura (cauca.gov.co/sedcauca)
**Para** garantizar coherencia institucional, confianza en el sistema y una experiencia de usuario responsiva en dispositivos móviles y de escritorio.
* **Criterios de Aceptación (DoD):**
  1. Franja superior gubernamental oficial GOV.CO en color `#3366CC` con logo SVG vectorizado en blanco puro.
  2. Encabezado institucional con escudos duales: Escudo de la República de Colombia (`colombia.svg`) y Escudo Oficial de la Gobernación del Cauca (`logoCaucaHorizontal.png`).
  3. Tipografía jerárquica: *"Secretaría de Educación y Cultura / Gobernación del Cauca"* en Azul Marino Cauca (`#1D3867`).
  4. Botón de acción principal (*"Acceder al Sistema"*) e indicadores activos del menú lateral en Naranja Cauca Oficial (`#eb6408` degradado a `#f97316`).
  5. Manifiesto PWA (`manifest.json`) y etiquetas meta en `index.html` con `theme-color: #3366CC`, modo `standalone` e íconos institucionales.
  6. Menú responsivo tipo Drawer adaptativo con botón toggle para dispositivos móviles y tablets.
  7. Retención al 100% de la funcionalidad preexistente (RBAC: ADMIN, OPERADOR, CONSULTOR; Wizard; Auditorías; Recuperación de credenciales).
* **Evidencias Registradas:**
  - **Commit Git:** `0a3955b` (`[SCRUM-34][SCRUM-35] feat(ui): alinear diseno y paleta institucional con Gobernacion del Cauca`)
  - **Validación Automatizada E2E:** 8/8 pruebas superadas contra producción (`e2e_vps_validation.py`).
  - **Verificación Visual:** Capturas en vivo `login_page_institutional_1792618343007.png` y `dashboard_institutional_1792618522546.png`.
  - **Despliegue Activo en Producción:** [https://riesgosti.tics.sedcauca.gov.co/login](https://riesgosti.tics.sedcauca.gov.co/login)

---

## Protocolo de Registro de Evidencias (Conforme a AGENTS.md)
Todos los cambios posteriores deben alimentar este documento siguiendo el ciclo:
1. Declaración o actualización de la HU con Criterios de Aceptación (DoD).
2. Smart Commit en el repositorio correspondiente (`[TICKET][HU-ID] tipo: mensaje`).
3. Ejecución de pruebas y validación en VPS.
4. Registro del hash de commit y artefacto de prueba en la sección de evidencias de la historia.



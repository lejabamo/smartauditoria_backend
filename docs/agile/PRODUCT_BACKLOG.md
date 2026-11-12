# Product Backlog — SmartAuditorIA (SGSRI)
**Proyecto:** Gobernanza y Auditoría Inteligente de Activos de Información y Riesgos TI (Trabajo Integrador 2)  
**Tablero Oficial en Jira Cloud:** [https://smartauditoria.atlassian.net/jira/software/projects/SCRUM/boards](https://smartauditoria.atlassian.net/jira/software/projects/SCRUM/boards)  
**Metodología:** Scrum / Modelo en Espiral / CRISP-DM  
**Responsable:** Ing. Leonardo Javier Bastidas Moreno

---

## 📊 Matriz Resumen del Product Backlog (100% Sincronizado con Jira & GitHub Actions)

| Clave Jira | Código HU | Tipo | Resumen de la Historia / Tarea | Épica | Story Points | Release | Sprint | Repositorio GitHub | Commit | Workflow GitHub Actions | Estado |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :---: | :--- | :---: |
| **[SCRUM-5](https://smartauditoria.atlassian.net/browse/SCRUM-5)** | `EP-01` | Epic | EP1 – Gestión de Activos de Información e Interoperabilidad GLPI/DAFP | - | - | `V1.0` | transversal | `smartauditoria_backend` | `724930d` | `ci.yml` | ✅ Done |
| **[SCRUM-6](https://smartauditoria.atlassian.net/browse/SCRUM-6)** | `EP-02` | Epic | EP2 – Evaluación y Matriz de Riesgos ISO 27005 / DAFP V7 | - | - | `V1.0` | transversal | `smartauditoria_backend` | `a798f19` | `ci.yml` | ✅ Done |
| **[SCRUM-7](https://smartauditoria.atlassian.net/browse/SCRUM-7)** | `EP-03` | Epic | EP3 – Motor Inteligente RAG/CAG para Sugerencia de Controles ISO 27002 | - | - | `V1.5` | transversal | `smartauditoria_engine` | `06ee676` | `ci.yml` | ✅ Done |
| **[SCRUM-8](https://smartauditoria.atlassian.net/browse/SCRUM-8)** | `EP-04` | Epic | EP4 – Dashboard Ejecutivo de Riesgos, SoA y Reportes Institucionales | - | - | `V2.0` | transversal | `smartauditoria_frontend` | `5eafd76` | `ci.yml` | ✅ Done |
| **[SCRUM-9](https://smartauditoria.atlassian.net/browse/SCRUM-9)** | `EP-05` | Epic | EP5 – Infraestructura Cloud, Seguridad RBAC/JWT y CI/CD con GitHub Actions | - | - | `V2.0` | transversal | `smartauditoria_backend` | `3b7c6c2` | `deploy.yml` | ✅ Done |
| **[SCRUM-43](https://smartauditoria.atlassian.net/browse/SCRUM-43)** | `EP-06` | Epic | EP6 – Homologación Institucional Gobernación del Cauca, Formato Oficial (.xlsm) y Ceremonias Ágiles | - | - | `V3.0` | transversal | `smartauditoria_backend` | `73ddbfd` | `pr_title_checker.yml` | ✅ Done |
| **[SCRUM-10](https://smartauditoria.atlassian.net/browse/SCRUM-10)** | `HU-001` | Feature | HU1 – Registrar activos de información e integración GLPI en el sistema | `SCRUM-5` | **5** | `V1.0` | Sprint 1 | `smartauditoria_backend` | `724930d` | `ci.yml` | ✅ Done |
| **[SCRUM-11](https://smartauditoria.atlassian.net/browse/SCRUM-11)** | `HU-002` | Feature | HU2 – Calcular nivel de riesgo inherente y residual (Probabilidad x Impacto) | `SCRUM-6` | **5** | `V1.0` | Sprint 1 | `smartauditoria_backend` | `790fce3` | `ci.yml` | ✅ Done |
| **[SCRUM-12](https://smartauditoria.atlassian.net/browse/SCRUM-12)** | `HU-003` | Feature | HU3 – Configurar entorno base del sistema (Docker Compose & MariaDB) | `SCRUM-9` | **3** | `V1.0` | Sprint 1 | `smartauditoria_backend` | `953426d` | `deploy.yml` | ✅ Done |
| **[SCRUM-14](https://smartauditoria.atlassian.net/browse/SCRUM-14)** | `HU-004` | Feature | HU4 – Implementar matriz de riesgos 5x5 interactiva | `SCRUM-6` | **8** | `V1.0` | Sprint 2 | `smartauditoria_frontend` | `68b7cd5` | `ci.yml` | ✅ Done |
| **[SCRUM-15](https://smartauditoria.atlassian.net/browse/SCRUM-15)** | `HU-005` | Feature | HU5 – Almacenar evaluaciones de riesgo en base de datos relacional | `SCRUM-6` | **5** | `V1.0` | Sprint 2 | `smartauditoria_backend` | `5078a8f` | `ci.yml` | ✅ Done |
| **[SCRUM-16](https://smartauditoria.atlassian.net/browse/SCRUM-16)** | `HU-006` | Feature | HU6 – Clasificar automáticamente el nivel de riesgo MSIP/MIPG (C-I-D) | `SCRUM-6` | **3** | `V1.0` | Sprint 2 | `smartauditoria_backend` | `790fce3` | `ci.yml` | ✅ Done |
| **[SCRUM-17](https://smartauditoria.atlassian.net/browse/SCRUM-17)** | `HU-007` | Feature | HU7 – Procesar documentos normativos ISO para extracción de texto | `SCRUM-7` | **5** | `V1.5` | Sprint 3 | `smartauditoria_engine` | `0643dd4` | `ci.yml` | ✅ Done |
| **[SCRUM-18](https://smartauditoria.atlassian.net/browse/SCRUM-18)** | `HU-008` | Feature | HU8 – Configurar base de conocimiento vectorial en ChromaDB | `SCRUM-7` | **8** | `V1.5` | Sprint 3 | `smartauditoria_engine` | `15eb3e2` | `ci.yml` | ✅ Done |
| **[SCRUM-19](https://smartauditoria.atlassian.net/browse/SCRUM-19)** | `HU-009` | Feature | HU9 – Implementar búsqueda semántica de controles ISO 27002:2022 | `SCRUM-7` | **8** | `V1.5` | Sprint 3 | `smartauditoria_engine` | `0789839` | `ci.yml` | ✅ Done |
| **[SCRUM-20](https://smartauditoria.atlassian.net/browse/SCRUM-20)** | `HU-010` | Feature | HU10 – Generar sugerencias automáticas de controles ISO con IA (RAG) | `SCRUM-7` | **8** | `V1.5` | Sprint 4 | `smartauditoria_engine` | `06ee676` | `ci.yml` | ✅ Done |
| **[SCRUM-21](https://smartauditoria.atlassian.net/browse/SCRUM-21)** | `HU-011` | Feature | HU11 – Generar justificación normativa contextual asistida (CAG) | `SCRUM-7` | **5** | `V1.5` | Sprint 4 | `smartauditoria_engine` | `099888d` | `ci.yml` | ✅ Done |
| **[SCRUM-22](https://smartauditoria.atlassian.net/browse/SCRUM-22)** | `HU-012` | Feature | HU12 – Mostrar sugerencias de controles e interfaz Wizard paso a paso | `SCRUM-7` | **5** | `V1.5` | Sprint 4 | `smartauditoria_frontend` | `2070132` | `ci.yml` | ✅ Done |
| **[SCRUM-23](https://smartauditoria.atlassian.net/browse/SCRUM-23)** | `HU-013` | Feature | HU13 – Visualizar riesgos clasificados por nivel en Dashboard | `SCRUM-8` | **5** | `V2.0` | Sprint 5 | `smartauditoria_frontend` | `0789839` | `ci.yml` | ✅ Done |
| **[SCRUM-24](https://smartauditoria.atlassian.net/browse/SCRUM-24)** | `HU-014` | Feature | HU14 – Mostrar indicadores clave de gestión de riesgos (KPIs SGSI) | `SCRUM-8` | **5** | `V2.0` | Sprint 5 | `smartauditoria_frontend` | `f649ae5` | `ci.yml` | ✅ Done |
| **[SCRUM-25](https://smartauditoria.atlassian.net/browse/SCRUM-25)** | `HU-015` | Feature | HU15 – Filtrar riesgos por activo de información y criticidad | `SCRUM-8` | **5** | `V2.0` | Sprint 5 | `smartauditoria_frontend` | `68b7cd5` | `ci.yml` | ✅ Done |
| **[SCRUM-26](https://smartauditoria.atlassian.net/browse/SCRUM-26)** | `HU-016` | Feature | HU16 – Implementar autenticación segura con tokens JWT | `SCRUM-9` | **8** | `V1.0` | Sprint 6 | `smartauditoria_backend` | `c767e2b` | `ci.yml` | ✅ Done |
| **[SCRUM-27](https://smartauditoria.atlassian.net/browse/SCRUM-27)** | `HU-017` | Feature | HU17 – Implementar control de acceso basado en roles (RBAC) | `SCRUM-9` | **5** | `V1.0` | Sprint 6 | `smartauditoria_backend` | `375f9f5` | `ci.yml` | ✅ Done |
| **[SCRUM-28](https://smartauditoria.atlassian.net/browse/SCRUM-28)** | `HU-018` | Feature | HU18 – Configurar pipeline de integración y despliegue continuo (GitHub Actions) | `SCRUM-9` | **5** | `V2.0` | Sprint 6 | `smartauditoria_backend` | `3b7c6c2` | `ci.yml / deploy.yml` | ✅ Done |
| **[SCRUM-29](https://smartauditoria.atlassian.net/browse/SCRUM-29)** | `HU-101` | Task | HU-101 – Aislamiento Contextual Normativo en Motor RAG (Target Isolation) | `SCRUM-7` | **5** | `V2.0` | Sprint 5 | `smartauditoria_engine` | `06a808d` | `ci.yml` | ✅ Done |
| **[SCRUM-30](https://smartauditoria.atlassian.net/browse/SCRUM-30)** | `HU-102` | Task | HU-102 – Trazabilidad Matemática y Forense de Respuestas IA (Data Lineage) | `SCRUM-7` | **5** | `V2.0` | Sprint 5 | `smartauditoria_engine` | `849cc9f` | `ci.yml` | ✅ Done |
| **[SCRUM-31](https://smartauditoria.atlassian.net/browse/SCRUM-31)** | `HU-103` | Task | HU-103 – Tolerancia a Fallos Heurísticos y Resiliencia (Fallback SQL) | `SCRUM-7` | **3** | `V2.0` | Sprint 5 | `smartauditoria_backend` | `d245275` | `ci.yml` | ✅ Done |
| **[SCRUM-32](https://smartauditoria.atlassian.net/browse/SCRUM-32)** | `HU-201` | Task | HU-201 – Rediseño Tonal de IA Auditora Experta (Auditor Copilot ISO 27002) | `SCRUM-7` | **2** | `V2.0` | Sprint 5 | `smartauditoria_engine` | `06ee676` | `ci.yml` | ✅ Done |
| **[SCRUM-33](https://smartauditoria.atlassian.net/browse/SCRUM-33)** | `HU-202` | Task | HU-202 – Validación Human-In-The-Loop con Chips de Acción Interactivos | `SCRUM-7` | **5** | `V2.0` | Sprint 5 | `smartauditoria_frontend` | `7df5d51` | `ci.yml` | ✅ Done |
| **[SCRUM-34](https://smartauditoria.atlassian.net/browse/SCRUM-34)** | `HU-203` | Task | HU-203 – Medición Visual de Certeza y Métricas RAGAS (Confidence Flagging) | `SCRUM-7` | **3** | `V2.0` | Sprint 5 | `smartauditoria_engine` | `849cc9f` | `ci.yml` | ✅ Done |
| **[SCRUM-35](https://smartauditoria.atlassian.net/browse/SCRUM-35)** | `HU-301` | Task | HU-301 – Despliegue en Producción VPS Cloud con SSL y Validación E2E | `SCRUM-9` | **5** | `V2.0` | Sprint 6 | `smartauditoria_backend` | `6de9c83` | `deploy.yml` | ✅ Done |
| **[SCRUM-36](https://smartauditoria.atlassian.net/browse/SCRUM-36)** | `HU-019` | Feature | HU19 – Módulo de Gestión de Usuarios, Roles RBAC y Responsables de Activos | `SCRUM-43` | **8** | `V3.0` | Sprint 7 | `smartauditoria_backend` | `73ddbfd` | `ci.yml` | ✅ Done |
| **[SCRUM-37](https://smartauditoria.atlassian.net/browse/SCRUM-37)** | `HU-020` | Feature | HU20 – Autoservicio y Recuperación Segura de Contraseñas con Token JWT | `SCRUM-43` | **5** | `V3.0` | Sprint 7 | `smartauditoria_backend` | `e0c4efa` | `ci.yml` | ✅ Done |
| **[SCRUM-38](https://smartauditoria.atlassian.net/browse/SCRUM-38)** | `HU-021` | Feature | HU21 – Alineación Estética e Identidad Gobernación del Cauca y PWA | `SCRUM-43` | **5** | `V3.0` | Sprint 7 | `smartauditoria_frontend` | `0a3955b` | `ci.yml` | ✅ Done |
| **[SCRUM-39](https://smartauditoria.atlassian.net/browse/SCRUM-39)** | `HU-022` | Feature | HU22 – Armonización de Catálogos Maestros DAFP V7, Ley 1712 y Escala CIA 1-5 | `SCRUM-43` | **8** | `V3.0` | Sprint 7 | `smartauditoria_backend` | `790fce3` | `ci.yml` | ✅ Done |
| **[SCRUM-40](https://smartauditoria.atlassian.net/browse/SCRUM-40)** | `HU-023` | Feature | HU23 – Evaluación Multidimensional de Riesgos y Declaración de Aplicabilidad (SoA 93 Controles ISO 27002) | `SCRUM-43` | **8** | `V3.0` | Sprint 7 | `smartauditoria_backend` | `921dfb0` | `ci.yml` | ✅ Done |
| **[SCRUM-41](https://smartauditoria.atlassian.net/browse/SCRUM-41)** | `HU-024` | Feature | HU24 – Adaptación del Wizard IA con Auditor Copilot (ISO 27005 & DAFP V7) y Matriz 5x5 | `SCRUM-43` | **8** | `V3.0` | Sprint 7 | `smartauditoria_frontend` | `a798f19` | `ci.yml` | ✅ Done |
| **[SCRUM-42](https://smartauditoria.atlassian.net/browse/SCRUM-42)** | `HU-025` | Feature | HU25 – Importación/Exportación Masiva Excel (.xlsm/.xlsx) y Mapa Oficial de Riesgos DAFP V7 | `SCRUM-43` | **8** | `V3.0` | Sprint 7 | `smartauditoria_backend` | `5eafd76` | `ci.yml` | ✅ Done |
| **[SCRUM-44](https://smartauditoria.atlassian.net/browse/SCRUM-44)** | `HU-026` | Task | HU26 – Ceremonia de Retrospectiva de Ciclo Ágil (Sprints 1 a 7), Evaluación RAGAS y Plan de Mejora Continua | `SCRUM-43` | **5** | `V3.0` | Sprint 7 | `smartauditoria_frontend` | `02d09f2` | `ci.yml` | ✅ Done |
| **[SCRUM-45](https://smartauditoria.atlassian.net/browse/SCRUM-45)** | `HU-027` | Task | HU27 – Automatización de Trazabilidad GitHub Actions ↔ Jira Smart Commits y Showcase Académico | `SCRUM-43` | **5** | `V3.0` | Sprint 7 | `smartauditoria_backend` | `db30e2f` | `pr_title_checker.yml` | ✅ Done |
| **[SCRUM-46](https://smartauditoria.atlassian.net/browse/SCRUM-46)** | `HU-028` | Feature | HU28 – [Mejora Retrospectiva 1] Optimización de Latencia Vectorial (<250ms) y Benchmark en ChromaDB | `SCRUM-43` | **5** | `V4.0-Backlog` | Backlog | `smartauditoria_engine` | `849cc9f` | `ci.yml` | 📋 Ready |
| **[SCRUM-47](https://smartauditoria.atlassian.net/browse/SCRUM-47)** | `HU-029` | Feature | HU29 – [Mejora Retrospectiva 2] Suite Automatizada de Evaluación Cuantitativa RAGAS en GitHub Actions | `SCRUM-43` | **8** | `V4.0-Backlog` | Backlog | `smartauditoria_engine` | `849cc9f` | `ci.yml` | 📋 Backlog |
| **[SCRUM-48](https://smartauditoria.atlassian.net/browse/SCRUM-48)** | `HU-030` | Feature | HU30 – [Mejora Retrospectiva 3] Job Programado de Sincronización GLPI en Tiempo Real y Webhooks Jira | `SCRUM-43` | **5** | `V4.0-Backlog` | Backlog | `smartauditoria_backend` | `3b7c6c2` | `ci.yml` | 📋 Backlog |

---

## Detalle de Épicas e Historias de Usuario con Criterios de Aceptación (DoD)

### Épica 1 (`SCRUM-5`): Gestión de Activos de Información e Interoperabilidad GLPI/DAFP
* **[SCRUM-10 / HU-001]** *Como Administrador del Sistema, quiero registrar activos de información y sincronizar el inventario mediante conexión REST con GLPI, para mantener una base de datos de activos actualizada y auditable.* (5 SP | Commit `724930d` | `smartauditoria_backend/.github/workflows/ci.yml`).

### Épica 2 (`SCRUM-6`): Evaluación y Matriz de Riesgos ISO 27005 / DAFP V7
* **[SCRUM-11 / HU-002]** *Cálculo matemático de nivel de riesgo inherente y residual $RI = P \times I$.* (5 SP | Commit `790fce3` | `ci.yml`).
* **[SCRUM-14 / HU-004]** *Matriz de calor 5x5 interactiva en React.* (8 SP | Commit `68b7cd5` | `ci.yml`).
* **[SCRUM-15 / HU-005]** *Persistencia relacional de evaluaciones en MariaDB.* (5 SP | Commit `5078a8f` | `ci.yml`).
* **[SCRUM-16 / HU-006]** *Clasificación automática MSIP/MIPG (C-I-D).* (3 SP | Commit `790fce3` | `ci.yml`).

### Épica 3 (`SCRUM-7`): Motor Inteligente RAG/CAG para Sugerencia de Controles ISO 27002
* **[SCRUM-17 / HU-007]** *Procesamiento y chunking de documentos normativos ISO.* (5 SP | Commit `0643dd4` | `ci.yml`).
* **[SCRUM-18 / HU-008]** *Base de conocimiento vectorial persistente en ChromaDB.* (8 SP | Commit `15eb3e2` | `ci.yml`).
* **[SCRUM-19 / HU-009]** *Búsqueda semántica Top-K de controles ISO 27002:2022.* (8 SP | Commit `0789839` | `ci.yml`).
* **[SCRUM-20 / HU-010]** *Sugerencias automáticas de controles ISO con IA (RAG).* (8 SP | Commit `06ee676` | `ci.yml`).
* **[SCRUM-21 / HU-011]** *Justificación normativa contextual asistida (CAG).* (5 SP | Commit `099888d` | `ci.yml`).
* **[SCRUM-22 / HU-012]** *Interfaz Wizard paso a paso con sugerencias de controles.* (5 SP | Commit `2070132` | `ci.yml`).
* **[SCRUM-29 a SCRUM-34 / HU-101 a HU-203]** *Hardening MLOps: Target Isolation (`06a808d`), Data Lineage (`849cc9f`), Fallback SQL (`d245275`), Auditor Copilot (`06ee676`), Human-In-The-Loop (`7df5d51`) y Métricas RAGAS (`849cc9f`).* (23 SP).

### Épica 4 (`SCRUM-8`): Dashboard Ejecutivo de Riesgos, SoA y Reportes Institucionales
* **[SCRUM-23 / HU-013]** *Visualización de riesgos clasificados por nivel en Dashboard.* (5 SP | Commit `0789839` | `ci.yml`).
* **[SCRUM-24 / HU-014]** *Indicadores clave de gestión de riesgos (KPIs SGSI).* (5 SP | Commit `f649ae5` | `ci.yml`).
* **[SCRUM-25 / HU-015]** *Filtrado interactivo de riesgos por activo y criticidad.* (5 SP | Commit `68b7cd5` | `ci.yml`).

### Épica 5 (`SCRUM-9`): Infraestructura Cloud, Seguridad RBAC/JWT y CI/CD con GitHub Actions
* **[SCRUM-12 / HU-003]** *Entorno base multicontenedor Docker Compose & MariaDB.* (3 SP | Commit `953426d` | `deploy.yml`).
* **[SCRUM-26 / HU-016]** *Autenticación segura con tokens JWT y protección anti-fuerza bruta.* (8 SP | Commit `c767e2b` | `ci.yml`).
* **[SCRUM-27 / HU-017]** *Control de acceso basado en roles RBAC (`ADMIN`, `OPERADOR`, `CONSULTOR`).* (5 SP | Commit `375f9f5` | `ci.yml`).
* **[SCRUM-28 / HU-018]** *Pipelines CI/CD en GitHub Actions (`ci.yml`, `deploy.yml`, `pr_title_checker.yml`).* (5 SP | Commit `3b7c6c2`).
* **[SCRUM-35 / HU-301]** *Despliegue en producción VPS Cloud con SSL (`riesgosti.tics.sedcauca.gov.co`) y validación E2E.* (5 SP | Commit `6de9c83` | `deploy.yml`).

### Épica 6 (`SCRUM-43`): Homologación Institucional Gobernación del Cauca, Formato Oficial (.xlsm) y Ceremonias Ágiles
* **[SCRUM-36 / HU-019]** *Módulo de gestión de usuarios, roles RBAC y responsables de activos.* (8 SP | Commit `73ddbfd` | `ci.yml`).
* **[SCRUM-37 / HU-020]** *Autoservicio y recuperación segura de contraseñas con token JWT.* (5 SP | Commit `e0c4efa` | `ci.yml`).
* **[SCRUM-38 / HU-021]** *Alineación estética e identidad Gobernación del Cauca y PWA.* (5 SP | Commit `0a3955b` | `ci.yml`).
* **[SCRUM-39 / HU-022]** *Armonización de catálogos maestros DAFP V7, Ley 1712 y escala CIA 1-5.* (8 SP | Commit `790fce3` | `ci.yml`).
* **[SCRUM-40 / HU-023]** *Evaluación multidimensional de riesgos y Declaración de Aplicabilidad (SoA 93 Controles ISO 27002:2022).* (8 SP | Commit `921dfb0` | `ci.yml`).
* **[SCRUM-41 / HU-024]** *Adaptación del Wizard IA con Auditor Copilot (ISO 27005 & DAFP V7) y Matriz 5x5.* (8 SP | Commit `a798f19` | `ci.yml`).
* **[SCRUM-42 / HU-025]** *Importación/Exportación masiva Excel (`.xlsm`/`.xlsx`) y Mapa Oficial de Riesgos DAFP V7.* (8 SP | Commit `5eafd76` | `ci.yml`).
* **[SCRUM-44 / HU-026]** *Ceremonia de Retrospectiva de Ciclo Ágil (Sprints 1 a 7), Evaluación RAGAS y Plan de Mejora Continua.* (5 SP | Commit `02d09f2` | [`RETROSPECTIVA_PROYECTO.md`](./RETROSPECTIVA_PROYECTO.md)).
* **[SCRUM-45 / HU-027]** *Automatización de Trazabilidad GitHub Actions ↔ Jira Smart Commits y Showcase Académico.* (5 SP | Commit `db30e2f` | `pr_title_checker.yml`).
* **[SCRUM-46 a SCRUM-48 / HU-028 a HU-030]** *Backlog de Mejora Continua derivado de la Retrospectiva (`V4.0-Backlog`, 18 SP).*

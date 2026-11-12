# Retrospectiva del Ciclo Ágil — SmartAuditorIA (SGSRI)
**Proyecto:** Gobernanza y Auditoría Inteligente de Activos de Información y Riesgos TI  
**Programa:** Maestría en Computación para el Desarrollo de Aplicaciones Inteligentes — Universidad del Valle  
**Autor / Roles Desempeñados:** Ing. Leonardo Javier Bastidas Moreno (*Product Owner, Arquitecto de Software, Desarrollador Fullstack, Ingeniero MLOps y Auditor Líder*)  
**Ticket Jira Asociado:** [SCRUM-44](https://smartauditoria.atlassian.net/browse/SCRUM-44) (`[HU-026] HU26 – Ceremonia de Retrospectiva de Ciclo Ágil (Sprints 1 a 7)`)  
**Entregable Web Interactivo:** [`docs/showcase/historical/20260320_Retrospectiva_Ciclo.html`](file:///c:/Users/Administrador1/Desktop/Riesgos/smartauditoria_project/docs/showcase/historical/20260320_Retrospectiva_Ciclo.html)

---

## 1. Resumen de Ejecución por Sprints y Velocidad del Ciclo

Durante el desarrollo iterativo e incremental del proyecto bajo el enfoque híbrido **Scrum + Espiral + CRISP-DM**, se ejecutaron **7 Sprints** cubriendo **6 Épicas (`SCRUM-5` a `SCRUM-9` y `SCRUM-43`)** y **34 Historias/Tareas completadas (`Done`)** por un total de **194 Story Points (SP)** entregados en producción, más **3 Historias de Mejora Continua (18 SP)** priorizadas en el Product Backlog para el siguiente ciclo:

| Sprint | Nombre en Jira | Fechas | Release | Historias Completadas (Jira Keys) | Story Points | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **Sprint 1** | `Sprint 1 – Fund del Sistema` | 2026-02-22 → 2026-02-28 | `V1.0` | `SCRUM-10` (HU1), `SCRUM-11` (HU2), `SCRUM-12` (HU3) | 13 SP | ✅ Cerrado |
| **Sprint 2** | `Sprint 2 Riesgos` | 2026-03-01 → 2026-03-18 | `V1.0` | `SCRUM-14` (HU4), `SCRUM-15` (HU5), `SCRUM-16` (HU6) | 16 SP | ✅ Cerrado |
| **Sprint 3** | `Sprint 3 RAG` | 2026-03-18 → 2026-03-27 | `V1.5` | `SCRUM-17` (HU7), `SCRUM-18` (HU8), `SCRUM-19` (HU9) | 21 SP | ✅ Cerrado |
| **Sprint 4** | `S4 – Integración RAG` | 2026-04-10 → 2026-04-25 | `V1.5` | `SCRUM-20` (HU10), `SCRUM-21` (HU11), `SCRUM-22` (HU12) | 18 SP | ✅ Cerrado |
| **Sprint 5** | `S5 – Dashboard & Hardening MLOps` | 2026-04-25 → 2026-05-05 | `V2.0` | `SCRUM-23`..`25` (HU13-15), `SCRUM-29`..`34` (HU101-203) | 38 SP | ✅ Cerrado |
| **Sprint 6** | `S6 – Seguridad & Cloud VPS` | 2026-04-24 → 2026-05-08 | `V2.0` | `SCRUM-26` (HU16), `SCRUM-27` (HU17), `SCRUM-28` (HU18), `SCRUM-35` (HU301) | 23 SP | ✅ Cerrado |
| **Sprint 7** | `S7 – Homologación Institucional, Gobernanza RBAC & Cierre` | 2026-05-09 → 2026-11-12 | `V3.0` | `SCRUM-36`..`42` (HU19-25), `SCRUM-44` (HU26), `SCRUM-45` (HU27) | 60 SP | ✅ Completado |
| **Backlog** | `Ciclo Futuro (Mejora Continua Post-Retrospectiva)` | 2026-11-13 → 2026-12-15 | `V4.0-Backlog` | `SCRUM-46` (HU28), `SCRUM-47` (HU29), `SCRUM-48` (HU30) | 18 SP | 📋 Priorizado |

---

## 2. ¿Qué Funcionó Bien? (Fortalezas y Logros Verificados)

1. **Arquitectura Multirepositorio Desacoplada y CI/CD con GitHub Actions:**
   - La separación limpia en tres repositorios oficiales ([`smartauditoria_frontend`](https://github.com/lejabamo/smartauditoria_frontend), [`smartauditoria_backend`](https://github.com/lejabamo/smartauditoria_backend), [`smartauditoria_engine`](https://github.com/lejabamo/smartauditoria_engine)) permitió configurar pipelines independientes (`ci.yml`, `deploy.yml`, `pr_title_checker.yml`) sin bloqueos cruzados.
2. **Gobernanza Institucional y Seguridad RBAC (`SCRUM-36`, `SCRUM-37`, `SCRUM-38`):**
   - Implementación completa del ciclo de vida de usuarios con roles oficiales (`ADMIN`, `OPERADOR`, `CONSULTOR`), recuperación autónoma de contraseñas con tokens JWT de 1 hora, asignación de responsables en activos y alineación con la identidad visual oficial de la **Gobernación del Cauca / Secretaría de Educación y Cultura (GOV.CO)**.
3. **Homologación Normativa DAFP V7, Ley 1712 e ISO/IEC 27001/27002/27005 (`SCRUM-39` a `SCRUM-42`):**
   - Incorporación de la **Declaración de Aplicabilidad (SoA)** con los **93 controles de ISO/IEC 27002:2022**, el **Generador Oficial del Mapa de Riesgos Institucional DAFP V7 / MIPG** con exportación a Excel/PDF y carga masiva inteligente enriquecida con **Auditor Copilot IA**.
4. **Despliegue Vivo en Producción y Validación E2E (`SCRUM-35`):**
   - Plataforma desplegada en VPS Cloud bajo certificado SSL institucional ([https://riesgosti.tics.sedcauca.gov.co](https://riesgosti.tics.sedcauca.gov.co)) con suite automatizada `e2e_vps_validation.py` superando 8/8 flujos críticos.

---

## 3. ¿Qué Dificultades se Presentaron? (Retos Reales Superados)

1. **Trazabilidad Manual Inicial entre GitHub y Jira (`SCRUM-28` / `SCRUM-45`):**
   - En los primeros sprints no se contaba con webhooks automáticos ni validación estricta de prefijos en Pull Requests, lo que generaba brechas de documentación entre los commits y las tarjetas del tablero. Se resolvió implementando la regla mandatoria `AGENTS.md`, el workflow `pr_title_checker.yml` y el sincronizador API REST con Jira Cloud (`sync_jira.py`).
2. **Restricciones de Memoria en Servidor Virtual para Embeddings (`SCRUM-18` / `SCRUM-31`):**
   - La carga simultánea de librerías de vectorización y modelos en contenedores con RAM acotada requirió optimizar las dependencias del `smartauditoria_engine` e implementar un mecanismo de **Fallback Heurístico SQL (`SCRUM-31`)** para garantizar disponibilidad del 99.9%.
3. **Modelado de los 93 Controles ISO 27002:2022 sin Alucinaciones (`SCRUM-29` / `SCRUM-40`):**
   - Representar y recuperar sin ambigüedad los 93 controles agrupados en 4 dominios (Organizacionales, Personas, Físicos, Tecnológicos) exigió implementar **Target Isolation (`SCRUM-29`)** y **Data Lineage (`SCRUM-30`)** con cita exacta de control.
4. **Sobrecarga Operativa en Desarrollo Unipersonal Multi-Rol:**
   - Asumir simultáneamente los roles de Arquitecto, Desarrollador Fullstack, DevSecOps y Auditor demandó priorizar estrictamente el alcance por iteración y automatizar las pruebas de regresión.

---

## 4. ¿Qué Aprendimos? (Lecciones Aprendidas del Ciclo)

* **Pruebas E2E sobre Producción como Criterio de Cierre (DoD):** Ninguna historia se da por terminada únicamente con compilación local; la validación contra los endpoints HTTPS en el VPS (`200 OK`) evitó regresiones de CORS, sesiones JWT y rutas SPA.
* **Evolución en Espiral para Sistemas de IA (RAG + CAG + HITL):** Combinar recuperación vectorial (RAG), generación aumentada por contexto (CAG) y validación **Human-In-The-Loop (`SCRUM-33`)** mediante chips de acción ofrece el equilibrio óptimo entre automatización inteligente y criterio experto del auditor.
* **Trazabilidad como Activo de Ingeniería:** Vincular cada Historia de Usuario (`HU-001` a `HU-030`) con su clave Jira (`SCRUM-XX`), su Smart Commit y su workflow de GitHub Actions convierte el repositorio en una evidencia forense auditable.

---

## 5. Acciones de Mejora Propuestas y Trazabilidad en el Backlog de Jira

Como resultado directo de esta Retrospectiva (`SCRUM-44`), los compromisos de mejora para el siguiente ciclo (consolidación del Trabajo de Grado / Tesis) fueron **creados, estimados y enlazados formalmente en el Product Backlog de Jira**:

| ID Jira / HU | Acción de Mejora Propuesta | Métrica Cuantitativa Objetivo | Método de Comprobación | Esfuerzo | Estado Jira |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **[SCRUM-46](https://smartauditoria.atlassian.net/browse/SCRUM-46)** (`HU-028`) | **1. Optimización de Latencia Vectorial y Benchmark en ChromaDB** | Tiempo de recuperación semántica $p_{95} < 250\text{ ms}$ sobre los 93 controles ISO 27002:2022. | Pruebas de carga sintética concurrente ejecutadas en `smartauditoria_engine` (`ci.yml`). | 5 SP | `Ready` (Backlog `V4.0`) |
| **[SCRUM-47](https://smartauditoria.atlassian.net/browse/SCRUM-47)** (`HU-029`) | **2. Suite Automatizada de Evaluación Cuantitativa RAGAS en CI/CD** | Puntaje de *Faithfulness* $> 0.85$ y *Context Precision* $> 0.80$ sobre Golden Dataset de 30 casos. | Ejecución automatizada en GitHub Actions (`smartauditoria_engine/.github/workflows/ci.yml`). | 8 SP | `Backlog` (`V4.0`) |
| **[SCRUM-48](https://smartauditoria.atlassian.net/browse/SCRUM-48)** (`HU-030`) | **3. Job Programado de Sincronización GLPI en Tiempo Real y Webhooks Jira** | Respuesta `HTTP 200` en `/api/activos/sync-glpi` programado y pipeline CI/CD $< 4\text{ min}$. | Suite de integración Pytest en `smartauditoria_backend` y pestaña *Actions* de GitHub. | 5 SP | `Backlog` (`V4.0`) |

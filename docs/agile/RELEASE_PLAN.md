# Release Plan — SmartAuditorIA (SGSRI)
**Proyecto:** Gobernanza y Auditoría Inteligente de Activos de Información y Riesgos TI (Trabajo Integrador 2)  
**Herramienta de Control Oficial:** [Jira Software Cloud — Proyecto SCRUM](https://smartauditoria.atlassian.net/jira/software/projects/SCRUM/boards)  
**Metodología:** Scrum / Modelo en Espiral / CRISP-DM  
**Responsable:** Ing. Leonardo Javier Bastidas Moreno  
**Versión Documental:** `v3.2-Final-QC` (Conciliación Forense de Sprints, Releases y Trazabilidad de Despliegue — `2026-11-19`)

---

## 1. Registro Forense de Sprints Reales en Jira Cloud (`customfield_10020`)

A continuación se documentan los **9 contenedores de Sprint registrados en Jira Cloud (`GET /rest/agile/1.0/board/1/sprint`)**, con sus fechas de planificación (`startDate` / `endDate`), sus **fechas reales de cierre administrativo (`completeDate`)** y sus **Sprint Goals** originales:

| ID Jira | Nombre Real del Sprint en Jira | Estado Jira | Inicio (`startDate`) | Fin Plan (`endDate`) | Cierre Real (`completeDate`) | Historias de Origen Único | SP Nuevos | Sprint Goal Registrado en Jira (`goal`) y Observación Forense |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| `40` | `Sprint 1 – Fund del Sistema` | `closed` | `2026-02-22` | `2026-02-28` | `2026-03-18` | `SCRUM-10`..`12` (`HU1`–`HU3`) | **13 SP** | *Goal:* *"Configurar la base técnica del sistema e implementar el registro inicial de activos y la estructura de evaluación de riesgos."* (Arrastradas administrativamente hasta `S4`). |
| `41` | `Sprint 2 Riesgos` | `closed` | `2026-03-18` | `2026-03-18` | `2026-03-18` | `SCRUM-14`..`16` (`HU4`–`HU6`) | **16 SP** | *Goal:* *"Implementar la matriz de riesgos y automatizar el cálculo y clasificación del nivel de riesgo."* (Arrastradas a `Sprint 3 RAG`). |
| `42` | `Sprint 3 RAG` | `closed` | `2026-03-18` | `2026-03-27` | `2026-04-24` | `SCRUM-17`..`19` (`HU7`–`HU9`) | **21 SP** | *Goal:* *"Implementar la base técnica del motor RAG incluyendo procesamiento de documentos ISO y configuración de base vectorial."* |
| `43` | `S4 – Integración RAG` | `closed` | `2026-04-25` | `2026-04-25` | `2026-04-25` | `SCRUM-20`..`22` (`HU10`–`HU12`) | **18 SP** | *Goal:* *"Integrar el motor RAG con el módulo de evaluación de riesgos para generar sugerencias automáticas de controles ISO."* |
| `44` | `S5 – Dashboard` *(+ `id 111` S5-2)* | `closed` | `2026-04-25` | `2026-05-02` | `2026-05-05` | `SCRUM-23`..`25` (`HU13`–`HU15`) | **15 SP** | *Goal:* *"Desarrollar el dashboard ejecutivo para visualización estratégica de riesgos y controles."* (Al cerrarse `S5` y `S5-2` el `2026-05-05` en estado `Ready`, Jira las arrastró a `S7`). |
| `78` | `S5 – Hardening MLOps & Interfa` | `closed` | `2026-04-25` | `2026-04-27` | `2026-05-05` | `SCRUM-29`..`35` (`HU-101`–`HU-301`) | **28 SP** | *Goal:* *"Consolidar la arquitectura inteligente mediante trazabilidad forense (Data Lineage) y métricas de certeza RAG. Rediseñar la interfaz visual hacia un entorno experto, validando el rendimiento del modelo mediante metodologías Human-In-The-Loop y un despliegue silencioso (Shadow Deployment)."* |
| `45` | `S6 – Seguridad` | `closed` | `2026-04-24` | `2026-05-08` | `2026-04-25` | `SCRUM-26`..`28` (`HU16`–`HU18`) | **18 SP** | *Goal:* *"Implementar autenticación segura, control de roles y pipeline básico de despliegue continuo."* |
| `112` | `S7 – Homologación Institucional, Gobernanza RBAC & Cierre` | `active` | `2026-05-09` | `2026-11-15` | *En curso* | `SCRUM-36`..`42`, `44`, `45` (`HU19`–`HU27`) | **60 SP** | *Goal:* *"Completar la homologación institucional con Gobernación del Cauca, gestión de usuarios RBAC, SoA 93 controles ISO 27002, Mapa Oficial DAFP V7, interoperabilidad Excel (.xlsm), trazabilidad GitHub Actions y Retrospectiva del Ciclo."* |
| `-` | `Backlog` *(Sin sprint asignado)* | `future` | `2026-11-13` | `2026-12-15` | *Pendiente* | `SCRUM-46`..`48` (`HU28`–`HU30`) | **18 SP** | Historias de mejora continua post-retrospectiva (`V4.0-Backlog`). |
| **TOTAL** | **37 Ítems Estimados (28 HU + 9 Tareas)** | - | - | - | - | **SCRUM-10 a SCRUM-48** | **207 SP** | **189 SP en Sprints 1–7 (`Done`) + 18 SP en Backlog (`Ready`/`Backlog`)** |

---

## 2. Hitos de Liberación (`Versions` en Jira Cloud) y Trazabilidad Real de Despliegue

> [!IMPORTANT]
> **Distinción Rigurosa entre `Release V2.0`, `Release V3.0` y Mecanismos Reales de Despliegue:**
> - **Segunda Versión Funcional (`Release V2.0` — 48 SP nuevos / 129 SP acumulados):** Corresponde al cierre de los Sprints 5 y 6 (línea base de las ramas `main` del `2026-06-16`: [`backend/e6a764d`](https://github.com/lejabamo/smartauditoria_backend/commit/e6a764d), [`frontend/9421a34`](https://github.com/lejabamo/smartauditoria_frontend/commit/9421a34), [`engine/bf30f33`](https://github.com/lejabamo/smartauditoria_engine/commit/bf30f33)), que consolidó el Dashboard Ejecutivo, el Hardening MLOps y el primer despliegue en VPS.
> - **Versión Desplegada y Operativa Hoy en el VPS (`Release V3.0` — 60 SP adicionales / 189 SP acumulados):** Corresponde a la homologación institucional con la Gobernación del Cauca (ramas `master` del `2026-09-22`: [`backend/b14a243`](https://github.com/lejabamo/smartauditoria_backend/commit/b14a243), [`frontend/c11814f`](https://github.com/lejabamo/smartauditoria_frontend/commit/c11814f), [`engine/182a901`](https://github.com/lejabamo/smartauditoria_engine/commit/182a901), más las entregas de Sprint 7 en `feature/github-pages-showcase`: [`921dfb0`](https://github.com/lejabamo/smartauditoria_backend/commit/921dfb0), [`5eafd76`](https://github.com/lejabamo/smartauditoria_backend/commit/5eafd76), [`73ddbfd`](https://github.com/lejabamo/smartauditoria_backend/commit/73ddbfd), [`e0c4efa`](https://github.com/lejabamo/smartauditoria_backend/commit/e0c4efa)).
> - **Trazabilidad Real de Despliegue (`deploy.yml` vs. SSH Manual):** En GitHub Actions, el workflow automático `deploy.yml` tuvo ejecuciones exitosas demostradas en `smartauditoria_frontend` (`4/5` runs exitosos, incluyendo `9421a34` y `c11814f`) y en `smartauditoria_engine` (`2/4` runs exitosos: `bf30f33` y `182a901`). En cambio, en `smartauditoria_backend` el workflow `deploy.yml` falló en sus 4 ejecuciones remotas; por tanto, **las actualizaciones del backend en el VPS (`https://riesgosti.tics.sedcauca.gov.co`) fueron sincronizadas mediante scripts directos de despliegue SSH (`deploy_paso3_soa.py`, `deploy_paso4_mapa.py`) y verificadas mediante pruebas E2E (`e2e_vps_validation.py`, `test_production.py`), sin afirmar una ejecución verde de CD en GitHub Actions para el repositorio `backend`**.

### 🚀 Release V1.0 — "Baseline: Gobernanza de Activos, Matriz 5x5 y Seguridad Base"
* **ID Versión en Jira:** `V1.0` (`id: 10000`) | **Estado en Jira:** `Released` (`releaseDate: 2026-03-18`)
* **Esfuerzo Asociado:** **42 Story Points** (8 historias: Sprints 1, 2 y seguridad base de Sprint 6)
* **Alcance y Commits Verificados (`HTTP 200`):**
  - [`SCRUM-10`](https://smartauditoria.atlassian.net/browse/SCRUM-10) (`HU-001` | 5 SP | [`backend/724930d`](https://github.com/lejabamo/smartauditoria_backend/commit/724930d)): CRUD de activos, valoración C-I-D y campo `id_externo_glpi` (**Parcial:** cliente REST activo hacia GLPI con `TRAZABILIDAD PENDIENTE` → `HU-030`).
  - [`SCRUM-11`](https://smartauditoria.atlassian.net/browse/SCRUM-11) (`HU-002` | 5 SP | [`backend/790fce3`](https://github.com/lejabamo/smartauditoria_backend/commit/790fce3)): Cálculo de riesgo inherente y residual $RI = P \times I$ (**Aceptada** — `test_entities.py` `12 passed`).
  - [`SCRUM-12`](https://smartauditoria.atlassian.net/browse/SCRUM-12) (`HU-003` | 3 SP | [`backend/953426d`](https://github.com/lejabamo/smartauditoria_backend/commit/953426d)): Entorno multicontenedor Docker Compose & MariaDB (**Aceptada**).
  - [`SCRUM-14`](https://smartauditoria.atlassian.net/browse/SCRUM-14) (`HU-004` | 8 SP | [`frontend/68b7cd5`](https://github.com/lejabamo/smartauditoria_frontend/commit/68b7cd5)): Matriz de calor 5x5 interactiva (**Aceptada**).
  - [`SCRUM-15`](https://smartauditoria.atlassian.net/browse/SCRUM-15) (`HU-005` | 5 SP | [`backend/5078a8f`](https://github.com/lejabamo/smartauditoria_backend/commit/5078a8f)): Persistencia relacional de evaluaciones en MariaDB (**Aceptada**).
  - [`SCRUM-16`](https://smartauditoria.atlassian.net/browse/SCRUM-16) (`HU-006` | 3 SP | [`backend/790fce3`](https://github.com/lejabamo/smartauditoria_backend/commit/790fce3)): Clasificación automática MSIP/MIPG (C-I-D) y Ley 1712 (**Aceptada** — `test_activo_funcion_publica.py` `11 passed`).
  - [`SCRUM-26`](https://smartauditoria.atlassian.net/browse/SCRUM-26) (`HU-016` | 8 SP | [`backend/c767e2b`](https://github.com/lejabamo/smartauditoria_backend/commit/c767e2b)): Autenticación JWT y bloqueo anti-fuerza bruta (**Aceptada**).
  - [`SCRUM-27`](https://smartauditoria.atlassian.net/browse/SCRUM-27) (`HU-017` | 5 SP | [`backend/375f9f5`](https://github.com/lejabamo/smartauditoria_backend/commit/375f9f5)): Control de acceso RBAC (`ADMIN`, `OPERADOR`, `CONSULTOR`) (**Aceptada** — `test_usuarios_auditorias_api.py` `3 passed`).

---

### 🧠 Release V1.5 — "Intelligence: Motor Experto RAG/CAG e Interfaz Wizard"
* **ID Versión en Jira:** `V1.5` (`id: 10001`) | **Estado en Jira:** `Released` (`releaseDate: 2026-04-25`)
* **Esfuerzo Asociado:** **39 Story Points** (6 historias: Sprints 3 y 4)
* **Alcance y Commits Verificados (`HTTP 200`):**
  - [`SCRUM-17`](https://smartauditoria.atlassian.net/browse/SCRUM-17) (`HU-007` | 5 SP | [`engine/0643dd4`](https://github.com/lejabamo/smartauditoria_engine/commit/0643dd4)): Ingestión y chunking normativo ISO (`iso_loader.py`, `test_iso_loader.py` `7 passed` — **Aceptada**).
  - [`SCRUM-18`](https://smartauditoria.atlassian.net/browse/SCRUM-18) (`HU-008` | 8 SP | [`engine/0643dd4`](https://github.com/lejabamo/smartauditoria_engine/commit/0643dd4)): Base vectorial ChromaDB (`chroma_adapter.py`, `chroma.sqlite3` con 85 chunks = **32/93 controles ISO 27002** — **Parcial en cobertura** → `HU-028`).
  - [`SCRUM-19`](https://smartauditoria.atlassian.net/browse/SCRUM-19) (`HU-009` | 8 SP | [`engine/15eb3e2`](https://github.com/lejabamo/smartauditoria_engine/commit/15eb3e2) y [`frontend/0789839`](https://github.com/lejabamo/smartauditoria_frontend/commit/0789839)): Búsqueda semántica Top-K (`retriever.py`, `test_rag_retriever.py` `4 passed`, benchmark real `Precision@3 = 13.3%` — **Aceptada**).
  - [`SCRUM-20`](https://smartauditoria.atlassian.net/browse/SCRUM-20) (`HU-010` | 8 SP | [`engine/8e9669c`](https://github.com/lejabamo/smartauditoria_engine/commit/8e9669c)): Sugerencias automáticas de controles ISO (`suggestions.py`, `test_api.py` `6 passed` — **Aceptada**).
  - [`SCRUM-21`](https://smartauditoria.atlassian.net/browse/SCRUM-21) (`HU-011` | 5 SP | [`engine/8e9669c`](https://github.com/lejabamo/smartauditoria_engine/commit/8e9669c) y [`engine/4889a77`](https://github.com/lejabamo/smartauditoria_engine/commit/4889a77)): Justificación normativa asistida CAG (`gemini_cag_service.py`, `test_copilot_asset_assistant.py` `8 passed` — **Aceptada**).
  - [`SCRUM-22`](https://smartauditoria.atlassian.net/browse/SCRUM-22) (`HU-012` | 5 SP | [`frontend/2070132`](https://github.com/lejabamo/smartauditoria_frontend/commit/2070132)): Wizard paso a paso en React (`useWizardAI.test.ts` `5 passed`, `WizardAIMessageService.test.ts` `18 passed` — **Aceptada**).

---

### ☁️ Release V2.0 — "Compliance & Cloud: Dashboard Ejecutivo, Hardening MLOps y Despliegue VPS (Segunda Versión Funcional)"
* **ID Versión en Jira:** `V2.0` (`id: 10002`) | **Estado en Jira:** `Released` (`releaseDate: 2026-05-08`)
* **Esfuerzo Asociado:** **48 Story Points** (4 historias + 7 tareas técnicas: Sprints 5 y 6)
* **Alcance y Commits Verificados (`HTTP 200`):**
  - [`SCRUM-23`](https://smartauditoria.atlassian.net/browse/SCRUM-23) (`HU-013` | 5 SP | [`frontend/0789839`](https://github.com/lejabamo/smartauditoria_frontend/commit/0789839)), [`SCRUM-24`](https://smartauditoria.atlassian.net/browse/SCRUM-24) (`HU-014` | 5 SP | [`frontend/f649ae5`](https://github.com/lejabamo/smartauditoria_frontend/commit/f649ae5)), [`SCRUM-25`](https://smartauditoria.atlassian.net/browse/SCRUM-25) (`HU-015` | 5 SP | [`frontend/68b7cd5`](https://github.com/lejabamo/smartauditoria_frontend/commit/68b7cd5)): Dashboard ejecutivo, KPIs SGSI y filtros dinámicos (**Aceptadas**).
  - [`SCRUM-28`](https://smartauditoria.atlassian.net/browse/SCRUM-28) (`HU-018` | 5 SP | [`backend/3b7c6c2`](https://github.com/lejabamo/smartauditoria_backend/commit/3b7c6c2)): Pipelines GitHub Actions (**Parcial:** `deploy.yml` exitoso en `frontend` y `engine`; `ci.yml` falló en `backend` `7/7` y `engine` `7/7` → `HU-030`).
  - [`SCRUM-29`](https://smartauditoria.atlassian.net/browse/SCRUM-29) (`HU-101` | 5 SP | [`engine/0643dd4`](https://github.com/lejabamo/smartauditoria_engine/commit/0643dd4)): Target Isolation y sanitización (`test_sanitizer.py` `5 passed` — **Aceptada**).
  - [`SCRUM-30`](https://smartauditoria.atlassian.net/browse/SCRUM-30) (`HU-102` | 5 SP | [`engine/15eb3e2`](https://github.com/lejabamo/smartauditoria_engine/commit/15eb3e2) y [`frontend/849cc9f`](https://github.com/lejabamo/smartauditoria_frontend/commit/849cc9f)): Data Lineage (`tracer.py`, `test_pipeline.py` `5 passed` — **Aceptada**).
  - [`SCRUM-31`](https://smartauditoria.atlassian.net/browse/SCRUM-31) (`HU-103` | 3 SP | [`backend/d245275`](https://github.com/lejabamo/smartauditoria_backend/commit/d245275) y [`engine/0643dd4`](https://github.com/lejabamo/smartauditoria_engine/commit/0643dd4)): Fallback determinístico SQL / catálogo maestro (`test_rag_retriever.py` `4 passed` — **Aceptada**).
  - [`SCRUM-32`](https://smartauditoria.atlassian.net/browse/SCRUM-32) (`HU-201` | 2 SP | [`engine/8e9669c`](https://github.com/lejabamo/smartauditoria_engine/commit/8e9669c)): Auditor Copilot ISO 27002 (`test_copilot_asset_assistant.py` `8 passed` — **Aceptada**).
  - [`SCRUM-33`](https://smartauditoria.atlassian.net/browse/SCRUM-33) (`HU-202` | 5 SP | [`frontend/7df5d51`](https://github.com/lejabamo/smartauditoria_frontend/commit/7df5d51)): Validación HITL con chips interactivos (`ConversationalAuditor.test.tsx` `8 passed` — **Aceptada**).
  - [`SCRUM-34`](https://smartauditoria.atlassian.net/browse/SCRUM-34) (`HU-203` | 3 SP | [`frontend/849cc9f`](https://github.com/lejabamo/smartauditoria_frontend/commit/849cc9f)): Indicador visual de certeza en UI (**Parcial:** script Python `ragas` con `TRAZABILIDAD PENDIENTE` → `HU-029`).
  - [`SCRUM-35`](https://smartauditoria.atlassian.net/browse/SCRUM-35) (`HU-301` | 5 SP | [`backend/6de9c83`](https://github.com/lejabamo/smartauditoria_backend/commit/6de9c83)): Despliegue VPS Cloud (`https://riesgosti.tics.sedcauca.gov.co`) y pruebas E2E (`test_production.py` — **Aceptada**, con sincronización backend vía SSH).

---

### 🏛️ Release V3.0 — "Homologación Institucional Gobernación del Cauca, SoA 93 Controles, DAFP V7 y Cierre Ágil (Versión Operativa en VPS)"
* **ID Versión en Jira:** `V3.0` (`id: 10035`) | **Estado en Jira:** `Released` (`releaseDate: 2026-11-12`)
* **Esfuerzo Asociado:** **60 Story Points** (7 historias + 2 tareas ágiles: Sprint 7)
* **Alcance y Commits Verificados (`HTTP 200`):**
  - [`SCRUM-36`](https://smartauditoria.atlassian.net/browse/SCRUM-36) (`HU-019` | 8 SP | [`backend/73ddbfd`](https://github.com/lejabamo/smartauditoria_backend/commit/73ddbfd)): Gestión de usuarios, roles RBAC y responsables de activos (**Aceptada** — `test_usuarios_flow.py` `passed`).
  - [`SCRUM-37`](https://smartauditoria.atlassian.net/browse/SCRUM-37) (`HU-020` | 5 SP | [`backend/e0c4efa`](https://github.com/lejabamo/smartauditoria_backend/commit/e0c4efa)): Autoservicio de recuperación de contraseña con token JWT (**Aceptada** — `test_usuarios_flow.py` `passed`).
  - [`SCRUM-38`](https://smartauditoria.atlassian.net/browse/SCRUM-38) (`HU-021` | 5 SP | [`frontend/0a3955b`](https://github.com/lejabamo/smartauditoria_frontend/commit/0a3955b)): Identidad institucional Gobernación del Cauca / GOV.CO y PWA (**Aceptada**).
  - [`SCRUM-39`](https://smartauditoria.atlassian.net/browse/SCRUM-39) (`HU-022` | 8 SP | [`backend/790fce3`](https://github.com/lejabamo/smartauditoria_backend/commit/790fce3)): Catálogos DAFP V7 Cap. V y Ley 1712 (`test_activos_funcion_publica_api.py` `2 passed` — **Parcial:** tablas semilla 57/64 de hoja `BÁSICOS` `.xlsm` con `TRAZABILIDAD PENDIENTE`).
  - [`SCRUM-40`](https://smartauditoria.atlassian.net/browse/SCRUM-40) (`HU-023` | 8 SP | [`backend/921dfb0`](https://github.com/lejabamo/smartauditoria_backend/commit/921dfb0)): Declaración de Aplicabilidad SoA 93 Controles ISO 27002:2022 (`test_soa_api.py` `2 passed`, `test_soa_service.py` `4 passed` — **Parcial:** endpoint N:M `/evaluaciones-matriz` con `TRAZABILIDAD PENDIENTE`).
  - [`SCRUM-41`](https://smartauditoria.atlassian.net/browse/SCRUM-41) (`HU-024` | 8 SP | [`frontend/a798f19`](https://github.com/lejabamo/smartauditoria_frontend/commit/a798f19)): Wizard IA con Auditor Copilot ISO 27005 & DAFP V7 (**Parcial:** selector multi-tupla N:M desde catálogo `.xlsm` con `TRAZABILIDAD PENDIENTE`).
  - [`SCRUM-42`](https://smartauditoria.atlassian.net/browse/SCRUM-42) (`HU-025` | 8 SP | [`backend/5eafd76`](https://github.com/lejabamo/smartauditoria_backend/commit/5eafd76) y [`backend/b82261c`](https://github.com/lejabamo/smartauditoria_backend/commit/b82261c)): Carga masiva (`/api/activos/bulk-upload`) y exportación Mapa DAFP V7 (`test_reportes_mapa_api.py` `3 passed`, `test_activos_bulk_api.py` `2 passed` — **Parcial:** rutas literales `/api/activos/import-excel` y `/api/riesgos/export-excel` para macros `.xlsm` con `TRAZABILIDAD PENDIENTE`).
  - [`SCRUM-44`](https://smartauditoria.atlassian.net/browse/SCRUM-44) (`HU-026` | 5 SP | [`frontend/02d09f2`](https://github.com/lejabamo/smartauditoria_frontend/commit/02d09f2)): Retrospectiva de Ciclo Ágil (`RETROSPECTIVA_PROYECTO.md` y `20260320_Retrospectiva_Ciclo.html` — **Aceptada**).
  - [`SCRUM-45`](https://smartauditoria.atlassian.net/browse/SCRUM-45) (`HU-027` | 5 SP | [`backend/db30e2f`](https://github.com/lejabamo/smartauditoria_backend/commit/db30e2f)): Regla `AGENTS.md` en remoto; workflow `pr_title_checker.yml` en commit local `30bb249` (**Parcial: pendiente de push**).

---

### 🔮 Release V4.0-Backlog — "Mejora Continua Post-Retrospectiva y Consolidación Tesis"
* **ID Versión en Jira:** `V4.0-Backlog` (`id: 10036`) | **Estado en Jira:** `Unreleased` (`releaseDate: 2026-12-15`)
* **Esfuerzo Estimado:** **18 Story Points** (3 historias en Product Backlog derivadas de las 4 acciones de mejora de `SCRUM-44`)
* **Propuestas Futuras (`TRAZABILIDAD PENDIENTE` — No implementadas aún):**
  - [`SCRUM-46`](https://smartauditoria.atlassian.net/browse/SCRUM-46) (`HU-028` | 5 SP | `Ready` | Commit: `TRAZABILIDAD PENDIENTE`): Re-indexación completa de los 93 controles ISO 27002:2022 en ChromaDB (superando la cobertura actual de 32/93 y `Precision@3 = 13.3%`) con latencia $p_{95} < 250\text{ ms}$.
  - [`SCRUM-47`](https://smartauditoria.atlassian.net/browse/SCRUM-47) (`HU-029` | 8 SP | `Backlog` | Commit: `TRAZABILIDAD PENDIENTE`): Suite automatizada de evaluación cuantitativa `ragas` (*Faithfulness* $> 0.85$) en GitHub Actions.
  - [`SCRUM-48`](https://smartauditoria.atlassian.net/browse/SCRUM-48) (`HU-030` | 5 SP | `Backlog` | Commit: `TRAZABILIDAD PENDIENTE`): Corrección de pipelines `ci.yml` ($< 4\text{ min}$, 100% verde), Webhooks Jira y conector programado `/api/activos/sync-glpi`.

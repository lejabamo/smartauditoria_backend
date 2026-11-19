# Retrospectiva del Ciclo Ágil — SmartAuditorIA (SGSRI)
**Proyecto:** Gobernanza y Auditoría Inteligente de Activos de Información y Riesgos TI  
**Programa:** Maestría en Computación para el Desarrollo de Aplicaciones Inteligentes — Universidad del Valle  
**Autor / Roles Desempeñados:** Ing. Leonardo Javier Bastidas Moreno (*Product Owner, Arquitecto de Software, Desarrollador Fullstack, Ingeniero MLOps y Auditor Líder*)  
**Ticket Jira Asociado:** [SCRUM-44](https://smartauditoria.atlassian.net/browse/SCRUM-44) (`[HU-026] HU26 – Ceremonia de Retrospectiva de Ciclo Ágil (Sprints 1 a 7)`)  
**Archivo Histórico Preservado:** [`docs/showcase/historical/20260320_Retrospectiva_Ciclo.html`](file:///c:/Users/Administrador1/Desktop/Riesgos/smartauditoria_project/docs/showcase/historical/20260320_Retrospectiva_Ciclo.html) (`HTTP 200` en https://lejabamo.github.io/smartauditoria_frontend/20260320_Retrospectiva_Ciclo.html)  
**Versión Documental:** `v3.2-Final-QC` (Conciliación Experimental y Trazabilidad de Mejoras — `2026-11-19`)

---

## 1. Trazabilidad Cronológica de Sprints (Diferenciación entre Evidencia Histórica, Actualización Retrospectiva y Propuestas Futuras)

| Sprint (ID Jira) | Nombre Real en Jira Cloud | Ventana Planificada | Fecha Real de Cierre (`completeDate`) | Historias Originales del Sprint | SP Nuevos | Naturaleza del Registro |
| :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| **Sprint 1** (`id 40`) | `Sprint 1 – Fund del Sistema` | `2026-02-22` → `2026-02-28` | `2026-03-18` | `SCRUM-10` (HU1), `SCRUM-11` (HU2), `SCRUM-12` (HU3) | **13 SP** | **Histórico** *(arrastradas en tablero hasta S4)* |
| **Sprint 2** (`id 41`) | `Sprint 2 Riesgos` | `2026-03-18` → `2026-03-18` | `2026-03-18` | `SCRUM-14` (HU4), `SCRUM-15` (HU5), `SCRUM-16` (HU6) | **16 SP** | **Histórico** *(arrastradas en tablero hasta S3)* |
| **Sprint 3** (`id 42`) | `Sprint 3 RAG` | `2026-03-18` → `2026-03-27` | `2026-04-24` | `SCRUM-17` (HU7), `SCRUM-18` (HU8), `SCRUM-19` (HU9) | **21 SP** | **Histórico** |
| **Sprint 4** (`id 43`) | `S4 – Integración RAG` | `2026-04-25` → `2026-04-25` | `2026-04-25` | `SCRUM-20` (HU10), `SCRUM-21` (HU11), `SCRUM-22` (HU12) | **18 SP** | **Histórico** |
| **Sprint 5A** (`id 44`) | `S5 – Dashboard` *(+ `id 111` S5-2)* | `2026-04-25` → `2026-05-02` | `2026-05-05` | `SCRUM-23` (HU13), `SCRUM-24` (HU14), `SCRUM-25` (HU15) | **15 SP** | **Histórico** *(arrastradas automáticamente a S7 al cerrar S5 en estado Ready)* |
| **Sprint 5B** (`id 78`) | `S5 – Hardening MLOps & Interfa` | `2026-04-25` → `2026-04-27` | `2026-05-05` | `SCRUM-29`..`35` (`HU-101` a `HU-301`) | **28 SP** | **Histórico** |
| **Sprint 6** (`id 45`) | `S6 – Seguridad` | `2026-04-24` → `2026-05-08` | `2026-04-25` | `SCRUM-26` (HU16), `SCRUM-27` (HU17), `SCRUM-28` (HU18) | **18 SP** | **Histórico** |
| **Sprint 7** (`id 112`) | `S7 – Homologación Institucional, Gobernanza RBAC & Cierre` | `2026-05-09` → `2026-11-15` | *Activo (Consolidado 2026-11-12)* | `SCRUM-36`..`42` (HU19–25), `SCRUM-44` (HU26), `SCRUM-45` (HU27) | **60 SP** | **Actualización Sprint 7** *(homologación institucional + cierre documental)* |
| **Backlog** (`V4.0`) | `Product Backlog (Post-Retrospectiva)` | `2026-11-13` → `2026-12-15` | *Pendiente* | `SCRUM-46` (HU28), `SCRUM-47` (HU29), `SCRUM-48` (HU30) | **18 SP** | **Propuesta Futura (`TRAZABILIDAD PENDIENTE`)** |
| **TOTAL** | **37 Ítems Estimados (28 HU + 9 Tareas)** | - | - | `SCRUM-10` a `SCRUM-48` (sin `SCRUM-13`) | **207 SP** | **189 SP en Sprints 1–7 (`Done`: 136 SP Completamente Aceptados [26 ítems] + 53 SP con Aceptación Parcial [8 ítems]) + 18 SP en Backlog [3 ítems]** |

---

## 2. ¿Qué Funcionó Bien? (Fortalezas Verificadas con 111 Pruebas Locales y VPS en Vivo)

1. **Suite de Pruebas Unitarias y de Integración (`111 passed, 0 failed` en entorno local):**
   - `smartauditoria_backend/tests`: **45 tests aprobados** (`8.14 s`) cubriendo entidades de dominio, cálculo $RI = P \times I$, clasificación DAFP V7/Ley 1712, carga masiva Excel, SoA de 93 controles, Mapa DAFP V7 y gestión de usuarios/RBAC.
   - `smartauditoria_engine/tests`: **35 tests aprobados** (`7.81 s`) cubriendo loader ISO, sanitizador, retriever con fallback, pipeline RAG y asistente Copilot.
   - `smartauditoria_frontend`: **31 tests Vitest aprobados** (`10.65 s`) cubriendo `WizardAIMessageService`, `useWizardAI` y `ConversationalAuditor`.
2. **Motor Experto Híbrido RAG + CAG + Fallback Determinístico (`SCRUM-17` a `SCRUM-22`, `SCRUM-29` a `SCRUM-33`):**
   - El desacoplamiento entre la recuperación vectorial (`chroma_adapter.py`) y el servicio de sugerencias con catálogo maestro de 93 controles (`iso_suggestions_service.py` / `gemini_cag_service.py`) garantiza que el auditor siempre reciba controles ISO/IEC 27002:2022 válidos.
3. **Gobernanza RBAC, Recuperación de Contraseñas, SoA 93 Controles y Mapa DAFP V7 (`SCRUM-36` a `SCRUM-42`):**
   - Operativos en el VPS institucional (`https://riesgosti.tics.sedcauca.gov.co`) con certificado SSL Let's Encrypt válido.

---

## 3. ¿Qué Dificultades e Inconsistencias Técnicas se Identificaron? (Evidencia Empírica)

1. **Cobertura Parcial en ChromaDB Diagnosticada mediante Benchmark Experimental (`SCRUM-18` / `SCRUM-19`):**
   - Al ejecutar el benchmark real ([`scratch/run_benchmark_rag.py`](file:///c:/Users/Administrador1/Desktop/Riesgos/smartauditoria_project/scratch/run_benchmark_rag.py)) sobre los **85 chunks** de `chroma.sqlite3` con `sentence-transformers/all-MiniLM-L6-v2`, se demostró que el PDF ingerido (`ISO_27001_2022_Espa_.pdf.pdf`) sólo contiene **32 de los 93 controles (34.4%)**, arrojando **`Precision@3 = 13.3%`** (`0.1333`) y latencias de **$p_{50} = 13.60\text{ ms}$** y **$p_{95} = 161.68\text{ ms}$**.
2. **Fallas en Ejecuciones Remotas de `ci.yml` y `deploy.yml` de Backend en GitHub Actions (`SCRUM-28` / `SCRUM-35`):**
   - Mientras `deploy.yml` y `pages-build-deployment` tuvieron éxito en `smartauditoria_frontend` (`8/9` runs) y `smartauditoria_engine` (`2/4` runs de deploy), **`ci.yml` falló en `smartauditoria_backend` (`7/7`) y `smartauditoria_engine` (`7/7`)**, y el backend fue sincronizado al VPS mediante scripts SSH manuales.
3. **Alcance Parcial frente a Especificaciones Literales de GLPI, RAGAS y Plantilla `.xlsm` (`SCRUM-10`, `SCRUM-34`, `SCRUM-39` a `SCRUM-42`):**
   - Documentados explícitamente con estado **`TRAZABILIDAD PENDIENTE`** en los sub-criterios no implementados.

---

## 4. Las 4 Acciones de Mejora y su Correspondencia con el Product Backlog (`HU-028` a `HU-030`)

| # Acción (Retrospectiva) | Descripción de la Acción de Mejora | Línea Base Experimental Actual | Métrica Cuantitativa Objetivo | Historia en Backlog Jira (`V4.0-Backlog`) | Esfuerzo | Estado de Implementación |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **Acción 1** | **Re-indexación de los 93 Controles ISO 27002:2022 y Benchmark en ChromaDB** | Cobertura `32/93` controles (`34.4%`), `Precision@3 = 13.3%`, $p_{50} = 13.60\text{ ms}$, $p_{95} = 161.68\text{ ms}$. | Cobertura `93/93` (`100%`), `Precision@3` $\ge 0.70$ y latencia $p_{95} < 250\text{ ms}$. | **[SCRUM-46](https://smartauditoria.atlassian.net/browse/SCRUM-46)** (`HU-028`) | 5 SP | 📋 `Ready` (`TRAZABILIDAD PENDIENTE`) |
| **Acción 2** | **Suite Automatizada de Evaluación Cuantitativa `ragas` en Python** | Sólo badge visual en UI (`SCRUM-34`); sin paquete `ragas` en Python. | *Faithfulness* $> 0.85$ y *Context Precision* $> 0.80$ sobre Golden Dataset en CI. | **[SCRUM-47](https://smartauditoria.atlassian.net/browse/SCRUM-47)** (`HU-029`) | 8 SP | 📋 `Backlog` (`TRAZABILIDAD PENDIENTE`) |
| **Acción 3** | **Estabilización de Pipelines CI/CD (`100% verde`) y Webhooks Jira–GitHub** | `111 tests` pasan localmente, pero `ci.yml` falla `7/7` en runners de `backend` y `engine`. | Ejecución `conclusion: success` en `ci.yml` de los 3 repositorios en $< 4\text{ min}$. | **[SCRUM-48](https://smartauditoria.atlassian.net/browse/SCRUM-48)** (`HU-030`, Parte A) + **[SCRUM-45](https://smartauditoria.atlassian.net/browse/SCRUM-45)** (`HU-027`) | 5 SP *(compartido en HU-030)* | 📋 `Backlog` (`TRAZABILIDAD PENDIENTE`) |
| **Acción 4** | **Servicio de Ingesta y Sincronización Periódica con GLPI** | Columna pasiva `id_externo_glpi` en `models.py` (`SCRUM-10`). | Respuesta `HTTP 200` en endpoint `/api/activos/sync-glpi` con mapeo C-I-D. | **[SCRUM-48](https://smartauditoria.atlassian.net/browse/SCRUM-48)** (`HU-030`, Parte B) | *(Incluido en los 5 SP de HU-030)* | 📋 `Backlog` (`TRAZABILIDAD PENDIENTE`) |

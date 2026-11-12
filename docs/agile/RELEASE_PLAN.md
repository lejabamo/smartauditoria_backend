# Release Plan — SmartAuditorIA (SGSRI)
**Proyecto:** Gobernanza y Auditoría Inteligente de Activos de Información y Riesgos TI (Trabajo Integrador 2)  
**Herramienta de Control Oficial:** [Jira Software Cloud — Proyecto SCRUM](https://smartauditoria.atlassian.net/jira/software/projects/SCRUM/boards)  
**Metodología:** Scrum / Modelo en Espiral / CRISP-DM  
**Responsable:** Ing. Leonardo Javier Bastidas Moreno

---

## 1. Planificación de Capacidad y Balanceo de Iteraciones

El **Release Plan** fue diseñado y controlado directamente en **Jira Software (`Versions` y `Sprints`)**, contemplando todas las Historias de Usuario identificadas (`HU-001` a `HU-030` / `SCRUM-10` a `SCRUM-48`), sus fechas de inicio y entrega (`startDate` y `duedate`), y su estimación de esfuerzo en **Story Points (SP)** mediante serie Fibonacci ($2, 3, 5, 8$).

* **Dedicación y Descuento por Ceremonias Ágiles:**
  - En cada Sprint se reserva un **15% del tiempo de dedicación** para ceremonias Scrum (*Sprint Planning, Daily Check individual, Sprint Review, Pruebas E2E en VPS y Sprint Retrospective*).
  - La velocidad efectiva se balanceó progresivamente entre **13 SP y 25 SP por quincena**, apoyada por herramientas de asistencia de codificación y automatización CI/CD en GitHub Actions.

---

## 2. Hitos de Liberación (Releases en Jira Cloud)

### 🚀 Release V1.0 — "Baseline: Gobernanza de Activos, Matriz 5x5 y Seguridad Base"
* **ID Versión en Jira:** `V1.0` (`id: 10000`) | **Estado:** ✅ **LIBERADO (`Released`)**
* **Ventana de Ejecución:** `2026-02-22` al `2026-03-18` (*Sprints 1 y 2 — Evaluado en Sesión 2*)
* **Esfuerzo Total Entregado:** **42 Story Points** (incluyendo historias transversales de seguridad JWT/RBAC inicial)
* **Productos e Historias Entregadas:**
  - [`SCRUM-10`](https://smartauditoria.atlassian.net/browse/SCRUM-10) (`HU-001` | 5 SP): Registro de activos de información e integración REST con GLPI (`2026-02-28`).
  - [`SCRUM-11`](https://smartauditoria.atlassian.net/browse/SCRUM-11) (`HU-002` | 5 SP): Motor de cálculo de nivel de riesgo inherente y residual $RI = P \times I$ (`2026-02-28`).
  - [`SCRUM-12`](https://smartauditoria.atlassian.net/browse/SCRUM-12) (`HU-003` | 3 SP): Configuración del entorno base multicontenedor Docker Compose & MariaDB (`2026-02-26`).
  - [`SCRUM-14`](https://smartauditoria.atlassian.net/browse/SCRUM-14) (`HU-004` | 8 SP): Implementación de matriz de calor de riesgos 5x5 interactiva (`2026-03-18`).
  - [`SCRUM-15`](https://smartauditoria.atlassian.net/browse/SCRUM-15) (`HU-005` | 5 SP): Persistencia relacional de evaluaciones de riesgo en MariaDB (`2026-03-18`).
  - [`SCRUM-16`](https://smartauditoria.atlassian.net/browse/SCRUM-16) (`HU-006` | 3 SP): Clasificación automática del nivel de riesgo MSIP/MIPG (C-I-D) (`2026-03-18`).
  - [`SCRUM-26`](https://smartauditoria.atlassian.net/browse/SCRUM-26) (`HU-016` | 8 SP): Autenticación segura con tokens JWT y protección anti-fuerza bruta (`2026-05-01`).
  - [`SCRUM-27`](https://smartauditoria.atlassian.net/browse/SCRUM-27) (`HU-017` | 5 SP): Control de acceso basado en roles RBAC (`ADMIN`, `OPERADOR`, `CONSULTOR`) (`2026-05-04`).

---

### 🧠 Release V1.5 — "Intelligence: Motor Experto RAG/CAG e Interfaz Wizard"
* **ID Versión en Jira:** `V1.5` (`id: 10001`) | **Estado:** ✅ **LIBERADO (`Released`)**
* **Ventana de Ejecución:** `2026-03-19` al `2026-04-25` (*Sprints 3 y 4*)
* **Esfuerzo Total Entregado:** **39 Story Points**
* **Productos e Historias Entregadas:**
  - [`SCRUM-17`](https://smartauditoria.atlassian.net/browse/SCRUM-17) (`HU-007` | 5 SP): Procesamiento y chunking de documentos normativos ISO 27001/27002/27005 (`2026-03-25`).
  - [`SCRUM-18`](https://smartauditoria.atlassian.net/browse/SCRUM-18) (`HU-008` | 8 SP): Configuración de base de conocimiento vectorial persistente en ChromaDB (`2026-03-27`).
  - [`SCRUM-19`](https://smartauditoria.atlassian.net/browse/SCRUM-19) (`HU-009` | 8 SP): Búsqueda semántica Top-K de controles ISO 27002:2022 (`2026-04-10`).
  - [`SCRUM-20`](https://smartauditoria.atlassian.net/browse/SCRUM-20) (`HU-010` | 8 SP): Generación de sugerencias automáticas de controles ISO con IA (RAG) (`2026-04-20`).
  - [`SCRUM-21`](https://smartauditoria.atlassian.net/browse/SCRUM-21) (`HU-011` | 5 SP): Redacción de justificación normativa contextual asistida (CAG) (`2026-04-25`).
  - [`SCRUM-22`](https://smartauditoria.atlassian.net/browse/SCRUM-22) (`HU-012` | 5 SP): Visualización de sugerencias de controles en interfaz Wizard paso a paso (`2026-04-25`).

---

### ☁️ Release V2.0 — "Compliance & Cloud: Dashboard Ejecutivo, Hardening MLOps y Despliegue VPS"
* **ID Versión en Jira:** `V2.0` (`id: 10002`) | **Estado:** ✅ **LIBERADO (`Released`)**
* **Ventana de Ejecución:** `2026-04-26` al `2026-05-08` (*Sprints 5 y 6 — Evaluado en Sesión 3*)
* **Esfuerzo Total Entregado:** **48 Story Points**
* **Productos e Historias Entregadas:**
  - [`SCRUM-23`](https://smartauditoria.atlassian.net/browse/SCRUM-23) (`HU-013` | 5 SP): Visualización de riesgos clasificados por nivel en Dashboard (`2026-05-02`).
  - [`SCRUM-24`](https://smartauditoria.atlassian.net/browse/SCRUM-24) (`HU-014` | 5 SP): Indicadores clave de gestión de riesgos (KPIs SGSI) (`2026-05-03`).
  - [`SCRUM-25`](https://smartauditoria.atlassian.net/browse/SCRUM-25) (`HU-015` | 5 SP): Filtrado dinámico de riesgos por activo de información y criticidad (`2026-05-04`).
  - [`SCRUM-28`](https://smartauditoria.atlassian.net/browse/SCRUM-28) (`HU-018` | 5 SP): Pipeline de integración y despliegue continuo en GitHub Actions (`ci.yml`, `deploy.yml`) (`2026-05-08`).
  - [`SCRUM-29`](https://smartauditoria.atlassian.net/browse/SCRUM-29) (`HU-101` | 5 SP): Aislamiento contextual normativo en motor RAG (*Target Isolation*) (`2026-04-27`).
  - [`SCRUM-30`](https://smartauditoria.atlassian.net/browse/SCRUM-30) (`HU-102` | 5 SP): Trazabilidad matemática y forense de respuestas IA (*Data Lineage*) (`2026-04-27`).
  - [`SCRUM-31`](https://smartauditoria.atlassian.net/browse/SCRUM-31) (`HU-103` | 3 SP): Tolerancia a fallos heurísticos y resiliencia (*Fallback SQL*) (`2026-04-27`).
  - [`SCRUM-32`](https://smartauditoria.atlassian.net/browse/SCRUM-32) (`HU-201` | 2 SP): Rediseño tonal de IA auditora experta (*Auditor Copilot ISO 27002*) (`2026-04-28`).
  - [`SCRUM-33`](https://smartauditoria.atlassian.net/browse/SCRUM-33) (`HU-202` | 5 SP): Validación *Human-In-The-Loop* con chips de acción interactivos (`2026-04-29`).
  - [`SCRUM-34`](https://smartauditoria.atlassian.net/browse/SCRUM-34) (`HU-203` | 3 SP): Medición visual de certeza y métricas RAGAS (*Confidence Flagging*) (`2026-04-30`).
  - [`SCRUM-35`](https://smartauditoria.atlassian.net/browse/SCRUM-35) (`HU-301` | 5 SP): Despliegue en producción VPS Cloud con SSL (`riesgosti.tics.sedcauca.gov.co`) y validación E2E (`2026-05-05`).

---

### 🏛️ Release V3.0 — "Homologación Institucional Gobernación del Cauca, SoA 93 Controles, DAFP V7 y Cierre Ágil"
* **ID Versión en Jira:** `V3.0` (`id: 10035`) | **Estado:** ✅ **LIBERADO (`Released`)**
* **Ventana de Ejecución:** `2026-05-09` al `2026-11-12` (*Sprint 7 — Entrega Final Consolidada*)
* **Esfuerzo Total Entregado:** **60 Story Points**
* **Productos e Historias Entregadas:**
  - [`SCRUM-36`](https://smartauditoria.atlassian.net/browse/SCRUM-36) (`HU-019` | 8 SP): Módulo integral de gestión de usuarios, roles RBAC y responsables de activos (`2026-05-20`).
  - [`SCRUM-37`](https://smartauditoria.atlassian.net/browse/SCRUM-37) (`HU-020` | 5 SP): Autoservicio y recuperación segura de contraseñas con token JWT (`2026-05-25`).
  - [`SCRUM-38`](https://smartauditoria.atlassian.net/browse/SCRUM-38) (`HU-021` | 5 SP): Alineación estética e identidad institucional Gobernación del Cauca y PWA (`2026-06-01`).
  - [`SCRUM-39`](https://smartauditoria.atlassian.net/browse/SCRUM-39) (`HU-022` | 8 SP): Armonización de catálogos maestros DAFP V7, Ley 1712 y escala CIA 1-5 (`2026-06-20`).
  - [`SCRUM-40`](https://smartauditoria.atlassian.net/browse/SCRUM-40) (`HU-023` | 8 SP): Evaluación multidimensional de riesgos y Declaración de Aplicabilidad (SoA 93 Controles ISO 27002:2022) (`2026-07-15`).
  - [`SCRUM-41`](https://smartauditoria.atlassian.net/browse/SCRUM-41) (`HU-024` | 8 SP): Adaptación del Wizard IA con Auditor Copilot (ISO 27005 & DAFP V7) y Matriz 5x5 (`2026-08-10`).
  - [`SCRUM-42`](https://smartauditoria.atlassian.net/browse/SCRUM-42) (`HU-025` | 8 SP): Importación/Exportación masiva Excel (`.xlsm`/`.xlsx`) y Mapa Oficial de Riesgos DAFP V7 (`2026-09-15`).
  - [`SCRUM-44`](https://smartauditoria.atlassian.net/browse/SCRUM-44) (`HU-026` | 5 SP): Ceremonia de Retrospectiva de Ciclo Ágil (Sprints 1 a 7), Evaluación RAGAS y Plan de Mejora Continua (`2026-11-12`).
  - [`SCRUM-45`](https://smartauditoria.atlassian.net/browse/SCRUM-45) (`HU-027` | 5 SP): Automatización de Trazabilidad GitHub Actions ↔ Jira Smart Commits y Showcase Académico (`2026-11-12`).

---

### 🔮 Release V4.0-Backlog — "Mejora Continua Post-Retrospectiva y Consolidación Tesis"
* **ID Versión en Jira:** `V4.0-Backlog` (`id: 10036`) | **Estado:** 📋 **PLANIFICADO EN BACKLOG (`Unreleased`)**
* **Ventana Programada:** `2026-11-13` al `2026-12-15`
* **Esfuerzo Estimado:** **18 Story Points**
* **Historias Derivadas de la Retrospectiva (`SCRUM-44`):**
  - [`SCRUM-46`](https://smartauditoria.atlassian.net/browse/SCRUM-46) (`HU-028` | 5 SP): Optimización de latencia vectorial ($<250\text{ ms}$) y benchmark sintético en ChromaDB (`2026-11-28`).
  - [`SCRUM-47`](https://smartauditoria.atlassian.net/browse/SCRUM-47) (`HU-029` | 8 SP): Suite automatizada de evaluación cuantitativa RAGAS (*Faithfulness* $> 0.85$) en GitHub Actions (`2026-12-05`).
  - [`SCRUM-48`](https://smartauditoria.atlassian.net/browse/SCRUM-48) (`HU-030` | 5 SP): Job programado de sincronización GLPI en tiempo real y webhooks Jira (`2026-12-15`).

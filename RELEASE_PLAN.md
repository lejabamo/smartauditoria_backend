# SmartAuditorIA: Release Plan (Puntos de Liberación)

Este documento detalla los tres hitos de liberación (Release Points) definidos para el proyecto SmartAuditorIA, alineando el desarrollo técnico con los objetivos estratégicos de gestión de riesgos institucional.

---

## 🚀 Punto de Liberación 1: Baseline & Inventario (V1.0)
**Foco**: Establecer la base de datos y el inventario de activos.

### Características Clave:
- **Gestión de Activos**: Registro y clasificación de activos (Hardware, Software, Datos, Usuarios).
- **Dimensiones CIA**: Asignación de niveles de Confidencialidad, Integridad y Disponibilidad.
- **Autenticación**: Implementación de seguridad JWT y control de roles básicos.
- **Base de Datos**: Esquema relacional consolidado para el SGSI.

---

## 🧠 Punto de Liberación 2: Inteligencia & Riesgos (V1.5)
**Foco**: Integración de IA y automatización de la evaluación.

### Características Clave:
- **Motor RAG V1**: Integración de ChromaDB con normativa ISO 27001/27005.
- **Wizard Interactivo**: Flujo guiado para la evaluación de riesgos inherentes y residuales.
- **Avatar Conversacional**: Asistente "Holográfico" interactivo para guiar al auditor.
- **Sugerencias Inteligentes**: Generación automática de controles sugeridos basados en el contexto del activo.

---

## 🛡️ Punto de Liberación 3: Auditoría & Cumplimiento (V2.0)
**Foco**: Control institucional, no conformidades y mejora continua.

### Características Clave:
- **Control de Auditoría**: Módulo para la planificación y ejecución de auditorías internas.
- **Gestión de No Conformidades**: Registro, evaluación y análisis de causa raíz de hallazgos.
- **Planes de Acción**: Seguimiento de acciones correctivas con fechas límite y responsables.
- **Dashboard Ejecutivo**: Visualización de métricas de cumplimiento y estado de mitigación de riesgos.

---

## 📅 Resumen de Trazabilidad
| Hito | Estado | Versión | Épicas Relacionadas |
|------|--------|---------|---------------------|
| Baseline | Completado | 1.0.0 | SS-1, SS-5 |
| Inteligencia | En Progreso | 1.5.0 | SS-2, SS-3 |
| Cumplimiento | Planificado | 2.0.0 | SS-4, New-Audit |

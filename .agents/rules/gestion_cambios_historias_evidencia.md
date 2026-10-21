---
title: Gestión de Cambios, Historias de Usuario y Evidencias de Proyecto
trigger: always_on
description: Regla de trazabilidad para que todos los cambios queden registrados como historias de usuario con evidencia en repositorios.
---

# Regla: Gestión de Cambios vinculada a Historias de Usuario y Evidencias

## Propósito
Garantizar que todo cambio técnico, refactorización, despliegue o ejecución quede formalmente asociado a una Historia de Usuario (HU) en el backlog y en Jira, contando con evidencia reproducible (commits, pruebas automatizadas, logs y capturas) en los repositorios correspondientes.

## Directrices Operativas
1. **Asociación Previa:** Antes de ejecutar o dar por terminado un cambio, identificar o crear la historia `HU-XXX` y ticket Jira `[SCRUM-XX]` en:
   - `docs/agile/PRODUCT_BACKLOG.md`
   - `docs/agile/jira_integrador_2.csv`
2. **Formato de Commits:** Utilizar Smart Commits con sintaxis:
   `[SCRUM-XX][HU-YYY] <tipo>(<alcance>): <mensaje>`
3. **Registro de Evidencia:**
   - Script de prueba o resultado de ejecución (`e2e_vps_validation.py`, `pytest`, etc.).
   - Hash del commit git con los archivos modificados.
   - Estado del despliegue en VPS / entorno de producción con código de respuesta HTTP.
4. **Cierre de Ciclo:**
   - Actualizar el backlog marcando los criterios de aceptación cumplidos.
   - Actualizar el CSV de Jira para sincronización de gestión del proyecto.

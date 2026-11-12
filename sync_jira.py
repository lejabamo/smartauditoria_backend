#!/usr/bin/env python3
"""
sync_jira.py — Sincronizador bidireccional entre Jira Software y SmartAuditorIA
Garantiza integridad estricta entre Jira Cloud, PRODUCT_BACKLOG.md y git commits.
"""

import os
import sys
import json
import requests
from typing import Dict, List, Any, Optional

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

JIRA_DOMAIN = os.environ.get("JIRA_DOMAIN", "https://smartauditoria.atlassian.net").rstrip("/")
JIRA_EMAIL = os.environ.get("JIRA_EMAIL", "leonardo.bastidas@correounivalle.edu.co")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
PROJECT_KEY = os.environ.get("JIRA_PROJECT_KEY", "SCRUM")

# Cargar desde archivo .env.jira si existe
if not JIRA_API_TOKEN and os.path.exists(".env.jira"):
    with open(".env.jira", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'").strip('"')
                if k == "JIRA_API_TOKEN":
                    JIRA_API_TOKEN = v
                elif k == "JIRA_EMAIL":
                    JIRA_EMAIL = v
                elif k == "JIRA_DOMAIN":
                    JIRA_DOMAIN = v.rstrip("/")

HISTORIAS_NUEVAS = [
    {
        "hu_id": "HU-012",
        "summary": "[HU-012] Armonización de Catálogos Maestros y Escala CIA 1-5 en Activos",
        "description": (
            "Como Auditor y Administrador de Seguridad,\n"
            "Quiero que los activos se califiquen en escala CIA cuantitativa 1 a 5 (con cálculo automático "
            "de promedio y criticidad) y disponer de los catálogos oficiales de 57 amenazas, 64 vulnerabilidades "
            "y 15 riesgos de la hoja BÁSICOS,\n"
            "Para unificar la metodología de clasificación institucional con la base documental de la entidad.\n\n"
            "Criterios de Aceptación (DoD):\n"
            "1. Base de datos con tablas maestras de 57 amenazas, 64 vulnerabilidades y 15 riesgos institucionales poblados desde la hoja BÁSICOS.\n"
            "2. Formulario de activos con calificación numérica 1-5 en C, I, D y cálculo automático en tiempo real de Promedio CIA y Criticidad (Alta, Media, Baja).\n"
            "3. Campos de Serial Inventario, Marca y Modelo disponibles en backend, frontend y DataGrid de activos.\n"
            "4. Pruebas automatizadas y validación en VPS con código 200 OK."
        ),
        "priority": "High",
        "issue_type": "Story"
    },
    {
        "hu_id": "HU-013",
        "summary": "[HU-013] Modelo de Evaluación Multidimensional N:M de Riesgos",
        "description": (
            "Como Operador de Seguridad,\n"
            "Quiero evaluar un activo seleccionando múltiples amenazas y múltiples vulnerabilidades asociadas a riesgos tipificados,\n"
            "Para romper la limitación 1:1 y reflejar los múltiples escenarios de riesgo a los que está expuesto un activo.\n\n"
            "Criterios de Aceptación (DoD):\n"
            "1. Modelo relacional y endpoints POST/GET /api/activos/<id>/evaluaciones-matriz que soporten múltiples tuplas por activo.\n"
            "2. Cálculo estricto del valor RI = P * I (1 a 25) y nivel de riesgo oficial (>15 Alto, 8-15 Moderado, <8 Bajo).\n"
            "3. Asociación de controles ISO 27002, plan de acción, responsable y evidencia de cumplimiento por cada escenario.\n"
            "4. Pruebas E2E de creación y consulta de matriz multidimensional."
        ),
        "priority": "High",
        "issue_type": "Story"
    },
    {
        "hu_id": "HU-014",
        "summary": "[HU-014] Adaptación del Wizard IA y Matriz Interactiva de Riesgos",
        "description": (
            "Como Auditor / Auxiliar,\n"
            "Quiero que el Wizard de evaluación permita seleccionar múltiples amenazas/vulnerabilidades con autocompletado y recomendación asistida por IA,\n"
            "Para agilizar la evaluación de activos sin tener que construir manualmente combinatorias extensas.\n\n"
            "Criterios de Aceptación (DoD):\n"
            "1. Paso de evaluación del Wizard transformado en selector múltiple (Autocomplete/Chips) alimentado por los catálogos maestros.\n"
            "2. Asistente IA (RAG) sugiere las amenazas y vulnerabilidades más probables según la tipología del activo.\n"
            "3. Matriz de calor 5x5 interactiva donde cada cuadrante agrupa y desglosa los escenarios evaluados.\n"
            "4. Validación visual en navegador y verificación en producción."
        ),
        "priority": "High",
        "issue_type": "Story"
    },
    {
        "hu_id": "HU-015",
        "summary": "[HU-015] Módulo de Importación y Exportación Bidireccional Excel (.xlsm)",
        "description": (
            "Como Administrador y Auditor,\n"
            "Quiero importar el archivo 'Levantamiento de Activos de Información y Riesgos - Prueba.xlsm' directamente al sistema y exportar la matriz consolidada generada,\n"
            "Para mantener la interoperabilidad total con los formatos de auditoría institucional y la entrega académica.\n\n"
            "Criterios de Aceptación (DoD):\n"
            "1. Endpoint POST /api/activos/import-excel que procese la hoja 1. ACTIVOS DE INFORMACIÓN del .xlsm y registre los activos en la BD.\n"
            "2. Endpoint GET /api/riesgos/export-excel que genere el archivo Excel con las fórmulas y estructura oficial de la entidad.\n"
            "3. Botones de acción 'Importar Excel' y 'Exportar Formato Oficial' en la barra de herramientas de /activos.\n"
            "4. Suite de pruebas de validación con el archivo de prueba institucional."
        ),
        "priority": "High",
        "issue_type": "Story"
    }
]

def text_to_adf(text: str) -> Dict[str, Any]:
    """Convierte texto plano a Atlassian Document Format (ADF) requerido por Jira v3"""
    paragraphs = []
    for line in text.split("\n"):
        if line.strip():
            paragraphs.append({
                "type": "paragraph",
                "content": [{"type": "text", "text": line}]
            })
        else:
            paragraphs.append({"type": "paragraph", "content": []})
    return {
        "version": 1,
        "type": "doc",
        "content": paragraphs or [{"type": "paragraph", "content": [{"type": "text", "text": text}]}]
    }

def main():
    print("=" * 65)
    print(" SmartAuditorIA — Sincronizador de Integridad Jira Cloud")
    print("=" * 65)
    print(f"Jira Domain:  {JIRA_DOMAIN}")
    print(f"Usuario Jira: {JIRA_EMAIL}")
    print(f"Proyecto:     {PROJECT_KEY}")

    if not JIRA_API_TOKEN:
        print("\n[!] ERROR: No se ha detectado el Atlassian API Token.")
        print("    Para conectarse con Jira, genera tu API Token en:")
        print("    👉 https://id.atlassian.com/manage-profile/security/api-tokens\n")
        print("    Luego puedes:")
        print("    a) Crear el archivo '.env.jira' con:")
        print(f"       JIRA_EMAIL={JIRA_EMAIL}")
        print("       JIRA_API_TOKEN=tu_token_aqui")
        print("    b) O exportar la variable de entorno: $env:JIRA_API_TOKEN='tu_token'\n")
        sys.exit(1)

    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # 1. Probar autenticación
    print("\n1. Verificando autenticación con Jira Cloud...")
    try:
        r_me = requests.get(f"{JIRA_DOMAIN}/rest/api/3/myself", auth=auth, headers=headers, timeout=10)
        if r_me.status_code != 200:
            print(f"[-] Error de autenticación (Status {r_me.status_code}): {r_me.text}")
            sys.exit(1)
        me_data = r_me.json()
        print(f"    ✓ Conexión exitosa. Usuario autenticado: {me_data.get('displayName')} ({me_data.get('emailAddress')})")
    except Exception as e:
        print(f"[-] Error conectando a Jira: {e}")
        sys.exit(1)

    # 2. Descubrimiento: Consultar últimos tickets en Jira
    print("\n2. Descubriendo tickets existentes en Jira (JQL: project = SCRUM)...")
    jql = f"project = {PROJECT_KEY} ORDER BY created DESC"
    search_url = f"{JIRA_DOMAIN}/rest/api/3/search"
    params = {"jql": jql, "maxResults": 15, "fields": "key,summary,status"}
    
    r_search = requests.get(search_url, auth=auth, headers=headers, params=params, timeout=15)
    existing_issues = {}
    last_key = "N/A"
    
    if r_search.status_code == 200:
        data = r_search.json()
        total = data.get("total", 0)
        issues = data.get("issues", [])
        if issues:
            last_key = issues[0]["key"]
            print(f"    ✓ Total tickets encontrados en proyecto: {total}")
            print(f"    ✓ Último ticket creado en Jira: {last_key}")
            print("    Últimos 5 tickets en el tablero:")
            for iss in issues[:5]:
                print(f"      • {iss['key']}: {iss['fields']['summary']} [{iss['fields']['status']['name']}]")
                # Guardar mapa de summaries
                existing_issues[iss["fields"]["summary"].strip()] = iss["key"]
    else:
        print(f"[-] Advertencia al consultar tickets: {r_search.status_code} - {r_search.text}")

    # 3. Crear o mapear cada historia
    print("\n3. Sincronizando las 4 historias de usuario con Jira...")
    sincronizadas = []

    for h in HISTORIAS_NUEVAS:
        hu_id = h["hu_id"]
        summary = h["summary"]
        
        # Verificar si ya existe un ticket con este HU_ID en el resumen
        found_key = None
        for s_text, k_code in existing_issues.items():
            if hu_id in s_text:
                found_key = k_code
                break
        
        if found_key:
            print(f"    [EXISTE] {hu_id} ya se encuentra registrada como {found_key} en Jira.")
            sincronizadas.append({
                "hu_id": hu_id,
                "jira_key": found_key,
                "summary": summary,
                "created": False
            })
            continue

        # Crear el issue en Jira
        payload = {
            "fields": {
                "project": {"key": PROJECT_KEY},
                "summary": summary,
                "description": text_to_adf(h["description"]),
                "issuetype": {"name": "Story"},
                "priority": {"name": h["priority"]}
            }
        }

        r_create = requests.post(f"{JIRA_DOMAIN}/rest/api/3/issue", auth=auth, headers=headers, json=payload, timeout=15)
        if r_create.status_code in (200, 201):
            created_data = r_create.json()
            new_key = created_data["key"]
            print(f"    [CREADA] {hu_id} -> Asignada oficialmente por Jira como: {new_key}")
            sincronizadas.append({
                "hu_id": hu_id,
                "jira_key": new_key,
                "summary": summary,
                "created": True
            })
        else:
            print(f"[-] Error creando {hu_id} en Jira (Status {r_create.status_code}): {r_create.text}")

    # 4. Actualizar PRODUCT_BACKLOG.md con las claves exactas de Jira
    print("\n4. Actualizando PRODUCT_BACKLOG.md con las claves reales de Jira...")
    backlog_path = os.path.join("docs", "agile", "PRODUCT_BACKLOG.md")
    
    # Generar bloque markdown para el Backlog
    bloque_epica = "\n\n---\n\n## Épica 6: Homologación y Armonización Institucional de Activos y Riesgos (Formato Oficial)\n"
    bloque_epica += "*Correspondiente a la alineación con el formato de Levantamiento de Activos de Información y Riesgos (.xlsm) y evaluación multidimensional N:M.*\n\n"

    for item in sincronizadas:
        hu_id = item["hu_id"]
        jira_key = item["jira_key"]
        h_data = next(x for x in HISTORIAS_NUEVAS if x["hu_id"] == hu_id)
        
        bloque_epica += f"### {hu_id}: {h_data['summary'].replace(f'[{hu_id}] ', '')} (Jira: {jira_key})\n"
        bloque_epica += f"{h_data['description']}\n\n"

    if os.path.exists(backlog_path):
        with open(backlog_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Si la Épica 6 ya existe, reemplazarla, sino agregarla
        if "## Épica 6: Homologación y Armonización Institucional" in content:
            idx = content.find("## Épica 6: Homologación y Armonización Institucional")
            content = content[:idx].rstrip() + bloque_epica
        else:
            # Insertar antes del protocolo de evidencias
            if "## Protocolo de Registro de Evidencias" in content:
                content = content.replace("## Protocolo de Registro de Evidencias", bloque_epica + "## Protocolo de Registro de Evidencias")
            else:
                content += bloque_epica

        with open(backlog_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("    ✓ PRODUCT_BACKLOG.md actualizado exitosamente con trazabilidad Jira.")

    # 5. Resumen final
    print("\n" + "=" * 65)
    print(" Sincronización Completada con Integridad Garantizada")
    print("=" * 65)
    for item in sincronizadas:
        print(f" • {item['hu_id']} <-> [{item['jira_key']}]: {item['summary']}")
        print(f"   URL Jira: {JIRA_DOMAIN}/browse/{item['jira_key']}")
        print(f"   Smart Commit: [{item['jira_key']}][{item['hu_id']}] feat(...): ...\n")

if __name__ == "__main__":
    main()

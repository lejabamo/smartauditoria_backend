#!/usr/bin/env python3
"""
build_iso_corpus_2022.py — Extractor y estructurador canónico de ISO/IEC 27002:2022 y 27005:2022
Genera el catálogo oficial de los 93 controles con metadatos estructurados,
propósitos, atributos de ciberseguridad (CIA) y tipos de control.
"""

import os
import re
import json
from pathlib import Path
from pypdf import PdfReader

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent
PDF_PATH = PROJECT_DIR / "docs" / "normativas" / "ISO_27002_2022_Espa_.pdf"
OUTPUT_ENGINE = BASE_DIR / "app" / "data" / "iso_27002_2022_catalog.json"
OUTPUT_BACKEND = PROJECT_DIR / "smartauditoria_backend" / "app" / "services" / "predictive" / "iso_27002_2022_catalog.json"

THEME_NAMES = {
    "5": {"tema": "Organizacional", "clausula": "5", "total": 37},
    "6": {"tema": "Personas", "clausula": "6", "total": 8},
    "7": {"tema": "Físico", "clausula": "7", "total": 14},
    "8": {"tema": "Tecnológico", "clausula": "8", "total": 34},
}

# Mapeo canónico de títulos de los 93 controles de ISO/IEC 27002:2022
CONTROLS_CANONICAL = {
    # 5. Organizacionales (37)
    "5.1": {"nombre": "Políticas de seguridad de la información", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.2": {"nombre": "Roles y responsabilidades en materia de seguridad de la información", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.3": {"nombre": "Segregación de funciones", "tipo": "Preventivo", "cia": ["C", "I"]},
    "5.4": {"nombre": "Responsabilidades de gestión", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.5": {"nombre": "Contacto con las autoridades", "tipo": "Correctivo", "cia": ["C", "I", "A"]},
    "5.6": {"nombre": "Contacto con grupos de interés especiales", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.7": {"nombre": "Inteligencia sobre amenazas", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "5.8": {"nombre": "Seguridad de la información en la gestión de proyectos", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.9": {"nombre": "Inventario de información y otros activos asociados", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.10": {"nombre": "Uso aceptable de la información y otros activos asociados", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.11": {"nombre": "Devolución de activos", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.12": {"nombre": "Clasificación de la información", "tipo": "Preventivo", "cia": ["C", "I"]},
    "5.13": {"nombre": "Etiquetado de la información", "tipo": "Preventivo", "cia": ["C", "I"]},
    "5.14": {"nombre": "Transferencia de información", "tipo": "Preventivo", "cia": ["C", "I"]},
    "5.15": {"nombre": "Control de acceso", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.16": {"nombre": "Gestión de identidades", "tipo": "Preventivo", "cia": ["C", "I"]},
    "5.17": {"nombre": "Información de autenticación", "tipo": "Preventivo", "cia": ["C", "I"]},
    "5.18": {"nombre": "Derechos de acceso", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.19": {"nombre": "Seguridad de la información en las relaciones con los proveedores", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.20": {"nombre": "Tratamiento de la seguridad de la información en los acuerdos con proveedores", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.21": {"nombre": "Gestión de la seguridad de la información en la cadena de suministro de TIC", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.22": {"nombre": "Monitoreo, revisión y gestión de cambios de los servicios de proveedores", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "5.23": {"nombre": "Seguridad de la información para el uso de servicios en la nube", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.24": {"nombre": "Planificación y preparación de la gestión de incidentes de seguridad", "tipo": "Correctivo", "cia": ["C", "I", "A"]},
    "5.25": {"nombre": "Evaluación y decisión sobre eventos de seguridad de la información", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "5.26": {"nombre": "Respuesta a incidentes de seguridad de la información", "tipo": "Correctivo", "cia": ["C", "I", "A"]},
    "5.27": {"nombre": "Aprendizaje derivado de los incidentes de seguridad de la información", "tipo": "Correctivo", "cia": ["C", "I", "A"]},
    "5.28": {"nombre": "Recopilación de evidencia", "tipo": "Correctivo", "cia": ["C", "I"]},
    "5.29": {"nombre": "Seguridad de la información durante una interrupción", "tipo": "Correctivo", "cia": ["A"]},
    "5.30": {"nombre": "Preparación de las TIC para la continuidad del negocio", "tipo": "Correctivo", "cia": ["A"]},
    "5.31": {"nombre": "Requisitos legales, estatutarios, reglamentarios y contractuales", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.32": {"nombre": "Derechos de propiedad intelectual", "tipo": "Preventivo", "cia": ["C", "I"]},
    "5.33": {"nombre": "Protección de registros", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "5.34": {"nombre": "Privacidad y protección de datos personales (PII)", "tipo": "Preventivo", "cia": ["C"]},
    "5.35": {"nombre": "Revisión independiente de la seguridad de la información", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "5.36": {"nombre": "Cumplimiento de políticas y normas de seguridad de la información", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "5.37": {"nombre": "Procedimientos operativos documentados", "tipo": "Preventivo", "cia": ["C", "I", "A"]},

    # 6. Personas (8)
    "6.1": {"nombre": "Selección de personal", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "6.2": {"nombre": "Términos y condiciones de empleo", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "6.3": {"nombre": "Sensibilización, educación y formación en seguridad de la información", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "6.4": {"nombre": "Proceso disciplinario", "tipo": "Correctivo", "cia": ["C", "I", "A"]},
    "6.5": {"nombre": "Responsabilidades posteriores al empleo o cambio de puesto", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "6.6": {"nombre": "Acuerdos de confidencialidad o no divulgación", "tipo": "Preventivo", "cia": ["C"]},
    "6.7": {"nombre": "Trabajo a distancia (Teletrabajo)", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "6.8": {"nombre": "Notificación de eventos de seguridad de la información", "tipo": "Detectivo", "cia": ["C", "I", "A"]},

    # 7. Físicos (14)
    "7.1": {"nombre": "Perímetros de seguridad física", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "7.2": {"nombre": "Entrada física", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "7.3": {"nombre": "Seguridad de oficinas, despachos y recursos", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "7.4": {"nombre": "Monitoreo de la seguridad física", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "7.5": {"nombre": "Protección contra amenazas físicas y ambientales", "tipo": "Preventivo", "cia": ["I", "A"]},
    "7.6": {"nombre": "Trabajo en áreas seguras", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "7.7": {"nombre": "Puesto de trabajo despejado y pantalla limpia", "tipo": "Preventivo", "cia": ["C", "I"]},
    "7.8": {"nombre": "Emplazamiento y protección de equipos", "tipo": "Preventivo", "cia": ["I", "A"]},
    "7.9": {"nombre": "Seguridad de los activos fuera de las instalaciones", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "7.10": {"nombre": "Soportes de almacenamiento", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "7.11": {"nombre": "Servicios de suministro (Energía, climatización)", "tipo": "Preventivo", "cia": ["A"]},
    "7.12": {"nombre": "Seguridad del cableado", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "7.13": {"nombre": "Mantenimiento de equipos", "tipo": "Preventivo", "cia": ["A"]},
    "7.14": {"nombre": "Eliminación segura o reutilización de equipos", "tipo": "Preventivo", "cia": ["C"]},

    # 8. Tecnológicos (34)
    "8.1": {"nombre": "Dispositivos finales del usuario", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.2": {"nombre": "Derechos de acceso privilegiado", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.3": {"nombre": "Restricción de acceso a la información", "tipo": "Preventivo", "cia": ["C", "I"]},
    "8.4": {"nombre": "Acceso al código fuente", "tipo": "Preventivo", "cia": ["C", "I"]},
    "8.5": {"nombre": "Autenticación segura", "tipo": "Preventivo", "cia": ["C", "I"]},
    "8.6": {"nombre": "Gestión de capacidad", "tipo": "Detectivo", "cia": ["A"]},
    "8.7": {"nombre": "Protección contra código malicioso (Malware)", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.8": {"nombre": "Gestión de vulnerabilidades técnicas", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.9": {"nombre": "Gestión de configuración", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.10": {"nombre": "Eliminación de información", "tipo": "Preventivo", "cia": ["C"]},
    "8.11": {"nombre": "Enmascaramiento de datos", "tipo": "Preventivo", "cia": ["C"]},
    "8.12": {"nombre": "Prevención de fuga de datos (DLP)", "tipo": "Preventivo", "cia": ["C"]},
    "8.13": {"nombre": "Copias de seguridad de la información (Backup)", "tipo": "Correctivo", "cia": ["A", "I"]},
    "8.14": {"nombre": "Redundancia de las instalaciones de procesamiento de información", "tipo": "Correctivo", "cia": ["A"]},
    "8.15": {"nombre": "Registro de eventos (Logging)", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "8.16": {"nombre": "Monitoreo de actividades", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "8.17": {"nombre": "Sincronización del reloj (NTP)", "tipo": "Preventivo", "cia": ["I"]},
    "8.18": {"nombre": "Uso de programas de utilidad con privilegios", "tipo": "Preventivo", "cia": ["C", "I"]},
    "8.19": {"nombre": "Instalación de software en sistemas operativos", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.20": {"nombre": "Seguridad en redes", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.21": {"nombre": "Seguridad de los servicios de red", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.22": {"nombre": "Segregación en redes (Segmentación / VLANs)", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.23": {"nombre": "Filtrado web", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.24": {"nombre": "Uso de criptografía", "tipo": "Preventivo", "cia": ["C", "I"]},
    "8.25": {"nombre": "Ciclo de vida de desarrollo seguro (SDLC)", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.26": {"nombre": "Requisitos de seguridad de las aplicaciones", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.27": {"nombre": "Principios de ingeniería y arquitectura de sistemas seguros", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.28": {"nombre": "Codificación segura", "tipo": "Preventivo", "cia": ["C", "I"]},
    "8.29": {"nombre": "Pruebas de seguridad en el desarrollo y aceptación", "tipo": "Detectivo", "cia": ["C", "I", "A"]},
    "8.30": {"nombre": "Desarrollo externalizado", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.31": {"nombre": "Separación de entornos de desarrollo, pruebas y producción", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.32": {"nombre": "Gestión de cambios", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
    "8.33": {"nombre": "Información sobre pruebas", "tipo": "Preventivo", "cia": ["C"]},
    "8.34": {"nombre": "Protección de los sistemas de información durante las pruebas de auditoría", "tipo": "Preventivo", "cia": ["C", "I", "A"]},
}

def extract_pdf_descriptions():
    """Extrae descripciones detalladas y propósitos de cada control desde el PDF."""
    descriptions = {}
    if not PDF_PATH.exists():
        print(f"WARN: PDF no encontrado en {PDF_PATH}. Usando descripciones canónicas.")
        return descriptions

    try:
        reader = PdfReader(str(PDF_PATH))
        full_text = ""
        # Extraer desde la página 11 hasta el final
        for page in reader.pages[10:]:
            full_text += page.extract_text() + "\n"

        # Regex para buscar bloques de control: "5.1 Políticas...", "Control:", "Propósito:"
        for code in CONTROLS_CANONICAL.keys():
            # Buscar mención del control en encabezado
            pattern = re.compile(rf"{re.escape(code)}\s+[^\n]+\n\s*(?:Control|Tipo de control|Propósito)", re.IGNORECASE)
            match = pattern.search(full_text)
            if match:
                snippet = full_text[match.start():match.start() + 1500]
                # Extraer texto de "Control" y "Propósito"
                ctrl_match = re.search(r"Control\s*\n([^\n]+(?:\n[^\n]+){1,4})", snippet, re.IGNORECASE)
                prop_match = re.search(r"Propósito\s*\n([^\n]+(?:\n[^\n]+){1,4})", snippet, re.IGNORECASE)
                
                desc = ctrl_match.group(1).strip().replace("\n", " ") if ctrl_match else ""
                prop = prop_match.group(1).strip().replace("\n", " ") if prop_match else ""
                
                descriptions[code] = {
                    "descripcion_oficial": desc,
                    "proposito": prop
                }
    except Exception as e:
        print(f"Error procesando PDF: {e}")

    return descriptions

def build_full_catalog():
    print(f"Construyendo Catálogo Canónico ISO/IEC 27002:2022 (93 controles)...")
    pdf_details = extract_pdf_descriptions()

    catalog = {
        "version": "ISO/IEC 27002:2022 / GTC-ISO/IEC 27002:2022",
        "total_controles": len(CONTROLS_CANONICAL),
        "temas": THEME_NAMES,
        "controles": []
    }

    for code, info in CONTROLS_CANONICAL.items():
        theme_id = code.split(".")[0]
        theme_info = THEME_NAMES[theme_id]
        details = pdf_details.get(code, {})

        control_item = {
            "id": f"A.{code}",
            "codigo": code,
            "clausula": int(theme_id),
            "tema": theme_info["tema"],
            "nombre": info["nombre"],
            "tipo_control": info["tipo"],
            "propiedades_cia": info["cia"],
            "proposito": details.get("proposito") or f"Asegurar la gestión efectiva de {info['nombre'].lower()}.",
            "descripcion": details.get("descripcion_oficial") or f"Debe implementarse y mantenerse el control para {info['nombre'].lower()}.",
            "eficacia_estimada": 85 if info["tipo"] == "Preventivo" else 75,
            "activo_tipos_aplicables": [
                "Hardware", "Software", "Datos", "Sistemas de Información", "Redes", "Personal"
            ]
        }
        catalog["controles"].append(control_item)

    # Escribir en Engine
    OUTPUT_ENGINE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_ENGINE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"[OK] Catálogo exportado a Engine: {OUTPUT_ENGINE}")

    # Escribir en Backend
    OUTPUT_BACKEND.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_BACKEND, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"[OK] Catálogo exportado a Backend: {OUTPUT_BACKEND}")

    print(f"Total controles generados: {len(catalog['controles'])}")
    return catalog

if __name__ == "__main__":
    build_full_catalog()

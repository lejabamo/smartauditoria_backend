#!/usr/bin/env python3
"""
Script de ejemplo para agregar nuevos elementos a la base de conocimiento
"""

import json
from pathlib import Path
from typing import Dict, Any

def load_knowledge_base() -> Dict[str, Any]:
    """Cargar base de conocimiento"""
    kb_path = Path("backend/app/services/predictive/iso_knowledge_base.json")
    
    if not kb_path.exists():
        # Si no existe, buscar en otra ubicación
        kb_path = Path("app/services/predictive/iso_knowledge_base.json")
    
    if not kb_path.exists():
        raise FileNotFoundError(f"No se encontró la base de conocimiento en {kb_path}")
    
    with open(kb_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_knowledge_base(kb: Dict[str, Any], output_path: str = None):
    """Guardar base de conocimiento"""
    if output_path is None:
        kb_path = Path("backend/app/services/predictive/iso_knowledge_base.json")
        if not kb_path.exists():
            kb_path = Path("app/services/predictive/iso_knowledge_base.json")
    else:
        kb_path = Path(output_path)
    
    kb_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(kb_path, 'w', encoding='utf-8') as f:
        json.dump(kb, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Base de conocimiento guardada en: {kb_path}")

def add_threat(kb: Dict[str, Any], threat_id: str, nombre: str, descripcion: str, 
               categoria: str, controles_mitigadores: list, vulnerabilidades_explotables: list):
    """Agregar una nueva amenaza"""
    if "amenazas" not in kb:
        kb["amenazas"] = {}
    
    kb["amenazas"][threat_id] = {
        "nombre": nombre,
        "descripcion": descripcion,
        "categoria": categoria,
        "controles_mitigadores": controles_mitigadores,
        "vulnerabilidades_explotables": vulnerabilidades_explotables
    }
    
    print(f"✅ Amenaza {threat_id} agregada: {nombre}")

def add_vulnerability(kb: Dict[str, Any], vuln_id: str, nombre: str, descripcion: str,
                     categoria: str, amenazas_que_explota: list, controles_mitigadores: list):
    """Agregar una nueva vulnerabilidad"""
    if "vulnerabilidades" not in kb:
        kb["vulnerabilidades"] = {}
    
    kb["vulnerabilidades"][vuln_id] = {
        "nombre": nombre,
        "descripcion": descripcion,
        "categoria": categoria,
        "amenazas_que_explota": amenazas_que_explota,
        "controles_mitigadores": controles_mitigadores
    }
    
    print(f"✅ Vulnerabilidad {vuln_id} agregada: {nombre}")

def add_control(kb: Dict[str, Any], control_id: str, titulo: str, descripcion: str,
               categoria: str, amenazas_relacionadas: list, vulnerabilidades_relacionadas: list):
    """Agregar un nuevo control"""
    if "controles" not in kb:
        kb["controles"] = {}
    
    # Extraer el código principal (A.12) y sub-control (A.12.1)
    parts = control_id.split('.')
    main_code = parts[0] if len(parts) > 0 else control_id
    sub_code = control_id
    
    # Si es un sub-control (tiene más de una parte)
    if len(parts) > 1:
        if main_code not in kb["controles"]:
            kb["controles"][main_code] = {
                "titulo": f"Control {main_code}",
                "descripcion": f"Descripción del control {main_code}",
                "controles": {}
            }
        
        kb["controles"][main_code]["controles"][sub_code] = {
            "titulo": titulo,
            "descripcion": descripcion,
            "categoria": categoria,
            "amenazas_relacionadas": amenazas_relacionadas,
            "vulnerabilidades_relacionadas": vulnerabilidades_relacionadas
        }
    else:
        # Es un control principal
        kb["controles"][control_id] = {
            "titulo": titulo,
            "descripcion": descripcion,
            "controles": {}
        }
    
    print(f"✅ Control {control_id} agregado: {titulo}")

def example_add_multiple_items():
    """Ejemplo de cómo agregar múltiples elementos"""
    
    # Cargar base de conocimiento
    kb = load_knowledge_base()
    
    print("📚 Agregando nuevos elementos a la base de conocimiento...\n")
    
    # Ejemplo 1: Agregar nueva amenaza
    add_threat(
        kb=kb,
        threat_id="T.6",
        nombre="Ataques de Denegación de Servicio (DDoS)",
        descripcion="Ataques que intentan interrumpir el servicio normal de un servidor, servicio o red sobrecargándolo con tráfico masivo desde múltiples fuentes",
        categoria="Tecnológica",
        controles_mitigadores=["A.12.1", "A.12.2", "A.17.1"],
        vulnerabilidades_explotables=["V.6", "V.7"]
    )
    
    # Ejemplo 2: Agregar nueva vulnerabilidad
    add_vulnerability(
        kb=kb,
        vuln_id="V.6",
        nombre="Falta de Parches de Seguridad",
        descripcion="Sistemas sin aplicar parches de seguridad críticos, exponiéndolos a vulnerabilidades conocidas y explotables",
        categoria="Tecnológica",
        amenazas_que_explota=["T.1", "T.3", "T.6"],
        controles_mitigadores=["A.12.1", "A.12.2", "A.8.1"]
    )
    
    # Ejemplo 3: Agregar nuevo control
    add_control(
        kb=kb,
        control_id="A.12.1",
        titulo="Gestión de cambios",
        descripcion="Se deben establecer procedimientos para la gestión de cambios en sistemas de información, incluyendo evaluación de impacto en seguridad",
        categoria="Tecnológica",
        amenazas_relacionadas=["T.1", "T.3", "T.6"],
        vulnerabilidades_relacionadas=["V.1", "V.6"]
    )
    
    # Guardar cambios
    save_knowledge_base(kb)
    
    print("\n✅ Proceso completado!")
    print(f"   - Amenazas totales: {len(kb.get('amenazas', {}))}")
    print(f"   - Vulnerabilidades totales: {len(kb.get('vulnerabilidades', {}))}")
    print(f"   - Controles totales: {len(kb.get('controles', {}))}")

if __name__ == "__main__":
    try:
        example_add_multiple_items()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


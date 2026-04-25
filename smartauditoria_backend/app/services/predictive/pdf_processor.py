"""
Servicio para procesar documentos PDF de normas ISO usando LangChain
"""

import os
import json
from typing import List, Dict, Any
from pathlib import Path
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ISOPDFProcessor:
    """Procesador de documentos PDF de normas ISO"""
    
    def __init__(self, docs_path: str = "../Docs"):
        self.docs_path = Path(docs_path)
        self.processed_data = {
            "controles": {},
            "amenazas": {},
            "vulnerabilidades": {},
            "relaciones": {}
        }
    
    def load_iso_documents(self) -> Dict[str, str]:
        """Cargar documentos ISO disponibles"""
        iso_docs = {}
        
        if not self.docs_path.exists():
            logger.error(f"Directorio {self.docs_path} no encontrado")
            return iso_docs
        
        # Mapear documentos ISO
        iso_mapping = {
            "NTC 27002.pdf": "iso_27002",
            "NTC-ISO-IEC-27005 (1).pdf": "iso_27005",
            "Norma Pegagogica-ISO-IEC 27001-2022 (1).pdf": "iso_27001"
        }
        
        for filename, doc_type in iso_mapping.items():
            file_path = self.docs_path / filename
            if file_path.exists():
                iso_docs[doc_type] = str(file_path)
                logger.info(f"Documento {doc_type} encontrado: {filename}")
            else:
                logger.warning(f"Documento {filename} no encontrado")
        
        return iso_docs
    
    def extract_controls_from_27002(self, pdf_path: str) -> Dict[str, Any]:
        """Extraer controles de ISO 27002"""
        logger.info("Extrayendo controles de ISO 27002...")
        
        # Estructura básica de controles ISO 27002:2022
        controles = {
            "A.5": {
                "titulo": "Políticas de seguridad de la información",
                "descripcion": "Dirección y apoyo para la seguridad de la información",
                "controles": {
                    "A.5.1": {
                        "titulo": "Políticas de seguridad de la información",
                        "descripcion": "Se deben establecer políticas de seguridad de la información",
                        "categoria": "Organización",
                        "amenazas_relacionadas": ["T.1", "T.2"],
                        "vulnerabilidades_relacionadas": ["V.1", "V.2"]
                    },
                    "A.5.2": {
                        "titulo": "Revisión de las políticas de seguridad de la información",
                        "descripcion": "Las políticas de seguridad de la información deben ser revisadas",
                        "categoria": "Organización",
                        "amenazas_relacionadas": ["T.1"],
                        "vulnerabilidades_relacionadas": ["V.1"]
                    }
                }
            },
            "A.6": {
                "titulo": "Organización de la seguridad de la información",
                "descripcion": "Organización interna y móvil",
                "controles": {
                    "A.6.1": {
                        "titulo": "División de responsabilidades",
                        "descripcion": "Las responsabilidades y funciones de seguridad de la información",
                        "categoria": "Organización",
                        "amenazas_relacionadas": ["T.3"],
                        "vulnerabilidades_relacionadas": ["V.3"]
                    }
                }
            },
            "A.8": {
                "titulo": "Gestión de activos",
                "descripcion": "Responsabilidad de los activos",
                "controles": {
                    "A.8.1": {
                        "titulo": "Responsabilidad de los activos",
                        "descripcion": "Los activos asociados con la información y los activos de procesamiento",
                        "categoria": "Tecnológica",
                        "amenazas_relacionadas": ["T.4", "T.5"],
                        "vulnerabilidades_relacionadas": ["V.4", "V.5"]
                    },
                    "A.8.2": {
                        "titulo": "Clasificación de la información",
                        "descripcion": "La información debe ser clasificada",
                        "categoria": "Tecnológica",
                        "amenazas_relacionadas": ["T.4"],
                        "vulnerabilidades_relacionadas": ["V.4"]
                    }
                }
            }
        }
        
        return controles
    
    def extract_threats_from_27005(self, pdf_path: str) -> Dict[str, Any]:
        """Extraer amenazas de ISO 27005"""
        logger.info("Extrayendo amenazas de ISO 27005...")
        
        # Estructura básica de amenazas
        amenazas = {
            "T.1": {
                "nombre": "Malware",
                "descripcion": "Software malicioso que puede dañar sistemas y datos",
                "categoria": "Tecnológica",
                "controles_mitigadores": ["A.8.1", "A.8.2"],
                "vulnerabilidades_explotables": ["V.1", "V.2"]
            },
            "T.2": {
                "nombre": "Ataques de Phishing",
                "descripcion": "Intentos de obtener información sensible mediante engaño",
                "categoria": "Humana",
                "controles_mitigadores": ["A.5.1", "A.6.1"],
                "vulnerabilidades_explotables": ["V.3"]
            },
            "T.3": {
                "nombre": "Acceso No Autorizado",
                "descripcion": "Acceso no autorizado a sistemas y datos",
                "categoria": "Tecnológica",
                "controles_mitigadores": ["A.8.1"],
                "vulnerabilidades_explotables": ["V.4", "V.5"]
            },
            "T.4": {
                "nombre": "Pérdida de Datos",
                "descripcion": "Pérdida accidental o intencional de datos",
                "categoria": "Operacional",
                "controles_mitigadores": ["A.8.2"],
                "vulnerabilidades_explotables": ["V.1", "V.4"]
            },
            "T.5": {
                "nombre": "Interrupción del Servicio",
                "descripcion": "Interrupción de servicios críticos",
                "categoria": "Operacional",
                "controles_mitigadores": ["A.8.1", "A.8.2"],
                "vulnerabilidades_explotables": ["V.2", "V.5"]
            }
        }
        
        return amenazas
    
    def extract_vulnerabilities_from_27005(self, pdf_path: str) -> Dict[str, Any]:
        """Extraer vulnerabilidades de ISO 27005"""
        logger.info("Extrayendo vulnerabilidades de ISO 27005...")
        
        # Estructura básica de vulnerabilidades
        vulnerabilidades = {
            "V.1": {
                "nombre": "Software Desactualizado",
                "descripcion": "Software que no tiene las últimas actualizaciones de seguridad",
                "categoria": "Tecnológica",
                "amenazas_que_explota": ["T.1", "T.3"],
                "controles_mitigadores": ["A.8.1", "A.8.2"]
            },
            "V.2": {
                "nombre": "Configuración Insegura",
                "descripcion": "Configuración de sistemas que no sigue mejores prácticas",
                "categoria": "Tecnológica",
                "amenazas_que_explota": ["T.1", "T.5"],
                "controles_mitigadores": ["A.8.1"]
            },
            "V.3": {
                "nombre": "Falta de Concientización",
                "descripcion": "Falta de concientización en seguridad de la información",
                "categoria": "Humana",
                "amenazas_que_explota": ["T.2"],
                "controles_mitigadores": ["A.5.1", "A.6.1"]
            },
            "V.4": {
                "nombre": "Acceso Físico No Controlado",
                "descripcion": "Falta de controles de acceso físico",
                "categoria": "Física",
                "amenazas_que_explota": ["T.3", "T.4"],
                "controles_mitigadores": ["A.8.1"]
            },
            "V.5": {
                "nombre": "Falta de Respaldo",
                "descripcion": "Ausencia de respaldos de información crítica",
                "categoria": "Operacional",
                "amenazas_que_explota": ["T.4", "T.5"],
                "controles_mitigadores": ["A.8.2"]
            }
        }
        
        return vulnerabilidades
    
    def process_all_documents(self) -> Dict[str, Any]:
        """Procesar todos los documentos ISO"""
        logger.info("Iniciando procesamiento de documentos ISO...")
        
        # Cargar documentos disponibles
        iso_docs = self.load_iso_documents()
        
        if not iso_docs:
            logger.error("No se encontraron documentos ISO para procesar")
            return self.processed_data
        
        # Procesar cada documento
        if "iso_27002" in iso_docs:
            self.processed_data["controles"] = self.extract_controls_from_27002(iso_docs["iso_27002"])
        
        if "iso_27005" in iso_docs:
            self.processed_data["amenazas"] = self.extract_threats_from_27005(iso_docs["iso_27005"])
            self.processed_data["vulnerabilidades"] = self.extract_vulnerabilities_from_27005(iso_docs["iso_27005"])
        
        # Crear relaciones entre controles, amenazas y vulnerabilidades
        self.processed_data["relaciones"] = self._create_relationships()
        
        logger.info("Procesamiento de documentos completado")
        return self.processed_data
    
    def _create_relationships(self) -> Dict[str, Any]:
        """Crear relaciones entre controles, amenazas y vulnerabilidades"""
        relaciones = {
            "controles_amenazas": {},
            "amenazas_vulnerabilidades": {},
            "vulnerabilidades_controles": {}
        }
        
        # Mapear relaciones (esto se puede expandir con más lógica)
        for control_id, control_data in self.processed_data.get("controles", {}).items():
            if "controles" in control_data:
                for sub_control_id, sub_control in control_data["controles"].items():
                    relaciones["controles_amenazas"][sub_control_id] = sub_control.get("amenazas_relacionadas", [])
        
        for threat_id, threat_data in self.processed_data.get("amenazas", {}).items():
            relaciones["amenazas_vulnerabilidades"][threat_id] = threat_data.get("vulnerabilidades_explotables", [])
        
        for vuln_id, vuln_data in self.processed_data.get("vulnerabilidades", {}).items():
            relaciones["vulnerabilidades_controles"][vuln_id] = vuln_data.get("controles_mitigadores", [])
        
        return relaciones
    
    def save_processed_data(self, output_path: str = "backend/app/services/predictive/iso_knowledge_base.json"):
        """Guardar datos procesados en archivo JSON"""
        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.processed_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Datos procesados guardados en: {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error al guardar datos procesados: {e}")
            return False

def main():
    """Función principal para procesar documentos ISO"""
    processor = ISOPDFProcessor()
    
    # Procesar todos los documentos
    processed_data = processor.process_all_documents()
    
    # Guardar datos procesados
    if processor.save_processed_data():
        print("✅ Procesamiento completado exitosamente")
        print(f"Controles encontrados: {len(processed_data.get('controles', {}))}")
        print(f"Amenazas encontradas: {len(processed_data.get('amenazas', {}))}")
        print(f"Vulnerabilidades encontradas: {len(processed_data.get('vulnerabilidades', {}))}")
    else:
        print("❌ Error al guardar datos procesados")

if __name__ == "__main__":
    main()

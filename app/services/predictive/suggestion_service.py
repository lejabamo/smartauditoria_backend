"""
Servicio de sugerencias predictivas basado en normas ISO
"""

import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PredictiveSuggestionService:
    """Servicio para generar sugerencias predictivas basadas en normas ISO"""
    
    def __init__(self, knowledge_base_path: str = "backend/app/services/predictive/iso_knowledge_base.json"):
        self.knowledge_base_path = Path(knowledge_base_path)
        self.knowledge_base = self._load_knowledge_base()
    
    def _load_knowledge_base(self) -> Dict[str, Any]:
        """Cargar base de conocimiento desde archivo JSON"""
        try:
            if self.knowledge_base_path.exists():
                with open(self.knowledge_base_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                logger.warning(f"Base de conocimiento no encontrada en {self.knowledge_base_path}")
                return {"controles": {}, "amenazas": {}, "vulnerabilidades": {}, "relaciones": {}}
        except Exception as e:
            logger.error(f"Error al cargar base de conocimiento: {e}")
            return {"controles": {}, "amenazas": {}, "vulnerabilidades": {}, "relaciones": {}}
    
    def suggest_threats_for_asset(self, asset_type: str, context: str = "") -> List[Dict[str, Any]]:
        """Sugerir amenazas basadas en el tipo de activo y contexto"""
        logger.info(f"Sugiriendo amenazas para activo tipo: {asset_type}")
        
        suggestions = []
        amenazas = self.knowledge_base.get("amenazas", {})
        
        # Mapeo de tipos de activos a amenazas relevantes
        asset_threat_mapping = {
            "servidor": ["T.1", "T.3", "T.5"],  # Malware, Acceso No Autorizado, Interrupción
            "base_datos": ["T.1", "T.3", "T.4"],  # Malware, Acceso No Autorizado, Pérdida de Datos
            "aplicacion": ["T.1", "T.2", "T.3"],  # Malware, Phishing, Acceso No Autorizado
            "red": ["T.1", "T.5"],  # Malware, Interrupción
            "dispositivo_movil": ["T.1", "T.2", "T.4"],  # Malware, Phishing, Pérdida de Datos
            "infraestructura": ["T.5", "T.4"],  # Interrupción, Pérdida de Datos
            "datos": ["T.3", "T.4"],  # Acceso No Autorizado, Pérdida de Datos
            "usuario": ["T.2", "T.3"]  # Phishing, Acceso No Autorizado
        }
        
        # Obtener amenazas relevantes para el tipo de activo
        relevant_threat_ids = asset_threat_mapping.get(asset_type.lower(), list(amenazas.keys()))
        
        for threat_id in relevant_threat_ids:
            if threat_id in amenazas:
                threat_data = amenazas[threat_id]
                suggestion = {
                    "id": threat_id,
                    "nombre": threat_data.get("nombre", ""),
                    "descripcion": threat_data.get("descripcion", ""),
                    "categoria": threat_data.get("categoria", ""),
                    "confianza": self._calculate_confidence(asset_type, threat_id, context),
                    "controles_sugeridos": threat_data.get("controles_mitigadores", []),
                    "vulnerabilidades_relacionadas": threat_data.get("vulnerabilidades_explotables", [])
                }
                suggestions.append(suggestion)
        
        # Ordenar por confianza
        suggestions.sort(key=lambda x: x["confianza"], reverse=True)
        
        return suggestions[:5]  # Retornar top 5 sugerencias
    
    def suggest_vulnerabilities_for_threat(self, threat_id: str, asset_type: str = "") -> List[Dict[str, Any]]:
        """Sugerir vulnerabilidades basadas en la amenaza seleccionada"""
        logger.info(f"Sugiriendo vulnerabilidades para amenaza: {threat_id}")
        
        suggestions = []
        amenazas = self.knowledge_base.get("amenazas", {})
        vulnerabilidades = self.knowledge_base.get("vulnerabilidades", {})
        
        if threat_id in amenazas:
            threat_data = amenazas[threat_id]
            vulnerable_ids = threat_data.get("vulnerabilidades_explotables", [])
            
            for vuln_id in vulnerable_ids:
                if vuln_id in vulnerabilidades:
                    vuln_data = vulnerabilidades[vuln_id]
                    suggestion = {
                        "id": vuln_id,
                        "nombre": vuln_data.get("nombre", ""),
                        "descripcion": vuln_data.get("descripcion", ""),
                        "categoria": vuln_data.get("categoria", ""),
                        "confianza": self._calculate_vulnerability_confidence(threat_id, vuln_id, asset_type),
                        "controles_mitigadores": vuln_data.get("controles_mitigadores", []),
                        "amenazas_relacionadas": vuln_data.get("amenazas_que_explota", [])
                    }
                    suggestions.append(suggestion)
        
        # Ordenar por confianza
        suggestions.sort(key=lambda x: x["confianza"], reverse=True)
        
        return suggestions
    
    def suggest_controls_for_risk(self, threat_id: str, vulnerability_id: str, asset_type: str = "") -> List[Dict[str, Any]]:
        """Sugerir controles basados en la amenaza y vulnerabilidad seleccionadas"""
        logger.info(f"Sugiriendo controles para amenaza: {threat_id}, vulnerabilidad: {vulnerability_id}")
        
        suggestions = []
        controles = self.knowledge_base.get("controles", {})
        amenazas = self.knowledge_base.get("amenazas", {})
        vulnerabilidades = self.knowledge_base.get("vulnerabilidades", {})
        
        # Obtener controles sugeridos por la amenaza
        threat_controls = []
        if threat_id in amenazas:
            threat_controls = amenazas[threat_id].get("controles_mitigadores", [])
        
        # Obtener controles sugeridos por la vulnerabilidad
        vuln_controls = []
        if vulnerability_id in vulnerabilidades:
            vuln_controls = vulnerabilidades[vulnerability_id].get("controles_mitigadores", [])
        
        # Combinar y deduplicar controles
        all_controls = list(set(threat_controls + vuln_controls))
        
        for control_id in all_controls:
            control_data = self._find_control_by_id(control_id, controles)
            if control_data:
                suggestion = {
                    "id": control_id,
                    "titulo": control_data.get("titulo", ""),
                    "descripcion": control_data.get("descripcion", ""),
                    "categoria": control_data.get("categoria", ""),
                    "confianza": self._calculate_control_confidence(threat_id, vulnerability_id, control_id),
                    "implementacion": self._get_implementation_guidance(control_id),
                    "prioridad": self._get_control_priority(control_id, asset_type)
                }
                suggestions.append(suggestion)
        
        # Ordenar por confianza y prioridad
        suggestions.sort(key=lambda x: (x["confianza"], x["prioridad"]), reverse=True)
        
        return suggestions[:10]  # Retornar top 10 controles
    
    def _find_control_by_id(self, control_id: str, controles: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Buscar control por ID en la estructura de controles"""
        for category, category_data in controles.items():
            if "controles" in category_data:
                for sub_control_id, sub_control_data in category_data["controles"].items():
                    if sub_control_id == control_id:
                        return sub_control_data
        return None
    
    def _calculate_confidence(self, asset_type: str, threat_id: str, context: str) -> float:
        """Calcular nivel de confianza para una sugerencia de amenaza"""
        base_confidence = 0.7
        
        # Ajustar confianza basada en el tipo de activo
        asset_confidence_boost = {
            "servidor": 0.2,
            "base_datos": 0.25,
            "aplicacion": 0.15,
            "red": 0.1,
            "dispositivo_movil": 0.2,
            "infraestructura": 0.15,
            "datos": 0.3,
            "usuario": 0.1
        }
        
        boost = asset_confidence_boost.get(asset_type.lower(), 0.1)
        confidence = min(base_confidence + boost, 1.0)
        
        # Ajustar basado en contexto (palabras clave)
        if context:
            context_keywords = ["critico", "importante", "sensible", "confidencial"]
            if any(keyword in context.lower() for keyword in context_keywords):
                confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _calculate_vulnerability_confidence(self, threat_id: str, vuln_id: str, asset_type: str) -> float:
        """Calcular confianza para vulnerabilidad"""
        base_confidence = 0.8
        
        # Ajustar basado en el tipo de activo
        asset_vuln_boost = {
            "servidor": 0.15,
            "base_datos": 0.2,
            "aplicacion": 0.1,
            "red": 0.05,
            "dispositivo_movil": 0.15,
            "infraestructura": 0.1,
            "datos": 0.25,
            "usuario": 0.05
        }
        
        boost = asset_vuln_boost.get(asset_type.lower(), 0.1)
        return min(base_confidence + boost, 1.0)
    
    def _calculate_control_confidence(self, threat_id: str, vuln_id: str, control_id: str) -> float:
        """Calcular confianza para control"""
        base_confidence = 0.75
        
        # Ajustar basado en la relevancia del control
        if threat_id and vuln_id:
            base_confidence += 0.1
        
        return min(base_confidence, 1.0)
    
    def _get_implementation_guidance(self, control_id: str) -> str:
        """Obtener guía de implementación para un control"""
        implementation_guides = {
            "A.5.1": "Establecer políticas de seguridad claras y comunicarlas a todos los empleados",
            "A.5.2": "Revisar y actualizar políticas regularmente",
            "A.6.1": "Definir roles y responsabilidades de seguridad",
            "A.8.1": "Mantener inventario actualizado de activos",
            "A.8.2": "Clasificar información según su criticidad"
        }
        
        return implementation_guides.get(control_id, "Implementar según mejores prácticas de seguridad")
    
    def _get_control_priority(self, control_id: str, asset_type: str) -> int:
        """Obtener prioridad del control (1-5, donde 5 es más alta)"""
        priority_mapping = {
            "A.5.1": 5,  # Políticas - Alta prioridad
            "A.5.2": 4,  # Revisión de políticas
            "A.6.1": 4,  # División de responsabilidades
            "A.8.1": 5,  # Gestión de activos - Alta prioridad
            "A.8.2": 4   # Clasificación de información
        }
        
        return priority_mapping.get(control_id, 3)  # Prioridad media por defecto
    
    def get_risk_assessment_suggestions(self, asset_type: str, context: str = "") -> Dict[str, Any]:
        """Obtener sugerencias completas para evaluación de riesgos"""
        logger.info(f"Generando sugerencias completas para activo: {asset_type}")
        
        # Obtener sugerencias de amenazas
        threat_suggestions = self.suggest_threats_for_asset(asset_type, context)
        
        # Obtener sugerencias de vulnerabilidades para la primera amenaza
        vulnerability_suggestions = []
        if threat_suggestions:
            first_threat = threat_suggestions[0]
            vulnerability_suggestions = self.suggest_vulnerabilities_for_threat(
                first_threat["id"], asset_type
            )
        
        # Obtener sugerencias de controles
        control_suggestions = []
        if threat_suggestions and vulnerability_suggestions:
            control_suggestions = self.suggest_controls_for_risk(
                threat_suggestions[0]["id"],
                vulnerability_suggestions[0]["id"],
                asset_type
            )
        
        return {
            "amenazas": threat_suggestions,
            "vulnerabilidades": vulnerability_suggestions,
            "controles": control_suggestions,
            "metadata": {
                "asset_type": asset_type,
                "context": context,
                "total_suggestions": len(threat_suggestions) + len(vulnerability_suggestions) + len(control_suggestions)
            }
        }

def main():
    """Función principal para probar el servicio de sugerencias"""
    service = PredictiveSuggestionService()
    
    # Probar sugerencias para diferentes tipos de activos
    test_cases = [
        {"asset_type": "servidor", "context": "Servidor crítico de producción"},
        {"asset_type": "base_datos", "context": "Base de datos con información sensible"},
        {"asset_type": "aplicacion", "context": "Aplicación web pública"}
    ]
    
    for test_case in test_cases:
        print(f"\n🔍 Sugerencias para: {test_case['asset_type']}")
        print("=" * 50)
        
        suggestions = service.get_risk_assessment_suggestions(
            test_case["asset_type"], 
            test_case["context"]
        )
        
        print(f"📊 Amenazas sugeridas: {len(suggestions['amenazas'])}")
        for threat in suggestions['amenazas'][:3]:
            print(f"  - {threat['nombre']} (Confianza: {threat['confianza']:.2f})")
        
        print(f"🔓 Vulnerabilidades sugeridas: {len(suggestions['vulnerabilidades'])}")
        for vuln in suggestions['vulnerabilidades'][:3]:
            print(f"  - {vuln['nombre']} (Confianza: {vuln['confianza']:.2f})")
        
        print(f"🛡️ Controles sugeridos: {len(suggestions['controles'])}")
        for control in suggestions['controles'][:3]:
            print(f"  - {control['titulo']} (Confianza: {control['confianza']:.2f})")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Servicio de Predicción de Texto
SGSRI - Sistema Predictivo de Riesgos ISO
"""

import re
from typing import Dict, List, Optional

class PredictiveTextService:
    """Servicio para generar texto predictivo basado en amenaza y vulnerabilidad"""
    
    def __init__(self):
        self.prediction_templates = {
            # Patrones de amenaza y vulnerabilidad
            "acceso_no_autorizado": {
                "falta_autenticacion": "Riesgo de acceso no autorizado debido a la ausencia de autenticación de dos factores. Este riesgo puede materializarse cuando usuarios maliciosos aprovechen la falta de autenticación robusta para acceder a sistemas críticos.",
                "control_de_acceso": "Riesgo de acceso no autorizado por deficiencias en el control de accesos. Los atacantes pueden explotar permisos excesivos o configuraciones débiles para acceder a información sensible.",
                "configuracion_insegura": "Riesgo de acceso no autorizado debido a configuraciones inseguras en sistemas. Las configuraciones por defecto o mal configuradas pueden ser explotadas por atacantes."
            },
            "malware": {
                "software_desactualizado": "Riesgo de infección por malware debido a software desactualizado. Las vulnerabilidades conocidas en software obsoleto pueden ser explotadas por malware para comprometer sistemas.",
                "falta_antivirus": "Riesgo de infección por malware por ausencia de protección antivirus. Sin protección adecuada, los sistemas son vulnerables a malware que puede causar pérdida de datos y interrupciones.",
                "configuracion_insegura": "Riesgo de infección por malware debido a configuraciones inseguras. Las configuraciones débiles pueden facilitar la propagación de malware en la red."
            },
            "perdida_datos": {
                "falta_respaldo": "Riesgo de pérdida de datos por ausencia de respaldos. Sin una estrategia de respaldo adecuada, la pérdida de datos puede ser irreversible y causar interrupciones críticas.",
                "configuracion_insegura": "Riesgo de pérdida de datos debido a configuraciones inseguras. Las configuraciones incorrectas pueden llevar a corrupción o pérdida accidental de datos.",
                "falta_monitoreo": "Riesgo de pérdida de datos por falta de monitoreo. Sin supervisión adecuada, los problemas de integridad de datos pueden pasar desapercibidos."
            },
            "interrupcion_servicio": {
                "falta_redundancia": "Riesgo de interrupción del servicio por falta de redundancia. Sin sistemas de respaldo, las fallas pueden causar interrupciones prolongadas del servicio.",
                "configuracion_insegura": "Riesgo de interrupción del servicio debido a configuraciones inseguras. Las configuraciones incorrectas pueden causar fallas en cascada.",
                "falta_monitoreo": "Riesgo de interrupción del servicio por falta de monitoreo. Sin supervisión, los problemas pueden escalar antes de ser detectados."
            }
        }
        
        self.justification_templates = {
            "ocasional_moderado": "El riesgo puede materializarse ocasionalmente (cada 2-3 años) y tendría un impacto moderado en las operaciones. Esta evaluación se basa en el análisis de amenazas similares y la efectividad de controles existentes.",
            "probable_mayor": "El riesgo es probable que ocurra (anualmente) y tendría un impacto mayor en la organización. La probabilidad se basa en tendencias de seguridad y la criticidad del activo evaluado.",
            "frecuente_catastrofico": "El riesgo puede ocurrir frecuentemente y tendría un impacto catastrófico. Esta evaluación considera la alta exposición del activo y la gravedad potencial de las consecuencias."
        }
    
    def generate_risk_description(self, amenaza: str, vulnerabilidad: str) -> str:
        """Generar descripción predictiva del riesgo"""
        try:
            # Normalizar inputs
            amenaza_norm = self._normalize_text(amenaza)
            vulnerabilidad_norm = self._normalize_text(vulnerabilidad)
            
            # Buscar patrón coincidente
            for threat_key, vulnerabilities in self.prediction_templates.items():
                if self._matches_pattern(amenaza_norm, threat_key):
                    for vuln_key, description in vulnerabilities.items():
                        if self._matches_pattern(vulnerabilidad_norm, vuln_key):
                            return description
            
            # Si no hay coincidencia exacta, generar descripción genérica
            return self._generate_generic_description(amenaza, vulnerabilidad)
            
        except Exception as e:
            print(f"Error generando descripción: {str(e)}")
            return f"Riesgo de {amenaza.lower()} debido a {vulnerabilidad.lower()}. Este riesgo puede materializarse cuando las amenazas exploten las vulnerabilidades identificadas."
    
    def generate_justification(self, probabilidad: str, impacto: str) -> str:
        """Generar justificación predictiva"""
        try:
            # Normalizar inputs
            prob_norm = self._normalize_text(probabilidad)
            imp_norm = self._normalize_text(impacto)
            
            # Buscar patrón coincidente
            key = f"{prob_norm}_{imp_norm}"
            if key in self.justification_templates:
                return self.justification_templates[key]
            
            # Generar justificación genérica
            return self._generate_generic_justification(probabilidad, impacto)
            
        except Exception as e:
            print(f"Error generando justificación: {str(e)}")
            return f"Evaluación basada en el análisis de {probabilidad.lower()} probabilidad y {impacto.lower()} impacto. Esta evaluación considera las características del activo y los controles existentes."
    
    def generate_control_suggestions(self, amenaza: str, vulnerabilidad: str) -> List[Dict]:
        """Generar sugerencias de controles"""
        try:
            suggestions = []
            
            # Normalizar inputs
            amenaza_norm = self._normalize_text(amenaza)
            vulnerabilidad_norm = self._normalize_text(vulnerabilidad)
            
            # Controles basados en amenaza
            if "acceso" in amenaza_norm or "autorizado" in amenaza_norm:
                suggestions.extend([
                    {"nombre": "Autenticación Multifactor", "tipo": "Tecnológico", "descripcion": "Implementar MFA para todos los accesos críticos"},
                    {"nombre": "Control de Accesos", "tipo": "Tecnológico", "descripcion": "Establecer controles de acceso basados en roles"},
                    {"nombre": "Auditoría de Accesos", "tipo": "Tecnológico", "descripcion": "Monitorear y registrar todos los accesos al sistema"}
                ])
            
            if "malware" in amenaza_norm:
                suggestions.extend([
                    {"nombre": "Antivirus Empresarial", "tipo": "Tecnológico", "descripcion": "Instalar y mantener antivirus actualizado"},
                    {"nombre": "Actualizaciones Automáticas", "tipo": "Tecnológico", "descripcion": "Configurar actualizaciones automáticas de software"},
                    {"nombre": "Políticas de Uso", "tipo": "Organizacional", "descripcion": "Establecer políticas de uso seguro de sistemas"}
                ])
            
            if "perdida" in amenaza_norm or "datos" in amenaza_norm:
                suggestions.extend([
                    {"nombre": "Respaldos Automáticos", "tipo": "Tecnológico", "descripcion": "Implementar respaldos automáticos y regulares"},
                    {"nombre": "Replicación de Datos", "tipo": "Tecnológico", "descripcion": "Configurar replicación en tiempo real"},
                    {"nombre": "Monitoreo de Integridad", "tipo": "Tecnológico", "descripcion": "Supervisar la integridad de los datos"}
                ])
            
            if "interrupcion" in amenaza_norm or "servicio" in amenaza_norm:
                suggestions.extend([
                    {"nombre": "Redundancia de Sistemas", "tipo": "Tecnológico", "descripcion": "Implementar sistemas de respaldo"},
                    {"nombre": "Balanceadores de Carga", "tipo": "Tecnológico", "descripcion": "Distribuir la carga entre múltiples servidores"},
                    {"nombre": "Monitoreo Continuo", "tipo": "Tecnológico", "descripcion": "Supervisar el estado de los servicios 24/7"}
                ])
            
            return suggestions[:5]  # Limitar a 5 sugerencias
            
        except Exception as e:
            print(f"Error generando sugerencias: {str(e)}")
            return []
    
    def _normalize_text(self, text: str) -> str:
        """Normalizar texto para comparación"""
        if not text:
            return ""
        return re.sub(r'[^\w\s]', '', text.lower().strip())
    
    def _matches_pattern(self, text: str, pattern: str) -> bool:
        """Verificar si el texto coincide con el patrón"""
        if not text or not pattern:
            return False
        
        # Buscar palabras clave
        pattern_words = pattern.split('_')
        text_words = text.split()
        
        matches = sum(1 for word in pattern_words if any(word in text_word for text_word in text_words))
        return matches >= len(pattern_words) * 0.5  # Al menos 50% de coincidencia
    
    def _generate_generic_description(self, amenaza: str, vulnerabilidad: str) -> str:
        """Generar descripción genérica"""
        return f"Riesgo de {amenaza.lower()} debido a {vulnerabilidad.lower()}. Este riesgo puede materializarse cuando las amenazas exploten las vulnerabilidades identificadas, causando impactos en la operación."
    
    def _generate_generic_justification(self, probabilidad: str, impacto: str) -> str:
        """Generar justificación genérica"""
        return f"Evaluación basada en el análisis de {probabilidad.lower()} probabilidad y {impacto.lower()} impacto. Esta evaluación considera las características del activo, los controles existentes y las tendencias de seguridad observadas."

# Instancia global del servicio
predictive_service = PredictiveTextService()

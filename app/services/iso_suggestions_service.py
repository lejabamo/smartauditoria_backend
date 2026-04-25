#!/usr/bin/env python3
"""
Servicio de Sugerencias ISO 27001/27002
SGSRI - Sistema Predictivo de Riesgos ISO
"""

from typing import Dict, List, Optional

class ISOSuggestionsService:
    """Servicio para generar sugerencias basadas en ISO 27001/27002"""
    
    def __init__(self):
        # Amenazas según ISO 27001/27002
        self.threats_iso = {
            "acceso_no_autorizado": {
                "nombre": "Acceso No Autorizado",
                "categoria": "Tecnológica",
                "descripcion": "Acceso no autorizado a sistemas, aplicaciones o datos por parte de usuarios internos o externos",
                "norma_iso": "ISO 27001 A.9 - Gestión de Acceso",
                "controles_iso": [
                    "A.9.1 - Política de control de acceso",
                    "A.9.2 - Gestión de acceso de usuarios",
                    "A.9.3 - Responsabilidades del usuario",
                    "A.9.4 - Control de acceso a sistemas y aplicaciones"
                ],
                "vulnerabilidades_comunes": [
                    "Falta de autenticación multifactor",
                    "Contraseñas débiles",
                    "Permisos excesivos",
                    "Falta de auditoría de accesos"
                ]
            },
            "malware": {
                "nombre": "Malware",
                "categoria": "Tecnológica", 
                "descripcion": "Software malicioso que puede dañar sistemas, robar datos o comprometer la seguridad",
                "norma_iso": "ISO 27001 A.12 - Gestión de Incidentes",
                "controles_iso": [
                    "A.12.2 - Protección contra malware",
                    "A.12.3 - Respaldos de información",
                    "A.12.6 - Gestión de vulnerabilidades técnicas"
                ],
                "vulnerabilidades_comunes": [
                    "Software desactualizado",
                    "Falta de antivirus",
                    "Configuración insegura",
                    "Falta de parches de seguridad"
                ]
            },
            "perdida_datos": {
                "nombre": "Pérdida de Datos",
                "categoria": "Operacional",
                "descripcion": "Pérdida, corrupción o robo de información crítica de la organización",
                "norma_iso": "ISO 27001 A.12 - Gestión de Incidentes",
                "controles_iso": [
                    "A.12.3 - Respaldos de información",
                    "A.12.4 - Logging y monitoreo",
                    "A.12.6 - Gestión de vulnerabilidades técnicas"
                ],
                "vulnerabilidades_comunes": [
                    "Falta de respaldo",
                    "Configuración insegura",
                    "Falta de monitoreo",
                    "Almacenamiento no seguro"
                ]
            },
            "interrupcion_servicio": {
                "nombre": "Interrupción del Servicio",
                "categoria": "Operacional",
                "descripcion": "Interrupción o degradación de servicios críticos de la organización",
                "norma_iso": "ISO 27001 A.17 - Continuidad del Negocio",
                "controles_iso": [
                    "A.17.1 - Planificación de la continuidad del negocio",
                    "A.17.2 - Redundancia de la información"
                ],
                "vulnerabilidades_comunes": [
                    "Falta de redundancia",
                    "Configuración insegura",
                    "Falta de monitoreo",
                    "Dependencia de un solo punto"
                ]
            }
        }
        
        # Vulnerabilidades según ISO 27001/27002
        self.vulnerabilities_iso = {
            "falta_autenticacion": {
                "nombre": "Falta de Autenticación Multifactor",
                "categoria": "Tecnológica",
                "descripcion": "Ausencia de autenticación de múltiples factores para acceder a sistemas críticos",
                "norma_iso": "ISO 27001 A.9.2.3 - Gestión de credenciales privilegiadas",
                "impacto": "Alto - Permite acceso no autorizado a sistemas críticos",
                "controles_recomendados": [
                    "Implementar MFA para todos los accesos críticos",
                    "Establecer políticas de contraseñas robustas",
                    "Implementar autenticación biométrica"
                ]
            },
            "software_desactualizado": {
                "nombre": "Software Desactualizado",
                "categoria": "Tecnológica",
                "descripcion": "Uso de software con versiones obsoletas que contienen vulnerabilidades conocidas",
                "norma_iso": "ISO 27001 A.12.6 - Gestión de vulnerabilidades técnicas",
                "impacto": "Alto - Expone sistemas a vulnerabilidades conocidas",
                "controles_recomendados": [
                    "Implementar programa de gestión de parches",
                    "Automatizar actualizaciones de seguridad",
                    "Monitorear vulnerabilidades conocidas"
                ]
            },
            "configuracion_insegura": {
                "nombre": "Configuración Insegura",
                "categoria": "Tecnológica",
                "descripcion": "Configuraciones de sistemas que no siguen las mejores prácticas de seguridad",
                "norma_iso": "ISO 27001 A.12.2 - Protección contra malware",
                "impacto": "Medio - Reduce la efectividad de controles de seguridad",
                "controles_recomendados": [
                    "Implementar hardening de sistemas",
                    "Establecer configuraciones base seguras",
                    "Auditar configuraciones regularmente"
                ]
            },
            "falta_respaldo": {
                "nombre": "Falta de Respaldo",
                "categoria": "Operacional",
                "descripcion": "Ausencia de estrategia de respaldo para información crítica",
                "norma_iso": "ISO 27001 A.12.3 - Respaldos de información",
                "impacto": "Crítico - Pérdida total de información en caso de incidente",
                "controles_recomendados": [
                    "Implementar respaldos automáticos",
                    "Establecer estrategia 3-2-1",
                    "Probar restauración regularmente"
                ]
            }
        }
        
        # Controles según ISO 27001/27002
        self.controls_iso = {
            "autenticacion_multifactor": {
                "nombre": "Autenticación Multifactor",
                "categoria": "Tecnológico",
                "descripcion": "Sistema de autenticación que requiere múltiples factores de verificación",
                "norma_iso": "ISO 27001 A.9.2.3",
                "eficacia": "Alta",
                "implementacion": "Implementar MFA para todos los accesos críticos usando tokens, SMS o aplicaciones autenticadoras",
                "monitoreo": "Auditar accesos fallidos y configurar alertas"
            },
            "control_accesos": {
                "nombre": "Control de Accesos",
                "categoria": "Tecnológico",
                "descripcion": "Sistema de gestión de permisos basado en roles y responsabilidades",
                "norma_iso": "ISO 27001 A.9.1 - A.9.4",
                "eficacia": "Alta",
                "implementacion": "Implementar RBAC (Role-Based Access Control) y revisar permisos regularmente",
                "monitoreo": "Auditar accesos y revisar permisos trimestralmente"
            },
            "antivirus_empresarial": {
                "nombre": "Antivirus Empresarial",
                "categoria": "Tecnológico",
                "descripcion": "Solución de protección contra malware para endpoints y servidores",
                "norma_iso": "ISO 27001 A.12.2",
                "eficacia": "Alta",
                "implementacion": "Desplegar antivirus en todos los endpoints con actualizaciones automáticas",
                "monitoreo": "Monitorear detecciones y actualizar firmas diariamente"
            },
            "respaldos_automaticos": {
                "nombre": "Respaldos Automáticos",
                "categoria": "Tecnológico",
                "descripcion": "Sistema automatizado de respaldo de información crítica",
                "norma_iso": "ISO 27001 A.12.3",
                "eficacia": "Crítica",
                "implementacion": "Implementar respaldos automáticos con estrategia 3-2-1 (3 copias, 2 medios, 1 offsite)",
                "monitoreo": "Probar restauración mensualmente y verificar integridad"
            },
            "monitoreo_continuo": {
                "nombre": "Monitoreo Continuo",
                "categoria": "Tecnológico",
                "descripcion": "Sistema de monitoreo 24/7 de infraestructura y aplicaciones",
                "norma_iso": "ISO 27001 A.12.4",
                "eficacia": "Alta",
                "implementacion": "Implementar SIEM y monitoreo de infraestructura con alertas automáticas",
                "monitoreo": "Revisar logs diariamente y configurar alertas proactivas"
            }
        }
    
    def get_threat_suggestions(self, threat_name: str) -> Dict:
        """Obtener sugerencias de amenaza basadas en ISO 27001/27002"""
        threat_normalized = self._normalize_text(threat_name)
        
        for threat_key, threat_data in self.threats_iso.items():
            if self._matches_pattern(threat_normalized, threat_key):
                return {
                    "suggestions": threat_data,
                    "iso_controls": threat_data["controles_iso"],
                    "common_vulnerabilities": threat_data["vulnerabilidades_comunes"]
                }
        
        # Sugerencia genérica si no hay coincidencia
        return {
            "suggestions": {
                "nombre": threat_name,
                "categoria": "General",
                "descripcion": f"Amenaza identificada: {threat_name}. Se recomienda evaluar según ISO 27001 A.12 - Gestión de Incidentes",
                "norma_iso": "ISO 27001 A.12 - Gestión de Incidentes",
                "controles_iso": ["A.12.1 - Gestión de incidentes de seguridad de la información"]
            },
            "iso_controls": ["A.12.1 - Gestión de incidentes de seguridad de la información"],
            "common_vulnerabilities": ["Evaluar vulnerabilidades específicas del activo"]
        }
    
    def get_vulnerability_suggestions(self, vulnerability_name: str) -> Dict:
        """Obtener sugerencias de vulnerabilidad basadas en ISO 27001/27002"""
        vuln_normalized = self._normalize_text(vulnerability_name)
        
        for vuln_key, vuln_data in self.vulnerabilities_iso.items():
            if self._matches_pattern(vuln_normalized, vuln_key):
                return {
                    "suggestions": vuln_data,
                    "iso_controls": vuln_data["controles_recomendados"],
                    "impact_level": vuln_data["impacto"]
                }
        
        # Sugerencia genérica si no hay coincidencia
        return {
            "suggestions": {
                "nombre": vulnerability_name,
                "categoria": "General",
                "descripcion": f"Vulnerabilidad identificada: {vulnerability_name}. Se recomienda evaluar según ISO 27001 A.12.6 - Gestión de vulnerabilidades técnicas",
                "norma_iso": "ISO 27001 A.12.6 - Gestión de vulnerabilidades técnicas",
                "impacto": "Evaluar impacto específico del activo"
            },
            "iso_controls": ["A.12.6 - Gestión de vulnerabilidades técnicas"],
            "impact_level": "Evaluar impacto específico"
        }
    
    def get_control_suggestions(self, threat_name: str, vulnerability_name: str) -> List[Dict]:
        """Obtener sugerencias de controles basadas en ISO 27001/27002"""
        suggestions = []
        
        # Controles basados en amenaza
        threat_normalized = self._normalize_text(threat_name)
        vuln_normalized = self._normalize_text(vulnerability_name)
        
        if "acceso" in threat_normalized or "autorizado" in threat_normalized:
            suggestions.extend([
                self.controls_iso["autenticacion_multifactor"],
                self.controls_iso["control_accesos"]
            ])
        
        if "malware" in threat_normalized:
            suggestions.append(self.controls_iso["antivirus_empresarial"])
        
        if "perdida" in threat_normalized or "datos" in threat_normalized:
            suggestions.append(self.controls_iso["respaldos_automaticos"])
        
        if "interrupcion" in threat_normalized or "servicio" in threat_normalized:
            suggestions.append(self.controls_iso["monitoreo_continuo"])
        
        # Controles basados en vulnerabilidad
        if "autenticacion" in vuln_normalized:
            suggestions.append(self.controls_iso["autenticacion_multifactor"])
        
        if "software" in vuln_normalized or "desactualizado" in vuln_normalized:
            suggestions.append(self.controls_iso["antivirus_empresarial"])
        
        if "respaldo" in vuln_normalized:
            suggestions.append(self.controls_iso["respaldos_automaticos"])
        
        # Eliminar duplicados
        unique_suggestions = []
        seen_names = set()
        for suggestion in suggestions:
            if suggestion["nombre"] not in seen_names:
                unique_suggestions.append(suggestion)
                seen_names.add(suggestion["nombre"])
        
        return unique_suggestions[:5]  # Máximo 5 sugerencias
    
    def _normalize_text(self, text: str) -> str:
        """Normalizar texto para comparación"""
        if not text:
            return ""
        return text.lower().strip().replace(" ", "_").replace("-", "_")
    
    def _matches_pattern(self, text: str, pattern: str) -> bool:
        """Verificar si el texto coincide con el patrón"""
        if not text or not pattern:
            return False
        
        # Buscar palabras clave
        pattern_words = pattern.split('_')
        text_words = text.split('_')
        
        matches = sum(1 for word in pattern_words if any(word in text_word for text_word in text_words))
        return matches >= len(pattern_words) * 0.5  # Al menos 50% de coincidencia

# Instancia global del servicio
iso_suggestions_service = ISOSuggestionsService()

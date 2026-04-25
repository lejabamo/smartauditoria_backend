"""
Rutas de la API para el sistema predictivo basado en normas ISO
"""

from flask import Blueprint, request, jsonify
import logging
from typing import Dict, Any

from ..services.predictive.suggestion_service import PredictiveSuggestionService
from ..services.predictive.pdf_processor import ISOPDFProcessor

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear Blueprint
predictive_bp = Blueprint('predictive', __name__, url_prefix='/api/predictive')

# Inicializar servicios
suggestion_service = PredictiveSuggestionService()
pdf_processor = ISOPDFProcessor()

@predictive_bp.route('/suggestions/threats', methods=['POST'])
def suggest_threats():
    """Sugerir amenazas basadas en el tipo de activo"""
    try:
        data = request.get_json()
        asset_type = data.get('asset_type', '')
        context = data.get('context', '')
        
        if not asset_type:
            return jsonify({'error': 'asset_type es requerido'}), 400
        
        suggestions = suggestion_service.suggest_threats_for_asset(asset_type, context)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'metadata': {
                'asset_type': asset_type,
                'context': context,
                'total_suggestions': len(suggestions)
            }
        })
        
    except Exception as e:
        logger.error(f"Error al sugerir amenazas: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/suggestions/vulnerabilities', methods=['POST'])
def suggest_vulnerabilities():
    """Sugerir vulnerabilidades basadas en la amenaza seleccionada"""
    try:
        data = request.get_json()
        threat_id = data.get('threat_id', '')
        asset_type = data.get('asset_type', '')
        
        if not threat_id:
            return jsonify({'error': 'threat_id es requerido'}), 400
        
        suggestions = suggestion_service.suggest_vulnerabilities_for_threat(threat_id, asset_type)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'metadata': {
                'threat_id': threat_id,
                'asset_type': asset_type,
                'total_suggestions': len(suggestions)
            }
        })
        
    except Exception as e:
        logger.error(f"Error al sugerir vulnerabilidades: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/suggestions/controls', methods=['POST'])
def suggest_controls():
    """Sugerir controles basados en amenaza y vulnerabilidad usando datos reales de la BD"""
    try:
        from ..models import controles_seguridad
        from sqlalchemy import or_, and_
        
        data = request.get_json()
        threat_id = data.get('threat_id', '')
        threat_name = data.get('threat_name', '')  # Nombre de la amenaza
        vulnerability_id = data.get('vulnerability_id', '')
        vulnerability_name = data.get('vulnerability_name', '')  # Nombre de la vulnerabilidad
        risk_description = data.get('risk_description', '')  # Descripción completa del riesgo
        asset_type = data.get('asset_type', '')
        
        suggestions = []
        
        # Primero intentar obtener controles de la base de datos real
        try:
            # Buscar controles relevantes basados en palabras clave de amenaza, vulnerabilidad y descripción del riesgo
            keywords = []
            if threat_name:
                # Extraer palabras clave de la amenaza
                threat_words = threat_name.lower().split()
                keywords.extend([w for w in threat_words if len(w) > 3])
            if vulnerability_name:
                # Extraer palabras clave de la vulnerabilidad
                vuln_words = vulnerability_name.lower().split()
                keywords.extend([w for w in vuln_words if len(w) > 3])
            if risk_description:
                # Extraer palabras clave de la descripción del riesgo
                desc_words = risk_description.lower().split()
                keywords.extend([w for w in desc_words if len(w) > 4])  # Palabras más largas de la descripción
            
            # Buscar controles que coincidan con las palabras clave
            if keywords:
                filters = []
                for keyword in keywords[:5]:  # Limitar a 5 palabras clave
                    filters.append(
                        or_(
                            controles_seguridad.Nombre.ilike(f'%{keyword}%'),
                            controles_seguridad.Descripcion.ilike(f'%{keyword}%'),
                            controles_seguridad.Categoria.ilike(f'%{keyword}%')
                        )
                    )
                
                # Buscar controles que coincidan con al menos una palabra clave
                db_controls = controles_seguridad.query.filter(
                    or_(*filters)
                ).limit(10).all()
                
                for control in db_controls:
                    # Calcular relevancia basada en coincidencias
                    relevancia = 0
                    descripcion_lower = (control.Descripcion or '').lower()
                    nombre_lower = (control.Nombre or '').lower()
                    
                    for keyword in keywords:
                        if keyword in nombre_lower:
                            relevancia += 2
                        if keyword in descripcion_lower:
                            relevancia += 1
                    
                    # Convertir eficacia a número para el cálculo
                    eficacia_valor = 60  # Default
                    if control.Eficacia_Esperada:
                        eficacia_map = {
                            'Muy Alta': 90,
                            'Alta': 75,
                            'Media': 60,
                            'Baja': 40
                        }
                        eficacia_valor = eficacia_map.get(control.Eficacia_Esperada, 60)
                    
                    suggestion = {
                        'id': str(control.ID_Control),
                        'titulo': control.Nombre,
                        'descripcion': control.Descripcion or f"Control de seguridad {control.Categoria or 'general'}",
                        'categoria': control.Categoria or 'General',
                        'confianza': min(0.95, 0.6 + (relevancia * 0.05) + (eficacia_valor / 100 * 0.2)),
                        'implementacion': f"Implementar {control.Nombre} según las mejores prácticas de {control.Categoria or 'seguridad'}",
                        'prioridad': 3 if eficacia_valor >= 75 else (2 if eficacia_valor >= 60 else 1),
                        'eficacia': eficacia_valor
                    }
                    suggestions.append(suggestion)
        except Exception as db_error:
            logger.warning(f"Error obteniendo controles de BD, usando servicio predictivo: {db_error}")
        
        # Si no se encontraron controles en BD o hay pocos, complementar con servicio predictivo
        if len(suggestions) < 5 and threat_id and vulnerability_id:
            try:
                predictive_suggestions = suggestion_service.suggest_controls_for_risk(
                    threat_id, vulnerability_id, asset_type
                )
                # Agregar solo si no están duplicados
                for pred_suggestion in predictive_suggestions:
                    if not any(s['titulo'] == pred_suggestion.get('titulo', '') for s in suggestions):
                        # Convertir formato del servicio predictivo al formato esperado
                        suggestion = {
                            'id': pred_suggestion.get('id', ''),
                            'titulo': pred_suggestion.get('titulo', ''),
                            'descripcion': pred_suggestion.get('descripcion', ''),
                            'categoria': pred_suggestion.get('categoria', ''),
                            'confianza': pred_suggestion.get('confianza', 0.7),
                            'implementacion': pred_suggestion.get('implementacion', ''),
                            'prioridad': pred_suggestion.get('prioridad', 2),
                            'eficacia': int(pred_suggestion.get('confianza', 0.7) * 100)
                        }
                        suggestions.append(suggestion)
            except Exception as pred_error:
                logger.warning(f"Error obteniendo sugerencias predictivas: {pred_error}")
        
        # Ordenar por confianza y prioridad
        suggestions.sort(key=lambda x: (x.get('confianza', 0), x.get('prioridad', 0)), reverse=True)
        
        # Limitar a top 10
        suggestions = suggestions[:10]
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'metadata': {
                'threat_id': threat_id,
                'vulnerability_id': vulnerability_id,
                'asset_type': asset_type,
                'total_suggestions': len(suggestions),
                'source': 'database' if len(suggestions) > 0 else 'predictive'
            }
        })
        
    except Exception as e:
        logger.error(f"Error al sugerir controles: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/suggestions/residual-justifications', methods=['POST'])
def suggest_residual_justifications():
    """Sugerir justificaciones residuales basadas en normativa ISO 27005 y controles reales de la BD"""
    try:
        from ..models import controles_seguridad, db
        from sqlalchemy import or_, text
        from sqlalchemy.sql import func
        
        data = request.get_json()
        inherent_risk = data.get('inherent_risk', {})
        residual_risk = data.get('residual_risk', {})
        controls = data.get('controls', [])  # Lista de nombres de controles
        
        if not inherent_risk or not residual_risk:
            return jsonify({
                'success': True,
                'suggestions': []
            }), 200
        
        inherent_prob = inherent_risk.get('probabilidad', '')
        inherent_impact = inherent_risk.get('impacto', '')
        inherent_level = inherent_risk.get('nivel', '')
        
        residual_prob = residual_risk.get('probabilidad', '')
        residual_impact = residual_risk.get('impacto', '')
        residual_level = residual_risk.get('nivel', '')
        
        # Obtener controles reales de la BD con sus códigos ISO
        controles_reales = []
        for control_name in controls:
            # Buscar control por nombre (puede ser parcial)
            query = controles_seguridad.query.filter(
                or_(
                    controles_seguridad.Nombre.ilike(f'%{control_name}%'),
                    controles_seguridad.Descripcion.ilike(f'%{control_name}%')
                )
            )
            
            # Filtrar por activo si el campo existe
            if hasattr(controles_seguridad, 'activo'):
                query = query.filter(controles_seguridad.activo == True)
            
            control = query.first()
            
            if control:
                codigo_iso = getattr(control, 'codigo_control_iso', None) or getattr(control, 'codigo_iso', None)
                categoria_iso = getattr(control, 'categoria_control_iso', None) or getattr(control, 'Categoria', None) or ''
                descripcion = getattr(control, 'Descripcion', '') or ''
                eficacia = getattr(control, 'Eficacia_Esperada', '') or ''
                tipo = getattr(control, 'Tipo', '') or getattr(control, 'Tipo_Control', '') or ''
                
                controles_reales.append({
                    'id': control.ID_Control,
                    'nombre': control.Nombre,
                    'descripcion': descripcion,
                    'codigo_iso': codigo_iso,
                    'categoria_iso': categoria_iso,
                    'eficacia': eficacia,
                    'tipo': tipo
                })
        
        if not controles_reales:
            # Si no se encontraron controles, retornar sugerencias básicas
            return jsonify({
                'success': True,
                'suggestions': [{
                    'id': 'no-controls',
                    'titulo': 'Controles no encontrados',
                    'descripcion': 'No se encontraron controles en la base de datos para los nombres proporcionados. Verifica que los controles estén correctamente registrados.',
                    'norma': 'ISO 27005',
                    'articulo': 'A.8.1',
                    'confianza': 0.5,
                    'relacion_inherente': 'Se requiere verificar los controles seleccionados.',
                    'controles_mencionados': controls[:3]
                }]
            }), 200
        
        suggestions = []
        level_map = {
            'HIGH': 'Alto',
            'MEDIUM': 'Medio',
            'LOW': 'Bajo'
        }
        
        # Sugerencia 1: Reducción de probabilidad con controles específicos
        if inherent_prob and residual_prob and inherent_prob != residual_prob:
            # Identificar controles que reducen probabilidad (preventivos)
            controles_preventivos = [c for c in controles_reales if 
                'prevención' in c['descripcion'].lower() or 
                'preventivo' in c['tipo'].lower() or
                'detección' in c['descripcion'].lower() or
                'monitoreo' in c['descripcion'].lower() or
                c['codigo_iso'] and ('A.6' in str(c['codigo_iso']) or 'A.7' in str(c['codigo_iso']) or 'A.9' in str(c['codigo_iso']))
            ]
            
            if not controles_preventivos:
                controles_preventivos = controles_reales[:2]
            
            prob_reduction_text = f"La probabilidad del riesgo se ha reducido de '{inherent_prob}' a '{residual_prob}' mediante la implementación de controles de seguridad preventivos y de detección."
            
            # Construir texto con controles y códigos ISO
            controles_texto = []
            for ctrl in controles_preventivos[:3]:
                if ctrl['codigo_iso']:
                    controles_texto.append(f"'{ctrl['nombre']}' (ISO 27002:{ctrl['codigo_iso']})")
                else:
                    controles_texto.append(f"'{ctrl['nombre']}'")
            
            if controles_texto:
                prob_reduction_text += f" Los controles {', '.join(controles_texto)} han demostrado eficacia en la reducción de la probabilidad de materialización del riesgo."
            
            # Agregar descripción de controles si están disponibles
            if controles_preventivos[0]['descripcion']:
                prob_reduction_text += f" Específicamente, {controles_preventivos[0]['descripcion'][:150]}..."
            
            # Agregar referencia al marco legal colombiano
            prob_reduction_text += " Esta reducción cumple con los requisitos de ISO 27005:2022 A.6.1.2 y con la Resolución 2277 de 2025, que establece la necesidad de documentar la reducción de probabilidad mediante controles efectivos."
            
            suggestions.append({
                'id': 'prob-reduction',
                'titulo': 'Reducción de Probabilidad',
                'descripcion': prob_reduction_text,
                'norma': 'ISO 27005 + Res. 2277/2025',
                'articulo': 'ISO 27005 A.6.1.2 - Res. 2277/2025',
                'confianza': 0.92,
                'relacion_inherente': f"El riesgo inherente tenía una probabilidad '{inherent_prob}', que ha sido mitigada a '{residual_prob}' mediante los controles implementados según ISO 27005:2022 y Resolución 2277 de 2025.",
                'controles_mencionados': [c['nombre'] for c in controles_preventivos[:3]]
            })
        
        # Sugerencia 2: Reducción de impacto con controles de protección
        if inherent_impact and residual_impact and inherent_impact != residual_impact:
            # Identificar controles que reducen impacto (protección, recuperación)
            controles_proteccion = [c for c in controles_reales if 
                'protección' in c['descripcion'].lower() or 
                'recuperación' in c['descripcion'].lower() or
                'backup' in c['descripcion'].lower() or
                'respaldo' in c['descripcion'].lower() or
                'continuidad' in c['descripcion'].lower() or
                c['codigo_iso'] and ('A.12' in str(c['codigo_iso']) or 'A.17' in str(c['codigo_iso']) or 'A.18' in str(c['codigo_iso']))
            ]
            
            if not controles_proteccion:
                controles_proteccion = controles_reales[:2]
            
            impact_reduction_text = f"El impacto del riesgo se ha reducido de '{inherent_impact}' a '{residual_impact}' gracias a los controles de protección, recuperación y continuidad implementados."
            
            # Construir texto con controles y códigos ISO
            controles_texto = []
            for ctrl in controles_proteccion[:2]:
                if ctrl['codigo_iso']:
                    controles_texto.append(f"'{ctrl['nombre']}' (ISO 27002:{ctrl['codigo_iso']})")
                else:
                    controles_texto.append(f"'{ctrl['nombre']}'")
            
            if controles_texto:
                impact_reduction_text += f" Los controles {', '.join(controles_texto)} han contribuido significativamente a esta reducción."
            
            # Agregar eficacia si está disponible
            if controles_proteccion[0]['eficacia']:
                eficacia_map = {
                    'Muy Alta': 'muy alta eficacia',
                    'Alta': 'alta eficacia',
                    'Media': 'eficacia moderada',
                    'Baja': 'eficacia limitada'
                }
                eficacia = eficacia_map.get(controles_proteccion[0]['eficacia'], 'eficacia')
                impact_reduction_text += f" El control '{controles_proteccion[0]['nombre']}' tiene {eficacia} según la evaluación realizada."
            
            # Agregar referencia al marco legal colombiano
            impact_reduction_text += " Esta mitigación cumple con ISO 27002:2022 A.12.3 y con los requisitos mínimos de protección establecidos en la Resolución 500 de 2021 para activos críticos."
            
            suggestions.append({
                'id': 'impact-reduction',
                'titulo': 'Mitigación de Impacto',
                'descripcion': impact_reduction_text,
                'norma': 'ISO 27002 + Res. 500/2021',
                'articulo': 'ISO 27002 A.12.3 - Res. 500/2021',
                'confianza': 0.87,
                'relacion_inherente': f"El impacto inherente era '{inherent_impact}', ahora es '{residual_impact}' debido a las medidas de mitigación implementadas según ISO 27002:2022 y Resolución 500 de 2021.",
                'controles_mencionados': [c['nombre'] for c in controles_proteccion[:2]]
            })
        
        # Sugerencia 3: Reducción general del nivel de riesgo con análisis completo
        if inherent_level and residual_level and inherent_level != residual_level:
            inherent_level_text = level_map.get(inherent_level, inherent_level)
            residual_level_text = level_map.get(residual_level, residual_level)
            
            general_reduction_text = f"El nivel de riesgo se ha reducido de {inherent_level_text} a {residual_level_text}. "
            general_reduction_text += f"Esta reducción se debe a la combinación estratégica de {len(controles_reales)} controles que han mitigado tanto la probabilidad como el impacto del riesgo."
            
            # Mencionar controles principales con códigos ISO
            controles_principales = controles_reales[:3]
            controles_texto = []
            for ctrl in controles_principales:
                if ctrl['codigo_iso']:
                    controles_texto.append(f"'{ctrl['nombre']}' (ISO 27002:{ctrl['codigo_iso']})")
                else:
                    controles_texto.append(f"'{ctrl['nombre']}'")
            
            if controles_texto:
                general_reduction_text += f" Los controles {', '.join(controles_texto)} han demostrado eficacia según ISO 27005 en la gestión de riesgos residuales."
            
            # Agregar referencia a ISO 27005 y marco legal colombiano
            general_reduction_text += " Según ISO 27005:2022, la evaluación residual debe considerar la efectividad real de los controles implementados y su capacidad para mitigar el riesgo inherente, considerando tanto factores cuantitativos como cualitativos. "
            general_reduction_text += "Esta evaluación cumple además con la Resolución 2277 de 2025, que establece los lineamientos para la gestión de riesgos residuales, y con el CONPES 3995 de 2020 sobre Política de Seguridad Digital."
            
            suggestions.append({
                'id': 'level-reduction',
                'titulo': 'Reducción del Nivel de Riesgo',
                'descripcion': general_reduction_text,
                'norma': 'ISO 27005 + Res. 2277/2025 + CONPES 3995/2020',
                'articulo': 'ISO 27005 A.8.1 - Res. 2277/2025 - CONPES 3995/2020',
                'confianza': 0.96,
                'relacion_inherente': f"El riesgo inherente era {inherent_level_text} ({inherent_prob} probabilidad, {inherent_impact} impacto). Con los controles implementados, el riesgo residual es {residual_level_text} ({residual_prob} probabilidad, {residual_impact} impacto), conforme a ISO 27005:2022, Resolución 2277 de 2025 y CONPES 3995 de 2020.",
                'controles_mencionados': [c['nombre'] for c in controles_principales]
            })
        
        # Sugerencia 4: Análisis detallado de eficacia de controles específicos
        if controles_reales:
            controls_text = f"Los {len(controles_reales)} controles seleccionados han demostrado eficacia en la reducción del riesgo. "
            
            # Analizar cada control
            controles_detallados = []
            for ctrl in controles_reales[:3]:
                detalle = f"El control '{ctrl['nombre']}'"
                
                if ctrl['codigo_iso']:
                    detalle += f" (ISO 27002:{ctrl['codigo_iso']})"
                
                if ctrl['eficacia']:
                    eficacia_map = {
                        'Muy Alta': 'muy alta eficacia',
                        'Alta': 'alta eficacia',
                        'Media': 'eficacia moderada',
                        'Baja': 'eficacia limitada'
                    }
                    eficacia = eficacia_map.get(ctrl['eficacia'], 'eficacia')
                    detalle += f" tiene {eficacia}"
                
                if ctrl['descripcion']:
                    detalle += f" y se enfoca en {ctrl['descripcion'][:100]}"
                
                controles_detallados.append(detalle)
            
            if controles_detallados:
                controls_text += " ".join(controles_detallados) + ". "
            
            controls_text += "Según ISO 27005:2022, la evaluación residual debe considerar la efectividad real de los controles implementados, su capacidad para mitigar el riesgo inherente, y la necesidad de controles adicionales si el riesgo residual sigue siendo inaceptable. "
            
            # Obtener códigos ISO únicos para la referencia
            codigos_iso = [c['codigo_iso'] for c in controles_reales if c['codigo_iso']]
            if codigos_iso:
                controls_text += f" Los controles implementados están alineados con los requisitos de ISO 27002:2022, específicamente en las secciones {', '.join(set(codigos_iso[:3]))}. "
            
            # Agregar referencia al marco legal colombiano
            controls_text += "La evaluación de eficacia cumple con la Resolución 500 de 2021, que establece la necesidad de evaluar y documentar la efectividad de los controles de seguridad implementados."
            
            suggestions.append({
                'id': 'controls-efficacy',
                'titulo': 'Análisis de Eficacia de Controles',
                'descripcion': controls_text,
                'norma': 'ISO 27005 + Res. 500/2021',
                'articulo': 'ISO 27005 A.8.2 - Res. 500/2021',
                'confianza': 0.90,
                'relacion_inherente': f"Los {len(controles_reales)} controles implementados han mitigado el riesgo inherente {level_map.get(inherent_level, inherent_level)} al nivel residual {level_map.get(residual_level, residual_level)}, conforme a ISO 27005:2022 y Resolución 500 de 2021.",
                'controles_mencionados': [c['nombre'] for c in controles_reales[:3]]
            })
        
        # Sugerencia 5: Justificación basada en normativa ISO 27005 y marco legal colombiano
        if controles_reales and inherent_level != residual_level:
            # Construir texto base con referencias ISO
            iso_text = f"De acuerdo con ISO 27005:2022, la gestión de riesgos residuales requiere una justificación clara de cómo los controles implementados han reducido el riesgo desde el nivel inherente ({level_map.get(inherent_level, inherent_level)}) al nivel residual ({level_map.get(residual_level, residual_level)}). "
            
            # Agregar referencias a controles específicos
            if len(controles_reales) > 0:
                iso_text += f"Los controles implementados incluyen: "
                controles_ref = []
                for ctrl in controles_reales[:3]:
                    ref = f"'{ctrl['nombre']}'"
                    if ctrl['codigo_iso']:
                        ref += f" conforme a ISO 27002:{ctrl['codigo_iso']}"
                    controles_ref.append(ref)
                iso_text += ", ".join(controles_ref) + ". "
            
            # Agregar referencias al marco legal colombiano
            iso_text += "Estos controles han sido seleccionados y aplicados siguiendo las mejores prácticas establecidas en ISO 27002:2022, y cumplen con los requisitos establecidos en el marco normativo colombiano, específicamente: "
            iso_text += "Resolución 500 de 2021 (Requisitos Mínimos de Seguridad), Resolución 2277 de 2025 (Gestión de Riesgos Residuales), y el Documento CONPES 3995 de 2020 (Política de Seguridad Digital). "
            iso_text += "Han demostrado su efectividad en la reducción tanto de la probabilidad como del impacto del riesgo identificado."
            
            suggestions.append({
                'id': 'iso-justification',
                'titulo': 'Justificación según ISO 27005 y Marco Legal Colombia',
                'descripcion': iso_text,
                'norma': 'ISO 27005 + Marco Legal Colombia',
                'articulo': 'ISO 27005 A.8 - Res. 2277/2025 - Res. 500/2021 - CONPES 3995/2020',
                'confianza': 0.95,  # Mayor confianza al incluir marco legal
                'relacion_inherente': f"La justificación se basa en la reducción documentada del riesgo desde {level_map.get(inherent_level, inherent_level)} a {level_map.get(residual_level, residual_level)}, conforme a los requisitos de ISO 27005:2022, Resolución 2277 de 2025, Resolución 500 de 2021 y CONPES 3995 de 2020.",
                'controles_mencionados': [c['nombre'] for c in controles_reales[:3]]
            })
            
            # Sugerencia adicional específica para marco legal colombiano
            if len(controles_reales) > 0:
                legal_text = f"Conforme al marco normativo colombiano, la evaluación residual del riesgo debe documentar la efectividad de los controles implementados. "
                legal_text += f"En este caso, los controles '{', '.join([c['nombre'] for c in controles_reales[:2]])}' han sido implementados siguiendo los requisitos mínimos establecidos en la Resolución 500 de 2021, "
                legal_text += f"y la reducción del riesgo desde {level_map.get(inherent_level, inherent_level)} a {level_map.get(residual_level, residual_level)} cumple con los lineamientos de la Resolución 2277 de 2025. "
                legal_text += f"Esta evaluación está alineada con la Política de Seguridad Digital (CONPES 3995 de 2020) y contribuye al cumplimiento del Decreto 767 de 2022 sobre Gobierno Digital."
                
                suggestions.append({
                    'id': 'legal-colombia-justification',
                    'titulo': 'Justificación según Marco Legal Colombia',
                    'descripcion': legal_text,
                    'norma': 'Marco Legal Colombia',
                    'articulo': 'Res. 2277/2025 - Res. 500/2021 - CONPES 3995/2020 - Dec. 767/2022',
                    'confianza': 0.90,
                    'relacion_inherente': f"La evaluación cumple con los requisitos del marco normativo colombiano para la gestión de riesgos residuales, documentando la reducción desde {level_map.get(inherent_level, inherent_level)} a {level_map.get(residual_level, residual_level)} mediante controles que cumplen con los estándares mínimos establecidos.",
                    'controles_mencionados': [c['nombre'] for c in controles_reales[:2]]
                })
        
        return jsonify({
            'success': True,
            'suggestions': suggestions[:5]  # Máximo 5 sugerencias
        }), 200
        
    except Exception as e:
        logger.error(f"Error al sugerir justificaciones residuales: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/suggestions/justifications', methods=['POST'])
def suggest_justifications():
    """Sugerir justificaciones basadas en controles seleccionados"""
    try:
        from ..models import controles_seguridad
        from sqlalchemy import or_
        
        data = request.get_json()
        controls = data.get('controls', [])  # Lista de nombres o IDs de controles
        risk_type = data.get('risk_type', '')
        
        if not controls or len(controls) == 0:
            return jsonify({
                'success': True,
                'suggestions': []
            }), 200
        
        # Buscar controles en la base de datos
        suggestions = []
        for control_name in controls:
            # Buscar control por nombre (puede ser parcial)
            control = controles_seguridad.query.filter(
                or_(
                    controles_seguridad.Nombre.ilike(f'%{control_name}%'),
                    controles_seguridad.Descripcion.ilike(f'%{control_name}%')
                )
            ).first()
            
            if control:
                # Generar justificación basada en el control real
                justification_text = f"El control '{control.Nombre}' "
                
                if control.Descripcion:
                    # Usar la descripción del control para generar justificación
                    descripcion = control.Descripcion
                    if len(descripcion) > 200:
                        descripcion = descripcion[:200] + "..."
                    justification_text += descripcion
                else:
                    justification_text += f"mitiga el riesgo mediante {control.Categoria or 'medidas de seguridad'}."
                
                # Agregar información de eficacia si está disponible
                if control.Eficacia_Esperada:
                    eficacia_map = {
                        'Muy Alta': 'reduciendo significativamente',
                        'Alta': 'reduciendo considerablemente',
                        'Media': 'reduciendo',
                        'Baja': 'mitigando parcialmente'
                    }
                    eficacia_text = eficacia_map.get(control.Eficacia_Esperada, 'reduciendo')
                    justification_text += f" Este control tiene una eficacia {control.Eficacia_Esperada.lower()}, {eficacia_text} la probabilidad o impacto del riesgo."
                
                # Buscar norma ISO relacionada si existe
                norma_iso = "ISO 27002"
                articulo_iso = ""
                
                # Mapeo básico de categorías a artículos ISO 27002
                categoria_articulo_map = {
                    'Tecnológica': 'A.10',
                    'Física': 'A.11',
                    'Organizativa': 'A.6',
                    'Legal': 'A.18',
                    'Humana': 'A.7'
                }
                
                if control.Categoria and control.Categoria in categoria_articulo_map:
                    articulo_iso = categoria_articulo_map[control.Categoria]
                
                suggestion = {
                    'id': str(control.ID_Control),
                    'titulo': control.Nombre,
                    'descripcion': justification_text,
                    'norma': norma_iso,
                    'articulo': articulo_iso or 'A.5',
                    'confianza': 0.85 if control.Eficacia_Esperada in ['Muy Alta', 'Alta'] else 0.7
                }
                suggestions.append(suggestion)
        
        # Si no se encontraron controles en BD, retornar lista vacía (no mock)
        return jsonify({
            'success': True,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        logger.error(f"Error al sugerir justificaciones: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/suggestions/complete', methods=['POST'])
def get_complete_suggestions():
    """Obtener sugerencias completas para evaluación de riesgos basadas en datos reales"""
    try:
        from ..models import db, Riesgo, Activo, evaluacion_riesgo_activo, controles_seguridad
        from sqlalchemy import text, func
        
        data = request.get_json()
        asset_type = data.get('asset_type', '')
        context = data.get('context', '')
        activo_id = data.get('activo_id')  # ID del activo actual si está disponible
        
        if not asset_type:
            return jsonify({'error': 'asset_type es requerido'}), 400
        
        # Obtener amenazas reales de la base de datos basadas en el tipo de activo
        amenazas_reales = []
        try:
            # Buscar riesgos (amenazas) relacionados con activos similares
            if activo_id:
                # Buscar evaluaciones de activos similares
                activos_similares = db.session.query(Activo.ID_Activo).filter(
                    Activo.Tipo_Activo.ilike(f'%{asset_type}%'),
                    Activo.ID_Activo != activo_id
                ).limit(10).all()
                
                activo_ids = [a[0] for a in activos_similares]
                
                if activo_ids:
                    riesgos_result = db.session.execute(
                        text("""
                            SELECT DISTINCT r.ID_Riesgo, r.Nombre, r.Descripcion, r.tipo_riesgo,
                                   COUNT(DISTINCT era.ID_Activo) as frecuencia
                            FROM riesgos r
                            JOIN evaluacion_riesgo_activo era ON r.ID_Riesgo = era.ID_Riesgo
                            WHERE era.ID_Activo IN :activo_ids
                            GROUP BY r.ID_Riesgo, r.Nombre, r.Descripcion, r.tipo_riesgo
                            ORDER BY frecuencia DESC
                            LIMIT 5
                        """),
                        {'activo_ids': tuple(activo_ids)}
                    ).fetchall()
                    
                    for riesgo in riesgos_result:
                        amenazas_reales.append({
                            'id': f"riesgo_{riesgo.ID_Riesgo}",
                            'nombre': riesgo.Nombre,
                            'descripcion': riesgo.Descripcion or '',
                            'categoria': riesgo.tipo_riesgo or 'Tecnológica',
                            'confianza': min(0.7 + (riesgo.frecuencia * 0.1), 0.95)
                        })
            
            # Si no hay amenazas de activos similares, buscar amenazas más comunes
            if not amenazas_reales:
                riesgos_comunes = db.session.query(
                    Riesgo.ID_Riesgo,
                    Riesgo.Nombre,
                    Riesgo.Descripcion,
                    Riesgo.tipo_riesgo,
                    func.count(evaluacion_riesgo_activo.ID_Activo).label('frecuencia')
                ).join(
                    evaluacion_riesgo_activo, Riesgo.ID_Riesgo == evaluacion_riesgo_activo.ID_Riesgo
                ).group_by(
                    Riesgo.ID_Riesgo, Riesgo.Nombre, Riesgo.Descripcion, Riesgo.tipo_riesgo
                ).order_by(
                    func.count(evaluacion_riesgo_activo.ID_Activo).desc()
                ).limit(5).all()
                
                for riesgo in riesgos_comunes:
                    amenazas_reales.append({
                        'id': f"riesgo_{riesgo.ID_Riesgo}",
                        'nombre': riesgo.Nombre,
                        'descripcion': riesgo.Descripcion or '',
                        'categoria': riesgo.tipo_riesgo or 'Tecnológica',
                        'confianza': min(0.6 + (riesgo.frecuencia * 0.05), 0.9)
                    })
        except Exception as e:
            logger.error(f"Error obteniendo amenazas reales: {e}")
        
        # Obtener vulnerabilidades reales
        vulnerabilidades_reales = []
        try:
            vulnerabilidades_db = db.session.execute(
                text("""
                    SELECT DISTINCT ID_Vulnerabilidad, Nombre, Descripcion, Categoria
                    FROM vulnerabilidades
                    ORDER BY ID_Vulnerabilidad
                    LIMIT 5
                """)
            ).fetchall()
            
            for vuln in vulnerabilidades_db:
                vulnerabilidades_reales.append({
                    'id': f"vuln_{vuln.ID_Vulnerabilidad}",
                    'nombre': vuln.Nombre,
                    'descripcion': vuln.Descripcion or '',
                    'categoria': vuln.Categoria or 'Tecnológica',
                    'confianza': 0.75
                })
        except Exception as e:
            logger.error(f"Error obteniendo vulnerabilidades reales: {e}")
        
        # Obtener controles reales
        controles_reales = []
        try:
            # El modelo controles_seguridad no tiene campo 'activo', obtener todos
            controles_db = controles_seguridad.query.order_by(controles_seguridad.Nombre).limit(10).all()
            
            for control in controles_db:
                controles_reales.append({
                    'id': f"control_{control.ID_Control}",
                    'nombre': control.Nombre,
                    'descripcion': control.Descripcion or '',
                    'categoria': control.Categoria or 'Tecnológica',
                    'confianza': 0.8
                })
        except Exception as e:
            logger.error(f"Error obteniendo controles reales: {e}")
        
        # Si no hay datos reales, usar servicio predictivo como fallback
        if not amenazas_reales and not vulnerabilidades_reales and not controles_reales:
            suggestions = suggestion_service.get_risk_assessment_suggestions(asset_type, context)
            return jsonify({
                'success': True,
                'data': suggestions
            })
        
        return jsonify({
            'success': True,
            'data': {
                'amenazas': amenazas_reales,
                'vulnerabilidades': vulnerabilidades_reales,
                'controles': controles_reales,
                'metadata': {
                    'asset_type': asset_type,
                    'context': context,
                    'source': 'database',
                    'total_suggestions': len(amenazas_reales) + len(vulnerabilidades_reales) + len(controles_reales)
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error al obtener sugerencias completas: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/knowledge-base/status', methods=['GET'])
def get_knowledge_base_status():
    """Obtener estado de la base de conocimiento"""
    try:
        knowledge_base = suggestion_service.knowledge_base
        
        status = {
            'controles_count': len(knowledge_base.get('controles', {})),
            'amenazas_count': len(knowledge_base.get('amenazas', {})),
            'vulnerabilidades_count': len(knowledge_base.get('vulnerabilidades', {})),
            'relaciones_count': len(knowledge_base.get('relaciones', {})),
            'last_updated': 'N/A'  # Se puede implementar timestamp
        }
        
        return jsonify({
            'success': True,
            'status': status
        })
        
    except Exception as e:
        logger.error(f"Error al obtener estado de la base de conocimiento: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/knowledge-base/refresh', methods=['POST'])
def refresh_knowledge_base():
    """Refrescar la base de conocimiento procesando documentos ISO"""
    try:
        # Procesar documentos ISO
        processed_data = pdf_processor.process_all_documents()
        
        # Guardar datos procesados
        if pdf_processor.save_processed_data():
            # Recargar el servicio de sugerencias
            global suggestion_service
            suggestion_service = PredictiveSuggestionService()
            
            return jsonify({
                'success': True,
                'message': 'Base de conocimiento actualizada exitosamente',
                'data': {
                    'controles': len(processed_data.get('controles', {})),
                    'amenazas': len(processed_data.get('amenazas', {})),
                    'vulnerabilidades': len(processed_data.get('vulnerabilidades', {}))
                }
            })
        else:
            return jsonify({'error': 'Error al guardar la base de conocimiento'}), 500
        
    except Exception as e:
        logger.error(f"Error al refrescar la base de conocimiento: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/asset-types', methods=['GET'])
def get_asset_types():
    """Obtener tipos de activos disponibles"""
    try:
        asset_types = [
            {
                'id': 'servidor',
                'nombre': 'Servidor',
                'descripcion': 'Servidores físicos o virtuales'
            },
            {
                'id': 'base_datos',
                'nombre': 'Base de Datos',
                'descripcion': 'Sistemas de gestión de bases de datos'
            },
            {
                'id': 'aplicacion',
                'nombre': 'Aplicación',
                'descripcion': 'Aplicaciones de software'
            },
            {
                'id': 'red',
                'nombre': 'Red',
                'descripcion': 'Infraestructura de red'
            },
            {
                'id': 'dispositivo_movil',
                'nombre': 'Dispositivo Móvil',
                'descripcion': 'Dispositivos móviles y portátiles'
            },
            {
                'id': 'infraestructura',
                'nombre': 'Infraestructura',
                'descripcion': 'Infraestructura física y lógica'
            },
            {
                'id': 'datos',
                'nombre': 'Datos',
                'descripcion': 'Información y datos'
            },
            {
                'id': 'usuario',
                'nombre': 'Usuario',
                'descripcion': 'Usuarios del sistema'
            }
        ]
        
        return jsonify({
            'success': True,
            'asset_types': asset_types
        })
        
    except Exception as e:
        logger.error(f"Error al obtener tipos de activos: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_bp.route('/risk-level/calculate', methods=['POST'])
def calculate_risk_level():
    """Calcular nivel de riesgo basado en amenaza y vulnerabilidad"""
    try:
        data = request.get_json()
        threat_id = data.get('threat_id', '')
        vulnerability_id = data.get('vulnerability_id', '')
        asset_type = data.get('asset_type', '')
        
        if not threat_id or not vulnerability_id:
            return jsonify({'error': 'threat_id y vulnerability_id son requeridos'}), 400
        
        # Obtener datos de amenaza y vulnerabilidad
        knowledge_base = suggestion_service.knowledge_base
        threat_data = knowledge_base.get('amenazas', {}).get(threat_id, {})
        vuln_data = knowledge_base.get('vulnerabilidades', {}).get(vulnerability_id, {})
        
        if not threat_data or not vuln_data:
            return jsonify({'error': 'Amenaza o vulnerabilidad no encontrada'}), 404
        
        # Calcular nivel de riesgo (simplificado)
        risk_level = "MEDIUM"  # Por defecto
        
        # Lógica de cálculo de riesgo (se puede expandir)
        if threat_data.get('categoria') == 'Tecnológica' and vuln_data.get('categoria') == 'Tecnológica':
            risk_level = "HIGH"
        elif threat_data.get('categoria') == 'Humana' and vuln_data.get('categoria') == 'Humana':
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        return jsonify({
            'success': True,
            'risk_level': risk_level,
            'threat': threat_data,
            'vulnerability': vuln_data,
            'metadata': {
                'asset_type': asset_type,
                'calculation_method': 'simplified'
            }
        })
        
    except Exception as e:
        logger.error(f"Error al calcular nivel de riesgo: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

# Función para registrar el Blueprint
def register_predictive_routes(app):
    """Registrar rutas predictivas en la aplicación Flask"""
    app.register_blueprint(predictive_bp)
    logger.info("Rutas predictivas registradas exitosamente")

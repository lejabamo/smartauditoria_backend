#!/usr/bin/env python3
"""
API para Sugerencias ISO 27001/27002
SGSRI - Sistema Predictivo de Riesgos ISO
"""

from flask import Blueprint, request, jsonify
from app.services.iso_suggestions_service import iso_suggestions_service
import logging

# Crear blueprint
iso_suggestions_bp = Blueprint('iso_suggestions', __name__)

@iso_suggestions_bp.route('/iso/threat-suggestions', methods=['POST'])
def get_threat_suggestions():
    """Obtener sugerencias de amenaza basadas en ISO 27001/27002"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        threat_name = data.get('threat_name', '')
        
        if not threat_name:
            return jsonify({'error': 'Nombre de amenaza es requerido'}), 400
        
        # Obtener sugerencias de amenaza
        suggestions = iso_suggestions_service.get_threat_suggestions(threat_name)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'threat_name': threat_name
        })
        
    except Exception as e:
        logging.error(f"Error obteniendo sugerencias de amenaza: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@iso_suggestions_bp.route('/iso/vulnerability-suggestions', methods=['POST'])
def get_vulnerability_suggestions():
    """Obtener sugerencias de vulnerabilidad basadas en ISO 27001/27002"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        vulnerability_name = data.get('vulnerability_name', '')
        
        if not vulnerability_name:
            return jsonify({'error': 'Nombre de vulnerabilidad es requerido'}), 400
        
        # Obtener sugerencias de vulnerabilidad
        suggestions = iso_suggestions_service.get_vulnerability_suggestions(vulnerability_name)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'vulnerability_name': vulnerability_name
        })
        
    except Exception as e:
        logging.error(f"Error obteniendo sugerencias de vulnerabilidad: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@iso_suggestions_bp.route('/iso/control-suggestions', methods=['POST'])
def get_control_suggestions():
    """Obtener sugerencias de controles basadas en ISO 27001/27002"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        threat_name = data.get('threat_name', '')
        vulnerability_name = data.get('vulnerability_name', '')
        
        if not threat_name or not vulnerability_name:
            return jsonify({'error': 'Nombre de amenaza y vulnerabilidad son requeridos'}), 400
        
        # Obtener sugerencias de controles
        suggestions = iso_suggestions_service.get_control_suggestions(threat_name, vulnerability_name)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'threat_name': threat_name,
            'vulnerability_name': vulnerability_name
        })
        
    except Exception as e:
        logging.error(f"Error obteniendo sugerencias de controles: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@iso_suggestions_bp.route('/iso/all-suggestions', methods=['POST'])
def get_all_suggestions():
    """Obtener todas las sugerencias basadas en ISO 27001/27002"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        threat_name = data.get('threat_name', '')
        vulnerability_name = data.get('vulnerability_name', '')
        
        if not threat_name or not vulnerability_name:
            return jsonify({'error': 'Nombre de amenaza y vulnerabilidad son requeridos'}), 400
        
        # Obtener todas las sugerencias
        threat_suggestions = iso_suggestions_service.get_threat_suggestions(threat_name)
        vulnerability_suggestions = iso_suggestions_service.get_vulnerability_suggestions(vulnerability_name)
        control_suggestions = iso_suggestions_service.get_control_suggestions(threat_name, vulnerability_name)
        
        return jsonify({
            'success': True,
            'suggestions': {
                'threat': threat_suggestions,
                'vulnerability': vulnerability_suggestions,
                'controls': control_suggestions
            },
            'threat_name': threat_name,
            'vulnerability_name': vulnerability_name
        })
        
    except Exception as e:
        logging.error(f"Error obteniendo todas las sugerencias: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

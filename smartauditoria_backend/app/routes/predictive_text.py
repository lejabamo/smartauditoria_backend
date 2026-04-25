#!/usr/bin/env python3
"""
API para Predicción de Texto
SGSRI - Sistema Predictivo de Riesgos ISO
"""

from flask import Blueprint, request, jsonify
from app.services.predictive_text_service import predictive_service
import logging

# Crear blueprint
predictive_text_bp = Blueprint('predictive_text', __name__)

@predictive_text_bp.route('/predictive/generate-description', methods=['POST'])
def generate_risk_description():
    """Generar descripción predictiva del riesgo"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        amenaza = data.get('amenaza', '')
        vulnerabilidad = data.get('vulnerabilidad', '')
        
        if not amenaza or not vulnerabilidad:
            return jsonify({'error': 'Amenaza y vulnerabilidad son requeridas'}), 400
        
        # Generar descripción predictiva
        description = predictive_service.generate_risk_description(amenaza, vulnerabilidad)
        
        return jsonify({
            'success': True,
            'description': description,
            'amenaza': amenaza,
            'vulnerabilidad': vulnerabilidad
        })
        
    except Exception as e:
        logging.error(f"Error generando descripción: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_text_bp.route('/predictive/generate-justification', methods=['POST'])
def generate_justification():
    """Generar justificación predictiva"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        probabilidad = data.get('probabilidad', '')
        impacto = data.get('impacto', '')
        
        if not probabilidad or not impacto:
            return jsonify({'error': 'Probabilidad e impacto son requeridos'}), 400
        
        # Generar justificación predictiva
        justification = predictive_service.generate_justification(probabilidad, impacto)
        
        return jsonify({
            'success': True,
            'justification': justification,
            'probabilidad': probabilidad,
            'impacto': impacto
        })
        
    except Exception as e:
        logging.error(f"Error generando justificación: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_text_bp.route('/predictive/generate-controls', methods=['POST'])
def generate_control_suggestions():
    """Generar sugerencias de controles"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        amenaza = data.get('amenaza', '')
        vulnerabilidad = data.get('vulnerabilidad', '')
        
        if not amenaza or not vulnerabilidad:
            return jsonify({'error': 'Amenaza y vulnerabilidad son requeridas'}), 400
        
        # Generar sugerencias de controles
        suggestions = predictive_service.generate_control_suggestions(amenaza, vulnerabilidad)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'amenaza': amenaza,
            'vulnerabilidad': vulnerabilidad
        })
        
    except Exception as e:
        logging.error(f"Error generando sugerencias: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@predictive_text_bp.route('/predictive/generate-all', methods=['POST'])
def generate_all_predictions():
    """Generar todas las predicciones de una vez"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        amenaza = data.get('amenaza', '')
        vulnerabilidad = data.get('vulnerabilidad', '')
        probabilidad = data.get('probabilidad', '')
        impacto = data.get('impacto', '')
        
        if not amenaza or not vulnerabilidad:
            return jsonify({'error': 'Amenaza y vulnerabilidad son requeridas'}), 400
        
        # Generar todas las predicciones
        description = predictive_service.generate_risk_description(amenaza, vulnerabilidad)
        suggestions = predictive_service.generate_control_suggestions(amenaza, vulnerabilidad)
        
        justification = ""
        if probabilidad and impacto:
            justification = predictive_service.generate_justification(probabilidad, impacto)
        
        return jsonify({
            'success': True,
            'predictions': {
                'description': description,
                'justification': justification,
                'controls': suggestions
            },
            'inputs': {
                'amenaza': amenaza,
                'vulnerabilidad': vulnerabilidad,
                'probabilidad': probabilidad,
                'impacto': impacto
            }
        })
        
    except Exception as e:
        logging.error(f"Error generando predicciones: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

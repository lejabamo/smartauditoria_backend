#!/usr/bin/env python3
"""
Servicio de Entrenamiento de Modelos ML
SGSRI - Sistema Predictivo de Riesgos ISO
"""

import pandas as pd
import numpy as np
from sqlalchemy import text
from app import create_app
from app.models import Activo, evaluacion_riesgo_activo, Riesgo
from .models.risk_predictor import RiskPredictor
import logging
from datetime import datetime
import json

class MLTrainingService:
    def __init__(self):
        self.app = create_app()
        self.predictor = RiskPredictor()
        self.logger = logging.getLogger(__name__)
    
    def prepare_training_data(self):
        """Preparar datos de entrenamiento desde la base de datos"""
        with self.app.app_context():
            try:
                self.logger.info("Preparando datos de entrenamiento...")
                
                # Query para obtener datos de entrenamiento
                query = """
                SELECT 
                    a.ID_Activo,
                    a.Nombre,
                    a.Tipo_Activo,
                    a.nivel_criticidad_negocio,
                    a.estado_activo,
                    era.id_nivel_probabilidad_inherente,
                    era.id_nivel_impacto_inherente,
                    era.id_nivel_riesgo_inherente_calculado,
                    r.Nombre as riesgo_nombre,
                    r.Descripcion as riesgo_descripcion
                FROM Activo a
                INNER JOIN evaluacion_riesgo_activo era ON a.ID_Activo = era.ID_Activo
                INNER JOIN Riesgo r ON era.ID_Riesgo = r.ID_Riesgo
                WHERE era.fecha_evaluacion_inherente IS NOT NULL
                """
                
                # Ejecutar query
                with self.app.app_context():
                    from app import db
                    result = db.session.execute(text(query))
                    data = result.fetchall()
                
                # Convertir a DataFrame
                columns = [
                    'ID_Activo', 'Nombre', 'Tipo_Activo', 'nivel_criticidad_negocio',
                    'estado_activo', 'id_nivel_probabilidad_inherente',
                    'id_nivel_impacto_inherente', 'id_nivel_riesgo_inherente_calculado',
                    'riesgo_nombre', 'riesgo_descripcion'
                ]
                
                df = pd.DataFrame(data, columns=columns)
                
                self.logger.info(f"Datos de entrenamiento preparados: {len(df)} registros")
                return df
                
            except Exception as e:
                self.logger.error(f"Error preparando datos de entrenamiento: {str(e)}")
                raise
    
    def train_models(self):
        """Entrenar todos los modelos ML"""
        try:
            self.logger.info("Iniciando entrenamiento de modelos ML...")
            
            # Preparar datos
            df = self.prepare_training_data()
            
            if len(df) < 10:
                raise ValueError("Insuficientes datos para entrenamiento (mínimo 10 registros)")
            
            # Preparar características
            X = self.predictor.prepare_features(df)
            
            # Entrenar clasificador de riesgo
            y_risk = df['id_nivel_riesgo_inherente_calculado']
            risk_accuracy = self.predictor.train_risk_classifier(X, y_risk)
            
            # Entrenar regresor de impacto
            y_impact = df['id_nivel_impacto_inherente']
            impact_mse = self.predictor.train_impact_regressor(X, y_impact)
            
            # Entrenar regresor de probabilidad
            y_prob = df['id_nivel_probabilidad_inherente']
            prob_mse = self.predictor.train_probability_regressor(X, y_prob)
            
            # Marcar como entrenado
            self.predictor.is_trained = True
            
            # Generar reporte de entrenamiento
            training_report = {
                'fecha_entrenamiento': datetime.now().isoformat(),
                'datos_entrenamiento': {
                    'total_registros': len(df),
                    'activos_unicos': df['ID_Activo'].nunique(),
                    'riesgos_unicos': df['riesgo_nombre'].nunique()
                },
                'metricas_modelos': {
                    'risk_classifier_accuracy': float(risk_accuracy),
                    'impact_regressor_mse': float(impact_mse),
                    'probability_regressor_mse': float(prob_mse)
                },
                'estado': 'Entrenamiento completado exitosamente'
            }
            
            # Guardar reporte
            self.save_training_report(training_report)
            
            self.logger.info("Entrenamiento completado exitosamente")
            return training_report
            
        except Exception as e:
            self.logger.error(f"Error en entrenamiento: {str(e)}")
            raise
    
    def save_training_report(self, report):
        """Guardar reporte de entrenamiento"""
        try:
            import os
            os.makedirs('backend/ml/reports', exist_ok=True)
            
            filepath = f'backend/ml/reports/training_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False, default=str)
            
            self.logger.info(f"Reporte de entrenamiento guardado: {filepath}")
            
        except Exception as e:
            self.logger.error(f"Error guardando reporte: {str(e)}")
    
    def get_model_status(self):
        """Obtener estado de los modelos"""
        return self.predictor.get_model_info()
    
    def predict_risk_for_activo(self, activo_id):
        """Predecir riesgo para un activo específico"""
        try:
            with self.app.app_context():
                from app import db
                
                # Obtener datos del activo
                activo = Activo.query.get(activo_id)
                if not activo:
                    raise ValueError(f"Activo {activo_id} no encontrado")
                
                # Preparar datos para predicción
                activo_data = pd.DataFrame([{
                    'ID_Activo': activo.ID_Activo,
                    'Tipo_Activo': activo.Tipo_Activo,
                    'nivel_criticidad_negocio': activo.nivel_criticidad_negocio,
                    'estado_activo': activo.estado_activo
                }])
                
                # Realizar predicción
                prediction = self.predictor.predict_risk(activo_data)
                
                return prediction
                
        except Exception as e:
            self.logger.error(f"Error prediciendo riesgo para activo {activo_id}: {str(e)}")
            raise

def main():
    """Función principal para entrenar modelos"""
    service = MLTrainingService()
    
    try:
        # Verificar estado actual
        status = service.get_model_status()
        print(f"Estado actual de modelos: {status}")
        
        # Entrenar modelos
        report = service.train_models()
        print(f"Entrenamiento completado: {report['estado']}")
        
        # Mostrar métricas
        metrics = report['metricas_modelos']
        print(f"Precisión clasificador de riesgo: {metrics['risk_classifier_accuracy']:.3f}")
        print(f"MSE regresor de impacto: {metrics['impact_regressor_mse']:.3f}")
        print(f"MSE regresor de probabilidad: {metrics['probability_regressor_mse']:.3f}")
        
    except Exception as e:
        print(f"Error en entrenamiento: {str(e)}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Modelo de Predicción de Riesgos
SGSRI - Sistema Predictivo de Riesgos ISO
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error
import joblib
import os
from datetime import datetime
import logging

class RiskPredictor:
    def __init__(self, model_path="backend/ml/models/saved/"):
        self.model_path = model_path
        self.risk_classifier = None
        self.impact_regressor = None
        self.probability_regressor = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Crear directorio si no existe
        os.makedirs(model_path, exist_ok=True)
        
        # Configurar logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def prepare_features(self, df):
        """Preparar características para el modelo"""
        try:
            # Crear copia del dataframe
            features_df = df.copy()
            
            # Codificar variables categóricas
            categorical_columns = ['Tipo_Activo', 'nivel_criticidad_negocio', 'estado_activo']
            
            for col in categorical_columns:
                if col in features_df.columns:
                    if col not in self.label_encoders:
                        self.label_encoders[col] = LabelEncoder()
                        features_df[col] = self.label_encoders[col].fit_transform(features_df[col].astype(str))
                    else:
                        features_df[col] = self.label_encoders[col].transform(features_df[col].astype(str))
            
            # Seleccionar características numéricas
            numeric_columns = ['ID_Activo']
            feature_columns = [col for col in numeric_columns if col in features_df.columns]
            feature_columns.extend(categorical_columns)
            
            # Filtrar columnas existentes
            feature_columns = [col for col in feature_columns if col in features_df.columns]
            
            return features_df[feature_columns]
            
        except Exception as e:
            self.logger.error(f"Error preparando características: {str(e)}")
            raise
    
    def train_risk_classifier(self, X, y):
        """Entrenar clasificador de nivel de riesgo"""
        try:
            self.logger.info("Entrenando clasificador de nivel de riesgo...")
            
            # Dividir datos
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Entrenar modelo
            self.risk_classifier = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            self.risk_classifier.fit(X_train, y_train)
            
            # Evaluar modelo
            y_pred = self.risk_classifier.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            self.logger.info(f"Precisión del clasificador de riesgo: {accuracy:.3f}")
            
            # Guardar modelo
            self.save_model('risk_classifier')
            
            return accuracy
            
        except Exception as e:
            self.logger.error(f"Error entrenando clasificador: {str(e)}")
            raise
    
    def train_impact_regressor(self, X, y):
        """Entrenar regresor de impacto"""
        try:
            self.logger.info("Entrenando regresor de impacto...")
            
            # Dividir datos
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Entrenar modelo
            self.impact_regressor = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            self.impact_regressor.fit(X_train, y_train)
            
            # Evaluar modelo
            y_pred = self.impact_regressor.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            
            self.logger.info(f"MSE del regresor de impacto: {mse:.3f}")
            
            # Guardar modelo
            self.save_model('impact_regressor')
            
            return mse
            
        except Exception as e:
            self.logger.error(f"Error entrenando regresor de impacto: {str(e)}")
            raise
    
    def train_probability_regressor(self, X, y):
        """Entrenar regresor de probabilidad"""
        try:
            self.logger.info("Entrenando regresor de probabilidad...")
            
            # Dividir datos
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Entrenar modelo
            self.probability_regressor = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            self.probability_regressor.fit(X_train, y_train)
            
            # Evaluar modelo
            y_pred = self.probability_regressor.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            
            self.logger.info(f"MSE del regresor de probabilidad: {mse:.3f}")
            
            # Guardar modelo
            self.save_model('probability_regressor')
            
            return mse
            
        except Exception as e:
            self.logger.error(f"Error entrenando regresor de probabilidad: {str(e)}")
            raise
    
    def predict_risk(self, activo_data):
        """Predecir nivel de riesgo para un activo"""
        try:
            if not self.is_trained:
                self.load_models()
            
            # Preparar características
            features = self.prepare_features(activo_data)
            
            # Predecir
            risk_prediction = self.risk_classifier.predict(features)[0]
            impact_prediction = self.impact_regressor.predict(features)[0]
            probability_prediction = self.probability_regressor.predict(features)[0]
            
            return {
                'nivel_riesgo': risk_prediction,
                'impacto_predicho': impact_prediction,
                'probabilidad_predicha': probability_prediction,
                'confianza': self._calculate_confidence(features)
            }
            
        except Exception as e:
            self.logger.error(f"Error prediciendo riesgo: {str(e)}")
            raise
    
    def _calculate_confidence(self, features):
        """Calcular confianza de la predicción"""
        try:
            # Usar la probabilidad de las predicciones del random forest
            if hasattr(self.risk_classifier, 'predict_proba'):
                probabilities = self.risk_classifier.predict_proba(features)
                confidence = np.max(probabilities)
                return float(confidence)
            else:
                return 0.5  # Valor por defecto
        except:
            return 0.5
    
    def save_model(self, model_name):
        """Guardar modelo entrenado"""
        try:
            model_file = os.path.join(self.model_path, f"{model_name}.joblib")
            
            if model_name == 'risk_classifier':
                joblib.dump(self.risk_classifier, model_file)
            elif model_name == 'impact_regressor':
                joblib.dump(self.impact_regressor, model_file)
            elif model_name == 'probability_regressor':
                joblib.dump(self.probability_regressor, model_file)
            
            self.logger.info(f"Modelo {model_name} guardado en {model_file}")
            
        except Exception as e:
            self.logger.error(f"Error guardando modelo {model_name}: {str(e)}")
            raise
    
    def load_models(self):
        """Cargar modelos entrenados"""
        try:
            # Cargar clasificador de riesgo
            risk_file = os.path.join(self.model_path, "risk_classifier.joblib")
            if os.path.exists(risk_file):
                self.risk_classifier = joblib.load(risk_file)
            
            # Cargar regresor de impacto
            impact_file = os.path.join(self.model_path, "impact_regressor.joblib")
            if os.path.exists(impact_file):
                self.impact_regressor = joblib.load(impact_file)
            
            # Cargar regresor de probabilidad
            prob_file = os.path.join(self.model_path, "probability_regressor.joblib")
            if os.path.exists(prob_file):
                self.probability_regressor = joblib.load(prob_file)
            
            self.is_trained = True
            self.logger.info("Modelos cargados exitosamente")
            
        except Exception as e:
            self.logger.error(f"Error cargando modelos: {str(e)}")
            raise
    
    def get_model_info(self):
        """Obtener información de los modelos"""
        return {
            'is_trained': self.is_trained,
            'models_available': {
                'risk_classifier': self.risk_classifier is not None,
                'impact_regressor': self.impact_regressor is not None,
                'probability_regressor': self.probability_regressor is not None
            },
            'model_path': self.model_path
        }

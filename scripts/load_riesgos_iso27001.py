#!/usr/bin/env python3
"""
Script para cargar riesgos basados en ISO 27001, Gobierno de Datos y 
guías de Seguridad de la Información del MinTIC Colombia
"""

import sys
import os
from datetime import datetime, date

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Riesgo

def load_riesgos_iso27001():
    """Cargar riesgos basados en estándares ISO 27001 y guías MinTIC"""
    
    app = create_app()
    
    with app.app_context():
        # Verificar si ya existen riesgos
        existing_riesgos = Riesgo.query.count()
        if existing_riesgos > 0:
            print(f"Ya existen {existing_riesgos} riesgos en la base de datos.")
            return
        
        # Riesgos basados en ISO 27001 y guías MinTIC Colombia
        riesgos_data = [
            # RIESGOS ESTRATÉGICOS
            {
                'Nombre': 'Falta de Políticas de Seguridad de la Información',
                'Descripcion': 'Ausencia o inadecuada implementación de políticas de seguridad de la información que guíen las actividades de la organización',
                'tipo_riesgo': 'Estrategico',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Exposición a vulnerabilidades, incumplimiento normativo, pérdida de confianza de usuarios y clientes'
            },
            {
                'Nombre': 'Falta de Gobierno de Datos',
                'Descripcion': 'Ausencia de un marco de gobierno de datos que defina responsabilidades, procesos y controles para la gestión de datos',
                'tipo_riesgo': 'Estrategico',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Mala calidad de datos, incumplimiento de normativas de protección de datos, pérdida de valor de la información'
            },
            
            # RIESGOS OPERACIONALES
            {
                'Nombre': 'Acceso No Autorizado a Sistemas',
                'Descripcion': 'Posibilidad de que personas no autorizadas accedan a sistemas, aplicaciones o datos de la organización',
                'tipo_riesgo': 'Operacional',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Pérdida de confidencialidad, integridad y disponibilidad de la información, robo de datos'
            },
            {
                'Nombre': 'Falta de Control de Accesos',
                'Descripcion': 'Ausencia o inadecuada implementación de controles de acceso a sistemas y datos',
                'tipo_riesgo': 'Operacional',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Acceso no autorizado, modificación indebida de datos, exposición de información sensible'
            },
            {
                'Nombre': 'Ausencia de Respaldos',
                'Descripcion': 'Falta de estrategia de respaldo y recuperación de datos críticos',
                'tipo_riesgo': 'Operacional',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Pérdida permanente de datos, interrupción de servicios críticos, pérdidas financieras'
            },
            {
                'Nombre': 'Falta de Monitoreo y Logging',
                'Descripcion': 'Ausencia de sistemas de monitoreo y registro de actividades en sistemas críticos',
                'tipo_riesgo': 'Operacional',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Detección tardía de incidentes, dificultad para investigar eventos de seguridad'
            },
            
            # RIESGOS DE SEGURIDAD DE LA INFORMACIÓN
            {
                'Nombre': 'Vulnerabilidades en Software',
                'Descripcion': 'Presencia de vulnerabilidades conocidas en software y sistemas no actualizados',
                'tipo_riesgo': 'Seguridad de la Informacion',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Explotación de vulnerabilidades, compromiso de sistemas, robo de información'
            },
            {
                'Nombre': 'Falta de Cifrado de Datos',
                'Descripcion': 'Ausencia de cifrado en datos sensibles en tránsito y en reposo',
                'tipo_riesgo': 'Seguridad de la Informacion',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Exposición de datos sensibles, incumplimiento de normativas de protección de datos'
            },
            {
                'Nombre': 'Ingeniería Social',
                'Descripcion': 'Manipulación de usuarios para obtener información confidencial o acceso a sistemas',
                'tipo_riesgo': 'Seguridad de la Informacion',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Pérdida de credenciales, acceso no autorizado, robo de información'
            },
            {
                'Nombre': 'Malware y Ransomware',
                'Descripcion': 'Infección de sistemas con software malicioso que puede cifrar o robar datos',
                'tipo_riesgo': 'Seguridad de la Informacion',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Cifrado de datos, extorsión, pérdida de disponibilidad de servicios'
            },
            
            # RIESGOS FINANCIEROS
            {
                'Nombre': 'Pérdidas Financieras por Incidentes',
                'Descripcion': 'Pérdidas económicas derivadas de incidentes de seguridad o interrupciones de servicios',
                'tipo_riesgo': 'Financiero',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Costos de recuperación, multas por incumplimiento, pérdida de ingresos'
            },
            {
                'Nombre': 'Costos de Cumplimiento Normativo',
                'Descripcion': 'Gastos asociados al cumplimiento de normativas de protección de datos y seguridad',
                'tipo_riesgo': 'Financiero',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Inversión en controles de seguridad, auditorías, capacitación del personal'
            },
            
            # RIESGOS LEGALES
            {
                'Nombre': 'Incumplimiento de Ley 1581 de 2012',
                'Descripcion': 'Violación de la Ley de Protección de Datos Personales de Colombia',
                'tipo_riesgo': 'Legal',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Multas, sanciones, demandas, pérdida de reputación'
            },
            {
                'Nombre': 'Incumplimiento de Decreto 1074 de 2015',
                'Descripcion': 'Violación del Decreto Único Reglamentario del Sector de Tecnologías de la Información',
                'tipo_riesgo': 'Legal',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Sanciones administrativas, multas, restricciones operativas'
            },
            
            # RIESGOS REPUTACIONALES
            {
                'Nombre': 'Pérdida de Confianza de Usuarios',
                'Descripcion': 'Deterioro de la confianza de usuarios y clientes debido a incidentes de seguridad',
                'tipo_riesgo': 'Reputacional',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Pérdida de usuarios, disminución de ingresos, daño a la imagen institucional'
            },
            {
                'Nombre': 'Exposición Pública de Incidentes',
                'Descripcion': 'Divulgación pública de incidentes de seguridad que afecten la reputación',
                'tipo_riesgo': 'Reputacional',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Cobertura mediática negativa, pérdida de credibilidad, impacto en relaciones comerciales'
            },
            
            # RIESGOS DE CUMPLIMIENTO
            {
                'Nombre': 'Falta de Auditorías de Seguridad',
                'Descripcion': 'Ausencia de auditorías regulares de seguridad de la información',
                'tipo_riesgo': 'Cumplimiento',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Detección tardía de vulnerabilidades, incumplimiento de estándares, sanciones'
            },
            {
                'Nombre': 'Falta de Capacitación en Seguridad',
                'Descripcion': 'Ausencia de programas de capacitación en seguridad de la información para el personal',
                'tipo_riesgo': 'Cumplimiento',
                'Estado_Riesgo_General': 'Identificado',
                'Efectos_Materializacion': 'Comportamientos inseguros, vulnerabilidad a ataques de ingeniería social'
            }
        ]
        
        # Insertar riesgos en la base de datos
        for riesgo_data in riesgos_data:
            riesgo = Riesgo(
                Nombre=riesgo_data['Nombre'],
                Descripcion=riesgo_data['Descripcion'],
                tipo_riesgo=riesgo_data['tipo_riesgo'],
                Estado_Riesgo_General=riesgo_data['Estado_Riesgo_General'],
                Efectos_Materializacion=riesgo_data['Efectos_Materializacion'],
                Fecha_Identificacion=date.today(),
                fecha_creacion_registro=datetime.utcnow(),
                fecha_ultima_actualizacion=datetime.utcnow()
            )
            
            db.session.add(riesgo)
        
        try:
            db.session.commit()
            print(f"✅ Se cargaron {len(riesgos_data)} riesgos basados en ISO 27001 y guías MinTIC Colombia")
            print("\n📋 Resumen de riesgos cargados:")
            for i, riesgo_data in enumerate(riesgos_data, 1):
                print(f"  {i}. {riesgo_data['Nombre']} ({riesgo_data['tipo_riesgo']})")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al cargar riesgos: {e}")

if __name__ == "__main__":
    load_riesgos_iso27001()




















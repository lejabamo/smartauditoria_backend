#!/usr/bin/env python3
"""
Script para cargar datos de prueba completos en el sistema SGRI
Incluye activos, riesgos, evaluaciones, incidentes, controles, etc.
"""

from app import create_app, db
from app.models import (
    UsuarioSistema, Activo, Riesgo, RiesgoActivo, Incidente,
    niveles_probabilidad, niveles_impacto, controles_seguridad,
    nivelesriesgo, evaluacion_riesgo_activo,
    Rol, UsuarioAuth
)
from datetime import datetime, date, timedelta
import random

def cargar_datos_prueba():
    """Cargar datos de prueba completos"""
    app = create_app()
    
    with app.app_context():
        try:
            print("=" * 60)
            print("📊 CARGANDO DATOS DE PRUEBA PARA SGRI")
            print("=" * 60)
            
            # Verificar/Crear niveles base si no existen
            print("\n0. Verificando niveles base...")
            niveles_prob = niveles_probabilidad.query.all()
            if not niveles_prob:
                print("   - Creando niveles de probabilidad...")
                niveles_prob_data = [
                    {'Nombre': 'Muy Baja', 'Valor': 1, 'Descripcion': 'Muy improbable que ocurra', 'Color_Representacion': '#00FF00'},
                    {'Nombre': 'Baja', 'Valor': 2, 'Descripcion': 'Poco probable que ocurra', 'Color_Representacion': '#90EE90'},
                    {'Nombre': 'Media', 'Valor': 3, 'Descripcion': 'Probable que ocurra', 'Color_Representacion': '#FFFF00'},
                    {'Nombre': 'Alta', 'Valor': 4, 'Descripcion': 'Muy probable que ocurra', 'Color_Representacion': '#FFA500'},
                    {'Nombre': 'Muy Alta', 'Valor': 5, 'Descripcion': 'Casi seguro que ocurra', 'Color_Representacion': '#FF0000'}
                ]
                for nivel_data in niveles_prob_data:
                    nivel = niveles_probabilidad(**nivel_data)
                    db.session.add(nivel)
                db.session.commit()
                niveles_prob = niveles_probabilidad.query.all()
                print(f"   ✓ {len(niveles_prob)} niveles de probabilidad creados")
            else:
                print(f"   ✓ {len(niveles_prob)} niveles de probabilidad existentes")
            
            niveles_imp = niveles_impacto.query.all()
            if not niveles_imp:
                print("   - Creando niveles de impacto...")
                niveles_imp_data = [
                    {'Nombre': 'Muy Bajo', 'Valor': 1, 'Descripcion': 'Impacto mínimo', 'Color_Representacion': '#00FF00'},
                    {'Nombre': 'Bajo', 'Valor': 2, 'Descripcion': 'Impacto bajo', 'Color_Representacion': '#90EE90'},
                    {'Nombre': 'Medio', 'Valor': 3, 'Descripcion': 'Impacto medio', 'Color_Representacion': '#FFFF00'},
                    {'Nombre': 'Alto', 'Valor': 4, 'Descripcion': 'Impacto alto', 'Color_Representacion': '#FFA500'},
                    {'Nombre': 'Muy Alto', 'Valor': 5, 'Descripcion': 'Impacto crítico', 'Color_Representacion': '#FF0000'}
                ]
                for nivel_data in niveles_imp_data:
                    nivel = niveles_impacto(**nivel_data)
                    db.session.add(nivel)
                db.session.commit()
                niveles_imp = niveles_impacto.query.all()
                print(f"   ✓ {len(niveles_imp)} niveles de impacto creados")
            else:
                print(f"   ✓ {len(niveles_imp)} niveles de impacto existentes")
            
            niveles_riesgo_obj = nivelesriesgo.query.all()
            if not niveles_riesgo_obj:
                print("   - Creando niveles de riesgo...")
                niveles_riesgo_data = [
                    {'Nombre': 'Bajo', 'Valor_Min': 1, 'Valor_Max': 8, 'Color_Representacion': '#00FF00', 
                     'Acciones_Sugeridas': 'Monitoreo periódico', 'Descripcion': 'Riesgo bajo'},
                    {'Nombre': 'Medio', 'Valor_Min': 9, 'Valor_Max': 15, 'Color_Representacion': '#FFFF00',
                     'Acciones_Sugeridas': 'Implementar controles básicos', 'Descripcion': 'Riesgo medio'},
                    {'Nombre': 'Alto', 'Valor_Min': 16, 'Valor_Max': 25, 'Color_Representacion': '#FF0000',
                     'Acciones_Sugeridas': 'Implementar controles inmediatos y plan de mitigación', 'Descripcion': 'Riesgo alto'}
                ]
                for nivel_data in niveles_riesgo_data:
                    nivel = nivelesriesgo(**nivel_data)
                    db.session.add(nivel)
                db.session.commit()
                niveles_riesgo_obj = nivelesriesgo.query.all()
                print(f"   ✓ {len(niveles_riesgo_obj)} niveles de riesgo creados")
            else:
                print(f"   ✓ {len(niveles_riesgo_obj)} niveles de riesgo existentes")
            
            # 1. Crear usuarios adicionales
            print("\n1. Creando usuarios adicionales...")
            usuarios_adicionales = [
                {
                    'nombre_completo': 'María González',
                    'email_institucional': 'maria.gonzalez@sgsri.local',
                    'password_hash': '',  # Vacío, no se usa para login
                    'puesto_organizacion': 'Analista de Seguridad',
                    'estado_usuario': 'Activo'
                },
                {
                    'nombre_completo': 'Carlos Ramírez',
                    'email_institucional': 'carlos.ramirez@sgsri.local',
                    'password_hash': '',  # Vacío, no se usa para login
                    'puesto_organizacion': 'Gerente de TI',
                    'estado_usuario': 'Activo'
                },
                {
                    'nombre_completo': 'Ana Martínez',
                    'email_institucional': 'ana.martinez@sgsri.local',
                    'password_hash': '',  # Vacío, no se usa para login
                    'puesto_organizacion': 'Especialista en Cumplimiento',
                    'estado_usuario': 'Activo'
                },
                {
                    'nombre_completo': 'Luis Fernández',
                    'email_institucional': 'luis.fernandez@sgsri.local',
                    'password_hash': '',  # Vacío, no se usa para login
                    'puesto_organizacion': 'Administrador de Sistemas',
                    'estado_usuario': 'Activo'
                }
            ]
            
            usuarios_creados = []
            for usuario_data in usuarios_adicionales:
                usuario = UsuarioSistema.query.filter_by(
                    email_institucional=usuario_data['email_institucional']
                ).first()
                if not usuario:
                    usuario = UsuarioSistema(**usuario_data)
                    db.session.add(usuario)
                    db.session.flush()
                usuarios_creados.append(usuario)
            
            db.session.commit()
            print(f"   ✓ {len(usuarios_creados)} usuarios creados/verificados")
            
            # 2. Crear activos de información
            print("\n2. Creando activos de información...")
            admin_usuario = UsuarioSistema.query.filter_by(
                email_institucional='admin@sgsri.local'
            ).first()
            
            activos_data = [
                {
                    'Nombre': 'Servidor de Base de Datos Principal',
                    'Descripcion': 'Servidor MySQL que almacena toda la información crítica de la organización',
                    'Tipo_Activo': 'Hardware',
                    'subtipo_activo': 'Servidor',
                    'ID_Propietario': admin_usuario.id_usuario if admin_usuario else usuarios_creados[0].id_usuario,
                    'ID_Custodio': usuarios_creados[3].id_usuario if len(usuarios_creados) > 3 else admin_usuario.id_usuario,
                    'Nivel_Clasificacion_Confidencialidad': 'Confidencial',
                    'Nivel_Clasificacion_Integridad': 'Alta',
                    'Nivel_Clasificacion_Disponibilidad': 'Alta',
                    'nivel_criticidad_negocio': 'Muy Alto',
                    'estado_activo': 'En produccion',
                    'requiere_backup': True,
                    'frecuencia_backup_general': 'Cada 4 horas',
                    'tiempo_retencion_general': '90 días'
                },
                {
                    'Nombre': 'Sistema de Gestión de Recursos Humanos',
                    'Descripcion': 'Aplicación web para gestión de personal, nómina y recursos humanos',
                    'Tipo_Activo': 'Aplicacion/Sistema',
                    'subtipo_activo': 'Aplicación',
                    'ID_Propietario': usuarios_creados[0].id_usuario if usuarios_creados else admin_usuario.id_usuario,
                    'ID_Custodio': usuarios_creados[0].id_usuario if usuarios_creados else admin_usuario.id_usuario,
                    'Nivel_Clasificacion_Confidencialidad': 'Confidencial',
                    'Nivel_Clasificacion_Integridad': 'Alta',
                    'Nivel_Clasificacion_Disponibilidad': 'Media',
                    'nivel_criticidad_negocio': 'Alto',
                    'estado_activo': 'En produccion',
                    'requiere_backup': True,
                    'frecuencia_backup_general': 'Diario',
                    'tiempo_retencion_general': '60 días'
                },
                {
                    'Nombre': 'Firewall Perimetral',
                    'Descripcion': 'Firewall de próxima generación que protege la red perimetral',
                    'Tipo_Activo': 'Hardware',
                    'subtipo_activo': 'Dispositivo de Red',
                    'ID_Propietario': usuarios_creados[3].id_usuario if len(usuarios_creados) > 3 else admin_usuario.id_usuario,
                    'ID_Custodio': usuarios_creados[3].id_usuario if len(usuarios_creados) > 3 else admin_usuario.id_usuario,
                    'Nivel_Clasificacion_Confidencialidad': 'Uso Interno',
                    'Nivel_Clasificacion_Integridad': 'Alta',
                    'Nivel_Clasificacion_Disponibilidad': 'Alta',
                    'nivel_criticidad_negocio': 'Muy Alto',
                    'estado_activo': 'En produccion',
                    'requiere_backup': True,
                    'frecuencia_backup_general': 'Semanal',
                    'tiempo_retencion_general': '30 días'
                },
                {
                    'Nombre': 'Servidor de Correo Electrónico',
                    'Descripcion': 'Servidor Exchange para gestión de correo corporativo',
                    'Tipo_Activo': 'Hardware',
                    'subtipo_activo': 'Servidor',
                    'ID_Propietario': usuarios_creados[1].id_usuario if len(usuarios_creados) > 1 else admin_usuario.id_usuario,
                    'ID_Custodio': usuarios_creados[3].id_usuario if len(usuarios_creados) > 3 else admin_usuario.id_usuario,
                    'Nivel_Clasificacion_Confidencialidad': 'Confidencial',
                    'Nivel_Clasificacion_Integridad': 'Media',
                    'Nivel_Clasificacion_Disponibilidad': 'Alta',
                    'nivel_criticidad_negocio': 'Alto',
                    'estado_activo': 'En produccion',
                    'requiere_backup': True,
                    'frecuencia_backup_general': 'Diario',
                    'tiempo_retencion_general': '30 días'
                },
                {
                    'Nombre': 'Base de Datos de Clientes',
                    'Descripcion': 'Base de datos que contiene información de clientes y transacciones',
                    'Tipo_Activo': 'Datos',
                    'subtipo_activo': 'Base de Datos',
                    'ID_Propietario': usuarios_creados[1].id_usuario if len(usuarios_creados) > 1 else admin_usuario.id_usuario,
                    'ID_Custodio': admin_usuario.id_usuario if admin_usuario else usuarios_creados[0].id_usuario,
                    'Nivel_Clasificacion_Confidencialidad': 'Confidencial',
                    'Nivel_Clasificacion_Integridad': 'Alta',
                    'Nivel_Clasificacion_Disponibilidad': 'Alta',
                    'nivel_criticidad_negocio': 'Muy Alto',
                    'estado_activo': 'En produccion',
                    'requiere_backup': True,
                    'frecuencia_backup_general': 'Cada 2 horas',
                    'tiempo_retencion_general': '180 días'
                },
                {
                    'Nombre': 'Sistema de Facturación Electrónica',
                    'Descripcion': 'Plataforma web para emisión de facturas electrónicas',
                    'Tipo_Activo': 'Aplicacion/Sistema',
                    'subtipo_activo': 'Aplicación',
                    'ID_Propietario': usuarios_creados[1].id_usuario if len(usuarios_creados) > 1 else admin_usuario.id_usuario,
                    'ID_Custodio': usuarios_creados[0].id_usuario if usuarios_creados else admin_usuario.id_usuario,
                    'Nivel_Clasificacion_Confidencialidad': 'Confidencial',
                    'Nivel_Clasificacion_Integridad': 'Alta',
                    'Nivel_Clasificacion_Disponibilidad': 'Alta',
                    'nivel_criticidad_negocio': 'Muy Alto',
                    'estado_activo': 'En produccion',
                    'requiere_backup': True,
                    'frecuencia_backup_general': 'Diario',
                    'tiempo_retencion_general': '365 días'
                },
                {
                    'Nombre': 'Centro de Datos Principal',
                    'Descripcion': 'Infraestructura física del centro de datos con servidores, almacenamiento y red',
                    'Tipo_Activo': 'Infraestructura Fisica',
                    'subtipo_activo': 'Centro de Datos',
                    'ID_Propietario': usuarios_creados[3].id_usuario if len(usuarios_creados) > 3 else admin_usuario.id_usuario,
                    'ID_Custodio': usuarios_creados[3].id_usuario if len(usuarios_creados) > 3 else admin_usuario.id_usuario,
                    'Nivel_Clasificacion_Confidencialidad': 'Uso Interno',
                    'Nivel_Clasificacion_Integridad': 'Alta',
                    'Nivel_Clasificacion_Disponibilidad': 'Alta',
                    'nivel_criticidad_negocio': 'Muy Alto',
                    'estado_activo': 'En produccion',
                    'requiere_backup': False,
                    'frecuencia_backup_general': 'N/A',
                    'tiempo_retencion_general': 'N/A'
                },
                {
                    'Nombre': 'Portal Web Institucional',
                    'Descripcion': 'Sitio web público de la organización',
                    'Tipo_Activo': 'Aplicacion/Sistema',
                    'subtipo_activo': 'Aplicación Web',
                    'ID_Propietario': usuarios_creados[0].id_usuario if usuarios_creados else admin_usuario.id_usuario,
                    'ID_Custodio': usuarios_creados[0].id_usuario if usuarios_creados else admin_usuario.id_usuario,
                    'Nivel_Clasificacion_Confidencialidad': 'Publica',
                    'Nivel_Clasificacion_Integridad': 'Media',
                    'Nivel_Clasificacion_Disponibilidad': 'Alta',
                    'nivel_criticidad_negocio': 'Medio',
                    'estado_activo': 'En produccion',
                    'requiere_backup': True,
                    'frecuencia_backup_general': 'Semanal',
                    'tiempo_retencion_general': '30 días'
                }
            ]
            
            activos_creados = []
            for activo_data in activos_data:
                activo = Activo.query.filter_by(Nombre=activo_data['Nombre']).first()
                if not activo:
                    activo = Activo(**activo_data)
                    db.session.add(activo)
                    db.session.flush()
                activos_creados.append(activo)
            
            db.session.commit()
            print(f"   ✓ {len(activos_creados)} activos creados/verificados")
            
            # 3. Crear riesgos
            print("\n3. Creando riesgos...")
            riesgos_data = [
                {
                    'Nombre': 'Pérdida de datos por fallo en sistema de backup',
                    'Descripcion': 'Riesgo de pérdida permanente de datos críticos debido a fallos en el sistema de respaldo o errores en los procesos de backup',
                    'tipo_riesgo': 'Técnico',
                    'Efectos_Materializacion': 'Pérdida de información crítica, interrupción de operaciones, impacto financiero y reputacional',
                    'Fecha_Identificacion': date.today() - timedelta(days=30),
                    'Estado_Riesgo_General': 'Activo'
                },
                {
                    'Nombre': 'Ataque de ransomware a servidores críticos',
                    'Descripcion': 'Riesgo de infección por malware ransomware que cifre los datos y exija rescate',
                    'tipo_riesgo': 'Seguridad',
                    'Efectos_Materializacion': 'Cifrado de datos, interrupción de servicios, pérdida financiera, daño reputacional',
                    'Fecha_Identificacion': date.today() - timedelta(days=15),
                    'Estado_Riesgo_General': 'Activo'
                },
                {
                    'Nombre': 'Interrupción del servicio por fallo de infraestructura',
                    'Descripcion': 'Riesgo de interrupción prolongada de servicios críticos debido a fallos en la infraestructura física o lógica',
                    'tipo_riesgo': 'Operacional',
                    'Efectos_Materializacion': 'Interrupción de servicios, pérdida de productividad, impacto en clientes',
                    'Fecha_Identificacion': date.today() - timedelta(days=45),
                    'Estado_Riesgo_General': 'Activo'
                },
                {
                    'Nombre': 'Acceso no autorizado a información confidencial',
                    'Descripcion': 'Riesgo de acceso no autorizado a datos confidenciales por parte de personal interno o externo',
                    'tipo_riesgo': 'Seguridad',
                    'Efectos_Materializacion': 'Fuga de información, violación de privacidad, sanciones legales, daño reputacional',
                    'Fecha_Identificacion': date.today() - timedelta(days=20),
                    'Estado_Riesgo_General': 'Activo'
                },
                {
                    'Nombre': 'Falla en sistema de autenticación',
                    'Descripcion': 'Riesgo de fallo en los mecanismos de autenticación que permita accesos no autorizados',
                    'tipo_riesgo': 'Técnico',
                    'Efectos_Materializacion': 'Acceso no autorizado, compromiso de cuentas, pérdida de control de acceso',
                    'Fecha_Identificacion': date.today() - timedelta(days=10),
                    'Estado_Riesgo_General': 'Activo'
                },
                {
                    'Nombre': 'Pérdida de disponibilidad por desastre natural',
                    'Descripcion': 'Riesgo de pérdida de disponibilidad de servicios debido a desastres naturales (terremotos, inundaciones, etc.)',
                    'tipo_riesgo': 'Operacional',
                    'Efectos_Materializacion': 'Interrupción prolongada, pérdida de infraestructura, impacto en continuidad del negocio',
                    'Fecha_Identificacion': date.today() - timedelta(days=60),
                    'Estado_Riesgo_General': 'Activo'
                }
            ]
            
            riesgos_creados = []
            for riesgo_data in riesgos_data:
                riesgo = Riesgo.query.filter_by(Nombre=riesgo_data['Nombre']).first()
                if not riesgo:
                    riesgo = Riesgo(**riesgo_data)
                    db.session.add(riesgo)
                    db.session.flush()
                riesgos_creados.append(riesgo)
            
            db.session.commit()
            print(f"   ✓ {len(riesgos_creados)} riesgos creados/verificados")
            
            # 4. Asociar riesgos a activos
            print("\n4. Asociando riesgos a activos...")
            asociaciones = [
                {'riesgo': riesgos_creados[0], 'activo': activos_creados[0], 'probabilidad': 2, 'impacto': 5},
                {'riesgo': riesgos_creados[0], 'activo': activos_creados[4], 'probabilidad': 2, 'impacto': 5},
                {'riesgo': riesgos_creados[1], 'activo': activos_creados[0], 'probabilidad': 3, 'impacto': 5},
                {'riesgo': riesgos_creados[1], 'activo': activos_creados[1], 'probabilidad': 3, 'impacto': 4},
                {'riesgo': riesgos_creados[1], 'activo': activos_creados[4], 'probabilidad': 3, 'impacto': 5},
                {'riesgo': riesgos_creados[2], 'activo': activos_creados[2], 'probabilidad': 2, 'impacto': 5},
                {'riesgo': riesgos_creados[2], 'activo': activos_creados[6], 'probabilidad': 2, 'impacto': 5},
                {'riesgo': riesgos_creados[3], 'activo': activos_creados[1], 'probabilidad': 3, 'impacto': 4},
                {'riesgo': riesgos_creados[3], 'activo': activos_creados[4], 'probabilidad': 3, 'impacto': 5},
                {'riesgo': riesgos_creados[4], 'activo': activos_creados[2], 'probabilidad': 2, 'impacto': 4},
                {'riesgo': riesgos_creados[5], 'activo': activos_creados[6], 'probabilidad': 1, 'impacto': 5},
            ]
            
            asociaciones_creadas = 0
            for asoc in asociaciones:
                riesgo_activo = RiesgoActivo.query.filter_by(
                    id_riesgo=asoc['riesgo'].ID_Riesgo,
                    ID_Activo=asoc['activo'].ID_Activo
                ).first()
                if not riesgo_activo:
                    riesgo_total = asoc['probabilidad'] * asoc['impacto']
                    nivel = 'Bajo' if riesgo_total <= 8 else ('Medio' if riesgo_total <= 15 else 'Alto')
                    riesgo_activo = RiesgoActivo(
                        id_riesgo=asoc['riesgo'].ID_Riesgo,
                        ID_Activo=asoc['activo'].ID_Activo,
                        probabilidad=asoc['probabilidad'],
                        impacto=asoc['impacto'],
                        nivel_riesgo_calculado=nivel,
                        medidas_mitigacion=f"Implementar controles de seguridad y monitoreo continuo para {asoc['activo'].Nombre}"
                    )
                    db.session.add(riesgo_activo)
                    asociaciones_creadas += 1
            
            db.session.commit()
            print(f"   ✓ {asociaciones_creadas} asociaciones riesgo-activo creadas")
            
            # 5. Crear evaluaciones de riesgo detalladas
            print("\n5. Creando evaluaciones de riesgo detalladas...")
            evaluaciones_data = [
                {
                    'riesgo': riesgos_creados[0],
                    'activo': activos_creados[0],
                    'prob_inherente': 2,
                    'imp_inherente': 5,
                    'prob_residual': 1,
                    'imp_residual': 3,
                    'evaluador': admin_usuario.id_usuario if admin_usuario else usuarios_creados[0].id_usuario
                },
                {
                    'riesgo': riesgos_creados[1],
                    'activo': activos_creados[0],
                    'prob_inherente': 3,
                    'imp_inherente': 5,
                    'prob_residual': 2,
                    'imp_residual': 4,
                    'evaluador': usuarios_creados[0].id_usuario if usuarios_creados else admin_usuario.id_usuario
                },
                {
                    'riesgo': riesgos_creados[2],
                    'activo': activos_creados[2],
                    'prob_inherente': 2,
                    'imp_inherente': 5,
                    'prob_residual': 1,
                    'imp_residual': 3,
                    'evaluador': usuarios_creados[3].id_usuario if len(usuarios_creados) > 3 else admin_usuario.id_usuario
                }
            ]
            
            evaluaciones_creadas = 0
            for eval_data in evaluaciones_data:
                # Buscar niveles correspondientes
                prob_inh = niveles_probabilidad.query.filter_by(Valor=eval_data['prob_inherente']).first()
                imp_inh = niveles_impacto.query.filter_by(Valor=eval_data['imp_inherente']).first()
                prob_res = niveles_probabilidad.query.filter_by(Valor=eval_data['prob_residual']).first()
                imp_res = niveles_impacto.query.filter_by(Valor=eval_data['imp_residual']).first()
                
                # Calcular niveles de riesgo
                riesgo_inh_valor = eval_data['prob_inherente'] * eval_data['imp_inherente']
                riesgo_res_valor = eval_data['prob_residual'] * eval_data['imp_residual']
                
                nivel_inh = next((n for n in niveles_riesgo_obj if n.Valor_Min <= riesgo_inh_valor <= n.Valor_Max), None)
                nivel_res = next((n for n in niveles_riesgo_obj if n.Valor_Min <= riesgo_res_valor <= n.Valor_Max), None)
                
                evaluacion = evaluacion_riesgo_activo.query.filter_by(
                    ID_Riesgo=eval_data['riesgo'].ID_Riesgo,
                    ID_Activo=eval_data['activo'].ID_Activo
                ).first()
                
                if not evaluacion:
                    evaluacion = evaluacion_riesgo_activo(
                        ID_Riesgo=eval_data['riesgo'].ID_Riesgo,
                        ID_Activo=eval_data['activo'].ID_Activo,
                        id_nivel_probabilidad_inherente=prob_inh.ID_NivelProbabilidad if prob_inh else None,
                        id_nivel_impacto_inherente=imp_inh.ID_NivelImpacto if imp_inh else None,
                        id_nivel_riesgo_inherente_calculado=nivel_inh.ID_NivelRiesgo if nivel_inh else None,
                        justificacion_evaluacion_inherente=f"Evaluación inicial del riesgo {eval_data['riesgo'].Nombre} para {eval_data['activo'].Nombre}",
                        fecha_evaluacion_inherente=date.today() - timedelta(days=random.randint(1, 30)),
                        id_evaluador_inherente=eval_data['evaluador'],
                        id_nivel_probabilidad_residual=prob_res.ID_NivelProbabilidad if prob_res else None,
                        id_nivel_impacto_residual=imp_res.ID_NivelImpacto if imp_res else None,
                        id_nivel_riesgo_residual_calculado=nivel_res.ID_NivelRiesgo if nivel_res else None,
                        justificacion_evaluacion_residual=f"Evaluación residual después de implementar controles de mitigación",
                        fecha_evaluacion_residual=date.today() - timedelta(days=random.randint(1, 15)),
                        id_evaluador_residual=eval_data['evaluador']
                    )
                    db.session.add(evaluacion)
                    evaluaciones_creadas += 1
            
            db.session.commit()
            print(f"   ✓ {evaluaciones_creadas} evaluaciones de riesgo creadas")
            
            # 6. Crear controles de seguridad
            print("\n6. Creando controles de seguridad...")
            controles_data = [
                {
                    'Nombre': 'Backup Automatizado Diario',
                    'Descripcion': 'Sistema automatizado de respaldo diario de todas las bases de datos críticas',
                    'Categoria': 'Preventivo',
                    'Tipo': 'Tecnológico',
                    'Eficacia_Esperada': 'Alta'
                },
                {
                    'Nombre': 'Firewall de Próxima Generación',
                    'Descripcion': 'Firewall con capacidades avanzadas de inspección profunda de paquetes y prevención de intrusiones',
                    'Categoria': 'Preventivo',
                    'Tipo': 'Tecnológico',
                    'Eficacia_Esperada': 'Alta'
                },
                {
                    'Nombre': 'Autenticación Multifactor (MFA)',
                    'Descripcion': 'Implementación de autenticación de dos factores para acceso a sistemas críticos',
                    'Categoria': 'Preventivo',
                    'Tipo': 'Tecnológico',
                    'Eficacia_Esperada': 'Alta'
                },
                {
                    'Nombre': 'Monitoreo Continuo de Seguridad',
                    'Descripcion': 'Sistema de monitoreo y detección de amenazas en tiempo real',
                    'Categoria': 'Detectivo',
                    'Tipo': 'Tecnológico',
                    'Eficacia_Esperada': 'Media'
                },
                {
                    'Nombre': 'Plan de Continuidad del Negocio',
                    'Descripcion': 'Documentación y procedimientos para garantizar la continuidad operativa ante desastres',
                    'Categoria': 'Recuperación',
                    'Tipo': 'Organizacional',
                    'Eficacia_Esperada': 'Alta'
                },
                {
                    'Nombre': 'Capacitación en Seguridad de la Información',
                    'Descripcion': 'Programa de capacitación periódica para el personal sobre seguridad de la información',
                    'Categoria': 'Preventivo',
                    'Tipo': 'Organizacional',
                    'Eficacia_Esperada': 'Media'
                }
            ]
            
            controles_creados = 0
            for control_data in controles_data:
                control = controles_seguridad.query.filter_by(Nombre=control_data['Nombre']).first()
                if not control:
                    control = controles_seguridad(**control_data)
                    db.session.add(control)
                    controles_creados += 1
            
            db.session.commit()
            print(f"   ✓ {controles_creados} controles de seguridad creados")
            
            # 7. Crear incidentes
            print("\n7. Creando incidentes de seguridad...")
            incidentes_data = [
                {
                    'titulo': 'Intento de acceso no autorizado detectado',
                    'descripcion': 'Se detectaron múltiples intentos de acceso no autorizado al servidor de base de datos desde una IP externa',
                    'tipo_incidente': 'Seguridad',
                    'severidad': 'Alta',
                    'estado': 'Resuelto',
                    'ID_Activo': activos_creados[0].ID_Activo,
                    'fecha_incidente': datetime.now() - timedelta(days=5),
                    'fecha_resolucion': datetime.now() - timedelta(days=4),
                    'responsable': usuarios_creados[0].nombre_completo if usuarios_creados else 'Administrador',
                    'acciones_correctivas': 'IP bloqueada en firewall, reglas de acceso reforzadas, monitoreo aumentado'
                },
                {
                    'titulo': 'Caída temporal del servidor de correo',
                    'descripcion': 'El servidor de correo electrónico presentó una interrupción de servicio de 2 horas',
                    'tipo_incidente': 'Disponibilidad',
                    'severidad': 'Media',
                    'estado': 'Resuelto',
                    'ID_Activo': activos_creados[3].ID_Activo,
                    'fecha_incidente': datetime.now() - timedelta(days=10),
                    'fecha_resolucion': datetime.now() - timedelta(days=10, hours=-22),
                    'responsable': usuarios_creados[3].nombre_completo if len(usuarios_creados) > 3 else 'Administrador',
                    'acciones_correctivas': 'Servicio reiniciado, causa raíz identificada y corregida, redundancia implementada'
                },
                {
                    'titulo': 'Vulnerabilidad detectada en sistema web',
                    'descripcion': 'Se identificó una vulnerabilidad de seguridad en el portal web institucional',
                    'tipo_incidente': 'Seguridad',
                    'severidad': 'Media',
                    'estado': 'En Proceso',
                    'ID_Activo': activos_creados[7].ID_Activo,
                    'fecha_incidente': datetime.now() - timedelta(days=2),
                    'responsable': usuarios_creados[0].nombre_completo if usuarios_creados else 'Administrador',
                    'acciones_correctivas': 'Parche de seguridad en desarrollo, medidas temporales implementadas'
                },
                {
                    'titulo': 'Fallo en proceso de backup',
                    'descripcion': 'El proceso de backup automático falló durante la noche, no se completó el respaldo',
                    'tipo_incidente': 'Disponibilidad',
                    'severidad': 'Alta',
                    'estado': 'Resuelto',
                    'ID_Activo': activos_creados[0].ID_Activo,
                    'fecha_incidente': datetime.now() - timedelta(days=7),
                    'fecha_resolucion': datetime.now() - timedelta(days=6),
                    'responsable': usuarios_creados[3].nombre_completo if len(usuarios_creados) > 3 else 'Administrador',
                    'acciones_correctivas': 'Proceso de backup corregido, verificación manual realizada, alertas configuradas'
                }
            ]
            
            incidentes_creados = 0
            for incidente_data in incidentes_data:
                incidente = Incidente.query.filter_by(titulo=incidente_data['titulo']).first()
                if not incidente:
                    incidente = Incidente(**incidente_data)
                    db.session.add(incidente)
                    incidentes_creados += 1
            
            db.session.commit()
            print(f"   ✓ {incidentes_creados} incidentes creados")
            
            print("\n" + "=" * 60)
            print("✅ DATOS DE PRUEBA CARGADOS EXITOSAMENTE")
            print("=" * 60)
            print("\n📊 Resumen:")
            print(f"   - {len(usuarios_creados)} usuarios del sistema")
            print(f"   - {len(activos_creados)} activos de información")
            print(f"   - {len(riesgos_creados)} riesgos identificados")
            print(f"   - {asociaciones_creadas} asociaciones riesgo-activo")
            print(f"   - {evaluaciones_creadas} evaluaciones de riesgo detalladas")
            print(f"   - {controles_creados} controles de seguridad")
            print(f"   - {incidentes_creados} incidentes registrados")
            print("\n🎉 El sistema está listo para demostración!")
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    cargar_datos_prueba()


from flask import Blueprint, request, jsonify
from ..models import db, Activo, UsuarioSistema
from ..auth.decorators import require_auth, operator_required, consultant_required, write_required
from ..utils.logger import get_logger
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

logger = get_logger(__name__)

activos_bp = Blueprint('activos', __name__)

@activos_bp.route('/', methods=['GET'])
@consultant_required
def get_activos():
    """Obtener todos los activos con filtros opcionales"""
    try:
        from sqlalchemy import text
        
        # Parámetros de filtrado
        tipo_activo = request.args.get('tipo_activo')
        estado = request.args.get('estado')
        nivel_criticidad = request.args.get('nivel_criticidad')
        
        # Obtener activos de hardware
        query = Activo.query
        
        if tipo_activo:
            query = query.filter(Activo.Tipo_Activo == tipo_activo)
        if estado:
            query = query.filter(Activo.estado_activo == estado)
        if nivel_criticidad:
            query = query.filter(Activo.nivel_criticidad_negocio == nivel_criticidad)
        
        activos = query.all()
        activos_list = [activo.to_dict() for activo in activos]
        
        # Obtener sistemas de información de la tabla de detalles
        try:
            sistemas_query = text("""
                SELECT 
                    ID_Activo,
                    tipo_sistema as Nombre,
                    'Sistema de Información' as Tipo_Activo,
                    'Activo' as estado_activo,
                    'Medio' as nivel_criticidad_negocio,
                    funcionalidad_principal as Descripcion
                FROM activos_detalles_sistemas_informacion
            """)
            
            sistemas_info = db.session.execute(sistemas_query).fetchall()
            
            # Convertir sistemas de información al formato de activos
            for sistema in sistemas_info:
                activo_dict = {
                    'ID_Activo': sistema.ID_Activo,
                    'Nombre': sistema.Nombre or f"Sistema-{sistema.ID_Activo}",
                    'Tipo_Activo': sistema.Tipo_Activo,
                    'estado_activo': sistema.estado_activo,
                    'nivel_criticidad_negocio': sistema.nivel_criticidad_negocio,
                    'Descripcion': sistema.Descripcion,
                    'id': sistema.ID_Activo,
                    'tipo': 'Sistema de Información',
                    'nombre': sistema.Nombre or f"Sistema-{sistema.ID_Activo}",
                    'nivel_criticidad': sistema.nivel_criticidad_negocio
                }
                activos_list.append(activo_dict)
        except Exception as e:
            logger.warning("Error obteniendo sistemas de información: %s", str(e))
            # Si hay error, continuar solo con activos de hardware
        
        return jsonify(activos_list), 200
    except Exception as e:
        logger.error("Error en get_activos: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/stats', methods=['GET'])
@consultant_required
def get_activos_stats():
    """Estadísticas normalizadas para KPIs de gestión de activos.

    - en_produccion: estado_activo ∈ {'En produccion','En producción','Producción','Productivo'} (case/tilde insensitive)
    - alta_criticidad: nivel_criticidad_negocio ∈ {'Crítico','Critico','Muy Alto','Alto'} (case/tilde insensitive)
    - requieren_backup: requiere_backup = True
    """
    try:
        total = Activo.query.count()

        # Normalización simple en SQL con LOWER/REPLACE para acentos comunes
        from sqlalchemy import text
        
        en_produccion = db.session.execute(
            text("""
            SELECT COUNT(*) FROM activos a
            WHERE LOWER(REPLACE(a.estado_activo, 'ó', 'o')) IN (
              'en produccion','produccion','productivo'
            )
            """)
        ).scalar() or 0

        alta_criticidad = db.session.execute(
            text("""
            SELECT COUNT(*) FROM activos a
            WHERE LOWER(REPLACE(a.nivel_criticidad_negocio, 'í', 'i')) IN (
              'critico','muy alto','alto'
            )
            """)
        ).scalar() or 0

        requieren_backup = db.session.execute(
            text("SELECT COUNT(*) FROM activos a WHERE a.requiere_backup = 1")
        ).scalar() or 0

        return jsonify({
            'total': int(total),
            'en_produccion': int(en_produccion),
            'alta_criticidad': int(alta_criticidad),
            'requieren_backup': int(requieren_backup)
        }), 200
    except Exception as e:
        logger.error("Error en get_activos_stats: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/<int:activo_id>', methods=['GET'])
@consultant_required
def get_activo(activo_id):
    """Obtener un activo específico por ID"""
    try:
        activo = Activo.query.get_or_404(activo_id)
        return jsonify(activo.to_dict()), 200
    except Exception as e:
        logger.error("Error en get_activo (id=%s): %s", activo_id, str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/', methods=['POST'])
@write_required
def create_activo():
    """Crear un nuevo activo"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validaciones básicas
        if not data.get('Nombre'):
            return jsonify({'error': 'El nombre del activo es obligatorio'}), 400
        if not data.get('Tipo_Activo'):
            return jsonify({'error': 'El tipo de activo es obligatorio'}), 400
        
        # Verificar si el propietario existe
        if data.get('ID_Propietario'):
            propietario = UsuarioSistema.query.get(data['ID_Propietario'])
            if not propietario:
                return jsonify({'error': 'El propietario especificado no existe'}), 400
        
        # Verificar si el custodio existe
        if data.get('ID_Custodio'):
            custodio = UsuarioSistema.query.get(data['ID_Custodio'])
            if not custodio:
                return jsonify({'error': 'El custodio especificado no existe'}), 400
        
        def parse_date(val):
            if not val:
                return None
            if isinstance(val, (datetime,)):
                return val.date()
            try:
                return datetime.strptime(str(val)[:10], '%Y-%m-%d').date()
            except Exception:
                return None

        activo = Activo(
            Nombre=data.get('Nombre'),
            Descripcion=data.get('Descripcion'),
            Tipo_Activo=data.get('Tipo_Activo'),
            subtipo_activo=data.get('subtipo_activo'),
            ID_Propietario=data.get('ID_Propietario'),
            ID_Custodio=data.get('ID_Custodio'),
            Nivel_Clasificacion_Confidencialidad=data.get('Nivel_Clasificacion_Confidencialidad', 'Uso Interno'),
            Nivel_Clasificacion_Integridad=data.get('Nivel_Clasificacion_Integridad', 'Media'),
            Nivel_Clasificacion_Disponibilidad=data.get('Nivel_Clasificacion_Disponibilidad', 'Media'),
            justificacion_clasificacion_cia=data.get('justificacion_clasificacion_cia'),
            nivel_criticidad_negocio=data.get('nivel_criticidad_negocio', 'Medio'),
            estado_activo=data.get('estado_activo', 'Planificado'),
            fuente_datos_principal=data.get('fuente_datos_principal', 'SGSI_Manual'),
            id_externo_glpi=data.get('id_externo_glpi'),
            id_externo_inventario_si=data.get('id_externo_inventario_si'),
            fecha_adquisicion=parse_date(data.get('fecha_adquisicion')),
            version_general_activo=data.get('version_general_activo'),
            requiere_backup=data.get('requiere_backup', True),
            frecuencia_backup_general=data.get('frecuencia_backup_general'),
            tiempo_retencion_general=data.get('tiempo_retencion_general'),
            fecha_proxima_revision_sgsi=parse_date(data.get('fecha_proxima_revision_sgsi')),
            procedimiento_eliminacion_segura_ref=data.get('procedimiento_eliminacion_segura_ref'),
            # Función Pública V7 (Capítulo V)
            macroproceso=data.get('macroproceso'),
            proceso=data.get('proceso'),
            identificador_trd=data.get('identificador_trd'),
            oficina_responsable=data.get('oficina_responsable'),
            serie_documental=data.get('serie_documental'),
            subserie_documental=data.get('subserie_documental'),
            soporte_registro=data.get('soporte_registro', 'Digital'),
            medio_conservacion=data.get('medio_conservacion'),
            formato=data.get('formato'),
            idioma=data.get('idioma', 'Español'),
            fecha_generacion=parse_date(data.get('fecha_generacion')),
            fecha_ingreso_archivo=parse_date(data.get('fecha_ingreso_archivo')),
            es_iccn=bool(data.get('es_iccn', False)),
            estado_publicacion=data.get('estado_publicacion', 'No Publicada'),
            ubicacion_consulta=data.get('ubicacion_consulta'),
            es_clasificada_reservada=bool(data.get('es_clasificada_reservada', False)),
            objeto_legitimo_excepcion=data.get('objeto_legitimo_excepcion'),
            fundamento_legal=data.get('fundamento_legal'),
            excepcion_alcance=data.get('excepcion_alcance'),
        )
        
        db.session.add(activo)
        db.session.commit()
        
        logger.info("Activo creado: id=%s nombre='%s' por usuario %s",
                    activo.ID_Activo, activo.Nombre,
                    getattr(request, 'current_user', None) and request.current_user.id_usuario_auth)
        return jsonify(activo.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': f'Error en formato de fecha: {str(e)}'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Error SQLAlchemy en create_activo: %s", str(e), exc_info=True)
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error("Error inesperado en create_activo: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/<int:activo_id>', methods=['PUT'])
@write_required
def update_activo(activo_id):
    """Actualizar un activo existente"""
    try:
        def parse_date(val):
            if not val:
                return None
            if isinstance(val, (datetime,)):
                return val.date()
            try:
                return datetime.strptime(str(val)[:10], '%Y-%m-%d').date()
            except Exception:
                return None

        activo = Activo.query.get_or_404(activo_id)
        data = request.json
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Actualizar campos básicos
        if 'Nombre' in data:
            activo.Nombre = data['Nombre']
        if 'Descripcion' in data:
            activo.Descripcion = data['Descripcion']
        if 'Tipo_Activo' in data:
            activo.Tipo_Activo = data['Tipo_Activo']
        if 'subtipo_activo' in data:
            activo.subtipo_activo = data['subtipo_activo']
        if 'ID_Propietario' in data:
            if data['ID_Propietario']:
                propietario = UsuarioSistema.query.get(data['ID_Propietario'])
                if not propietario:
                    return jsonify({'error': 'El propietario especificado no existe'}), 400
            activo.ID_Propietario = data['ID_Propietario']
        if 'ID_Custodio' in data:
            if data['ID_Custodio']:
                custodio = UsuarioSistema.query.get(data['ID_Custodio'])
                if not custodio:
                    return jsonify({'error': 'El custodio especificado no existe'}), 400
            activo.ID_Custodio = data['ID_Custodio']
        if 'Nivel_Clasificacion_Confidencialidad' in data:
            activo.Nivel_Clasificacion_Confidencialidad = data['Nivel_Clasificacion_Confidencialidad']
        if 'Nivel_Clasificacion_Integridad' in data:
            activo.Nivel_Clasificacion_Integridad = data['Nivel_Clasificacion_Integridad']
        if 'Nivel_Clasificacion_Disponibilidad' in data:
            activo.Nivel_Clasificacion_Disponibilidad = data['Nivel_Clasificacion_Disponibilidad']
        if 'justificacion_clasificacion_cia' in data:
            activo.justificacion_clasificacion_cia = data['justificacion_clasificacion_cia']
        if 'nivel_criticidad_negocio' in data:
            activo.nivel_criticidad_negocio = data['nivel_criticidad_negocio']
        if 'estado_activo' in data:
            activo.estado_activo = data['estado_activo']
        if 'fecha_adquisicion' in data:
            activo.fecha_adquisicion = parse_date(data['fecha_adquisicion'])
        if 'fecha_proxima_revision_sgsi' in data:
            activo.fecha_proxima_revision_sgsi = parse_date(data['fecha_proxima_revision_sgsi'])
        if 'requiere_backup' in data:
            activo.requiere_backup = data['requiere_backup']
        if 'frecuencia_backup_general' in data:
            activo.frecuencia_backup_general = data['frecuencia_backup_general']
        if 'tiempo_retencion_general' in data:
            activo.tiempo_retencion_general = data['tiempo_retencion_general']

        # Actualizar campos Función Pública V7
        if 'macroproceso' in data:
            activo.macroproceso = data['macroproceso']
        if 'proceso' in data:
            activo.proceso = data['proceso']
        if 'identificador_trd' in data:
            activo.identificador_trd = data['identificador_trd']
        if 'oficina_responsable' in data:
            activo.oficina_responsable = data['oficina_responsable']
        if 'serie_documental' in data:
            activo.serie_documental = data['serie_documental']
        if 'subserie_documental' in data:
            activo.subserie_documental = data['subserie_documental']
        if 'soporte_registro' in data:
            activo.soporte_registro = data['soporte_registro']
        if 'medio_conservacion' in data:
            activo.medio_conservacion = data['medio_conservacion']
        if 'formato' in data:
            activo.formato = data['formato']
        if 'idioma' in data:
            activo.idioma = data['idioma']
        if 'fecha_generacion' in data:
            activo.fecha_generacion = parse_date(data['fecha_generacion'])
        if 'fecha_ingreso_archivo' in data:
            activo.fecha_ingreso_archivo = parse_date(data['fecha_ingreso_archivo'])
        if 'es_iccn' in data:
            activo.es_iccn = bool(data['es_iccn'])
        if 'estado_publicacion' in data:
            activo.estado_publicacion = data['estado_publicacion']
        if 'ubicacion_consulta' in data:
            activo.ubicacion_consulta = data['ubicacion_consulta']
        if 'es_clasificada_reservada' in data:
            activo.es_clasificada_reservada = bool(data['es_clasificada_reservada'])
        if 'objeto_legitimo_excepcion' in data:
            activo.objeto_legitimo_excepcion = data['objeto_legitimo_excepcion']
        if 'fundamento_legal' in data:
            activo.fundamento_legal = data['fundamento_legal']
        if 'excepcion_alcance' in data:
            activo.excepcion_alcance = data['excepcion_alcance']
        
        db.session.commit()
        logger.info("Activo actualizado: id=%s", activo_id)
        return jsonify(activo.to_dict()), 200
    except ValueError as e:
        return jsonify({'error': f'Error en formato de fecha: {str(e)}'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Error SQLAlchemy en update_activo (id=%s): %s", activo_id, str(e), exc_info=True)
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error("Error inesperado en update_activo (id=%s): %s", activo_id, str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/<int:activo_id>', methods=['DELETE'])
@write_required
def delete_activo(activo_id):
    """Eliminar un activo"""
    try:
        activo = Activo.query.get_or_404(activo_id)
        db.session.delete(activo)
        db.session.commit()
        logger.info("Activo eliminado: id=%s", activo_id)
        return jsonify({'message': 'Activo eliminado correctamente'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Error SQLAlchemy en delete_activo (id=%s): %s", activo_id, str(e), exc_info=True)
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error("Error inesperado en delete_activo (id=%s): %s", activo_id, str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/tipos', methods=['GET'])
@consultant_required
def get_tipos_activo():
    """Obtener todos los tipos de activo únicos"""
    try:
        tipos = db.session.query(Activo.Tipo_Activo).distinct().all()
        return jsonify([tipo[0] for tipo in tipos]), 200
    except Exception as e:
        logger.error("Error en get_tipos_activo: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/estados', methods=['GET'])
@consultant_required
def get_estados_activo():
    """Obtener todos los estados de activo únicos"""
    try:
        estados = db.session.query(Activo.estado_activo).distinct().all()
        return jsonify([estado[0] for estado in estados]), 200
    except Exception as e:
        logger.error("Error en get_estados_activo: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/<int:activo_id>/riesgos', methods=['GET'])
@consultant_required
def get_riesgos_activo(activo_id):
    """Obtener los riesgos asociados a un activo"""
    try:
        activo = Activo.query.get_or_404(activo_id)
        riesgos = []
        for riesgo_activo in activo.riesgos:
            riesgo_data = riesgo_activo.riesgo.to_dict()
            riesgo_data.update({
                'probabilidad': riesgo_activo.probabilidad,
                'impacto': riesgo_activo.impacto,
                'nivel_riesgo_calculado': riesgo_activo.nivel_riesgo_calculado,
                'medidas_mitigacion': riesgo_activo.medidas_mitigacion,
                'fecha_evaluacion': riesgo_activo.fecha_evaluacion.isoformat() if riesgo_activo.fecha_evaluacion else None
            })
            riesgos.append(riesgo_data)
        return jsonify(riesgos), 200
    except Exception as e:
        logger.error("Error en get_riesgos_activo (id=%s): %s", activo_id, str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@activos_bp.route('/<int:activo_id>/detalle', methods=['GET'])
@consultant_required
def get_detalle_activo(activo_id):
    """Obtener detalle completo del activo con sus evaluaciones"""
    try:
        from sqlalchemy import text
        from ..models import evaluacion_riesgo_activo, Riesgo, niveles_probabilidad, niveles_impacto, nivelesriesgo
        
        activo = Activo.query.get_or_404(activo_id)
        activo_dict = activo.to_dict()
        
        # Obtener evaluaciones completas del activo
        evaluaciones = db.session.query(
            evaluacion_riesgo_activo,
            Riesgo,
            niveles_probabilidad,
            niveles_impacto,
            nivelesriesgo
        ).join(
            Riesgo, evaluacion_riesgo_activo.ID_Riesgo == Riesgo.ID_Riesgo
        ).outerjoin(
            niveles_probabilidad, evaluacion_riesgo_activo.id_nivel_probabilidad_inherente == niveles_probabilidad.ID_NivelProbabilidad
        ).outerjoin(
            niveles_impacto, evaluacion_riesgo_activo.id_nivel_impacto_inherente == niveles_impacto.ID_NivelImpacto
        ).outerjoin(
            nivelesriesgo, evaluacion_riesgo_activo.id_nivel_riesgo_inherente_calculado == nivelesriesgo.ID_NivelRiesgo
        ).filter(
            evaluacion_riesgo_activo.ID_Activo == activo_id
        ).all()
        
        evaluaciones_list = []
        for eval, riesgo, prob_inh, imp_inh, niv_riesgo_inh in evaluaciones:
            # Obtener datos residuales si existen
            prob_res = None
            imp_res = None
            niv_riesgo_res = None
            if eval.id_nivel_probabilidad_residual:
                prob_res = db.session.query(niveles_probabilidad).filter_by(
                    ID_NivelProbabilidad=eval.id_nivel_probabilidad_residual
                ).first()
            if eval.id_nivel_impacto_residual:
                imp_res = db.session.query(niveles_impacto).filter_by(
                    ID_NivelImpacto=eval.id_nivel_impacto_residual
                ).first()
            if eval.id_nivel_riesgo_residual_calculado:
                niv_riesgo_res = db.session.query(nivelesriesgo).filter_by(
                    ID_NivelRiesgo=eval.id_nivel_riesgo_residual_calculado
                ).first()
            
            # Obtener controles aplicados (manejar si la tabla no existe)
            controles_list = []
            try:
                controles = db.session.execute(
                    text("""
                        SELECT 
                            c.ID_Control,
                            c.Nombre,
                            c.Descripcion,
                            c.Tipo_Control,
                            c.categoria_control_iso,
                            c.codigo_control_iso,
                            rca.justificacion_aplicacion_control,
                            rca.efectividad_real_observada
                        FROM riesgocontrolaplicado rca
                        JOIN controles c ON rca.ID_Control = c.ID_Control
                        WHERE rca.id_evaluacion_riesgo_activo = :eval_id
                    """),
                    {'eval_id': eval.id_evaluacion_riesgo_activo}
                ).fetchall()
                
                controles_list = [{
                    'id': ctrl.ID_Control,
                    'nombre': ctrl.Nombre,
                    'descripcion': ctrl.Descripcion,
                    'tipo': getattr(ctrl, 'Tipo_Control', None) or getattr(ctrl, 'Tipo', None),
                    'categoria': getattr(ctrl, 'categoria_control_iso', None) or getattr(ctrl, 'Categoria', None),
                    'codigo_iso': getattr(ctrl, 'codigo_control_iso', None),
                    'justificacion': ctrl.justificacion_aplicacion_control,
                    'eficacia': ctrl.efectividad_real_observada or 'Media'
                } for ctrl in controles]
            except Exception as ctrl_error:
                logger.warning("Error obteniendo controles para eval %s: %s",
                               eval.id_evaluacion_riesgo_activo, str(ctrl_error))
                controles_list = []
            
            evaluaciones_list.append({
                'id_evaluacion': eval.id_evaluacion_riesgo_activo,
                'riesgo': {
                    'id': riesgo.ID_Riesgo,
                    'nombre': riesgo.Nombre,
                    'descripcion': riesgo.Descripcion,
                    'categoria': getattr(riesgo, 'Categoria', None) or getattr(riesgo, 'tipo_riesgo', None)
                },
                'evaluacion_inherente': {
                    'probabilidad': prob_inh.Nombre if prob_inh else None,
                    'impacto': imp_inh.Nombre if imp_inh else None,
                    'nivel_riesgo': niv_riesgo_inh.Nombre if niv_riesgo_inh else None,
                    'justificacion': eval.justificacion_evaluacion_inherente,
                    'fecha': eval.fecha_evaluacion_inherente.isoformat() if eval.fecha_evaluacion_inherente else None
                },
                'evaluacion_residual': {
                    'probabilidad': prob_res.Nombre if prob_res else None,
                    'impacto': imp_res.Nombre if imp_res else None,
                    'nivel_riesgo': niv_riesgo_res.Nombre if niv_riesgo_res else None,
                    'justificacion': eval.justificacion_evaluacion_residual,
                    'fecha': eval.fecha_evaluacion_residual.isoformat() if eval.fecha_evaluacion_residual else None
                } if eval.id_nivel_riesgo_residual_calculado else None,
                'controles_aplicados': controles_list,
                'fecha_creacion': eval.fecha_creacion_registro.isoformat() if eval.fecha_creacion_registro else None
            })
        
        return jsonify({
            'activo': activo_dict,
            'evaluaciones': evaluaciones_list,
            'total_evaluaciones': len(evaluaciones_list)
        }), 200
        
    except Exception as e:
        logger.error("Error en get_detalle_activo (id=%s): %s", activo_id, str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500


@activos_bp.route('/bulk-upload', methods=['POST'])
@write_required
def bulk_upload_activos():
    """
    Carga masiva inteligente de activos con soporte para:
    1. Archivos Excel (.xlsx/.xls) y CSV vía multipart/form-data
    2. Payload JSON directo { "activos": [...], "enriquecer_con_ia": bool, "dry_run": bool }
    3. Enriquecimiento autónomo con Auditor Copilot (TRD, CID, Ley 1712)
    4. Previsualización y validación (dry_run=true) antes de confirmar en BD
    """
    try:
        from ..services.bulk_activos_service import BulkActivosService

        user_id = request.current_user.id_usuario_sistema if hasattr(request, 'current_user') and request.current_user else 1
        enriquecer = False
        dry_run = False
        rows = []

        # Caso 1: Archivo subido vía form-data
        if 'file' in request.files:
            file_obj = request.files['file']
            filename = file_obj.filename or "upload.xlsx"
            file_bytes = file_obj.read()
            enriquecer = request.form.get('enriquecer_con_ia', 'false').lower() in ('true', '1', 'si')
            dry_run = request.form.get('dry_run', 'false').lower() in ('true', '1', 'si')
            rows = BulkActivosService.parse_file_content(file_bytes, filename)
        # Caso 2: Payload JSON
        elif request.is_json:
            body = request.get_json() or {}
            raw_activos = body.get('activos', [])
            enriquecer = bool(body.get('enriquecer_con_ia', False))
            dry_run = bool(body.get('dry_run', False))
            rows = [BulkActivosService.normalize_row(r) for r in raw_activos if isinstance(r, dict) and (r.get('Nombre') or r.get('nombre'))]
        else:
            return jsonify({'error': 'Se requiere un archivo .xlsx/.csv o un cuerpo JSON con la lista de activos'}), 400

        if not rows:
            return jsonify({'error': 'No se encontraron registros de activos válidos para procesar'}), 400

        # Enriquecimiento IA opcional
        if enriquecer:
            rows = BulkActivosService.enrich_rows_with_ai(rows)

        # Si es modo simulación / previsualización, no persistir
        if dry_run:
            return jsonify({
                'modo': 'preview',
                'total_filas': len(rows),
                'enriquecidos_por_ia': sum(1 for r in rows if r.get('enriquecido_por_ia')),
                'activos_procesados': rows
            }), 200

        # Guardar en base de datos
        total_creados, creados, errores = BulkActivosService.save_bulk_activos(rows, user_id)

        return jsonify({
            'message': f'Carga masiva completada: {total_creados} activos creados.',
            'total_procesados': len(rows),
            'total_creados': total_creados,
            'total_errores': len(errores),
            'activos_creados': creados,
            'errores': errores
        }), 201

    except Exception as e:
        logger.error("Error en bulk_upload_activos: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500


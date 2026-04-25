from flask import Blueprint, request, jsonify
from ..models import db, Activo, Riesgo, Incidente, UsuarioSistema, RiesgoActivo, evaluacion_riesgo_activo
from sqlalchemy import func, text, case
from datetime import datetime, timedelta
from ..auth.decorators import consultant_required
from ..utils.logger import get_logger

logger = get_logger(__name__)
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@consultant_required
def get_stats():
    """Obtener estadísticas para el dashboard

    - Todos los valores provienen de la base de datos
    - "tendencia" se calcula como el % de variación mes a mes de
      riesgos creados: (ultimo_mes - mes_anterior) / max(1, mes_anterior) * 100
    """
    try:
        # Contadores básicos
        total_activos_base = Activo.query.count()
        total_usuarios = UsuarioSistema.query.count()
        total_riesgos = Riesgo.query.count()

        # Usuarios activos
        usuarios_activos = UsuarioSistema.query.filter(
            UsuarioSistema.estado_usuario == 'Activo'
        ).count()

        # Activos por tipo (tabla principal)
        activos_por_tipo_rows = db.session.query(
            Activo.Tipo_Activo,
            func.count(Activo.ID_Activo)
        ).group_by(Activo.Tipo_Activo).all()
        activos_por_tipo = {k if k is not None else 'Sin Tipo': v for k, v in activos_por_tipo_rows}

        # Incluir conteo de Sistemas de Información desde tabla de detalles, si existe
        detalles_count = 0
        try:
            detalles_count = db.session.execute(
                text("SELECT COUNT(*) AS c FROM activos_detalles_sistemas_informacion")
            ).scalar() or 0
            if detalles_count > 0:
                label_sistemas = 'Sistemas de Información'
                activos_por_tipo[label_sistemas] = activos_por_tipo.get(label_sistemas, 0) + detalles_count
        except Exception:
            # Si la tabla no existe o no hay permisos, ignorar silenciosamente
            pass

        # Total de activos mostrado debe incluir hardware + sistemas de información
        total_activos = total_activos_base + detalles_count
        
        # Contar activos evaluados (activos con al menos una evaluación)
        activos_evaluados = db.session.execute(
            text("SELECT COUNT(DISTINCT ID_Activo) FROM evaluacion_riesgo_activo WHERE id_nivel_probabilidad_inherente IS NOT NULL AND id_nivel_impacto_inherente IS NOT NULL")
        ).scalar() or 0

        # Riesgos por nivel (si hay evaluaciones) o por estado (si no hay evaluaciones)
        try:
            # Intentar obtener riesgos por nivel desde evaluaciones
            riesgos_por_nivel_rows = db.session.query(
                db.text('nr.Nombre as nivel'),
                func.count(db.text('r.ID_Riesgo'))
            ).select_from(
                db.text('riesgos r')
            ).join(
                db.text('evaluacion_riesgo_activo era'), 
                db.text('r.ID_Riesgo = era.ID_Riesgo')
            ).join(
                db.text('nivelesriesgo nr'), 
                db.text('era.id_nivel_riesgo_residual_calculado = nr.ID_NivelRiesgo')
            ).group_by(
                db.text('nr.Nombre')
            ).all()
            
            if riesgos_por_nivel_rows:
                # Hay evaluaciones, usar niveles
                riesgos_por_estado = {k if k is not None else 'Sin Nivel': v for k, v in riesgos_por_nivel_rows}
            else:
                # No hay evaluaciones, usar estados
                riesgos_por_estado_rows = db.session.query(
                    Riesgo.Estado_Riesgo_General,
                    func.count(Riesgo.ID_Riesgo)
                ).group_by(Riesgo.Estado_Riesgo_General).all()
                riesgos_por_estado = {k if k is not None else 'Sin Estado': v for k, v in riesgos_por_estado_rows}
        except Exception:
            # Fallback a estados si hay error en la consulta de niveles
            riesgos_por_estado_rows = db.session.query(
                Riesgo.Estado_Riesgo_General,
                func.count(Riesgo.ID_Riesgo)
            ).group_by(Riesgo.Estado_Riesgo_General).all()
            riesgos_por_estado = {k if k is not None else 'Sin Estado': v for k, v in riesgos_por_estado_rows}

        # Tendencia real basada en creación de riesgos (últimos 30 días vs 30 días previos)
        hoy = datetime.utcnow()
        hace_30 = hoy - timedelta(days=30)
        hace_60 = hoy - timedelta(days=60)

        riesgos_ultimo_mes = Riesgo.query.filter(
            Riesgo.fecha_creacion_registro >= hace_30
        ).count()
        riesgos_mes_anterior = Riesgo.query.filter(
            Riesgo.fecha_creacion_registro >= hace_60,
            Riesgo.fecha_creacion_registro < hace_30
        ).count()

        # Variación porcentual segura
        base = riesgos_mes_anterior if riesgos_mes_anterior > 0 else (riesgos_ultimo_mes if riesgos_ultimo_mes > 0 else 1)
        tendencia = round(((riesgos_ultimo_mes - riesgos_mes_anterior) / base) * 100)

        return jsonify({
            'total_activos': total_activos,
            'activos_evaluados': activos_evaluados,
            'usuarios_activos': usuarios_activos,
            'riesgos_identificados': total_riesgos,
            'tendencia': tendencia,
            'activos_por_tipo': activos_por_tipo,
            'riesgos_por_estado': riesgos_por_estado
        }), 200
    except Exception as e:
        logger.error("Error en get_stats: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/historial', methods=['GET'])
@consultant_required
def get_historial():
    """Devolver series mensuales (últimos 12 meses) y acumuladas de activos y riesgos.

    Respuesta:
    {
      "activos": { "total": int, "monthly": [{"month": "YYYY-MM", "count": int, "cumulative": int}] },
      "riesgos": { "total": int, "monthly": [{...}] }
    }
    """
    try:
        hoy = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        meses = []
        for i in range(11, -1, -1):
            inicio_mes = (hoy - timedelta(days=30 * i)).replace(day=1)
            # calcular fin de mes aproximando con +32 días y llevando a día 1 - 1 segundo
            inicio_mes_siguiente = (inicio_mes + timedelta(days=32)).replace(day=1)
            fin_mes = inicio_mes_siguiente
            meses.append((inicio_mes, fin_mes))

        # Series para activos
        activos_series = []
        acumulado_activos = 0
        for inicio, fin in meses:
            count_mes = Activo.query.filter(Activo.fecha_creacion_registro >= inicio, Activo.fecha_creacion_registro < fin).count()
            acumulado_activos += count_mes
            activos_series.append({
                'month': f"{inicio.year}-{str(inicio.month).zfill(2)}",
                'count': count_mes,
                'cumulative': acumulado_activos
            })

        # Series para riesgos
        riesgos_series = []
        acumulado_riesgos = 0
        for inicio, fin in meses:
            count_mes = Riesgo.query.filter(Riesgo.fecha_creacion_registro >= inicio, Riesgo.fecha_creacion_registro < fin).count()
            acumulado_riesgos += count_mes
            riesgos_series.append({
                'month': f"{inicio.year}-{str(inicio.month).zfill(2)}",
                'count': count_mes,
                'cumulative': acumulado_riesgos
            })

        return jsonify({
            'activos': {
                'total': Activo.query.count(),
                'monthly': activos_series
            },
            'riesgos': {
                'total': Riesgo.query.count(),
                'monthly': riesgos_series
            }
        }), 200
    except Exception as e:
        logger.error("Error en get_historial: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/sistemas-info/resumen', methods=['GET'])
@consultant_required
def get_sistemas_info_resumen():
    """Resumen de sistemas de información agrupado por criticidad o secretaria.

    Parámetros:
      - by: 'criticidad' (default) | 'secretaria'
    """
    try:
        by = request.args.get('by', 'criticidad')
        if by not in ('criticidad', 'secretaria'):
            return jsonify({'error': 'Parametro by inválido'}), 400

        if by == 'criticidad':
            sql = text("""
                SELECT COALESCE(nivel_criticidad, 'Sin dato') AS clave, COUNT(*) AS total 
                FROM activos_detalles_sistemas_informacion 
                GROUP BY COALESCE(nivel_criticidad, 'Sin dato')
            """)
        else:
            sql = text("""
                SELECT COALESCE(secretaria_uso, 'Sin dato') AS clave, COUNT(*) AS total 
                FROM activos_detalles_sistemas_informacion 
                GROUP BY COALESCE(secretaria_uso, 'Sin dato')
            """)

        rows = db.session.execute(sql).fetchall()
        data = {row[0]: int(row[1]) for row in rows}
        return jsonify({'by': by, 'data': data}), 200
    except Exception as e:
        logger.error("Error en get_sistemas_info_resumen: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/matriz-riesgos', methods=['GET'])
@consultant_required
def get_matriz_riesgos():
    """Obtener matriz de riesgos contando ACTIVOS EVALUADOS, no riesgos individuales"""
    try:
        # Obtener parámetros de filtro
        activo_id = request.args.get('activo_id', type=int)
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        # Obtener todas las evaluaciones con filtros
        base_query = db.session.query(
            Activo.ID_Activo,
            Activo.Nombre,
            db.func.COALESCE(
                db.text('np_res.Nombre'),
                db.text('np_inh.Nombre')
            ).label('probabilidad'),
            db.func.COALESCE(
                db.text('ni_res.Nombre'),
                db.text('ni_inh.Nombre')
            ).label('impacto'),
            db.func.COALESCE(
                db.text('nr_res.Nombre'),
                db.text('nr_inh.Nombre')
            ).label('nivel_riesgo'),
            db.func.COALESCE(
                evaluacion_riesgo_activo.fecha_evaluacion_residual,
                evaluacion_riesgo_activo.fecha_evaluacion_inherente
            ).label('fecha_evaluacion'),
            UsuarioSistema.nombre_completo.label('nombre_usuario')
        ).select_from(
            evaluacion_riesgo_activo
        ).join(
            Activo, evaluacion_riesgo_activo.ID_Activo == Activo.ID_Activo
        ).join(
            Riesgo, evaluacion_riesgo_activo.ID_Riesgo == Riesgo.ID_Riesgo
        ).outerjoin(
            db.text('niveles_probabilidad np_inh'),
            evaluacion_riesgo_activo.id_nivel_probabilidad_inherente == db.text('np_inh.ID_NivelProbabilidad')
        ).outerjoin(
            db.text('niveles_impacto ni_inh'),
            evaluacion_riesgo_activo.id_nivel_impacto_inherente == db.text('ni_inh.ID_NivelImpacto')
        ).outerjoin(
            db.text('nivelesriesgo nr_inh'),
            evaluacion_riesgo_activo.id_nivel_riesgo_inherente_calculado == db.text('nr_inh.ID_NivelRiesgo')
        ).outerjoin(
            db.text('niveles_probabilidad np_res'),
            evaluacion_riesgo_activo.id_nivel_probabilidad_residual == db.text('np_res.ID_NivelProbabilidad')
        ).outerjoin(
            db.text('niveles_impacto ni_res'),
            evaluacion_riesgo_activo.id_nivel_impacto_residual == db.text('ni_res.ID_NivelImpacto')
        ).outerjoin(
            db.text('nivelesriesgo nr_res'),
            evaluacion_riesgo_activo.id_nivel_riesgo_residual_calculado == db.text('nr_res.ID_NivelRiesgo')
        ).outerjoin(
            UsuarioSistema,
            db.func.COALESCE(
                evaluacion_riesgo_activo.id_evaluador_residual,
                evaluacion_riesgo_activo.id_evaluador_inherente
            ) == UsuarioSistema.id_usuario
        ).filter(
            db.text('np_inh.Nombre IS NOT NULL'),
            db.text('ni_inh.Nombre IS NOT NULL')
        )
        
        # Aplicar filtros
        if activo_id:
            base_query = base_query.filter(Activo.ID_Activo == activo_id)
        if fecha_inicio:
            base_query = base_query.filter(
                db.func.COALESCE(
                    evaluacion_riesgo_activo.fecha_evaluacion_residual,
                    evaluacion_riesgo_activo.fecha_evaluacion_inherente
                ) >= fecha_inicio
            )
        if fecha_fin:
            base_query = base_query.filter(
                db.func.COALESCE(
                    evaluacion_riesgo_activo.fecha_evaluacion_residual,
                    evaluacion_riesgo_activo.fecha_evaluacion_inherente
                ) <= fecha_fin
            )
        
        # Obtener todas las evaluaciones para determinar el riesgo más crítico de cada activo
        sql = text("""
            SELECT 
                a.ID_Activo as id_activo,
                a.Nombre as nombre_activo,
                COALESCE(np_res.Nombre, np_inh.Nombre) as probabilidad,
                COALESCE(ni_res.Nombre, ni_inh.Nombre) as impacto,
                COALESCE(nr_res.Nombre, nr_inh.Nombre) as nivel_riesgo,
                COALESCE(era.fecha_evaluacion_residual, era.fecha_evaluacion_inherente) as fecha_evaluacion,
                u.nombre_completo as nombre_usuario,
                CASE 
                    WHEN COALESCE(nr_res.Nombre, nr_inh.Nombre) = 'ALTO' THEN 3
                    WHEN COALESCE(nr_res.Nombre, nr_inh.Nombre) = 'MEDIO' THEN 2
                    ELSE 1
                END as score_nivel,
                CASE 
                    WHEN COALESCE(np_res.Nombre, np_inh.Nombre) = 'Frecuente' THEN 4
                    WHEN COALESCE(np_res.Nombre, np_inh.Nombre) = 'Probable' THEN 3
                    WHEN COALESCE(np_res.Nombre, np_inh.Nombre) = 'Ocasional' THEN 2
                    WHEN COALESCE(np_res.Nombre, np_inh.Nombre) = 'Posible' THEN 1
                    ELSE 0
                END as score_prob,
                CASE 
                    WHEN COALESCE(ni_res.Nombre, ni_inh.Nombre) = 'Catastrófico' THEN 4
                    WHEN COALESCE(ni_res.Nombre, ni_inh.Nombre) = 'Mayor' THEN 3
                    WHEN COALESCE(ni_res.Nombre, ni_inh.Nombre) = 'Moderado' THEN 2
                    WHEN COALESCE(ni_res.Nombre, ni_inh.Nombre) = 'Menor' THEN 1
                    ELSE 0
                END as score_impacto
            FROM evaluacion_riesgo_activo era
            JOIN activos a ON era.ID_Activo = a.ID_Activo
            JOIN riesgos r ON era.ID_Riesgo = r.ID_Riesgo
            LEFT JOIN niveles_probabilidad np_inh ON era.id_nivel_probabilidad_inherente = np_inh.ID_NivelProbabilidad
            LEFT JOIN niveles_impacto ni_inh ON era.id_nivel_impacto_inherente = ni_inh.ID_NivelImpacto
            LEFT JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
            LEFT JOIN niveles_probabilidad np_res ON era.id_nivel_probabilidad_residual = np_res.ID_NivelProbabilidad
            LEFT JOIN niveles_impacto ni_res ON era.id_nivel_impacto_residual = ni_res.ID_NivelImpacto
            LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
            LEFT JOIN usuarios_sistema u ON COALESCE(era.id_evaluador_residual, era.id_evaluador_inherente) = u.id_usuario
            WHERE np_inh.Nombre IS NOT NULL AND ni_inh.Nombre IS NOT NULL
        """)
        
        params = {}
        conditions = []
        
        if activo_id:
            conditions.append("a.ID_Activo = :activo_id")
            params['activo_id'] = activo_id
        if fecha_inicio:
            conditions.append("COALESCE(era.fecha_evaluacion_residual, era.fecha_evaluacion_inherente) >= :fecha_inicio")
            params['fecha_inicio'] = fecha_inicio
        if fecha_fin:
            conditions.append("COALESCE(era.fecha_evaluacion_residual, era.fecha_evaluacion_inherente) <= :fecha_fin")
            params['fecha_fin'] = fecha_fin
        
        if conditions:
            sql_str = str(sql)
            sql_str = sql_str.replace("WHERE np_inh.Nombre IS NOT NULL", 
                                     "WHERE np_inh.Nombre IS NOT NULL AND " + " AND ".join(conditions))
            sql = text(sql_str)
        
        rows = db.session.execute(sql, params).fetchall()
        
        # Log para debug
        logger.debug("Total de filas de la consulta de matriz: %d", len(rows))
        if len(rows) > 0:
            logger.debug("Primera fila: activo_id=%s, probabilidad=%s, impacto=%s",
                         rows[0].id_activo, rows[0].probabilidad, rows[0].impacto)
        
        # Mapeo de niveles a índices de matriz (case insensitive)
        probabilidades_map = {
            'Frecuente': 0,
            'Probable': 1,
            'Ocasional': 2,
            'Posible': 3,
            'Improbable': 4
        }
        
        impactos_map = {
            'Insignificante': 0,
            'Menor': 1,
            'Moderado': 2,
            'Mayor': 3,
            'Catastrófico': 4
        }
        
        # Inicializar matriz 5x5
        matriz = [[{'cantidad': 0, 'nivel': 'BAJO', 'activos': []} for _ in range(5)] for _ in range(5)]
        
        # Función para determinar nivel de riesgo
        def determinar_nivel_riesgo(prob, imp):
            if (prob in ['Frecuente', 'Probable'] and imp in ['Mayor', 'Catastrófico']):
                return 'ALTO'
            elif (prob in ['Posible', 'Improbable'] and imp in ['Insignificante', 'Menor']):
                return 'BAJO'
            else:
                return 'MEDIO'
        
        # Agrupar evaluaciones por activo para determinar su posición en la matriz
        # Cada activo se posiciona en la celda de su riesgo más crítico
        activos_data = {}
        
        for row in rows:
            activo_id = row.id_activo
            probabilidad = row.probabilidad
            impacto = row.impacto
            
            # Validar que probabilidad e impacto existan
            if not probabilidad or not impacto:
                logger.debug("Activo %s (%s) tiene probabilidad o impacto NULL, omitiendo",
                             activo_id, row.nombre_activo)
                continue
            
            # Buscar en el mapeo, si no está usar valores por defecto seguros
            prob_idx = probabilidades_map.get(probabilidad)
            imp_idx = impactos_map.get(impacto)
            
            # Si no está en el mapeo, intentar normalizar (case insensitive)
            if prob_idx is None:
                prob_lower = probabilidad.lower().strip()
                for key, idx in probabilidades_map.items():
                    if key.lower() == prob_lower:
                        prob_idx = idx
                        break
                if prob_idx is None:
                    logger.debug("Probabilidad '%s' no en mapeo para activo %s, usando 'Posible'",
                                 probabilidad, activo_id)
                    prob_idx = 3  # Usar 'Posible' como default
            
            if imp_idx is None:
                imp_lower = impacto.lower().strip()
                for key, idx in impactos_map.items():
                    if key.lower() == imp_lower:
                        imp_idx = idx
                        break
                if imp_idx is None:
                    logger.debug("Impacto '%s' no en mapeo para activo %s, usando 'Menor'",
                                 impacto, activo_id)
                    imp_idx = 1  # Usar 'Menor' como default
            
            # Validar índices
            if prob_idx < 0 or prob_idx >= 5 or imp_idx < 0 or imp_idx >= 5:
                logger.warning("Índices fuera de rango para activo %s: prob_idx=%s, imp_idx=%s",
                               activo_id, prob_idx, imp_idx)
                continue
            
            nivel_calculado = determinar_nivel_riesgo(probabilidad, impacto)
            nivel_riesgo = row.nivel_riesgo or nivel_calculado
            
            # Usar scores calculados en SQL para determinar criticidad
            score_nivel = getattr(row, 'score_nivel', 1)
            score_prob = getattr(row, 'score_prob', 0)
            score_impacto = getattr(row, 'score_impacto', 0)
            score_total = (score_nivel * 100) + (score_prob * 10) + score_impacto
            
            if activo_id not in activos_data:
                activos_data[activo_id] = {
                    'id': activo_id,
                    'nombre': row.nombre_activo,
                    'fecha': row.fecha_evaluacion.strftime('%Y-%m-%d') if row.fecha_evaluacion else None,
                    'propietario': row.nombre_usuario or 'No asignado',
                    'prob_idx': prob_idx,
                    'imp_idx': imp_idx,
                    'probabilidad': probabilidad,
                    'impacto': impacto,
                    'nivel_riesgo': nivel_riesgo,
                    'score_total': score_total
                }
            else:
                # Si este riesgo es más crítico (mayor score_total), actualizar la posición del activo
                if score_total > activos_data[activo_id]['score_total']:
                    activos_data[activo_id].update({
                        'prob_idx': prob_idx,
                        'imp_idx': imp_idx,
                        'probabilidad': probabilidad,
                        'impacto': impacto,
                        'nivel_riesgo': nivel_riesgo,
                        'score_total': score_total,
                        'fecha': row.fecha_evaluacion.strftime('%Y-%m-%d') if row.fecha_evaluacion else activos_data[activo_id].get('fecha'),
                        'propietario': row.nombre_usuario or activos_data[activo_id].get('propietario', 'No asignado')
                    })
        
        # Agrupar activos por celda de matriz
        activos_por_celda = {}
        for activo_id, activo_info in activos_data.items():
            celda_key = f"{activo_info['prob_idx']}_{activo_info['imp_idx']}"
            if celda_key not in activos_por_celda:
                activos_por_celda[celda_key] = []
            activos_por_celda[celda_key].append({
                'id': activo_info['id'],
                'nombre': activo_info['nombre'],
                'fecha': activo_info['fecha'],
                'propietario': activo_info['propietario'],
                'nivel_riesgo': activo_info['nivel_riesgo']
            })
        
        # Llenar matriz con activos únicos por celda
        for celda_key, activos in activos_por_celda.items():
            prob_idx, imp_idx = map(int, celda_key.split('_'))
            nivel = determinar_nivel_riesgo(
                list(probabilidades_map.keys())[list(probabilidades_map.values()).index(prob_idx)],
                list(impactos_map.keys())[list(impactos_map.values()).index(imp_idx)]
            )
            
            # Determinar nivel más alto entre los activos de esta celda
            niveles_activos = [a.get('nivel_riesgo', nivel) for a in activos]
            if 'ALTO' in niveles_activos:
                nivel_final = 'ALTO'
            elif 'MEDIO' in niveles_activos:
                nivel_final = 'MEDIO'
            else:
                nivel_final = 'BAJO'
            
            matriz[prob_idx][imp_idx] = {
                'cantidad': len(activos),
                'nivel': nivel_final,
                'activos': activos
            }
        
        # Calcular estadísticas (total de activos evaluados únicos)
        total_activos_evaluados = len(activos_data)
        
        # Log para debug
        logger.debug("Total de activos únicos procesados: %d", total_activos_evaluados)
        logger.debug("Activos en activos_data: %s", list(activos_data.keys()))
        
        # Contar activos por nivel
        activos_altos = sum(1 for a in activos_data.values() if a['nivel_riesgo'] == 'ALTO')
        activos_medios = sum(1 for a in activos_data.values() if a['nivel_riesgo'] == 'MEDIO')
        activos_bajos = sum(1 for a in activos_data.values() if a['nivel_riesgo'] == 'BAJO')
        
        # Calcular suma de celdas para verificar
        suma_celdas = sum(sum(celda['cantidad'] for celda in fila) for fila in matriz)
        logger.debug("Suma de celdas en matriz: %d", suma_celdas)
        
        return jsonify({
            'matriz': matriz,
            'estadisticas': {
                'total': total_activos_evaluados,
                'altos': activos_altos,
                'medios': activos_medios,
                'bajos': activos_bajos,
                'suma_celdas': suma_celdas  # Agregar para verificar consistencia
            }
        }), 200
    except Exception as e:
        logger.error("Error en get_matriz_riesgos: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/reporte-completo-riesgos', methods=['GET'])
@consultant_required
def get_reporte_completo_riesgos():
    """Obtener reporte consolidado completo de todos los activos con sus riesgos y evaluaciones"""
    try:
        from sqlalchemy import text
        from ..models import Activo, Riesgo, evaluacion_riesgo_activo, niveles_probabilidad, niveles_impacto, nivelesriesgo
        
        # Obtener todos los activos con sus evaluaciones completas
        # Incluir también riesgos asociados directamente a activos (aunque no tengan evaluación)
        sql = text("""
            SELECT 
                a.ID_Activo,
                a.Nombre as nombre_activo,
                a.Tipo_Activo,
                a.Descripcion as descripcion_activo,
                a.nivel_criticidad_negocio,
                a.estado_activo,
                era.id_evaluacion_riesgo_activo,
                COALESCE(era.ID_Riesgo, ra.ID_Riesgo) as ID_Riesgo,
                COALESCE(r.Nombre, r2.Nombre) as nombre_riesgo,
                COALESCE(r.Descripcion, r2.Descripcion) as descripcion_riesgo,
                COALESCE(r.tipo_riesgo, r2.tipo_riesgo) as categoria_riesgo,
                -- Evaluación Inherente
                np_inh.Nombre as prob_inherente,
                ni_inh.Nombre as impacto_inherente,
                nr_inh.Nombre as nivel_riesgo_inherente,
                era.justificacion_evaluacion_inherente,
                era.fecha_evaluacion_inherente,
                -- Evaluación Residual
                np_res.Nombre as prob_residual,
                ni_res.Nombre as impacto_residual,
                nr_res.Nombre as nivel_riesgo_residual,
                era.justificacion_evaluacion_residual,
                era.fecha_evaluacion_residual,
                -- Controles
                (SELECT COUNT(*) FROM riesgocontrolaplicado rca 
                 WHERE rca.id_evaluacion_riesgo_activo = era.id_evaluacion_riesgo_activo) as total_controles
            FROM activos a
            LEFT JOIN evaluacion_riesgo_activo era ON a.ID_Activo = era.ID_Activo
            LEFT JOIN riesgos r ON era.ID_Riesgo = r.ID_Riesgo
            -- También incluir riesgos asociados directamente (sin evaluación)
            LEFT JOIN riesgo_activo ra ON a.ID_Activo = ra.ID_Activo AND era.id_evaluacion_riesgo_activo IS NULL
            LEFT JOIN riesgos r2 ON ra.ID_Riesgo = r2.ID_Riesgo
            LEFT JOIN niveles_probabilidad np_inh ON era.id_nivel_probabilidad_inherente = np_inh.ID_NivelProbabilidad
            LEFT JOIN niveles_impacto ni_inh ON era.id_nivel_impacto_inherente = ni_inh.ID_NivelImpacto
            LEFT JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
            LEFT JOIN niveles_probabilidad np_res ON era.id_nivel_probabilidad_residual = np_res.ID_NivelProbabilidad
            LEFT JOIN niveles_impacto ni_res ON era.id_nivel_impacto_residual = ni_res.ID_NivelImpacto
            LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
            ORDER BY a.ID_Activo, COALESCE(era.ID_Riesgo, ra.ID_Riesgo)
        """)
        
        result = db.session.execute(sql).fetchall()
        
        # Agrupar por activo
        activos_dict = {}
        for row in result:
            activo_id = row.ID_Activo
            if activo_id not in activos_dict:
                activos_dict[activo_id] = {
                    'id': activo_id,
                    'nombre': row.nombre_activo,
                    'tipo': row.Tipo_Activo or 'Sin tipo',
                    'descripcion': row.descripcion_activo,
                    'criticidad': row.nivel_criticidad_negocio,
                    'estado': row.estado_activo,
                    'riesgos': []
                }
            
            # Agregar riesgo si existe (con o sin evaluación)
            if row.ID_Riesgo:
                # Obtener controles aplicados para esta evaluación
                controles_list = []
                if row.id_evaluacion_riesgo_activo:
                    try:
                        controles_sql = text("""
                            SELECT 
                                c.ID_Control,
                                c.Nombre,
                                c.Descripcion,
                                c.categoria_control_iso as Categoria,
                                c.Tipo_Control as Tipo,
                                c.codigo_control_iso,
                                c.categoria_control_iso,
                                rca.justificacion_aplicacion_control,
                                rca.efectividad_real_observada
                            FROM riesgocontrolaplicado rca
                            JOIN controles c ON rca.ID_Control = c.ID_Control
                            WHERE rca.id_evaluacion_riesgo_activo = :eval_id
                        """)
                        controles_result = db.session.execute(controles_sql, {'eval_id': row.id_evaluacion_riesgo_activo}).fetchall()
                    except Exception as ctrl_error:
                        logger.warning("Error obteniendo controles para evaluación %s: %s",
                                       row.id_evaluacion_riesgo_activo, str(ctrl_error))
                        controles_result = []
                    controles_list = [{
                        'id': ctrl.ID_Control,
                        'nombre': ctrl.Nombre,
                        'descripcion': ctrl.Descripcion,
                        'categoria': ctrl.Categoria,
                        'tipo': ctrl.Tipo,
                        'codigo_iso': getattr(ctrl, 'codigo_control_iso', None) or getattr(ctrl, 'codigo_iso', None),
                        'categoria_iso': getattr(ctrl, 'categoria_control_iso', None) or ctrl.Categoria,
                        'justificacion': ctrl.justificacion_aplicacion_control,
                        'eficacia': ctrl.efectividad_real_observada
                    } for ctrl in controles_result]
                
                riesgo_data = {
                    'id_riesgo': row.ID_Riesgo,
                    'nombre': row.nombre_riesgo,
                    'descripcion': row.descripcion_riesgo,
                    'categoria': row.categoria_riesgo,
                    'evaluacion_inherente': {
                        'probabilidad': row.prob_inherente,
                        'impacto': row.impacto_inherente,
                        'nivel_riesgo': row.nivel_riesgo_inherente,
                        'justificacion': row.justificacion_evaluacion_inherente,
                        'fecha': row.fecha_evaluacion_inherente.isoformat() if row.fecha_evaluacion_inherente else None
                    },
                    'evaluacion_residual': None,
                    'total_controles': len(controles_list),
                    'controles': controles_list
                }
                
                # Agregar evaluación residual si existe
                if row.prob_residual:
                    riesgo_data['evaluacion_residual'] = {
                        'probabilidad': row.prob_residual,
                        'impacto': row.impacto_residual,
                        'nivel_riesgo': row.nivel_riesgo_residual,
                        'justificacion': row.justificacion_evaluacion_residual,
                        'fecha': row.fecha_evaluacion_residual.isoformat() if row.fecha_evaluacion_residual else None
                    }
                
                activos_dict[activo_id]['riesgos'].append(riesgo_data)
        
        # Convertir a lista y calcular estadísticas
        activos_list = list(activos_dict.values())
        
        # Obtener TODOS los activos para asegurar que se incluyan todos los tipos
        # Incluso si no tienen evaluaciones
        try:
            todos_los_activos_ids = {a.ID_Activo for a in Activo.query.all()}
            activos_en_dict_ids = set(activos_dict.keys())
            activos_faltantes_ids = todos_los_activos_ids - activos_en_dict_ids
            
            # Agregar activos que no tienen evaluaciones
            if activos_faltantes_ids:
                activos_faltantes = Activo.query.filter(Activo.ID_Activo.in_(activos_faltantes_ids)).all()
                for a in activos_faltantes:
                    activos_list.append({
                        'id': a.ID_Activo,
                        'nombre': a.Nombre,
                        'tipo': a.Tipo_Activo or 'Sin tipo',
                        'descripcion': a.Descripcion,
                        'criticidad': a.nivel_criticidad_negocio,
                        'estado': a.estado_activo,
                        'riesgos': []
                    })
        except Exception as e:
            logger.warning("Error obteniendo activos faltantes: %s", str(e))
        
        # También incluir Sistemas de Información si existen
        try:
            sistemas_info_count = db.session.execute(
                text("SELECT COUNT(*) FROM activos_detalles_sistemas_informacion")
            ).scalar() or 0
            if sistemas_info_count > 0:
                # Verificar si ya existe en la lista
                tiene_sistemas = any(a.get('tipo') == 'Sistemas de Información' for a in activos_list)
                if not tiene_sistemas:
                    activos_list.append({
                        'id': None,
                        'nombre': 'Sistemas de Información',
                        'tipo': 'Sistemas de Información',
                        'descripcion': 'Sistemas de información registrados',
                        'criticidad': None,
                        'estado': None,
                        'riesgos': []
                    })
        except Exception as e:
            logger.warning("Error obteniendo sistemas de información: %s", str(e))
            pass
        
        total_activos = len(activos_list)
        activos_evaluados = len([a for a in activos_list if len(a.get('riesgos', [])) > 0])
        total_riesgos = sum(len(a.get('riesgos', [])) for a in activos_list)
        
        # Estadísticas por nivel de riesgo
        # Contar evaluaciones de riesgo (no riesgos únicos) para que coincida con el modal
        riesgos_altos = 0
        riesgos_medios = 0
        riesgos_bajos = 0
        
        # Usar un set para evitar contar la misma evaluación múltiples veces
        evaluaciones_contadas = set()
        
        try:
            for a in activos_list:
                for r in a.get('riesgos', []):
                    # Usar evaluación residual si existe, sino inherente
                    eval_data = r.get('evaluacion_residual') or r.get('evaluacion_inherente', {})
                    nivel = eval_data.get('nivel_riesgo', '')
                    if nivel:
                        # Crear clave única: riesgo_id + activo_id para contar evaluaciones únicas
                        eval_key = f"{r.get('id_riesgo')}_{a.get('id')}"
                        if eval_key not in evaluaciones_contadas:
                            evaluaciones_contadas.add(eval_key)
                            if nivel.upper() in ['ALTO', 'HIGH']:
                                riesgos_altos += 1
                            elif nivel.upper() in ['MEDIO', 'MEDIUM']:
                                riesgos_medios += 1
                            elif nivel.upper() in ['BAJO', 'LOW']:
                                riesgos_bajos += 1
        except Exception as e:
            logger.warning("Error calculando estadísticas de riesgos: %s", str(e))
        
        return jsonify({
            'activos': activos_list,
            'estadisticas': {
                'total_activos': total_activos,
                'activos_evaluados': activos_evaluados,
                'total_riesgos': total_riesgos,
                'riesgos_altos': riesgos_altos,
                'riesgos_medios': riesgos_medios,
                'riesgos_bajos': riesgos_bajos
            }
        }), 200
        
    except Exception as e:
        logger.error("Error en get_reporte_completo_riesgos: %s", str(e), exc_info=True)
        return jsonify({
            'activos': [],
            'estadisticas': {
                'total_activos': 0,
                'activos_evaluados': 0,
                'total_riesgos': 0,
                'riesgos_altos': 0,
                'riesgos_medios': 0,
                'riesgos_bajos': 0
            },
            'error': str(e)
        }), 200  # Retornar 200 pero con estructura vacía

@dashboard_bp.route('/activos-evaluados-detalle', methods=['GET'])
@consultant_required
def get_activos_evaluados_detalle():
    """Obtener activos evaluados con detalles completos de riesgos y controles"""
    try:
        from sqlalchemy import text
        from ..models import Activo, Riesgo, evaluacion_riesgo_activo, niveles_probabilidad, niveles_impacto, nivelesriesgo
        
        # Obtener solo activos que tienen evaluaciones
        sql = text("""
            SELECT DISTINCT
                a.ID_Activo,
                a.Nombre as nombre_activo,
                a.Tipo_Activo,
                a.Descripcion as descripcion_activo,
                a.nivel_criticidad_negocio,
                a.estado_activo
            FROM activos a
            INNER JOIN evaluacion_riesgo_activo era ON a.ID_Activo = era.ID_Activo
            WHERE era.id_nivel_probabilidad_inherente IS NOT NULL 
              AND era.id_nivel_impacto_inherente IS NOT NULL
            ORDER BY a.ID_Activo
        """)
        
        activos_result = db.session.execute(sql).fetchall()
        activos_list = []
        
        for activo_row in activos_result:
            activo_id = activo_row.ID_Activo
            
            # Obtener riesgos y evaluaciones para este activo
            riesgos_sql = text("""
                SELECT 
                    r.ID_Riesgo,
                    r.Nombre as nombre_riesgo,
                    r.Descripcion as descripcion_riesgo,
                    r.tipo_riesgo as categoria_riesgo,
                    era.id_evaluacion_riesgo_activo,
                    -- Evaluación Inherente
                    np_inh.Nombre as prob_inherente,
                    ni_inh.Nombre as impacto_inherente,
                    nr_inh.Nombre as nivel_riesgo_inherente,
                    era.justificacion_evaluacion_inherente,
                    -- Evaluación Residual
                    np_res.Nombre as prob_residual,
                    ni_res.Nombre as impacto_residual,
                    nr_res.Nombre as nivel_riesgo_residual,
                    era.justificacion_evaluacion_residual
                FROM evaluacion_riesgo_activo era
                JOIN riesgos r ON era.ID_Riesgo = r.ID_Riesgo
                LEFT JOIN niveles_probabilidad np_inh ON era.id_nivel_probabilidad_inherente = np_inh.ID_NivelProbabilidad
                LEFT JOIN niveles_impacto ni_inh ON era.id_nivel_impacto_inherente = ni_inh.ID_NivelImpacto
                LEFT JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
                LEFT JOIN niveles_probabilidad np_res ON era.id_nivel_probabilidad_residual = np_res.ID_NivelProbabilidad
                LEFT JOIN niveles_impacto ni_res ON era.id_nivel_impacto_residual = ni_res.ID_NivelImpacto
                LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
                WHERE era.ID_Activo = :activo_id
                  AND era.id_nivel_probabilidad_inherente IS NOT NULL
                  AND era.id_nivel_impacto_inherente IS NOT NULL
            """)
            
            riesgos_result = db.session.execute(riesgos_sql, {'activo_id': activo_id}).fetchall()
            riesgos_list = []
            
            for riesgo_row in riesgos_result:
                eval_id = riesgo_row.id_evaluacion_riesgo_activo
                
                # Obtener controles aplicados
                controles_sql = text("""
                    SELECT 
                        c.ID_Control,
                        c.Nombre,
                        c.Descripcion,
                        c.categoria_control_iso as Categoria,
                        c.Tipo_Control as Tipo,
                        c.codigo_control_iso,
                        rca.justificacion_aplicacion_control,
                        rca.efectividad_real_observada
                    FROM riesgocontrolaplicado rca
                    JOIN controles c ON rca.ID_Control = c.ID_Control
                    WHERE rca.id_evaluacion_riesgo_activo = :eval_id
                """)
                
                controles_result = db.session.execute(controles_sql, {'eval_id': eval_id}).fetchall()
                controles_list = [{
                    'id': ctrl.ID_Control,
                    'nombre': ctrl.Nombre,
                    'descripcion': ctrl.Descripcion,
                    'categoria': ctrl.Categoria,
                    'tipo': ctrl.Tipo,
                    'eficacia_esperada': ctrl.Eficacia_Esperada,
                    'justificacion': ctrl.justificacion_aplicacion_control,
                    'eficacia_real': ctrl.efectividad_real_observada
                } for ctrl in controles_result]
                
                riesgo_data = {
                    'id_riesgo': riesgo_row.ID_Riesgo,
                    'nombre': riesgo_row.nombre_riesgo,
                    'descripcion': riesgo_row.descripcion_riesgo,
                    'categoria': riesgo_row.categoria_riesgo,
                    'evaluacion_inherente': {
                        'probabilidad': riesgo_row.prob_inherente,
                        'impacto': riesgo_row.impacto_inherente,
                        'nivel_riesgo': riesgo_row.nivel_riesgo_inherente,
                        'justificacion': riesgo_row.justificacion_evaluacion_inherente
                    },
                    'evaluacion_residual': None,
                    'controles': controles_list
                }
                
                if riesgo_row.prob_residual:
                    riesgo_data['evaluacion_residual'] = {
                        'probabilidad': riesgo_row.prob_residual,
                        'impacto': riesgo_row.impacto_residual,
                        'nivel_riesgo': riesgo_row.nivel_riesgo_residual,
                        'justificacion': riesgo_row.justificacion_evaluacion_residual
                    }
                
                riesgos_list.append(riesgo_data)
            
            activo_data = {
                'id': activo_id,
                'nombre': activo_row.nombre_activo,
                'tipo': activo_row.Tipo_Activo,
                'descripcion': activo_row.descripcion_activo,
                'criticidad': activo_row.nivel_criticidad_negocio,
                'estado': activo_row.estado_activo,
                'riesgos': riesgos_list
            }
            activos_list.append(activo_data)
        
        return jsonify({
            'activos': activos_list,
            'total': len(activos_list)
        }), 200
        
    except Exception as e:
        logger.error("Error en get_activos_evaluados_detalle: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/riesgos-altos-detalle', methods=['GET'])
@consultant_required
def get_riesgos_altos_detalle():
    """Obtener riesgos altos con estado de mitigación y evidencia"""
    try:
        from sqlalchemy import text
        from ..models import Activo, Riesgo, evaluacion_riesgo_activo, nivelesriesgo
        from ..models.documentos import DocumentoAdjunto
        
        # Obtener riesgos con nivel ALTO (residual o inherente) con responsable
        # Contar evaluaciones de riesgo (riesgo + activo) para que coincida con el reporte completo
        sql = text("""
            SELECT 
                r.ID_Riesgo,
                r.Nombre as nombre_riesgo,
                r.Descripcion as descripcion_riesgo,
                r.tipo_riesgo,
                r.Estado_Riesgo_General,
                a.ID_Activo,
                a.Nombre as nombre_activo,
                a.Tipo_Activo,
                era.id_evaluacion_riesgo_activo,
                COALESCE(nr_res.Nombre, nr_inh.Nombre) as nivel_riesgo,
                era.justificacion_evaluacion_residual,
                era.justificacion_evaluacion_inherente,
                COALESCE(u_res.nombre_completo, u_inh.nombre_completo) as responsable,
                COALESCE(u_res.email_institucional, u_inh.email_institucional) as email_responsable
            FROM riesgos r
            JOIN evaluacion_riesgo_activo era ON r.ID_Riesgo = era.ID_Riesgo
            JOIN activos a ON era.ID_Activo = a.ID_Activo
            LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
            LEFT JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
            LEFT JOIN usuarios_sistema u_res ON era.id_evaluador_residual = u_res.id_usuario
            LEFT JOIN usuarios_sistema u_inh ON era.id_evaluador_inherente = u_inh.id_usuario
            WHERE (nr_res.Nombre = 'ALTO' OR nr_inh.Nombre = 'ALTO')
            ORDER BY r.ID_Riesgo, a.ID_Activo
        """)
        
        result = db.session.execute(sql).fetchall()
        riesgos_list = []
        # Usar un set para evitar duplicados basado en riesgo + activo + evaluación
        evaluaciones_unicas = set()
        
        for row in result:
            riesgo_id = row.ID_Riesgo
            activo_id = row.ID_Activo
            eval_id = row.id_evaluacion_riesgo_activo
            
            # Crear clave única para evitar duplicados
            eval_key = f"{riesgo_id}_{activo_id}_{eval_id}"
            if eval_key in evaluaciones_unicas:
                continue  # Ya procesamos esta evaluación
            evaluaciones_unicas.add(eval_key)
            
            # Obtener controles aplicados
            try:
                controles_sql = text("""
                    SELECT 
                        c.ID_Control,
                        c.Nombre,
                        c.Descripcion,
                        c.categoria_control_iso as Categoria,
                        c.Tipo_Control as Tipo,
                        c.codigo_control_iso,
                        rca.justificacion_aplicacion_control,
                        rca.efectividad_real_observada
                    FROM riesgocontrolaplicado rca
                    JOIN controles c ON rca.ID_Control = c.ID_Control
                    WHERE rca.id_evaluacion_riesgo_activo = :eval_id
                """)
            except Exception as e:
                logger.warning("Error en query de controles: %s", str(e))
                controles_sql = None
            
            controles_result = db.session.execute(controles_sql, {'eval_id': eval_id}).fetchall()
            controles_list = [{
                'id': ctrl.ID_Control,
                'nombre': ctrl.Nombre,
                'descripcion': ctrl.Descripcion,
                'categoria': ctrl.Categoria,
                'justificacion': ctrl.justificacion_aplicacion_control,
                'eficacia': ctrl.efectividad_real_observada
            } for ctrl in controles_result]
            
            # Obtener documentos de evidencia
            documentos = DocumentoAdjunto.query.filter(
                DocumentoAdjunto.accion_id.like(f'%activo_{activo_id}%'),
                DocumentoAdjunto.activo == True
            ).all()
            
            documentos_list = [doc.to_dict() for doc in documentos]
            
            # Determinar estado de mitigación basado en controles y estado del riesgo
            estado_mitigacion = 'Pendiente'
            if row.Estado_Riesgo_General in ['Mitigado', 'Cerrado']:
                estado_mitigacion = 'Mitigado'
            elif row.Estado_Riesgo_General == 'Aceptado':
                estado_mitigacion = 'Aceptado'
            elif len(controles_list) > 0:
                estado_mitigacion = 'En Mitigación'
            
            riesgo_data = {
                'id_riesgo': riesgo_id,
                'nombre': row.nombre_riesgo,
                'descripcion': row.descripcion_riesgo,
                'tipo': row.tipo_riesgo,
                'estado': row.Estado_Riesgo_General,
                'nivel_riesgo': row.nivel_riesgo,
                'activo': {
                    'id': activo_id,
                    'nombre': row.nombre_activo,
                    'tipo': row.Tipo_Activo
                },
                'controles': controles_list,
                'documentos_evidencia': documentos_list,
                'estado_mitigacion': estado_mitigacion,
                'justificacion': row.justificacion_evaluacion_residual or row.justificacion_evaluacion_inherente,
                'responsable': row.responsable or 'No asignado',
                'email_responsable': row.email_responsable
            }
            riesgos_list.append(riesgo_data)
        
        return jsonify({
            'riesgos': riesgos_list,
            'total': len(riesgos_list)
        }), 200
        
    except Exception as e:
        logger.error("Error en get_riesgos_altos_detalle: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/riesgos-con-activos', methods=['GET'])
@consultant_required
def get_riesgos_con_activos():
    """Obtener todos los riesgos con activos enlazados y controles sugeridos por norma"""
    try:
        from sqlalchemy import text
        from ..models import Riesgo, Activo, evaluacion_riesgo_activo, controles as controles_seguridad
        
        # Obtener todos los riesgos con sus activos asociados
        sql = text("""
            SELECT DISTINCT
                r.ID_Riesgo,
                r.Nombre as nombre_riesgo,
                r.Descripcion as descripcion_riesgo,
                r.tipo_riesgo,
                r.Estado_Riesgo_General,
                a.ID_Activo,
                a.Nombre as nombre_activo,
                a.Tipo_Activo
            FROM riesgos r
            LEFT JOIN evaluacion_riesgo_activo era ON r.ID_Riesgo = era.ID_Riesgo
            LEFT JOIN activos a ON era.ID_Activo = a.ID_Activo
            ORDER BY r.ID_Riesgo, a.ID_Activo
        """)
        
        result = db.session.execute(sql).fetchall()
        riesgos_dict = {}
        
        for row in result:
            riesgo_id = row.ID_Riesgo
            if riesgo_id not in riesgos_dict:
                riesgos_dict[riesgo_id] = {
                    'id_riesgo': riesgo_id,
                    'nombre': row.nombre_riesgo,
                    'descripcion': row.descripcion_riesgo,
                    'tipo': row.tipo_riesgo,
                    'estado': row.Estado_Riesgo_General,
                    'activos': [],
                    'controles_sugeridos': []
                }
            
            # Agregar activo si existe
            if row.ID_Activo:
                # Verificar si el activo ya está en la lista (por ID)
                activo_ids_existentes = [a['id'] for a in riesgos_dict[riesgo_id]['activos']]
                if row.ID_Activo not in activo_ids_existentes:
                    activo_data = {
                        'id': row.ID_Activo,
                        'nombre': row.nombre_activo,
                        'tipo': row.Tipo_Activo
                    }
                    riesgos_dict[riesgo_id]['activos'].append(activo_data)
        
        # Obtener controles sugeridos por norma ISO para cada riesgo
        for riesgo_id, riesgo_data in riesgos_dict.items():
            try:
                # Buscar controles relevantes basados en el tipo de riesgo y nombre
                tipo_riesgo = riesgo_data.get('tipo', '')
                nombre_riesgo = riesgo_data.get('nombre', '')
                
                # Si no hay tipo de riesgo, obtener controles generales
                if not tipo_riesgo:
                    controles_sql = text("""
                        SELECT 
                            c.ID_Control,
                            c.Nombre,
                            c.Descripcion,
                            c.categoria_control_iso as Categoria,
                            c.Tipo_Control as Tipo,
                            c.codigo_control_iso,
                            c.categoria_control_iso
                        FROM controles c
                        LIMIT 10
                    """)
                    controles_result = db.session.execute(controles_sql).fetchall()
                else:
                    # Buscar por tipo de riesgo o nombre
                    controles_sql = text("""
                        SELECT 
                            c.ID_Control,
                            c.Nombre,
                            c.Descripcion,
                            c.categoria_control_iso as Categoria,
                            c.Tipo_Control as Tipo,
                            c.codigo_control_iso,
                            c.categoria_control_iso
                        FROM controles c
                        WHERE c.categoria_control_iso LIKE :tipo_pattern
                           OR c.Descripcion LIKE :desc_pattern
                           OR c.Nombre LIKE :nombre_pattern
                        LIMIT 10
                    """)
                    
                    tipo_pattern = f'%{tipo_riesgo}%' if tipo_riesgo else '%'
                    desc_pattern = f'%{nombre_riesgo}%' if nombre_riesgo else '%'
                    nombre_pattern = f'%{nombre_riesgo}%' if nombre_riesgo else '%'
                    
                    controles_result = db.session.execute(controles_sql, {
                        'tipo_pattern': tipo_pattern,
                        'desc_pattern': desc_pattern,
                        'nombre_pattern': nombre_pattern
                    }).fetchall()
                
                controles_sugeridos = [{
                    'id': str(ctrl.ID_Control),
                    'nombre': ctrl.Nombre,
                    'descripcion': ctrl.Descripcion,
                    'categoria': ctrl.Categoria,
                    'tipo': getattr(ctrl, 'Tipo', None),
                    'eficacia_esperada': ctrl.Eficacia_Esperada,
                    'codigo_iso': getattr(ctrl, 'codigo_control_iso', None) or getattr(ctrl, 'codigo_iso', None),
                    'categoria_iso': getattr(ctrl, 'categoria_control_iso', None) or ctrl.Categoria
                } for ctrl in controles_result]
                
                riesgo_data['controles_sugeridos'] = controles_sugeridos
            except Exception as ctrl_error:
                logger.warning("Error obteniendo controles sugeridos para riesgo %s: %s",
                               riesgo_id, str(ctrl_error))
                riesgo_data['controles_sugeridos'] = []
        
        riesgos_list = list(riesgos_dict.values())
        
        # Si no hay riesgos en el dict pero hay riesgos en la tabla, obtener todos los riesgos sin activos
        if not riesgos_list:
            riesgos_sin_activos = Riesgo.query.all()
            riesgos_list = [{
                'id_riesgo': r.ID_Riesgo,
                'nombre': r.Nombre,
                'descripcion': r.Descripcion,
                'tipo': r.tipo_riesgo,
                'estado': r.Estado_Riesgo_General,
                'activos': [],
                'controles_sugeridos': []
            } for r in riesgos_sin_activos]
        
        return jsonify({
            'riesgos': riesgos_list,
            'total': len(riesgos_list)
        }), 200
        
    except Exception as e:
        logger.error("Error en get_riesgos_con_activos: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/estadisticas-activos', methods=['GET'])
@consultant_required
def get_estadisticas_activos():
    """Obtener estadísticas detalladas de activos"""
    try:
        from ..models import Activo, evaluacion_riesgo_activo
        
        # Total de activos
        total_activos = Activo.query.count()
        
        # Activos por tipo
        activos_por_tipo = db.session.query(
            Activo.Tipo_Activo,
            func.count(Activo.ID_Activo)
        ).group_by(Activo.Tipo_Activo).all()
        
        # Activos por estado
        activos_por_estado = db.session.query(
            Activo.estado_activo,
            func.count(Activo.ID_Activo)
        ).group_by(Activo.estado_activo).all()
        
        # Activos por criticidad
        activos_por_criticidad = db.session.query(
            Activo.nivel_criticidad_negocio,
            func.count(Activo.ID_Activo)
        ).group_by(Activo.nivel_criticidad_negocio).all()
        
        # Activos con backup configurado
        activos_con_backup = Activo.query.filter(
            Activo.requiere_backup == True,
            Activo.frecuencia_backup_general.isnot(None)
        ).count()
        
        activos_sin_backup = Activo.query.filter(
            Activo.requiere_backup == True,
            Activo.frecuencia_backup_general.is_(None)
        ).count()
        
        # Activos evaluados vs no evaluados
        activos_evaluados_ids = db.session.query(
            evaluacion_riesgo_activo.ID_Activo
        ).distinct().all()
        activos_evaluados = len(activos_evaluados_ids)
        activos_no_evaluados = total_activos - activos_evaluados
        
        # Activos críticos sin evaluación
        activos_criticos = Activo.query.filter(
            Activo.nivel_criticidad_negocio.in_(['Alto', 'Crítico', 'Alta'])
        ).all()
        activos_criticos_ids = [a.ID_Activo for a in activos_criticos]
        activos_criticos_evaluados = db.session.query(
            evaluacion_riesgo_activo.ID_Activo
        ).filter(
            evaluacion_riesgo_activo.ID_Activo.in_(activos_criticos_ids)
        ).distinct().count()
        activos_criticos_sin_evaluar = len(activos_criticos_ids) - activos_criticos_evaluados
        
        # Activos por fuente de datos
        activos_por_fuente = db.session.query(
            Activo.fuente_datos_principal,
            func.count(Activo.ID_Activo)
        ).group_by(Activo.fuente_datos_principal).all()
        
        return jsonify({
            'total_activos': total_activos,
            'por_tipo': {tipo: count for tipo, count in activos_por_tipo},
            'por_estado': {estado: count for estado, count in activos_por_estado},
            'por_criticidad': {criticidad: count for criticidad, count in activos_por_criticidad},
            'backup': {
                'con_backup': activos_con_backup,
                'sin_backup': activos_sin_backup
            },
            'evaluacion': {
                'evaluados': activos_evaluados,
                'no_evaluados': activos_no_evaluados,
                'porcentaje_evaluados': (activos_evaluados / total_activos * 100) if total_activos > 0 else 0
            },
            'criticos': {
                'total': len(activos_criticos_ids),
                'evaluados': activos_criticos_evaluados,
                'sin_evaluar': activos_criticos_sin_evaluar
            },
            'por_fuente': {fuente: count for fuente, count in activos_por_fuente}
        }), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_estadisticas_activos: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/tendencias-seguridad', methods=['GET'])
def get_tendencias_seguridad():
    """Obtener tendencias de seguridad: riesgos y controles"""
    try:
        from sqlalchemy import text
        from ..models import Riesgo, evaluacion_riesgo_activo, niveles_probabilidad, niveles_impacto, nivelesriesgo
        
        # Obtener todos los riesgos con sus evaluaciones y controles
        sql = text("""
            SELECT 
                r.ID_Riesgo,
                r.Nombre as nombre_riesgo,
                r.Descripcion as descripcion_riesgo,
                r.tipo_riesgo as categoria,
                era.id_evaluacion_riesgo_activo,
                a.ID_Activo,
                a.Nombre as nombre_activo,
                -- Evaluación Inherente
                np_inh.Nombre as prob_inherente,
                ni_inh.Nombre as impacto_inherente,
                nr_inh.Nombre as nivel_inherente,
                era.fecha_evaluacion_inherente,
                -- Evaluación Residual
                np_res.Nombre as prob_residual,
                ni_res.Nombre as impacto_residual,
                nr_res.Nombre as nivel_residual,
                era.fecha_evaluacion_residual,
                -- Controles
                (SELECT COUNT(*) FROM riesgocontrolaplicado rca 
                 WHERE rca.id_evaluacion_riesgo_activo = era.id_evaluacion_riesgo_activo) as controles_aplicados,
                (SELECT GROUP_CONCAT(c.Nombre SEPARATOR ', ') 
                 FROM riesgocontrolaplicado rca 
                 JOIN controles c ON rca.ID_Control = c.ID_Control
                 WHERE rca.id_evaluacion_riesgo_activo = era.id_evaluacion_riesgo_activo) as nombres_controles
            FROM riesgos r
            JOIN evaluacion_riesgo_activo era ON r.ID_Riesgo = era.ID_Riesgo
            JOIN activos a ON era.ID_Activo = a.ID_Activo
            LEFT JOIN niveles_probabilidad np_inh ON era.id_nivel_probabilidad_inherente = np_inh.ID_NivelProbabilidad
            LEFT JOIN niveles_impacto ni_inh ON era.id_nivel_impacto_inherente = ni_inh.ID_NivelImpacto
            LEFT JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
            LEFT JOIN niveles_probabilidad np_res ON era.id_nivel_probabilidad_residual = np_res.ID_NivelProbabilidad
            LEFT JOIN niveles_impacto ni_res ON era.id_nivel_impacto_residual = ni_res.ID_NivelImpacto
            LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
            ORDER BY era.fecha_evaluacion_inherente DESC
        """)
        
        result = db.session.execute(sql).fetchall()
        
        # Agrupar datos
        riesgos_data = []
        riesgos_por_categoria = {}
        riesgos_con_controles = 0
        riesgos_sin_controles = 0
        mejora_riesgo = 0  # Riesgos que mejoraron de inherente a residual
        
        for row in result:
            categoria = row.categoria or 'General'
            if categoria not in riesgos_por_categoria:
                riesgos_por_categoria[categoria] = {'total': 0, 'con_controles': 0}
            riesgos_por_categoria[categoria]['total'] += 1
            
            tiene_controles = (row.controles_aplicados or 0) > 0
            if tiene_controles:
                riesgos_con_controles += 1
                riesgos_por_categoria[categoria]['con_controles'] += 1
            else:
                riesgos_sin_controles += 1
            
            # Verificar si mejoró el riesgo
            if row.nivel_inherente and row.nivel_residual:
                niveles = {'Bajo': 1, 'Medio': 2, 'Alto': 3}
                if niveles.get(row.nivel_residual, 0) < niveles.get(row.nivel_inherente, 0):
                    mejora_riesgo += 1
            
            riesgos_data.append({
                'id_riesgo': row.ID_Riesgo,
                'nombre_riesgo': row.nombre_riesgo,
                'descripcion': row.descripcion_riesgo,
                'categoria': categoria,
                'activo': {
                    'id': row.ID_Activo,
                    'nombre': row.nombre_activo
                },
                'evaluacion_inherente': {
                    'probabilidad': row.prob_inherente,
                    'impacto': row.impacto_inherente,
                    'nivel': row.nivel_inherente,
                    'fecha': row.fecha_evaluacion_inherente.isoformat() if row.fecha_evaluacion_inherente else None
                },
                'evaluacion_residual': {
                    'probabilidad': row.prob_residual,
                    'impacto': row.impacto_residual,
                    'nivel': row.nivel_residual,
                    'fecha': row.fecha_evaluacion_residual.isoformat() if row.fecha_evaluacion_residual else None
                } if row.prob_residual else None,
                'controles': {
                    'aplicados': row.controles_aplicados or 0,
                    'nombres': row.nombres_controles.split(', ') if row.nombres_controles else []
                }
            })
        
        return jsonify({
            'riesgos': riesgos_data,
            'estadisticas': {
                'total_riesgos': len(riesgos_data),
                'con_controles': riesgos_con_controles,
                'sin_controles': riesgos_sin_controles,
                'mejora_riesgo': mejora_riesgo,
                'por_categoria': riesgos_por_categoria
            }
        }), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_tendencias_seguridad: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/reporte-usuarios-evidencias', methods=['GET'])
def get_reporte_usuarios_evidencias():
    """Obtener reporte de usuarios con evidencias subidas"""
    try:
        from sqlalchemy import text
        from ..models.documentos import DocumentoAdjunto
        from ..models import UsuarioSistema
        
        # Obtener todos los documentos con información del usuario
        # Manejar tanto usuarios_auth como usuarios_sistema directamente
        sql = text("""
            SELECT 
                da.id,
                da.accion_id,
                da.nombre_original,
                da.descripcion,
                da.tipo_mime,
                da.tamaño_bytes,
                da.fecha_subida,
                da.subido_por,
                COALESCE(ua.id_usuario_sistema, da.subido_por, 0) as id_usuario_sistema,
                COALESCE(us.nombre_completo, 'Usuario Desconocido') as nombre_completo,
                COALESCE(us.email_institucional, '') as email_institucional,
                COALESCE(us.puesto_organizacion, '') as puesto_organizacion
            FROM documentos_adjuntos da
            LEFT JOIN usuarios_auth ua ON da.subido_por = ua.id_usuario_auth
            LEFT JOIN usuarios_sistema us ON COALESCE(ua.id_usuario_sistema, da.subido_por) = us.id_usuario
            WHERE (da.activo = 1 OR da.activo IS NULL)
            ORDER BY da.fecha_subida DESC
        """)
        
        result = db.session.execute(sql).fetchall()
        
        # Categorizar documentos por tipo de evidencia
        def categorizar_documento(nombre: str, descripcion: str = '') -> str:
            texto = (nombre + ' ' + (descripcion or '')).lower()
            if any(palabra in texto for palabra in ['riesgo', 'evaluacion', 'matriz']):
                return 'Gestión de Riesgo'
            elif any(palabra in texto for palabra in ['mitigacion', 'mitigación', 'tratamiento', 'control']):
                return 'Mitigación'
            elif any(palabra in texto for palabra in ['politica', 'política', 'norma', 'procedimiento']):
                return 'Política'
            elif any(palabra in texto for palabra in ['control', 'auditoria', 'auditoría', 'verificacion']):
                return 'Control'
            elif any(palabra in texto for palabra in ['contrato', 'acuerdo', 'convenio', 'servicio']):
                return 'Contrato'
            else:
                return 'Otro'
        
        # Agrupar por usuario
        usuarios_dict = {}
        total_documentos = 0
        documentos_por_categoria = {
            'Gestión de Riesgo': 0,
            'Mitigación': 0,
            'Política': 0,
            'Control': 0,
            'Contrato': 0,
            'Otro': 0
        }
        
        for row in result:
            usuario_id = row.id_usuario_sistema or 0
            usuario_nombre = row.nombre_completo or 'Usuario Desconocido'
            
            if usuario_id not in usuarios_dict:
                usuarios_dict[usuario_id] = {
                    'id_usuario': usuario_id,
                    'nombre': usuario_nombre,
                    'email': row.email_institucional or '',
                    'puesto': row.puesto_organizacion or '',
                    'documentos': [],
                    'por_categoria': {
                        'Gestión de Riesgo': 0,
                        'Mitigación': 0,
                        'Política': 0,
                        'Control': 0,
                        'Contrato': 0,
                        'Otro': 0
                    }
                }
            
            categoria = categorizar_documento(row.nombre_original or '', row.descripcion or '')
            documentos_por_categoria[categoria] += 1
            usuarios_dict[usuario_id]['por_categoria'][categoria] += 1
            
            usuarios_dict[usuario_id]['documentos'].append({
                'id': row.id,
                'nombre': row.nombre_original,
                'descripcion': row.descripcion,
                'tipo': row.tipo_mime,
                'tamaño': row.tamaño_bytes,
                'fecha_subida': row.fecha_subida.isoformat() if row.fecha_subida else None,
                'categoria': categoria,
                'accion_id': row.accion_id
            })
            
            total_documentos += 1
        
        usuarios_list = list(usuarios_dict.values())
        usuarios_list.sort(key=lambda x: len(x['documentos']), reverse=True)
        
        return jsonify({
            'usuarios': usuarios_list,
            'estadisticas': {
                'total_usuarios_con_evidencias': len(usuarios_list),
                'total_documentos': total_documentos,
                'por_categoria': documentos_por_categoria,
                'promedio_documentos_por_usuario': total_documentos / len(usuarios_list) if usuarios_list else 0
            }
        }), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_reporte_usuarios_evidencias: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/matriz-riesgos/exportar', methods=['GET'])
def exportar_matriz_riesgos():
    """Exportar reporte completo de activos evaluados con todas sus evaluaciones"""
    try:
        # Obtener parámetros de filtro (mismos que matriz-riesgos)
        activo_id = request.args.get('activo_id', type=int)
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        # Query para obtener todos los activos evaluados con sus evaluaciones completas
        sql = text("""
            SELECT 
                a.ID_Activo as id_activo,
                a.Nombre as nombre_activo,
                a.Tipo_Activo as tipo_activo,
                a.nivel_criticidad_negocio as criticidad,
                a.estado_activo as estado,
                r.ID_Riesgo as id_riesgo,
                r.Nombre as nombre_riesgo,
                COALESCE(np_res.Nombre, np_inh.Nombre) as probabilidad,
                COALESCE(ni_res.Nombre, ni_inh.Nombre) as impacto,
                COALESCE(nr_res.Nombre, nr_inh.Nombre) as nivel_riesgo,
                COALESCE(era.fecha_evaluacion_residual, era.fecha_evaluacion_inherente) as fecha_evaluacion,
                u.nombre_completo as evaluador,
                era.justificacion_evaluacion_inherente as justificacion_inherente,
                era.justificacion_evaluacion_residual as justificacion_residual
            FROM evaluacion_riesgo_activo era
            JOIN activos a ON era.ID_Activo = a.ID_Activo
            JOIN riesgos r ON era.ID_Riesgo = r.ID_Riesgo
            LEFT JOIN niveles_probabilidad np_inh ON era.id_nivel_probabilidad_inherente = np_inh.ID_NivelProbabilidad
            LEFT JOIN niveles_impacto ni_inh ON era.id_nivel_impacto_inherente = ni_inh.ID_NivelImpacto
            LEFT JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
            LEFT JOIN niveles_probabilidad np_res ON era.id_nivel_probabilidad_residual = np_res.ID_NivelProbabilidad
            LEFT JOIN niveles_impacto ni_res ON era.id_nivel_impacto_residual = ni_res.ID_NivelImpacto
            LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
            LEFT JOIN usuarios_sistema u ON COALESCE(era.id_evaluador_residual, era.id_evaluador_inherente) = u.id_usuario
            WHERE np_inh.Nombre IS NOT NULL AND ni_inh.Nombre IS NOT NULL
        """)
        
        params = {}
        conditions = []
        
        if activo_id:
            conditions.append("a.ID_Activo = :activo_id")
            params['activo_id'] = activo_id
        if fecha_inicio:
            conditions.append("COALESCE(era.fecha_evaluacion_residual, era.fecha_evaluacion_inherente) >= :fecha_inicio")
            params['fecha_inicio'] = fecha_inicio
        if fecha_fin:
            conditions.append("COALESCE(era.fecha_evaluacion_residual, era.fecha_evaluacion_inherente) <= :fecha_fin")
            params['fecha_fin'] = fecha_fin
        
        if conditions:
            sql_str = str(sql)
            sql_str = sql_str.replace("WHERE np_inh.Nombre IS NOT NULL", 
                                     "WHERE np_inh.Nombre IS NOT NULL AND " + " AND ".join(conditions))
            sql = text(sql_str)
        
        sql = text(str(sql) + " ORDER BY a.ID_Activo, r.ID_Riesgo")
        rows = db.session.execute(sql, params).fetchall()
        
        # Agrupar por activo
        reporte = {}
        for row in rows:
            activo_id = row.id_activo
            if activo_id not in reporte:
                reporte[activo_id] = {
                    'id': activo_id,
                    'nombre': row.nombre_activo,
                    'tipo': row.tipo_activo,
                    'criticidad': row.criticidad,
                    'estado': row.estado,
                    'evaluaciones': []
                }
            
            reporte[activo_id]['evaluaciones'].append({
                'id_riesgo': row.id_riesgo,
                'nombre_riesgo': row.nombre_riesgo,
                'probabilidad': row.probabilidad,
                'impacto': row.impacto,
                'nivel_riesgo': row.nivel_riesgo,
                'fecha_evaluacion': row.fecha_evaluacion.strftime('%Y-%m-%d') if row.fecha_evaluacion else None,
                'evaluador': row.evaluador or 'No asignado',
                'justificacion_inherente': row.justificacion_inherente,
                'justificacion_residual': row.justificacion_residual
            })
        
        return jsonify({
            'total_activos': len(reporte),
            'fecha_generacion': datetime.utcnow().isoformat(),
            'filtros': {
                'activo_id': activo_id,
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin
            },
            'activos': list(reporte.values())
        }), 200
    except Exception as e:
        print(f"Error exportando matriz de riesgos: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/salud-institucional', methods=['GET'])
def get_salud_institucional():
    """Calcular salud institucional basada en evaluaciones y porcentaje de evaluación"""
    try:
        # Obtener total de activos
        total_activos = Activo.query.count()
        
        # Si no hay activos, retornar salud 0
        if total_activos == 0:
            return jsonify({
                'porcentaje': 0,
                'estado': 'SIN_DATOS',
                'porcentaje_evaluacion': 0,
                'total_activos': 0,
                'activos_evaluados': 0,
                'distribucion': {
                    'altos': 0,
                    'medios': 0,
                    'bajos': 0,
                    'total': 0
                }
            }), 200
        
        # Obtener total de evaluaciones (activos evaluados)
        total_evaluaciones = db.session.execute(
            text("SELECT COUNT(DISTINCT ID_Activo) FROM evaluacion_riesgo_activo WHERE id_nivel_probabilidad_inherente IS NOT NULL AND id_nivel_impacto_inherente IS NOT NULL")
        ).scalar() or 0
        
        # Obtener activos evaluados por tipo
        activos_evaluados_por_tipo = db.session.execute(
            text("""
                SELECT a.Tipo_Activo, COUNT(DISTINCT era.ID_Activo) as cantidad
                FROM evaluacion_riesgo_activo era
                JOIN activos a ON era.ID_Activo = a.ID_Activo
                WHERE era.id_nivel_probabilidad_inherente IS NOT NULL 
                  AND era.id_nivel_impacto_inherente IS NOT NULL
                GROUP BY a.Tipo_Activo
            """)
        ).fetchall()
        activos_evaluados_por_tipo_dict = {tipo if tipo else 'Sin Tipo': cantidad for tipo, cantidad in activos_evaluados_por_tipo}
        
        # Calcular porcentaje de evaluación
        porcentaje_evaluacion = (total_evaluaciones / total_activos * 100) if total_activos > 0 else 0
        
        # Obtener riesgos por nivel (usar residual si existe, si no inherente)
        riesgos_altos = db.session.execute(
            text("""
                SELECT COUNT(*) 
                FROM evaluacion_riesgo_activo era
                LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
                JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
                WHERE COALESCE(nr_res.Nombre, nr_inh.Nombre) = 'ALTO'
            """)
        ).scalar() or 0
        
        riesgos_medios = db.session.execute(
            text("""
                SELECT COUNT(*) 
                FROM evaluacion_riesgo_activo era
                LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
                JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
                WHERE COALESCE(nr_res.Nombre, nr_inh.Nombre) = 'MEDIO'
            """)
        ).scalar() or 0
        
        riesgos_bajos = db.session.execute(
            text("""
                SELECT COUNT(*) 
                FROM evaluacion_riesgo_activo era
                LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
                JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
                WHERE COALESCE(nr_res.Nombre, nr_inh.Nombre) = 'BAJO'
            """)
        ).scalar() or 0
        
        total_riesgos_evaluados = riesgos_altos + riesgos_medios + riesgos_bajos
        
        # Calcular porcentaje de salud considerando:
        # 1. Porcentaje de evaluación (peso 30%)
        # 2. Distribución de riesgos (peso 70%)
        # - Menos riesgos altos = más salud
        # - Más riesgos bajos = más salud
        
        if total_riesgos_evaluados > 0:
            # Score de distribución de riesgos (0-100)
            # Penalizar riesgos altos y medios, premiar riesgos bajos
            # Fórmula: 100 - (porcentaje_altos * 50 + porcentaje_medios * 20 - porcentaje_bajos * 10)
            porcentaje_altos = (riesgos_altos / total_riesgos_evaluados) * 100
            porcentaje_medios = (riesgos_medios / total_riesgos_evaluados) * 100
            porcentaje_bajos = (riesgos_bajos / total_riesgos_evaluados) * 100
            
            # Calcular score: menos riesgos altos/medios = más salud
            score_distribucion = max(0, min(100, 100 - (porcentaje_altos * 0.5 + porcentaje_medios * 0.2 - porcentaje_bajos * 0.1)))
        else:
            # Si no hay riesgos evaluados pero hay activos, la salud debe ser baja
            # Si no hay activos ni evaluaciones, retornar 0
            score_distribucion = 0
        
        # Score de evaluación (0-100)
        score_evaluacion = porcentaje_evaluacion
        
        # Calcular salud final: 30% evaluación + 70% distribución
        porcentaje_salud = (score_evaluacion * 0.3) + (score_distribucion * 0.7)
        
        # Ajustar si hay muy pocas evaluaciones (penalizar)
        if porcentaje_evaluacion < 50 and total_activos > 0:
            # Si menos del 50% está evaluado, reducir la salud
            factor_penalizacion = porcentaje_evaluacion / 50
            porcentaje_salud = porcentaje_salud * factor_penalizacion
        
        porcentaje_salud = max(0, min(100, round(porcentaje_salud, 1)))
        
        # Determinar estado
        if porcentaje_salud >= 80:
            estado = 'BUENO'
        elif porcentaje_salud >= 60:
            estado = 'REGULAR'
        else:
            estado = 'CRÍTICO'
        
        return jsonify({
            'porcentaje': porcentaje_salud,
            'estado': estado,
            'porcentaje_evaluacion': round(porcentaje_evaluacion, 1),
            'total_activos': total_activos,
            'activos_evaluados': total_evaluaciones,
            'activos_evaluados_por_tipo': activos_evaluados_por_tipo_dict,
            'distribucion': {
                'altos': riesgos_altos,
                'medios': riesgos_medios,
                'bajos': riesgos_bajos,
                'total': total_riesgos_evaluados
            }
        }), 200
    except Exception as e:
        print(f"Error calculando salud institucional: {str(e)}")
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/riesgos-activos-mitigados', methods=['GET'])
def get_riesgos_activos_mitigados():
    """Obtener contadores de riesgos activos y mitigados"""
    try:
        # Riesgos activos (con evaluaciones recientes)
        riesgos_activos = db.session.execute(
            text("""
                SELECT COUNT(DISTINCT ID_Riesgo) 
                FROM evaluacion_riesgo_activo 
                WHERE COALESCE(fecha_evaluacion_residual, fecha_evaluacion_inherente) >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            """)
        ).scalar() or 0
        
        # Riesgos mitigados (disminución de nivel de riesgo)
        # Si no hay residual, no se considera mitigado
        riesgos_mitigados = db.session.execute(
            text("""
                SELECT COUNT(*) 
                FROM evaluacion_riesgo_activo era
                JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
                LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
                WHERE (
                    (nr_inh.Nombre = 'ALTO' AND nr_res.Nombre IN ('MEDIO', 'BAJO'))
                    OR (nr_inh.Nombre = 'MEDIO' AND nr_res.Nombre = 'BAJO')
                )
                AND era.id_nivel_riesgo_residual_calculado IS NOT NULL
                AND era.fecha_evaluacion_residual >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            """)
        ).scalar() or 0
        
        return jsonify({
            'activos': riesgos_activos,
            'mitigados': riesgos_mitigados
        }), 200
    except Exception as e:
        print(f"Error obteniendo riesgos activos/mitigados: {str(e)}")
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/top-riesgos-criticos', methods=['GET'])
def get_top_riesgos_criticos():
    """Obtener top 5 riesgos críticos desde riesgo_activo y evaluaciones"""
    try:
        riesgos = []
        riesgos_vistos = set()  # Para evitar duplicados
        
        # Primero obtener desde riesgo_activo (más común)
        riesgo_activos = db.session.query(
            Riesgo, Activo, RiesgoActivo
        ).join(
            RiesgoActivo, Riesgo.ID_Riesgo == RiesgoActivo.id_riesgo
        ).join(
            Activo, RiesgoActivo.ID_Activo == Activo.ID_Activo
        ).filter(
            Riesgo.Estado_Riesgo_General == 'Activo'
        ).order_by(
            case(
                (RiesgoActivo.nivel_riesgo_calculado == 'Alto', 1),
                (RiesgoActivo.nivel_riesgo_calculado == 'Medio', 2),
                else_=3
            ),
            Riesgo.Fecha_Identificacion.desc()
        ).limit(10).all()
        
        for riesgo, activo, riesgo_activo in riesgo_activos:
            clave = f"{riesgo.ID_Riesgo}_{activo.ID_Activo}"
            if clave not in riesgos_vistos and len(riesgos) < 5:
                nivel = riesgo_activo.nivel_riesgo_calculado or 'Medio'
                riesgos.append({
                    'nombre': riesgo.Nombre,
                    'activo': activo.Nombre,
                    'nivel': nivel,
                    'severidad': 'HIGH' if nivel == 'Alto' else 'MEDIUM',
                    'categoria': riesgo.tipo_riesgo or 'General'
                })
                riesgos_vistos.add(clave)
        
        # Si aún no hay suficientes, obtener desde evaluacion_riesgo_activo
        if len(riesgos) < 5:
            sql_eval = text("""
                SELECT 
                    r.Nombre as riesgo_nombre,
                    a.Nombre as activo_nombre,
                    COALESCE(nr_res.Nombre, nr_inh.Nombre) as nivel_riesgo,
                    r.ID_Riesgo,
                    a.ID_Activo
                FROM evaluacion_riesgo_activo era
                JOIN riesgos r ON era.ID_Riesgo = r.ID_Riesgo
                JOIN activos a ON era.ID_Activo = a.ID_Activo
                JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
                LEFT JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
                WHERE r.Estado_Riesgo_General = 'Activo'
                ORDER BY 
                    CASE COALESCE(nr_res.Nombre, nr_inh.Nombre)
                        WHEN 'Alto' THEN 1
                        WHEN 'Medio' THEN 2
                        ELSE 3
                    END
                LIMIT :limit
            """)
            
            limit = 5 - len(riesgos)
            rows_eval = db.session.execute(sql_eval, {'limit': limit}).fetchall()
            
            for row in rows_eval:
                clave = f"{row.ID_Riesgo}_{row.ID_Activo}"
                if clave not in riesgos_vistos:
                    riesgos.append({
                        'nombre': row.riesgo_nombre,
                        'activo': row.activo_nombre,
                        'nivel': row.nivel_riesgo,
                        'severidad': 'HIGH' if row.nivel_riesgo == 'Alto' else 'MEDIUM',
                        'categoria': 'Crítico'
                    })
                    riesgos_vistos.add(clave)
                    if len(riesgos) >= 5:
                        break
        
        # Si aún no hay suficientes, obtener desde la tabla riesgos directamente
        if len(riesgos) < 5:
            riesgos_directos = Riesgo.query.filter(
                Riesgo.Estado_Riesgo_General == 'Activo'
            ).order_by(Riesgo.Fecha_Identificacion.desc()).limit(5 - len(riesgos)).all()
            
            for riesgo in riesgos_directos:
                if len(riesgos) >= 5:
                    break
                    
                # Obtener el primer activo asociado si existe
                riesgo_activo = RiesgoActivo.query.filter_by(id_riesgo=riesgo.ID_Riesgo).first()
                activo_nombre = 'Sin activo asociado'
                nivel = 'Medio'
                
                if riesgo_activo:
                    activo = Activo.query.get(riesgo_activo.ID_Activo)
                    if activo:
                        activo_nombre = activo.Nombre
                        nivel = riesgo_activo.nivel_riesgo_calculado or 'Medio'
                
                # Evitar duplicados
                if not any(r['nombre'] == riesgo.Nombre and r['activo'] == activo_nombre for r in riesgos):
                    riesgos.append({
                        'nombre': riesgo.Nombre,
                        'activo': activo_nombre,
                        'nivel': nivel,
                        'severidad': 'HIGH' if nivel == 'Alto' else 'MEDIUM',
                        'categoria': riesgo.tipo_riesgo or 'General'
                    })
        
        return jsonify({'riesgos': riesgos}), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error obteniendo top riesgos críticos: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/resumen', methods=['GET'])
def get_resumen_general():
    """Obtener resumen general del sistema"""
    try:
        # Contadores generales
        total_activos = Activo.query.count()
        total_riesgos = Riesgo.query.count()
        total_incidentes = Incidente.query.count()
        total_usuarios = UsuarioSistema.query.count()
        
        # Activos por estado
        activos_por_estado = db.session.query(
            Activo.estado_activo, 
            func.count(Activo.ID_Activo)
        ).group_by(Activo.estado_activo).all()
        
        # Activos por nivel de criticidad
        activos_por_criticidad = db.session.query(
            Activo.nivel_criticidad_negocio, 
            func.count(Activo.ID_Activo)
        ).group_by(Activo.nivel_criticidad_negocio).all()
        
        # Incidentes por estado
        incidentes_por_estado = db.session.query(
            Incidente.estado, 
            func.count(Incidente.id_incidente)
        ).group_by(Incidente.estado).all()
        
        # Incidentes por severidad
        incidentes_por_severidad = db.session.query(
            Incidente.severidad, 
            func.count(Incidente.id_incidente)
        ).group_by(Incidente.severidad).all()
        
        # Riesgos por estado
        riesgos_por_estado = db.session.query(
            Riesgo.Estado_Riesgo_General, 
            func.count(Riesgo.ID_Riesgo)
        ).group_by(Riesgo.Estado_Riesgo_General).all()
        
        return jsonify({
            'contadores_generales': {
                'total_activos': total_activos,
                'total_riesgos': total_riesgos,
                'total_incidentes': total_incidentes,
                'total_usuarios': total_usuarios
            },
            'activos_por_estado': dict(activos_por_estado),
            'activos_por_criticidad': dict(activos_por_criticidad),
            'incidentes_por_estado': dict(incidentes_por_estado),
            'incidentes_por_severidad': dict(incidentes_por_severidad),
            'riesgos_por_estado': dict(riesgos_por_estado)
        }), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_stats: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/actividad-reciente', methods=['GET'])
def get_actividad_reciente():
    """Obtener actividad reciente del sistema"""
    try:
        # Últimos activos creados
        ultimos_activos = Activo.query.order_by(
            Activo.fecha_creacion_registro.desc()
        ).limit(5).all()
        
        # Últimos incidentes
        ultimos_incidentes = Incidente.query.order_by(
            Incidente.fecha_incidente.desc()
        ).limit(5).all()
        
        # Últimos usuarios creados
        ultimos_usuarios = UsuarioSistema.query.order_by(
            UsuarioSistema.fecha_creacion_registro.desc()
        ).limit(5).all()
        
        return jsonify({
            'ultimos_activos': [activo.to_dict() for activo in ultimos_activos],
            'ultimos_incidentes': [incidente.to_dict() for incidente in ultimos_incidentes],
            'ultimos_usuarios': [{
                'id_usuario': u.id_usuario,
                'nombre_completo': u.nombre_completo,
                'email_institucional': u.email_institucional,
                'puesto_organizacion': u.puesto_organizacion,
                'fecha_creacion_registro': u.fecha_creacion_registro.isoformat() if u.fecha_creacion_registro else None
            } for u in ultimos_usuarios]
        }), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_stats: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/riesgos-altos', methods=['GET'])
def get_riesgos_altos():
    """Obtener activos con riesgos altos"""
    try:
        # Activos con riesgos altos
        riesgos_altos = db.session.query(
            Activo, Riesgo, RiesgoActivo
        ).join(
            RiesgoActivo, Activo.ID_Activo == RiesgoActivo.ID_Activo
        ).join(
            Riesgo, RiesgoActivo.id_riesgo == Riesgo.ID_Riesgo
        ).filter(
            RiesgoActivo.nivel_riesgo_calculado == 'Alto'
        ).all()
        
        resultado = []
        for activo, riesgo, riesgo_activo in riesgos_altos:
            resultado.append({
                'activo': activo.to_dict(),
                'riesgo': riesgo.to_dict(),
                'evaluacion': {
                    'probabilidad': riesgo_activo.probabilidad,
                    'impacto': riesgo_activo.impacto,
                    'nivel_riesgo_calculado': riesgo_activo.nivel_riesgo_calculado,
                    'medidas_mitigacion': riesgo_activo.medidas_mitigacion,
                    'fecha_evaluacion': riesgo_activo.fecha_evaluacion.isoformat() if riesgo_activo.fecha_evaluacion else None
                }
            })
        
        return jsonify(resultado), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_stats: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/incidentes-pendientes', methods=['GET'])
def get_incidentes_pendientes():
    """Obtener incidentes pendientes de resolución"""
    try:
        incidentes_pendientes = Incidente.query.filter(
            Incidente.estado.in_(['Abierto', 'En Proceso'])
        ).order_by(Incidente.fecha_incidente.desc()).all()
        
        return jsonify([incidente.to_dict() for incidente in incidentes_pendientes]), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_stats: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/activos-criticos', methods=['GET'])
def get_activos_criticos():
    """Obtener activos críticos"""
    try:
        activos_criticos = Activo.query.filter(
            Activo.nivel_criticidad_negocio.in_(['Alto', 'Crítico'])
        ).all()
        
        return jsonify([activo.to_dict() for activo in activos_criticos]), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_stats: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/evolucion-riesgos', methods=['GET'])
def get_evolucion_riesgos():
    """Obtener evolución de riesgos identificados y mitigados por mes (últimos 6 meses)"""
    try:
        from sqlalchemy import text
        from ..models import Riesgo, evaluacion_riesgo_activo, nivelesriesgo
        
        hoy = datetime.utcnow()
        meses_datos = []
        
        # Obtener datos de los últimos 6 meses
        for i in range(5, -1, -1):
            # Calcular inicio y fin del mes
            fecha_mes = hoy - timedelta(days=30 * i)
            inicio_mes = fecha_mes.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Calcular fin de mes
            if inicio_mes.month == 12:
                fin_mes = inicio_mes.replace(year=inicio_mes.year + 1, month=1)
            else:
                fin_mes = inicio_mes.replace(month=inicio_mes.month + 1)
            
            # Nombres de meses en español
            meses_es = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
            nombre_mes = meses_es[inicio_mes.month - 1]
            
            # Contar riesgos identificados en este mes (por fecha de creación)
            riesgos_identificados = Riesgo.query.filter(
                Riesgo.fecha_creacion_registro >= inicio_mes,
                Riesgo.fecha_creacion_registro < fin_mes
            ).count()
            
            # Contar riesgos mitigados en este mes
            # Un riesgo se considera mitigado si:
            # 1. Su estado es "Mitigado" o "Cerrado" Y fue actualizado en este mes
            # 2. O tiene evaluación residual con nivel menor que inherente Y fue evaluado en este mes
            riesgos_mitigados_estado = Riesgo.query.filter(
                Riesgo.Estado_Riesgo_General.in_(['Mitigado', 'Cerrado']),
                Riesgo.fecha_ultima_actualizacion >= inicio_mes,
                Riesgo.fecha_ultima_actualizacion < fin_mes
            ).count()
            
            # Riesgos mitigados por evaluación residual (nivel residual < inherente)
            sql_mitigados_residual = text("""
                SELECT COUNT(DISTINCT era.ID_Riesgo) as total
                FROM evaluacion_riesgo_activo era
                JOIN nivelesriesgo nr_inh ON era.id_nivel_riesgo_inherente_calculado = nr_inh.ID_NivelRiesgo
                JOIN nivelesriesgo nr_res ON era.id_nivel_riesgo_residual_calculado = nr_res.ID_NivelRiesgo
                WHERE era.fecha_evaluacion_residual >= :inicio
                  AND era.fecha_evaluacion_residual < :fin
                  AND (
                    (nr_inh.Nombre = 'ALTO' AND nr_res.Nombre IN ('MEDIO', 'BAJO')) OR
                    (nr_inh.Nombre = 'MEDIO' AND nr_res.Nombre = 'BAJO')
                  )
            """)
            result_mitigados_residual = db.session.execute(sql_mitigados_residual, {
                'inicio': inicio_mes,
                'fin': fin_mes
            }).fetchone()
            riesgos_mitigados_residual = result_mitigados_residual[0] if result_mitigados_residual else 0
            
            # Total de mitigados (suma de ambos)
            riesgos_mitigados = riesgos_mitigados_estado + riesgos_mitigados_residual
            
            meses_datos.append({
                'mes': nombre_mes,
                'riesgos': riesgos_identificados,
                'mitigados': riesgos_mitigados
            })
        
        return jsonify({
            'evolucion': meses_datos
        }), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_evolucion_riesgos: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/tendencias', methods=['GET'])
def get_tendencias():
    """Obtener tendencias del sistema"""
    try:
        # Obtener fechas para el análisis
        hoy = datetime.utcnow()
        hace_30_dias = hoy - timedelta(days=30)
        hace_60_dias = hoy - timedelta(days=60)
        hace_90_dias = hoy - timedelta(days=90)
        
        # Activos creados en diferentes períodos
        activos_ultimo_mes = Activo.query.filter(
            Activo.fecha_creacion_registro >= hace_30_dias
        ).count()
        
        activos_mes_anterior = Activo.query.filter(
            Activo.fecha_creacion_registro >= hace_60_dias,
            Activo.fecha_creacion_registro < hace_30_dias
        ).count()
        
        activos_mes_anterior_2 = Activo.query.filter(
            Activo.fecha_creacion_registro >= hace_90_dias,
            Activo.fecha_creacion_registro < hace_60_dias
        ).count()
        
        # Incidentes en diferentes períodos
        incidentes_ultimo_mes = Incidente.query.filter(
            Incidente.fecha_incidente >= hace_30_dias
        ).count()
        
        incidentes_mes_anterior = Incidente.query.filter(
            Incidente.fecha_incidente >= hace_60_dias,
            Incidente.fecha_incidente < hace_30_dias
        ).count()
        
        incidentes_mes_anterior_2 = Incidente.query.filter(
            Incidente.fecha_incidente >= hace_90_dias,
            Incidente.fecha_incidente < hace_60_dias
        ).count()
        
        # Usuarios creados en diferentes períodos
        usuarios_ultimo_mes = UsuarioSistema.query.filter(
            UsuarioSistema.fecha_creacion_registro >= hace_30_dias
        ).count()
        
        usuarios_mes_anterior = UsuarioSistema.query.filter(
            UsuarioSistema.fecha_creacion_registro >= hace_60_dias,
            UsuarioSistema.fecha_creacion_registro < hace_30_dias
        ).count()
        
        return jsonify({
            'activos': {
                'ultimo_mes': activos_ultimo_mes,
                'mes_anterior': activos_mes_anterior,
                'mes_anterior_2': activos_mes_anterior_2,
                'tendencia': 'creciente' if activos_ultimo_mes > activos_mes_anterior else 'decreciente'
            },
            'incidentes': {
                'ultimo_mes': incidentes_ultimo_mes,
                'mes_anterior': incidentes_mes_anterior,
                'mes_anterior_2': incidentes_mes_anterior_2,
                'tendencia': 'creciente' if incidentes_ultimo_mes > incidentes_mes_anterior else 'decreciente'
            },
            'usuarios': {
                'ultimo_mes': usuarios_ultimo_mes,
                'mes_anterior': usuarios_mes_anterior,
                'tendencia': 'creciente' if usuarios_ultimo_mes > usuarios_mes_anterior else 'decreciente'
            }
        }), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_stats: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500

@dashboard_bp.route('/alertas', methods=['GET'])
def get_alertas():
    """Obtener alertas del sistema"""
    try:
        alertas = []
        
        # Alertas de incidentes sin resolver
        incidentes_sin_resolver = Incidente.query.filter(
            Incidente.estado.in_(['Abierto', 'En Proceso'])
        ).count()
        
        if incidentes_sin_resolver > 0:
            alertas.append({
                'tipo': 'incidentes_pendientes',
                'mensaje': f'Hay {incidentes_sin_resolver} incidentes pendientes de resolución',
                'severidad': 'alta' if incidentes_sin_resolver > 5 else 'media',
                'cantidad': incidentes_sin_resolver
            })
        
        # Alertas de riesgos altos
        riesgos_altos_count = db.session.query(RiesgoActivo).filter(
            RiesgoActivo.nivel_riesgo_calculado == 'Alto'
        ).count()
        
        if riesgos_altos_count > 0:
            alertas.append({
                'tipo': 'riesgos_altos',
                'mensaje': f'Hay {riesgos_altos_count} activos con riesgos altos',
                'severidad': 'alta',
                'cantidad': riesgos_altos_count
            })
        
        # Alertas de activos críticos sin backup
        activos_criticos_sin_backup = Activo.query.filter(
            Activo.nivel_criticidad_negocio.in_(['Alto', 'Crítico']),
            Activo.requiere_backup == True,
            Activo.frecuencia_backup_general.is_(None)
        ).count()
        
        if activos_criticos_sin_backup > 0:
            alertas.append({
                'tipo': 'activos_criticos_sin_backup',
                'mensaje': f'Hay {activos_criticos_sin_backup} activos críticos sin configuración de backup',
                'severidad': 'alta',
                'cantidad': activos_criticos_sin_backup
            })
        
        # Alertas de revisiones próximas
        proxima_semana = datetime.utcnow() + timedelta(days=7)
        revisiones_proximas = Activo.query.filter(
            Activo.fecha_proxima_revision_sgsi <= proxima_semana,
            Activo.fecha_proxima_revision_sgsi >= datetime.utcnow()
        ).count()
        
        if revisiones_proximas > 0:
            alertas.append({
                'tipo': 'revisiones_proximas',
                'mensaje': f'Hay {revisiones_proximas} activos con revisiones próximas',
                'severidad': 'media',
                'cantidad': revisiones_proximas
            })
        
        return jsonify(alertas), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error en get_stats: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': str(e), 'traceback': error_trace}), 500 

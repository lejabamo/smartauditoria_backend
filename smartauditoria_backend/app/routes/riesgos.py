from flask import Blueprint, request, jsonify
from ..models import db, Riesgo, RiesgoActivo, Activo
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, text
from datetime import datetime
from ..auth.decorators import admin_required, consultant_required, write_required
from ..utils.logger import get_logger

logger = get_logger(__name__)
riesgos_bp = Blueprint('riesgos', __name__)

@riesgos_bp.route('/', methods=['GET'])
@consultant_required
def get_riesgos():
    """Obtener todos los riesgos con filtros opcionales"""
    try:
        # Parámetros de filtrado
        tipo_riesgo = request.args.get('tipo_riesgo')
        estado = request.args.get('estado')
        
        query = Riesgo.query
        
        if tipo_riesgo:
            query = query.filter(Riesgo.tipo_riesgo == tipo_riesgo)
        if estado:
            query = query.filter(Riesgo.Estado_Riesgo_General == estado)
        
        riesgos = query.all()
        return jsonify([riesgo.to_dict() for riesgo in riesgos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/<int:riesgo_id>', methods=['GET'])
@consultant_required
def get_riesgo(riesgo_id):
    """Obtener un riesgo específico por ID"""
    try:
        riesgo = Riesgo.query.filter_by(ID_Riesgo=riesgo_id).first_or_404()
        return jsonify(riesgo.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/', methods=['POST'])
@write_required
def create_riesgo():
    """Crear un nuevo riesgo"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validaciones básicas
        if not data.get('Nombre'):
            return jsonify({'error': 'El nombre del riesgo es obligatorio'}), 400
        
        # Validar que no exista un riesgo con el mismo nombre (antes de insertar)
        nombre_riesgo = data.get('Nombre').strip()
        riesgo_existente = Riesgo.query.filter_by(Nombre=nombre_riesgo).first()
        if riesgo_existente:
            return jsonify({
                'error': f'Ya existe un riesgo con el nombre "{nombre_riesgo}"',
                'type': 'duplicate_error',
                'existing_id': riesgo_existente.ID_Riesgo
            }), 409  # 409 Conflict es el código HTTP apropiado para duplicados
        
        # Validar y ajustar tipo_riesgo si es necesario
        tipo_riesgo = data.get('tipo_riesgo')
        # Si tipo_riesgo es muy largo, truncarlo
        if tipo_riesgo:
            # Limitar a 50 caracteres por si la BD tiene restricción
            tipo_riesgo = tipo_riesgo[:50] if len(tipo_riesgo) > 50 else tipo_riesgo
        # Si no se proporciona tipo_riesgo, intentar usar un valor por defecto válido
        # basado en los tipos existentes en la BD
        if not tipo_riesgo:
            try:
                # Intentar obtener un tipo de riesgo existente como fallback
                tipo_existente = db.session.query(Riesgo.tipo_riesgo).filter(
                    Riesgo.tipo_riesgo.isnot(None)
                ).first()
                if tipo_existente and tipo_existente[0]:
                    tipo_riesgo = tipo_existente[0]
                else:
                    # Si no hay tipos en la BD, usar un valor corto por defecto
                    tipo_riesgo = 'Operacional'  # Valor corto que debería funcionar
            except Exception as e:
                logger.warning("No se pudo obtener tipo_riesgo existente de BD: %s", str(e))
                tipo_riesgo = 'Operacional'  # Fallback
        
        riesgo = Riesgo(
            Nombre=nombre_riesgo,  # Usar el nombre ya validado y limpiado
            Descripcion=data.get('Descripcion'),
            tipo_riesgo=tipo_riesgo,
            Estado_Riesgo_General=data.get('Estado_Riesgo_General', 'Identificado'),
            Fecha_Identificacion=datetime.now().date()  # Agregar fecha de identificación
        )
        
        db.session.add(riesgo)
        db.session.commit()
        logger.info("Riesgo creado: id=%s nombre='%s'", riesgo.ID_Riesgo, riesgo.Nombre)
        return jsonify(riesgo.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        error_str = str(e)
        
        # Detectar específicamente errores de duplicado
        if 'Duplicate entry' in error_str and 'idx_nombre_riesgo' in error_str:
            # Extraer el nombre del error si es posible
            import re
            match = re.search(r"Duplicate entry '([^']+)'", error_str)
            nombre_duplicado = match.group(1) if match else 'desconocido'
            
            # Buscar el riesgo existente
            riesgo_existente = Riesgo.query.filter_by(Nombre=nombre_duplicado).first()
            return jsonify({
                'error': f'Ya existe un riesgo con el nombre "{nombre_duplicado}"',
                'type': 'duplicate_error',
                'existing_id': riesgo_existente.ID_Riesgo if riesgo_existente else None
            }), 409  # 409 Conflict
        
        error_msg = f'Error de base de datos: {error_str}'
        logger.error("Error SQLAlchemy en create_riesgo: %s", error_msg, exc_info=True)
        return jsonify({'error': error_msg, 'type': 'database_error'}), 500
    except Exception as e:
        db.session.rollback()
        error_msg = str(e)
        logger.error("Error inesperado en create_riesgo: %s", error_msg, exc_info=True)
        return jsonify({'error': error_msg, 'type': 'general_error'}), 500

@riesgos_bp.route('/<int:riesgo_id>', methods=['PUT'])
@write_required
def update_riesgo(riesgo_id):
    """Actualizar un riesgo existente"""
    try:
        riesgo = Riesgo.query.get_or_404(riesgo_id)
        data = request.json
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Actualizar campos
        if 'nombre_riesgo' in data:
            riesgo.nombre_riesgo = data['nombre_riesgo']
        if 'descripcion' in data:
            riesgo.descripcion = data['descripcion']
        if 'tipo_riesgo' in data:
            riesgo.tipo_riesgo = data['tipo_riesgo']
        if 'nivel_riesgo' in data:
            riesgo.nivel_riesgo = data['nivel_riesgo']
        if 'estado' in data:
            riesgo.estado = data['estado']
        
        db.session.commit()
        return jsonify(riesgo.to_dict()), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/<int:riesgo_id>', methods=['DELETE'])
@write_required
def delete_riesgo(riesgo_id):
    """Eliminar un riesgo"""
    try:
        riesgo = Riesgo.query.get_or_404(riesgo_id)
        db.session.delete(riesgo)
        db.session.commit()
        return jsonify({'message': 'Riesgo eliminado correctamente'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/tipos', methods=['GET'])
@consultant_required
def get_tipos_riesgo():
    """Obtener todos los tipos de riesgo únicos"""
    try:
        tipos = db.session.query(Riesgo.tipo_riesgo).distinct().filter(
            Riesgo.tipo_riesgo.isnot(None)
        ).all()
        tipos_list = [tipo[0] for tipo in tipos if tipo[0]]
        # Si no hay tipos, retornar lista vacía en lugar de error
        return jsonify(tipos_list), 200
    except Exception as e:
        logger.error("Error en get_tipos_riesgo: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/estados', methods=['GET'])
@consultant_required
def get_estados_riesgo():
    """Obtener todos los estados de riesgo únicos"""
    try:
        estados = db.session.query(Riesgo.Estado_Riesgo_General).distinct().all()
        return jsonify([estado[0] for estado in estados if estado[0]]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/<int:riesgo_id>/activos', methods=['GET'])
@consultant_required
def get_activos_riesgo(riesgo_id):
    """Obtener los activos asociados a un riesgo"""
    try:
        riesgo = Riesgo.query.get_or_404(riesgo_id)
        activos = []
        for riesgo_activo in riesgo.activos:
            activo_data = riesgo_activo.activo.to_dict()
            activo_data.update({
                'probabilidad': riesgo_activo.probabilidad,
                'impacto': riesgo_activo.impacto,
                'nivel_riesgo_calculado': riesgo_activo.nivel_riesgo_calculado,
                'medidas_mitigacion': riesgo_activo.medidas_mitigacion,
                'fecha_evaluacion': riesgo_activo.fecha_evaluacion.isoformat() if riesgo_activo.fecha_evaluacion else None
            })
            activos.append(activo_data)
        return jsonify(activos), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/<int:riesgo_id>/activos/<int:activo_id>', methods=['POST'])
@write_required
def asociar_riesgo_activo(riesgo_id, activo_id):
    """Asociar un riesgo a un activo con evaluación"""
    try:
        riesgo = Riesgo.query.get_or_404(riesgo_id)
        activo = Activo.query.get_or_404(activo_id)
        data = request.json
        
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validaciones
        if not data.get('probabilidad') or not data.get('impacto'):
            return jsonify({'error': 'La probabilidad e impacto son obligatorios'}), 400
        
        probabilidad = int(data['probabilidad'])
        impacto = int(data['impacto'])
        
        if not (1 <= probabilidad <= 5) or not (1 <= impacto <= 5):
            return jsonify({'error': 'La probabilidad e impacto deben estar entre 1 y 5'}), 400
        
        # Verificar si ya existe la asociación
        riesgo_activo_existente = RiesgoActivo.query.filter_by(
            id_riesgo=riesgo_id, 
            ID_Activo=activo_id
        ).first()
        
        if riesgo_activo_existente:
            return jsonify({'error': 'El riesgo ya está asociado a este activo'}), 400
        
        # Calcular nivel de riesgo
        nivel_riesgo = 'Bajo'
        riesgo_total = probabilidad * impacto
        if riesgo_total > 12:
            nivel_riesgo = 'Alto'
        elif riesgo_total > 4:
            nivel_riesgo = 'Medio'
        
        riesgo_activo = RiesgoActivo(
            id_riesgo=riesgo_id,
            ID_Activo=activo_id,
            probabilidad=probabilidad,
            impacto=impacto,
            nivel_riesgo_calculado=nivel_riesgo,
            medidas_mitigacion=data.get('medidas_mitigacion'),
            fecha_evaluacion=datetime.utcnow()
        )
        
        db.session.add(riesgo_activo)
        db.session.commit()
        
        return jsonify({
            'message': 'Riesgo asociado correctamente al activo',
            'nivel_riesgo_calculado': nivel_riesgo,
            'riesgo_total': riesgo_total
        }), 201
    except ValueError as e:
        return jsonify({'error': f'Error en formato de datos: {str(e)}'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/<int:riesgo_id>/activos/<int:activo_id>', methods=['PUT'])
@write_required
def actualizar_evaluacion_riesgo(riesgo_id, activo_id):
    """Actualizar la evaluación de un riesgo en un activo"""
    try:
        riesgo_activo = RiesgoActivo.query.filter_by(
            id_riesgo=riesgo_id, 
            ID_Activo=activo_id
        ).first_or_404()
        
        data = request.json
        if not data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Actualizar campos
        if 'probabilidad' in data:
            probabilidad = int(data['probabilidad'])
            if not (1 <= probabilidad <= 5):
                return jsonify({'error': 'La probabilidad debe estar entre 1 y 5'}), 400
            riesgo_activo.probabilidad = probabilidad
        
        if 'impacto' in data:
            impacto = int(data['impacto'])
            if not (1 <= impacto <= 5):
                return jsonify({'error': 'El impacto debe estar entre 1 y 5'}), 400
            riesgo_activo.impacto = impacto
        
        if 'medidas_mitigacion' in data:
            riesgo_activo.medidas_mitigacion = data['medidas_mitigacion']
        
        # Recalcular nivel de riesgo
        if riesgo_activo.probabilidad and riesgo_activo.impacto:
            riesgo_total = riesgo_activo.probabilidad * riesgo_activo.impacto
            if riesgo_total > 12:
                riesgo_activo.nivel_riesgo_calculado = 'Alto'
            elif riesgo_total > 4:
                riesgo_activo.nivel_riesgo_calculado = 'Medio'
            else:
                riesgo_activo.nivel_riesgo_calculado = 'Bajo'
        
        riesgo_activo.fecha_evaluacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Evaluación actualizada correctamente',
            'nivel_riesgo_calculado': riesgo_activo.nivel_riesgo_calculado,
            'riesgo_total': riesgo_activo.probabilidad * riesgo_activo.impacto if riesgo_activo.probabilidad and riesgo_activo.impacto else None
        }), 200
    except ValueError as e:
        return jsonify({'error': f'Error en formato de datos: {str(e)}'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/<int:riesgo_id>/activos/<int:activo_id>', methods=['DELETE'])
@write_required
def desasociar_riesgo_activo(riesgo_id, activo_id):
    """Desasociar un riesgo de un activo"""
    try:
        riesgo_activo = RiesgoActivo.query.filter_by(
            id_riesgo=riesgo_id, 
            ID_Activo=activo_id
        ).first_or_404()
        
        db.session.delete(riesgo_activo)
        db.session.commit()
        
        return jsonify({'message': 'Riesgo desasociado correctamente del activo'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/matriz-riesgo', methods=['GET'])
@consultant_required
def get_matriz_riesgo():
    """Obtener datos para la matriz de riesgos"""
    try:
        # Obtener todos los riesgos
        riesgos = Riesgo.query.all()
        
        # Configuración de la matriz
        probabilidades = ['Frecuente', 'Ocasional', 'Posible', 'Improbable']
        impactos = ['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Catastrófico']
        
        # Mapeo de niveles de riesgo
        def calcular_nivel_riesgo(probabilidad, impacto):
            prob_values = {'Improbable': 1, 'Posible': 2, 'Ocasional': 3, 'Frecuente': 4}
            impacto_values = {'Insignificante': 1, 'Menor': 2, 'Moderado': 3, 'Mayor': 4, 'Catastrófico': 5}
            
            score = prob_values.get(probabilidad, 1) * impacto_values.get(impacto, 1)
            
            if score <= 6:
                return 'BAJO'
            elif score <= 11:
                return 'MEDIO'
            else:
                return 'ALTO'
        
        # Procesar riesgos y agrupar por celda de matriz
        cells = []
        for prob in probabilidades:
            for impacto in impactos:
                # Filtrar riesgos por probabilidad e impacto
                riesgos_celda = [
                    r for r in riesgos 
                    if r.Probabilidad_Riesgo == prob and r.Impacto_Riesgo == impacto
                ]
                
                if riesgos_celda:
                    nivel = calcular_nivel_riesgo(prob, impacto)
                    risks_data = []
                    
                    for riesgo in riesgos_celda:
                        # Obtener información del activo asociado
                        activo = Activo.query.filter_by(ID_Activo=riesgo.ID_Activo).first()
                        
                        risks_data.append({
                            'id': riesgo.ID_Riesgo,
                            'nombre': riesgo.Nombre,
                            'nivel': nivel,
                            'propietario': activo.Propietario_Activo if activo else 'No asignado',
                            'fecha': riesgo.Fecha_Identificacion.strftime('%Y-%m-%d') if riesgo.Fecha_Identificacion else '',
                            'activo': activo.Nombre_Activo if activo else 'Activo no encontrado',
                            'proceso': activo.Proceso_Negocio if activo else 'No especificado'
                        })
                    
                    cells.append({
                        'probabilidad_key': prob,
                        'impacto_key': impacto,
                        'count': len(riesgos_celda),
                        'risks': risks_data
                    })
        
        # Calcular salud institucional
        total_riesgos = len(riesgos)
        if total_riesgos > 0:
            riesgos_bajos = sum(1 for r in riesgos if calcular_nivel_riesgo(r.Probabilidad_Riesgo, r.Impacto_Riesgo) == 'BAJO')
            riesgos_medios = sum(1 for r in riesgos if calcular_nivel_riesgo(r.Probabilidad_Riesgo, r.Impacto_Riesgo) == 'MEDIO')
            riesgos_altos = sum(1 for r in riesgos if calcular_nivel_riesgo(r.Probabilidad_Riesgo, r.Impacto_Riesgo) == 'ALTO')
            
            # Calcular score de salud (0-100, donde 100 es mejor)
            score = max(0, 100 - (riesgos_altos * 30 + riesgos_medios * 15))
            
            health = {
                'low': round((riesgos_bajos / total_riesgos) * 100, 1),
                'medium': round((riesgos_medios / total_riesgos) * 100, 1),
                'high': round((riesgos_altos / total_riesgos) * 100, 1),
                'score': round(score, 1)
            }
        else:
            health = {
                'low': 0,
                'medium': 0,
                'high': 0,
                'score': 100
            }
        
        return jsonify({
            'cells': cells,
            'health': health
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@riesgos_bp.route('/alter-table-nombre', methods=['POST'])
@admin_required
def alter_table_nombre(current_user):
    """Endpoint temporal para alterar el campo Nombre de riesgos a TEXT"""
    try:
        # Paso 1: Obtener todos los índices que usan la columna Nombre
        indices = db.session.execute(text("""
            SELECT DISTINCT INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'riesgos'
            AND COLUMN_NAME = 'Nombre'
            AND INDEX_NAME != 'PRIMARY'
        """)).fetchall()
        
        indices_eliminados = []
        
        # Paso 2: Eliminar cada índice que use la columna Nombre
        for idx in indices:
            index_name = idx[0]
            try:
                db.session.execute(text(f"ALTER TABLE riesgos DROP INDEX `{index_name}`"))
                indices_eliminados.append(index_name)
            except Exception as e:
                # Si el índice no existe o ya fue eliminado, continuar
                pass
        
        db.session.commit()
        
        # Paso 3: Ahora alterar la columna a TEXT
        db.session.execute(text("""
            ALTER TABLE riesgos 
            MODIFY COLUMN Nombre TEXT NOT NULL
        """))
        
        # Asegurar que Descripcion sea TEXT
        db.session.execute(text("""
            ALTER TABLE riesgos 
            MODIFY COLUMN Descripcion TEXT
        """))
        
        db.session.commit()
        
        mensaje = 'Tabla riesgos alterada exitosamente. Campo Nombre ahora es TEXT (sin limite de longitud)'
        if indices_eliminados:
            mensaje += f'. Indices eliminados: {", ".join(indices_eliminados)}'
        
        return jsonify({
            'success': True,
            'message': mensaje,
            'indices_eliminados': indices_eliminados
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error("Error en alter_table_nombre: %s", str(e), exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

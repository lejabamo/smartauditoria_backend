from flask import Blueprint, request, jsonify
from ..models import db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from datetime import datetime
from ..auth.decorators import consultant_required, write_required
from ..utils.logger import get_logger

logger = get_logger(__name__)
controles_evaluacion_bp = Blueprint('controles_evaluacion', __name__)

@controles_evaluacion_bp.route('/guardar-controles-evaluacion', methods=['POST'])
@consultant_required
@write_required
def guardar_controles_evaluacion():
    """Guardar los controles aplicados en una evaluación de riesgo"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['id_evaluacion_riesgo_activo', 'controles']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        id_evaluacion = data['id_evaluacion_riesgo_activo']
        controles = data['controles']
        
        # Verificar que la evaluación existe
        evaluacion = db.session.execute(
            text('SELECT id_evaluacion_riesgo_activo FROM evaluacion_riesgo_activo WHERE id_evaluacion_riesgo_activo = :id'),
            {'id': id_evaluacion}
        ).fetchone()
        
        if not evaluacion:
            return jsonify({'error': 'Evaluación no encontrada'}), 404
        
        # Eliminar controles existentes para esta evaluación
        db.session.execute(
            text('DELETE FROM riesgocontrolaplicado WHERE id_evaluacion_riesgo_activo = :id'),
            {'id': id_evaluacion}
        )
        
        # Insertar nuevos controles
        for control in controles:
            control_id = control.get('ID_Control') or control.get('id')
            justificacion = control.get('justificacion', '')
            eficacia = control.get('eficacia', 'Media')
            
            # Obtener ID de calificación de eficacia
            calif_eficacia = db.session.execute(
                text('SELECT ID_CalificacionEficacia FROM calificacioneficaciacontrol WHERE Nombre_Calificacion = :nombre'),
                {'nombre': eficacia}
            ).fetchone()
            
            calif_id = calif_eficacia[0] if calif_eficacia else None
            
            db.session.execute(
                text("""
                    INSERT INTO riesgocontrolaplicado 
                    (id_evaluacion_riesgo_activo, ID_Control, justificacion_aplicacion_control, 
                     id_calificacion_eficacia_esperada, efectividad_real_observada, Fecha_Aplicacion_Control)
                    VALUES (:eval_id, :control_id, :justificacion, :calif_id, :eficacia, :fecha)
                """),
                {
                    'eval_id': id_evaluacion,
                    'control_id': control_id,
                    'justificacion': justificacion,
                    'calif_id': calif_id,
                    'eficacia': eficacia,
                    'fecha': datetime.now().date()
                }
            )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Controles guardados exitosamente',
            'id_evaluacion': id_evaluacion,
            'controles_guardados': len(controles)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error("Error guardando controles: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@controles_evaluacion_bp.route('/obtener-controles-por-evaluacion/<int:evaluacion_id>', methods=['GET'])
def obtener_controles_por_evaluacion(evaluacion_id):
    """Obtener los controles aplicados en una evaluación específica"""
    try:
        sql = text("""
            SELECT 
                c.ID_Control,
                c.Nombre,
                c.Descripcion,
                c.Tipo_Control,
                c.categoria_control_iso,
                c.codigo_control_iso,
                rca.justificacion_aplicacion_control,
                rca.efectividad_real_observada,
                rca.Fecha_Aplicacion_Control,
                rca.id_riesgo_control_aplicado
            FROM riesgocontrolaplicado rca
            JOIN controles c ON rca.ID_Control = c.ID_Control
            WHERE rca.id_evaluacion_riesgo_activo = :eval_id
            ORDER BY rca.Fecha_Aplicacion_Control DESC
        """)
        
        rows = db.session.execute(sql, {'eval_id': evaluacion_id}).fetchall()
        
        controles = []
        for row in rows:
            controles.append({
                'id': row.ID_Control,
                'nombre': row.Nombre,
                'descripcion': row.Descripcion,
                'tipo': row.Tipo_Control,
                'categoria': row.categoria_control_iso,
                'codigo_iso': row.codigo_control_iso,
                'justificacion': row.justificacion_aplicacion_control,
                'eficacia': row.efectividad_real_observada,
                'fecha_aplicacion': row.Fecha_Aplicacion_Control.isoformat() if row.Fecha_Aplicacion_Control else None,
                'id_relacion': row.id_riesgo_control_aplicado
            })
        
        return jsonify({'controles': controles}), 200
        
    except Exception as e:
        logger.error("Error obteniendo controles: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@controles_evaluacion_bp.route('/obtener-controles-usados', methods=['GET'])
def obtener_controles_usados():
    """Obtener todos los controles que han sido utilizados históricamente"""
    try:
        sql = text("""
            SELECT DISTINCT
                c.ID_Control,
                c.Nombre,
                c.Descripcion,
                c.Tipo_Control,
                c.categoria_control_iso,
                c.codigo_control_iso,
                COUNT(rca.id_riesgo_control_aplicado) as veces_usado
            FROM controles c
            JOIN riesgocontrolaplicado rca ON c.ID_Control = rca.ID_Control
            GROUP BY c.ID_Control, c.Nombre, c.Descripcion, c.Tipo_Control, c.categoria_control_iso, c.codigo_control_iso
            ORDER BY veces_usado DESC
        """)
        
        rows = db.session.execute(sql).fetchall()
        
        controles = []
        for row in rows:
            controles.append({
                'id': row.ID_Control,
                'nombre': row.Nombre,
                'descripcion': row.Descripcion,
                'tipo': row.Tipo_Control,
                'categoria': row.categoria_control_iso,
                'codigo_iso': row.codigo_control_iso,
                'veces_usado': row.veces_usado
            })
        
        return jsonify({'controles': controles}), 200
        
    except Exception as e:
        logger.error("Error obteniendo controles usados: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500

@controles_evaluacion_bp.route('/obtener-controles-por-riesgo/<int:riesgo_id>', methods=['GET'])
def obtener_controles_por_riesgo(riesgo_id):
    """Obtener controles usados para un riesgo específico a través de todas sus evaluaciones"""
    try:
        sql = text("""
            SELECT DISTINCT
                c.ID_Control,
                c.Nombre,
                c.Descripcion,
                c.Tipo_Control,
                c.categoria_control_iso,
                c.codigo_control_iso,
                rca.justificacion_aplicacion_control,
                rca.efectividad_real_observada,
                a.Nombre as activo_nombre,
                era.fecha_evaluacion_residual,
                era.fecha_evaluacion_inherente
            FROM riesgocontrolaplicado rca
            JOIN controles c ON rca.ID_Control = c.ID_Control
            JOIN evaluacion_riesgo_activo era ON rca.id_evaluacion_riesgo_activo = era.id_evaluacion_riesgo_activo
            JOIN activos a ON era.ID_Activo = a.ID_Activo
            WHERE era.ID_Riesgo = :riesgo_id
            ORDER BY rca.Fecha_Aplicacion_Control DESC, c.Nombre
        """)
        
        rows = db.session.execute(sql, {'riesgo_id': riesgo_id}).fetchall()
        
        controles = []
        for row in rows:
            controles.append({
                'id': row.ID_Control,
                'nombre': row.Nombre,
                'descripcion': row.Descripcion,
                'tipo': row.Tipo_Control,
                'categoria': row.categoria_control_iso,
                'codigo_iso': row.codigo_control_iso,
                'justificacion': row.justificacion_aplicacion_control,
                'eficacia': row.efectividad_real_observada,
                'activo': row.activo_nombre,
                'fecha_evaluacion': (row.fecha_evaluacion_residual or row.fecha_evaluacion_inherente).isoformat() if (row.fecha_evaluacion_residual or row.fecha_evaluacion_inherente) else None
            })
        
        return jsonify({'controles': controles}), 200
        
    except Exception as e:
        logger.error("Error obteniendo controles por riesgo: %s", str(e), exc_info=True)
        return jsonify({'error': str(e)}), 500








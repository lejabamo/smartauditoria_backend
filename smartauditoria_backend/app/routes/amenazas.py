from flask import Blueprint, request, jsonify
from ..models import db, Riesgo
from sqlalchemy import text, func, distinct
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

amenazas_bp = Blueprint('amenazas', __name__)

@amenazas_bp.route('/', methods=['GET'])
def get_amenazas():
    """Obtener amenazas desde la base de datos (extraídas de riesgos)"""
    try:
        # Extraer amenazas únicas de los nombres de riesgos
        # Las amenazas están en el campo Nombre de la tabla riesgos
        amenazas_result = db.session.execute(
            text("""
                SELECT DISTINCT 
                    r.Nombre as amenaza,
                    COUNT(DISTINCT r.ID_Riesgo) as frecuencia,
                    GROUP_CONCAT(DISTINCT r.tipo_riesgo) as categorias
                FROM riesgos r
                WHERE r.Nombre IS NOT NULL AND r.Nombre != ''
                GROUP BY r.Nombre
                ORDER BY frecuencia DESC, r.Nombre ASC
                LIMIT 100
            """)
        ).fetchall()
        
        amenazas = []
        for row in amenazas_result:
            amenazas.append({
                'nombre': row.amenaza,
                'frecuencia': row.frecuencia,
                'categorias': row.categorias.split(',') if row.categorias else []
            })
        
        return jsonify(amenazas), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@amenazas_bp.route('/buscar', methods=['GET'])
def buscar_amenazas():
    """Buscar amenazas por texto"""
    try:
        search = request.args.get('search', '')
        limit = request.args.get('limit', 20, type=int)
        
        if not search or len(search) < 2:
            return jsonify([]), 200
        
        amenazas_result = db.session.execute(
            text("""
                SELECT DISTINCT 
                    r.Nombre as amenaza,
                    COUNT(DISTINCT r.ID_Riesgo) as frecuencia
                FROM riesgos r
                WHERE r.Nombre LIKE :search
                GROUP BY r.Nombre
                ORDER BY frecuencia DESC, r.Nombre ASC
                LIMIT :limit
            """),
            {'search': f'%{search}%', 'limit': limit}
        ).fetchall()
        
        amenazas = [row.amenaza for row in amenazas_result]
        return jsonify(amenazas), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@amenazas_bp.route('/crear', methods=['POST'])
def crear_amenaza():
    """Crear una nueva amenaza (como riesgo) si no existe"""
    try:
        data = request.get_json()
        nombre_amenaza = data.get('nombre', '').strip()
        descripcion = data.get('descripcion', '')
        tipo_riesgo = data.get('tipo_riesgo', 'Tecnológico')
        
        if not nombre_amenaza:
            return jsonify({'error': 'El nombre de la amenaza es requerido'}), 400
        
        # Verificar si ya existe un riesgo con este nombre
        riesgo_existente = Riesgo.query.filter(
            func.lower(Riesgo.Nombre) == nombre_amenaza.lower()
        ).first()
        
        if riesgo_existente:
            return jsonify({
                'success': True,
                'amenaza': nombre_amenaza,
                'id_riesgo': riesgo_existente.ID_Riesgo,
                'mensaje': 'La amenaza ya existe'
            }), 200
        
        # Crear nuevo riesgo (amenaza)
        nuevo_riesgo = Riesgo(
            Nombre=nombre_amenaza,
            Descripcion=descripcion or f'Amenaza: {nombre_amenaza}',
            tipo_riesgo=tipo_riesgo,
            Estado_Riesgo_General='Identificado',
            Fecha_Identificacion=datetime.now().date()
        )
        
        db.session.add(nuevo_riesgo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'amenaza': nombre_amenaza,
            'id_riesgo': nuevo_riesgo.ID_Riesgo,
            'mensaje': 'Amenaza creada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


from flask import Blueprint, request, jsonify
from ..models import db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

vulnerabilidades_bp = Blueprint('vulnerabilidades', __name__)

@vulnerabilidades_bp.route('/', methods=['GET'])
def get_vulnerabilidades():
    """Obtener vulnerabilidades con filtros y búsqueda inteligente"""
    try:
        # Parámetros de búsqueda
        search = request.args.get('search', '')
        categoria = request.args.get('categoria', '')
        severidad = request.args.get('severidad', '')
        # Si no hay búsqueda específica, permitir cargar todas (o muchas) para el autocomplete
        limit = request.args.get('limit', 1000 if not search else 50, type=int)
        
        # Primero verificar qué columnas existen en la tabla
        try:
            # Intentar obtener información de la tabla
            table_info = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'vulnerabilidades'
            """)).fetchall()
            columnas_disponibles = [col[0] for col in table_info]
            tiene_categoria = 'categoria' in columnas_disponibles
        except:
            # Si no se puede verificar, asumir que no tiene categoria
            tiene_categoria = False
        
        # Construir consulta base según columnas disponibles
        if tiene_categoria:
            query = """
            SELECT id_vulnerabilidad, nombre, descripcion, categoria, severidad, 
                   cve_referencia, descripcion_tecnica, impacto_potencial, controles_recomendados
            FROM vulnerabilidades 
            WHERE 1=1
            """
        else:
            # Si no tiene categoria, usar NULL o valor por defecto
            query = """
            SELECT id_vulnerabilidad, nombre, descripcion, NULL as categoria, severidad, 
                   cve_referencia, descripcion_tecnica, impacto_potencial, controles_recomendados
            FROM vulnerabilidades 
            WHERE 1=1
            """
        
        params = {}
        
        # Filtro de búsqueda inteligente
        if search:
            query += """
            AND (
                nombre LIKE :search OR 
                descripcion LIKE :search OR 
                COALESCE(descripcion_tecnica, '') LIKE :search OR
                COALESCE(impacto_potencial, '') LIKE :search OR
                COALESCE(controles_recomendados, '') LIKE :search
            )
            """
            params['search'] = f'%{search}%'
        
        # Filtro por categoría (solo si la columna existe)
        if categoria and tiene_categoria:
            query += " AND categoria = :categoria"
            params['categoria'] = categoria
        
        # Filtro por severidad
        if severidad:
            query += " AND severidad = :severidad"
            params['severidad'] = severidad
        
        query += " ORDER BY COALESCE(severidad, '') DESC, nombre ASC LIMIT :limit"
        params['limit'] = limit
        
        result = db.session.execute(text(query), params)
        vulnerabilidades = []
        
        for row in result:
            vulnerabilidades.append({
                'id_vulnerabilidad': row.id_vulnerabilidad,
                'nombre': row.nombre,
                'descripcion': row.descripcion,
                'categoria': row.categoria if tiene_categoria else 'Tecnológica',  # Valor por defecto
                'severidad': row.severidad,
                'cve_referencia': row.cve_referencia,
                'descripcion_tecnica': row.descripcion_tecnica,
                'impacto_potencial': row.impacto_potencial,
                'controles_recomendados': row.controles_recomendados
            })
        
        return jsonify(vulnerabilidades), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@vulnerabilidades_bp.route('/categorias', methods=['GET'])
def get_categorias():
    """Obtener lista de categorías de vulnerabilidades"""
    try:
        # Verificar si la columna categoria existe
        try:
            table_info = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'vulnerabilidades'
                AND COLUMN_NAME = 'categoria'
            """)).fetchone()
            tiene_categoria = table_info is not None
        except:
            tiene_categoria = False
        
        if tiene_categoria:
            query = "SELECT DISTINCT categoria FROM vulnerabilidades WHERE categoria IS NOT NULL ORDER BY categoria"
            result = db.session.execute(text(query))
            categorias = [row.categoria for row in result if row.categoria]
        else:
            # Retornar categorías por defecto si la columna no existe
            categorias = ['Tecnológica', 'Autenticación', 'Autorización', 'Red', 'Software', 'Aplicación', 'Datos', 'Configuración', 'Monitoreo', 'Respaldo']
        
        return jsonify(categorias), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vulnerabilidades_bp.route('/severidades', methods=['GET'])
def get_severidades():
    """Obtener lista de severidades de vulnerabilidades"""
    try:
        query = "SELECT DISTINCT severidad FROM vulnerabilidades ORDER BY FIELD(severidad, 'Crítica', 'Alta', 'Media', 'Baja')"
        result = db.session.execute(text(query))
        severidades = [row.severidad for row in result if row.severidad]
        return jsonify(severidades), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vulnerabilidades_bp.route('/sugerencias', methods=['GET'])
def get_sugerencias():
    """Obtener sugerencias predictivas basadas en texto de entrada"""
    try:
        texto = request.args.get('texto', '')
        if not texto or len(texto) < 2:
            return jsonify([]), 200
        
        # Verificar si tiene columna categoria
        try:
            table_info = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'vulnerabilidades'
                AND COLUMN_NAME = 'categoria'
            """)).fetchone()
            tiene_categoria = table_info is not None
        except:
            tiene_categoria = False
        
        # Búsqueda inteligente con ranking por relevancia
        if tiene_categoria:
            query = """
            SELECT id_vulnerabilidad, nombre, descripcion, categoria, severidad,
                   (
                       CASE WHEN nombre LIKE :contains_match THEN 4
                            WHEN nombre LIKE :start_match THEN 3
                            WHEN descripcion LIKE :start_match THEN 2
                            WHEN descripcion LIKE :contains_match THEN 1
                            ELSE 0
                       END
                   ) as relevancia
            FROM vulnerabilidades 
            WHERE (
                nombre LIKE :contains_match OR 
                descripcion LIKE :contains_match OR
                COALESCE(descripcion_tecnica, '') LIKE :contains_match
            )
            ORDER BY relevancia DESC, COALESCE(severidad, '') DESC, nombre ASC
            LIMIT 10
            """
        else:
            query = """
            SELECT id_vulnerabilidad, nombre, descripcion, NULL as categoria, severidad,
                   (
                       CASE WHEN nombre LIKE :contains_match THEN 4
                            WHEN nombre LIKE :start_match THEN 3
                            WHEN descripcion LIKE :start_match THEN 2
                            WHEN descripcion LIKE :contains_match THEN 1
                            ELSE 0
                       END
                   ) as relevancia
            FROM vulnerabilidades 
            WHERE (
                nombre LIKE :contains_match OR 
                descripcion LIKE :contains_match OR
                COALESCE(descripcion_tecnica, '') LIKE :contains_match
            )
            ORDER BY relevancia DESC, COALESCE(severidad, '') DESC, nombre ASC
            LIMIT 10
            """
        
        params = {
            'start_match': f'{texto}%',
            'contains_match': f'%{texto}%'
        }
        
        result = db.session.execute(text(query), params)
        sugerencias = []
        
        for row in result:
            sugerencias.append({
                'id_vulnerabilidad': row.id_vulnerabilidad,
                'nombre': row.nombre,
                'descripcion': row.descripcion,
                'categoria': row.categoria if tiene_categoria else 'Tecnológica',
                'severidad': row.severidad,
                'relevancia': row.relevancia
            })
        
        return jsonify(sugerencias), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@vulnerabilidades_bp.route('/crear', methods=['POST'])
def crear_vulnerabilidad():
    """Crear una nueva vulnerabilidad si no existe"""
    try:
        data = request.get_json()
        nombre = data.get('nombre', '').strip()
        descripcion = data.get('descripcion', '')
        categoria = data.get('categoria', 'Tecnológica')
        severidad = data.get('severidad', 'Media')
        
        if not nombre:
            return jsonify({'error': 'El nombre de la vulnerabilidad es requerido'}), 400
        
        # Verificar si ya existe
        vulnerabilidad_existente = db.session.execute(
            text("""
                SELECT id_vulnerabilidad, nombre 
                FROM vulnerabilidades 
                WHERE LOWER(nombre) = LOWER(:nombre)
                LIMIT 1
            """),
            {'nombre': nombre}
        ).fetchone()
        
        if vulnerabilidad_existente:
            return jsonify({
                'success': True,
                'vulnerabilidad': nombre,
                'id_vulnerabilidad': vulnerabilidad_existente.id_vulnerabilidad,
                'mensaje': 'La vulnerabilidad ya existe'
            }), 200
        
        # Crear nueva vulnerabilidad
        db.session.execute(
            text("""
                INSERT INTO vulnerabilidades 
                (nombre, descripcion, categoria, severidad, fecha_creacion, fecha_actualizacion)
                VALUES (:nombre, :descripcion, :categoria, :severidad, NOW(), NOW())
            """),
            {
                'nombre': nombre,
                'descripcion': descripcion or f'Vulnerabilidad: {nombre}',
                'categoria': categoria,
                'severidad': severidad
            }
        )
        
        db.session.commit()
        
        # Obtener el ID de la vulnerabilidad creada
        nueva_vuln = db.session.execute(
            text("""
                SELECT id_vulnerabilidad, nombre 
                FROM vulnerabilidades 
                WHERE LOWER(nombre) = LOWER(:nombre)
                LIMIT 1
            """),
            {'nombre': nombre}
        ).fetchone()
        
        return jsonify({
            'success': True,
            'vulnerabilidad': nombre,
            'id_vulnerabilidad': nueva_vuln.id_vulnerabilidad,
            'mensaje': 'Vulnerabilidad creada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500




















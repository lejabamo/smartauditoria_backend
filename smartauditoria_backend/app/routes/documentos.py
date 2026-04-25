from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
from ..models.documentos import DocumentoAdjunto
from app.auth.decorators import require_auth
import mimetypes

documentos_bp = Blueprint('documentos', __name__)

# Configuración de archivos permitidos
ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff',
    'txt', 'csv', 'zip', 'rar'
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_size(file):
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset to beginning
    return size

@documentos_bp.route('/api/documentos/subir', methods=['POST'])
@require_auth
def subir_documento(current_user):
    try:
        # Verificar que se envió un archivo
        if 'archivo' not in request.files:
            return jsonify({'error': 'No se envió ningún archivo'}), 400
        
        archivo = request.files['archivo']
        if archivo.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        # Obtener datos adicionales
        accion_id = request.form.get('accionId')
        descripcion = request.form.get('descripcion', '')
        
        if not accion_id:
            return jsonify({'error': 'ID de acción es requerido'}), 400
        
        # Verificar tipo de archivo
        if not allowed_file(archivo.filename):
            return jsonify({'error': 'Tipo de archivo no permitido'}), 400
        
        # Verificar tamaño
        archivo.seek(0)
        tamaño = get_file_size(archivo)
        if tamaño > MAX_FILE_SIZE:
            return jsonify({'error': 'El archivo es demasiado grande (máximo 10MB)'}), 400
        
        # Generar nombre único para el archivo
        nombre_original = secure_filename(archivo.filename)
        extension = nombre_original.rsplit('.', 1)[1].lower()
        nombre_archivo = f"{uuid.uuid4()}.{extension}"
        
        # Crear directorio si no existe
        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'documentos')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Guardar archivo
        ruta_archivo = os.path.join(upload_folder, nombre_archivo)
        archivo.save(ruta_archivo)
        
        # Obtener tipo MIME
        tipo_mime, _ = mimetypes.guess_type(nombre_original)
        if not tipo_mime:
            tipo_mime = 'application/octet-stream'
        
        # Crear registro en base de datos
        documento = DocumentoAdjunto.crear_documento(
            accion_id=accion_id,
            nombre_original=nombre_original,
            nombre_archivo=nombre_archivo,
            tipo_mime=tipo_mime,
            tamaño_bytes=tamaño,
            ruta_archivo=ruta_archivo,
            descripcion=descripcion,
            subido_por=current_user.id_usuario_auth
        )
        
        return jsonify({
            'message': 'Documento subido exitosamente',
            'documento': documento.to_dict()
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error al subir documento: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@documentos_bp.route('/api/documentos/accion/<accion_id>', methods=['GET'])
@require_auth
def obtener_documentos_accion(current_user, accion_id):
    try:
        documentos = DocumentoAdjunto.obtener_por_accion(accion_id)
        return jsonify([doc.to_dict() for doc in documentos]), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener documentos: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@documentos_bp.route('/api/documentos/descargar/<int:documento_id>', methods=['GET'])
@require_auth
def descargar_documento(current_user, documento_id):
    try:
        documento = DocumentoAdjunto.obtener_por_id(documento_id)
        if not documento:
            return jsonify({'error': 'Documento no encontrado'}), 404
        
        # Verificar que el archivo existe
        if not os.path.exists(documento.ruta_archivo):
            return jsonify({'error': 'Archivo no encontrado en el servidor'}), 404
        
        return send_file(
            documento.ruta_archivo,
            as_attachment=True,
            download_name=documento.nombre_original,
            mimetype=documento.tipo_mime
        )
        
    except Exception as e:
        current_app.logger.error(f"Error al descargar documento: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@documentos_bp.route('/api/documentos/<int:documento_id>', methods=['DELETE'])
@require_auth
def eliminar_documento(current_user, documento_id):
    try:
        documento = DocumentoAdjunto.obtener_por_id(documento_id)
        if not documento:
            return jsonify({'error': 'Documento no encontrado'}), 404
        
        # Verificar permisos (opcional: solo el que subió puede eliminar)
        if documento.subido_por != current_user.id_usuario_auth:
            return jsonify({'error': 'No tienes permisos para eliminar este documento'}), 403
        
        # Eliminar archivo físico
        try:
            if os.path.exists(documento.ruta_archivo):
                os.remove(documento.ruta_archivo)
        except Exception as e:
            current_app.logger.warning(f"No se pudo eliminar archivo físico: {str(e)}")
        
        # Marcar como inactivo en base de datos
        DocumentoAdjunto.eliminar_documento(documento_id)
        
        return jsonify({'message': 'Documento eliminado exitosamente'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al eliminar documento: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@documentos_bp.route('/api/documentos/info/<int:documento_id>', methods=['GET'])
@require_auth
def obtener_info_documento(current_user, documento_id):
    try:
        documento = DocumentoAdjunto.obtener_por_id(documento_id)
        if not documento:
            return jsonify({'error': 'Documento no encontrado'}), 404
        
        return jsonify(documento.to_dict()), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al obtener información del documento: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

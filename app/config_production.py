import os
from .config import Config

class ProductionConfig(Config):
    """Configuración optimizada para producción"""
    
    # Desactivar debug en producción
    DEBUG = False
    TESTING = False
    
    # Configuración de base de datos optimizada para producción
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
        'pool_size': 20,  # Pool más grande para producción
        'max_overflow': 40,  # Más conexiones adicionales
        'pool_timeout': 30,
        'connect_args': {
            'charset': 'utf8mb4',
            'use_unicode': True,
            'autocommit': True,
            'connect_timeout': 10,
        }
    }
    
    # Configuración de compresión
    COMPRESS_MIMETYPES = [
        'text/html',
        'text/css',
        'text/xml',
        'application/json',
        'application/javascript',
        'text/javascript',
    ]
    COMPRESS_LEVEL = 6
    COMPRESS_MIN_SIZE = 500
    
    # Configuración de seguridad
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Límites de contenido
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB



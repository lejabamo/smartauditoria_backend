import os
from dotenv import load_dotenv

# Cargar el archivo .env desde la raíz del proyecto
basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    
    # Configuración de base de datos desde variables de entorno
    # Si DATABASE_URL está definido, usarlo (para SQLite)
    # Si no, usar configuración MySQL
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    if DATABASE_URL:
        # Usar SQLite si DATABASE_URL está configurado
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        # Configuración MySQL por defecto
        DB_USER = os.environ.get('DB_USER', 'root')
        DB_PASSWORD = os.environ.get('DB_PASSWORD', 'toor')
        DB_HOST = os.environ.get('DB_HOST', 'localhost')
        DB_PORT = os.environ.get('DB_PORT', '3306')
        DB_NAME = os.environ.get('DB_NAME', 'sgri')
        
        # Construir la URI de la base de datos MySQL
        SQLALCHEMY_DATABASE_URI = f'mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?auth_plugin=mysql_native_password&charset=utf8mb4'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configuración adicional para UTF-8 y optimización de pool de conexiones
    # Opciones de engine para SQLAlchemy (compatibles con mysql-connector-python)
    # Se evitan parámetros no soportados como read_timeout / write_timeout.
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
        'pool_size': 10,
        'max_overflow': 20,
        'pool_timeout': 30,
    }
    
    # Configuración para archivos
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB máximo
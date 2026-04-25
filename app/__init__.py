from flask import Flask, request, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_compress import Compress
from .config import Config  # Usar MySQL

db = SQLAlchemy()
compress = Compress()

def create_app(config=None):
    app = Flask(__name__)
    # Usar configuración proporcionada o la por defecto
    config_class = config if config else Config
    app.config.from_object(config_class)

    # Configuración UTF-8
    app.config['JSON_AS_ASCII'] = False
    app.config['MYSQL_CHARSET'] = 'utf8mb4'
    app.config['MYSQL_COLLATION'] = 'utf8mb4_unicode_ci'
    
    # Deshabilitar redirect automático de trailing slashes para evitar problemas CORS
    app.url_map.strict_slashes = False

    # Inicializar compresión
    compress.init_app(app)
    
    db.init_app(app)
    
    # Configuración CORS - más permisiva en desarrollo
    import os
    is_production = os.environ.get('FLASK_ENV') == 'production'
    
    if is_production:
        # En producción, CORS restrictivo
        cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
        CORS(app, 
             origins=cors_origins,
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization'],
             supports_credentials=True)
    else:
        # En desarrollo, permitir todos los orígenes (solo para desarrollo)
        # Flask-CORS maneja los headers automáticamente, NO agregar manualmente
        CORS(app, 
             origins="*",
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization'],
             supports_credentials=False)  # No se puede usar credentials con "*"
    
    # NO agregar before_request para CORS, Flask-CORS ya lo maneja
    # Esto evita headers duplicados que causan "Multiple CORS header not allowed"
    
    # Headers de caché y optimización para respuestas estáticas
    # NO agregar headers CORS aquí, Flask-CORS ya los maneja automáticamente
    @app.after_request
    def add_cache_headers(response):
        # Caché para respuestas GET exitosas (5 minutos)
        if request.method == 'GET' and response.status_code == 200:
            # No cachear endpoints de autenticación o datos dinámicos
            if not any(path in request.path for path in ['/api/auth', '/api/dashboard', '/api/predictive']):
                response.cache_control.max_age = 300
                response.cache_control.public = True
        # Headers de seguridad y optimización
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        return response

    # Importar modelos después de inicializar db
    with app.app_context():
        from . import models

    # Importar y registrar blueprints aquí
    # Autenticación (sin prefijo para endpoints básicos)
    from .auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Rutas protegidas
    from .routes.activos import activos_bp
    app.register_blueprint(activos_bp, url_prefix='/api/activos')

    from .routes.riesgos import riesgos_bp
    app.register_blueprint(riesgos_bp, url_prefix='/api/riesgos')

    from .routes.incidentes import incidentes_bp
    app.register_blueprint(incidentes_bp, url_prefix='/api/incidentes')

    from .routes.usuarios import usuarios_bp
    app.register_blueprint(usuarios_bp, url_prefix='/api/usuarios')

    from .routes.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    from .routes.vulnerabilidades import vulnerabilidades_bp
    app.register_blueprint(vulnerabilidades_bp, url_prefix='/api/vulnerabilidades')
    
    from .routes.amenazas import amenazas_bp
    app.register_blueprint(amenazas_bp, url_prefix='/api/amenazas')

    # REGISTRO V2 RAG ENGINE (AMO AUDITOR)
    from .routes.ia_v2 import ia_v2_bp
    app.register_blueprint(ia_v2_bp, url_prefix='/api/v2/ia')

    # Rutas del sistema predictivo
    from .routes.predictive import register_predictive_routes
    register_predictive_routes(app)
    
    # Rutas de predicción de texto
    from .routes.predictive_text import predictive_text_bp
    app.register_blueprint(predictive_text_bp, url_prefix='/api/predictive')
    
    # Rutas de sugerencias ISO
    from .routes.iso_suggestions import iso_suggestions_bp
    app.register_blueprint(iso_suggestions_bp, url_prefix='/api/iso')
    
    # Rutas de controles de evaluación
    from .routes.controles_evaluacion import controles_evaluacion_bp
    app.register_blueprint(controles_evaluacion_bp, url_prefix='/api/controles-evaluacion')

    # Rutas de evaluación de riesgos (Corrigiendo 404 Crítico)
    from .routes.evaluacion_riesgos import evaluacion_riesgos_bp
    app.register_blueprint(evaluacion_riesgos_bp, url_prefix='/api/evaluacion-riesgos')


    # Ruta de prueba para verificar que el servidor está funcionando
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'ok', 'message': 'SGRI API is running'}

    # Ruta raíz
    @app.route('/', methods=['GET'])
    def root():
        return {'status': 'ok', 'message': 'SGRI Backend API is running', 'version': '1.0.0'}

    return app
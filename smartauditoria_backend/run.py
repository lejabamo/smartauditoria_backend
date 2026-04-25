import os
from app import create_app

# Determinar configuración según entorno
config_name = os.environ.get('FLASK_ENV', 'development')
if config_name == 'production':
    from app.config_production import ProductionConfig
    app = create_app(config=ProductionConfig)
else:
    app = create_app()

if __name__ == '__main__':
    # En desarrollo, usar el servidor de desarrollo de Flask
    # En producción, usar: gunicorn -c gunicorn_config.py 'run:app'
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(
        debug=debug_mode,
        host=os.environ.get('FLASK_HOST', '0.0.0.0'),
        port=int(os.environ.get('FLASK_PORT', 5000)),
        threaded=True
    ) 
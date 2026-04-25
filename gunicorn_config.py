"""
Configuración de Gunicorn para producción
Uso: gunicorn -c gunicorn_config.py 'app:create_app()'
"""

import multiprocessing
import os

# Configuración del servidor
bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:5000')
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5

# Configuración de logging
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Configuración de procesos
preload_app = True
max_requests = 1000
max_requests_jitter = 50

# Configuración de threads (si se usa worker_class = 'gthread')
threads = 2

# Configuración de seguridad
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

def on_starting(server):
    """Callback cuando el servidor inicia"""
    server.log.info("Iniciando servidor Gunicorn en modo producción")

def on_reload(server):
    """Callback cuando se recarga el servidor"""
    server.log.info("Recargando servidor Gunicorn")

def worker_int(worker):
    """Callback cuando un worker recibe SIGINT o SIGQUIT"""
    worker.log.info("Worker recibió señal de interrupción")

def pre_fork(server, worker):
    """Callback antes de crear un worker"""
    pass

def post_fork(server, worker):
    """Callback después de crear un worker"""
    server.log.info(f"Worker {worker.pid} iniciado")

def post_worker_init(worker):
    """Callback después de inicializar un worker"""
    pass

def worker_abort(worker):
    """Callback cuando un worker aborta"""
    worker.log.info(f"Worker {worker.pid} abortado")



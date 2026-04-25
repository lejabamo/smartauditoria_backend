FROM python:3.12-slim

WORKDIR /app

# Dependencias del sistema para MariaDB y Gunicorn
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Variables de entorno por defecto
ENV FLASK_APP=run.py
ENV FLASK_ENV=development
ENV FLASK_HOST=0.0.0.0
ENV FLASK_PORT=5000

EXPOSE 5000

# Script de arranque (podría incluir migraciones si fuera necesario)
CMD ["python", "run.py"]

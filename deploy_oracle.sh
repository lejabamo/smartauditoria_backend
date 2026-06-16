#!/bin/bash
# =============================================================================
# deploy_oracle.sh — Deploy SmartAuditoria ENGINE en VPS Oracle
# VPS: 158.69.114.73
# Ejecutar como: bash deploy_oracle.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
ok()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
fail(){ echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

log "======================================================"
log " SmartAuditoria — Deploy VPS Oracle (Engine + ChromaDB)"
log "======================================================"

# -----------------------------------------------------------------------
# 1. Verificar sistema operativo y recursos
# -----------------------------------------------------------------------
log "Verificando sistema..."
DISK_FREE=$(df / | awk 'NR==2{print $4}')
RAM_FREE=$(free -m | awk '/Mem/{print $7}')
log "Disco libre: ${DISK_FREE}KB | RAM libre: ${RAM_FREE}MB"

if [ "$DISK_FREE" -lt 5000000 ]; then
    warn "Menos de 5GB libres en disco. Procediendo con precaución."
fi

# -----------------------------------------------------------------------
# 2. Instalar Docker si no está instalado
# -----------------------------------------------------------------------
if ! command -v docker &>/dev/null; then
    log "Instalando Docker..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    ok "Docker instalado correctamente"
else
    ok "Docker ya instalado: $(docker --version)"
fi

# -----------------------------------------------------------------------
# 3. Crear directorios de datos persistentes
# -----------------------------------------------------------------------
log "Creando directorios de datos..."
mkdir -p /data/chromadb /data/models /opt/smartauditoria
ok "Directorios creados"

# -----------------------------------------------------------------------
# 4. Clonar o actualizar el repositorio
# -----------------------------------------------------------------------
REPO_DIR="/opt/smartauditoria"
REPO_URL="https://github.com/TU_USUARIO/smartauditoria_project.git"  # CAMBIAR

if [ -d "$REPO_DIR/.git" ]; then
    log "Actualizando repositorio existente..."
    cd "$REPO_DIR"
    git pull origin main
else
    log "Clonando repositorio..."
    # Alternativa: copiar via scp si no hay repo git público
    # Si ya copiaste el código via scp, comentar estas líneas y descomentar la siguiente
    cd /opt
    git clone "$REPO_URL" smartauditoria
fi

cd "$REPO_DIR"

# -----------------------------------------------------------------------
# 5. Configurar variables de entorno de producción
# -----------------------------------------------------------------------
log "Configurando entorno de producción..."

if [ ! -f "./smartauditoria_engine/.env.production" ]; then
    fail ".env.production del engine no encontrado. Cópialo antes de ejecutar este script."
fi

# Verificar que la API KEY fue cambiada
if grep -q "CAMBIAR_CLAVE_SEGURA" ./smartauditoria_engine/.env.production; then
    fail "ERROR: Debes cambiar ENGINE_API_KEY en smartauditoria_engine/.env.production antes de deployar!"
fi
ok "Variables de entorno configuradas"

# -----------------------------------------------------------------------
# 6. Construir y levantar servicios
# -----------------------------------------------------------------------
log "Construyendo imágenes Docker (esto puede tardar 5-10 minutos la primera vez)..."
docker compose -f docker-compose.oracle.yml build --no-cache

log "Levantando servicios..."
docker compose -f docker-compose.oracle.yml up -d

# -----------------------------------------------------------------------
# 7. Esperar a que los servicios estén listos
# -----------------------------------------------------------------------
log "Esperando a que ChromaDB esté listo (max 60s)..."
for i in $(seq 1 12); do
    if docker exec smartauditoria_chroma curl -sf http://localhost:8000/api/v1/heartbeat &>/dev/null; then
        ok "ChromaDB listo"
        break
    fi
    sleep 5
    echo -n "."
done

log "Esperando a que el Engine esté listo (max 120s)..."
for i in $(seq 1 24); do
    if curl -sf http://localhost:8001/health &>/dev/null; then
        ok "Engine listo"
        break
    fi
    sleep 5
    echo -n "."
done

# -----------------------------------------------------------------------
# 8. Ingestar documentos ISO en ChromaDB (solo primera vez)
# -----------------------------------------------------------------------
if docker exec smartauditoria_engine python -c "
import chromadb
c = chromadb.HttpClient(host='vector_db', port=8000)
col = c.get_or_create_collection('iso_documents')
print(col.count())
" 2>/dev/null | grep -q "^0$"; then
    log "ChromaDB vacío. Ingestionando documentos ISO..."
    docker exec smartauditoria_engine python ingest_iso_final.py 2>&1 | tail -20
    ok "Documentos ISO ingestados"
else
    ok "ChromaDB ya tiene documentos. Saltando ingestión."
fi

# -----------------------------------------------------------------------
# 9. Configurar firewall UFW
# -----------------------------------------------------------------------
log "Configurando firewall UFW..."
if command -v ufw &>/dev/null; then
    ufw --force enable
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'Nginx health'
    # Puerto 8001 del engine — SOLO desde IP de SGSRI
    ufw allow from 51.79.35.88 to any port 8001 proto tcp comment 'SmartAuditoria Backend SGSRI'
    ufw deny 8001/tcp
    ufw deny 8000/tcp  # ChromaDB nunca público
    ufw status verbose
    ok "Firewall configurado"
else
    warn "UFW no disponible. Configura el firewall manualmente."
fi

# -----------------------------------------------------------------------
# 10. Verificación final
# -----------------------------------------------------------------------
log "====== VERIFICACIÓN FINAL ======"
echo ""
echo "Estado de contenedores:"
docker compose -f docker-compose.oracle.yml ps
echo ""
echo "Health del engine:"
curl -s http://localhost:8001/health | python3 -m json.tool 2>/dev/null || echo "Engine no responde aún"
echo ""
ok "====== DEPLOY ORACLE COMPLETADO ======"
log "Engine disponible en: http://158.69.114.73:8001"
log "Siguiente paso: Ejecutar deploy_sgsri.sh en el VPS SGSRI"

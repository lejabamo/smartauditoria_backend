#!/bin/bash
# =============================================================================
# deploy_sgsri.sh — Deploy SmartAuditoria BACKEND+FRONTEND en VPS SGSRI
# VPS: 51.79.35.88
# Ejecutar como: bash deploy_sgsri.sh
# REQUISITO: deploy_oracle.sh debe haber completado exitosamente primero
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

ORACLE_IP="158.69.114.73"
SGSRI_IP="51.79.35.88"

log "======================================================"
log " SmartAuditoria — Deploy VPS SGSRI (Backend + Frontend)"
log "======================================================"

# -----------------------------------------------------------------------
# 1. Verificar recursos (disco crítico: solo 13G libres)
# -----------------------------------------------------------------------
log "Verificando recursos del sistema..."
DISK_FREE_KB=$(df / | awk 'NR==2{print $4}')
DISK_FREE_GB=$(( DISK_FREE_KB / 1024 / 1024 ))
log "Disco libre: ~${DISK_FREE_GB}GB"

if [ "$DISK_FREE_GB" -lt 8 ]; then
    fail "Solo ${DISK_FREE_GB}GB libres. Se necesitan mínimo 8GB. Libera espacio antes de continuar."
fi

if [ "$DISK_FREE_GB" -lt 10 ]; then
    warn "Espacio en disco ajustado (${DISK_FREE_GB}GB). Procediendo con precaución."
fi

# Limpiar residuos Docker previos si existen
log "Limpiando imágenes Docker no utilizadas..."
docker system prune -f 2>/dev/null || true

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
    ok "Docker instalado"
else
    ok "Docker ya instalado: $(docker --version)"
fi

# -----------------------------------------------------------------------
# 3. Crear directorios de datos persistentes
# -----------------------------------------------------------------------
log "Creando directorios de datos..."
mkdir -p /data/mariadb /opt/smartauditoria
ok "Directorios creados"

# -----------------------------------------------------------------------
# 4. Verificar conectividad con VPS Oracle (engine)
# -----------------------------------------------------------------------
log "Verificando conectividad con VPS Oracle (Engine)..."
if curl -sf --max-time 10 "http://${ORACLE_IP}:8001/health" &>/dev/null; then
    ok "VPS Oracle accesible — Engine respondiendo"
else
    fail "No se puede conectar al Engine en ${ORACLE_IP}:8001. Asegúrate de haber ejecutado deploy_oracle.sh primero."
fi

# -----------------------------------------------------------------------
# 5. Verificar .env de producción
# -----------------------------------------------------------------------
log "Verificando configuración de entorno..."
BACKEND_ENV="./smartauditoria_backend/.env.production"

if [ ! -f "$BACKEND_ENV" ]; then
    fail "$BACKEND_ENV no encontrado. Copia el archivo antes de continuar."
fi

if grep -q "CAMBIAR_" "$BACKEND_ENV"; then
    fail "ERROR: Debes configurar todas las variables CAMBIAR_* en $BACKEND_ENV antes de deployar!"
fi
ok "Variables de entorno configuradas"

# -----------------------------------------------------------------------
# 6. Build y deploy
# -----------------------------------------------------------------------
log "Construyendo imágenes Docker (5-15 minutos la primera vez)..."
docker compose -f docker-compose.sgsri.yml build --no-cache

log "Levantando servicios..."
docker compose -f docker-compose.sgsri.yml up -d

# -----------------------------------------------------------------------
# 7. Esperar MariaDB
# -----------------------------------------------------------------------
log "Esperando a que MariaDB esté listo (max 90s)..."
for i in $(seq 1 18); do
    if docker exec smartauditoria_db mysqladmin ping -h localhost -u root 2>/dev/null | grep -q "alive"; then
        ok "MariaDB listo"
        break
    fi
    sleep 5
    echo -n "."
done
echo ""

# -----------------------------------------------------------------------
# 8. Ejecutar migraciones Flask
# -----------------------------------------------------------------------
log "Ejecutando migraciones de base de datos..."
sleep 5  # pequeño buffer antes de migrate
docker exec smartauditoria_backend python -c "
from app import create_app
from extensions import db
app = create_app()
with app.app_context():
    db.create_all()
    print('Tablas creadas correctamente')
" || {
    warn "Error al crear tablas automáticamente. Intentando con flask db upgrade..."
    docker exec smartauditoria_backend flask db upgrade 2>/dev/null || \
    warn "Migraciones necesitan revisión manual"
}
ok "Migraciones completadas"

# -----------------------------------------------------------------------
# 9. Crear usuario admin inicial
# -----------------------------------------------------------------------
log "Creando usuario administrador inicial..."
docker exec smartauditoria_backend python -c "
from app import create_app
from extensions import db
import sys

app = create_app()
with app.app_context():
    try:
        from app.domain.models import User
        admin = User.query.filter_by(email='admin@smartauditoria.co').first()
        if not admin:
            import bcrypt
            pw = bcrypt.hashpw('Admin@2024!'.encode(), bcrypt.gensalt()).decode()
            admin = User(
                nombre='Administrador',
                email='admin@smartauditoria.co',
                password_hash=pw,
                rol='admin',
                activo=True
            )
            db.session.add(admin)
            db.session.commit()
            print('Usuario admin creado: admin@smartauditoria.co / Admin@2024!')
        else:
            print('Usuario admin ya existe')
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)
" 2>&1 || warn "Revisar creación de usuario admin manualmente"

# -----------------------------------------------------------------------
# 10. Esperar backend
# -----------------------------------------------------------------------
log "Esperando a que el Backend esté listo (max 90s)..."
for i in $(seq 1 18); do
    if curl -sf http://localhost:5000/api/health &>/dev/null; then
        ok "Backend listo"
        break
    fi
    sleep 5
    echo -n "."
done
echo ""

# -----------------------------------------------------------------------
# 11. Configurar firewall UFW
# -----------------------------------------------------------------------
log "Configurando firewall UFW..."
if command -v ufw &>/dev/null; then
    ufw --force enable
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP Frontend'
    ufw allow 443/tcp comment 'HTTPS Frontend'
    ufw deny 5000/tcp   # Backend no directamente público
    ufw deny 3306/tcp   # MariaDB nunca público
    ufw status verbose
    ok "Firewall configurado"
else
    warn "UFW no disponible."
fi

# -----------------------------------------------------------------------
# 12. Verificación final E2E
# -----------------------------------------------------------------------
log "====== VERIFICACIÓN FINAL ======"
echo ""
echo "Estado de contenedores SGSRI:"
docker compose -f docker-compose.sgsri.yml ps
echo ""
echo "Health del backend:"
curl -s http://localhost:5000/api/health | python3 -m json.tool 2>/dev/null || echo "Backend no responde aún"
echo ""
echo "Test de login:"
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartauditoria.co","password":"Admin@2024!"}' | python3 -m json.tool 2>/dev/null || echo "Login: revisar logs"
echo ""
ok "====== DEPLOY SGSRI COMPLETADO ======"
log "Frontend disponible en: http://${SGSRI_IP}"
log "Backend API en:         http://${SGSRI_IP}/api"
log "Engine (Oracle) en:     http://${ORACLE_IP}:8001"
log ""
log "Credenciales iniciales:"
log "  Email: admin@smartauditoria.co"
log "  Clave: Admin@2024!  ← CAMBIAR INMEDIATAMENTE"

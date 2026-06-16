#!/usr/bin/env pwsh
# =============================================================================
# transfer_to_vps.ps1 — Transferir código SmartAuditoria a ambos VPS
# Ejecutar desde Windows con:  .\transfer_to_vps.ps1
# Requiere: OpenSSH instalado (incluido en Windows 10/11)
# =============================================================================

$ORACLE_IP    = "158.69.114.73"
$SGSRI_IP     = "51.79.35.88"
$PROJECT_DIR  = $PSScriptRoot  # Directorio del proyecto

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Transferencia de código SmartAuditoria a 2 VPS" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Archivos a EXCLUIR de la transferencia (pesados/innecesarios)
$EXCLUDES = @(
    "--exclude=node_modules",
    "--exclude=.venv",
    "--exclude=__pycache__",
    "--exclude=*.pyc",
    "--exclude=.git",
    "--exclude=data",
    "--exclude=dist",
    "--exclude=.next",
    "--exclude=*.log"
)

# -----------------------------------------------------------------------
# FUNCIÓN: Verificar conectividad SSH
# -----------------------------------------------------------------------
function Test-SSHConnection($ip, $password) {
    Write-Host "Probando conexión SSH a $ip..." -ForegroundColor Yellow
    $result = echo $password | ssh -o "StrictHostKeyChecking=no" -o "ConnectTimeout=10" root@$ip "echo OK" 2>&1
    return $result -match "OK"
}

# -----------------------------------------------------------------------
# FASE 1: Transferir a VPS Oracle (Engine + ChromaDB)
# -----------------------------------------------------------------------
Write-Host ""
Write-Host "--- FASE 1: VPS Oracle ($ORACLE_IP) ---" -ForegroundColor Green

# Crear estructura de directorios en Oracle via SSH
Write-Host "Creando directorios en Oracle..."
$oracleSetup = @"
mkdir -p /opt/smartauditoria/smartauditoria_engine
mkdir -p /data/chromadb /data/models
echo 'Directorios creados'
"@
ssh -o "StrictHostKeyChecking=no" root@$ORACLE_IP $oracleSetup

# Transferir solo lo que necesita Oracle (engine + configs raíz)
Write-Host "Transfiriendo código del Engine a Oracle..."
scp -o "StrictHostKeyChecking=no" -r `
    "$PROJECT_DIR\smartauditoria_engine\" `
    "root@${ORACLE_IP}:/opt/smartauditoria/"

scp -o "StrictHostKeyChecking=no" `
    "$PROJECT_DIR\docker-compose.oracle.yml" `
    "$PROJECT_DIR\nginx.oracle.conf" `
    "$PROJECT_DIR\deploy_oracle.sh" `
    "root@${ORACLE_IP}:/opt/smartauditoria/"

Write-Host "Oracle: Transferencia completada" -ForegroundColor Green

# -----------------------------------------------------------------------
# FASE 2: Transferir a VPS SGSRI (Backend + Frontend + MariaDB)
# -----------------------------------------------------------------------
Write-Host ""
Write-Host "--- FASE 2: VPS SGSRI ($SGSRI_IP) ---" -ForegroundColor Green

Write-Host "Creando directorios en SGSRI..."
$sgsriSetup = @"
mkdir -p /opt/smartauditoria/smartauditoria_backend
mkdir -p /opt/smartauditoria/smartauditoria_frontend
mkdir -p /data/mariadb
echo 'Directorios creados'
"@
ssh -o "StrictHostKeyChecking=no" root@$SGSRI_IP $sgsriSetup

# Transferir backend, frontend y configs
Write-Host "Transfiriendo código del Backend a SGSRI..."
scp -o "StrictHostKeyChecking=no" -r `
    "$PROJECT_DIR\smartauditoria_backend\" `
    "root@${SGSRI_IP}:/opt/smartauditoria/"

Write-Host "Transfiriendo Frontend a SGSRI..."
scp -o "StrictHostKeyChecking=no" -r `
    "$PROJECT_DIR\smartauditoria_frontend\" `
    "root@${SGSRI_IP}:/opt/smartauditoria/"

scp -o "StrictHostKeyChecking=no" `
    "$PROJECT_DIR\docker-compose.sgsri.yml" `
    "$PROJECT_DIR\nginx.sgsri.conf" `
    "$PROJECT_DIR\deploy_sgsri.sh" `
    "root@${SGSRI_IP}:/opt/smartauditoria/"

Write-Host "SGSRI: Transferencia completada" -ForegroundColor Green

# -----------------------------------------------------------------------
# INSTRUCCIONES FINALES
# -----------------------------------------------------------------------
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " TRANSFERENCIA COMPLETADA" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conectar a VPS Oracle y configurar el .env:" -ForegroundColor White
Write-Host "   ssh root@$ORACLE_IP" -ForegroundColor Gray
Write-Host "   cd /opt/smartauditoria" -ForegroundColor Gray
Write-Host "   nano smartauditoria_engine/.env.production  # Cambiar ENGINE_API_KEY" -ForegroundColor Gray
Write-Host "   bash deploy_oracle.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Conectar a VPS SGSRI y configurar el .env:" -ForegroundColor White
Write-Host "   ssh root@$SGSRI_IP" -ForegroundColor Gray
Write-Host "   cd /opt/smartauditoria" -ForegroundColor Gray
Write-Host "   nano smartauditoria_backend/.env.production  # Cambiar todas las CAMBIAR_*" -ForegroundColor Gray
Write-Host "   bash deploy_sgsri.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verificar en el navegador:" -ForegroundColor White
Write-Host "   http://$SGSRI_IP  → Frontend SmartAuditoria" -ForegroundColor Gray
Write-Host "   http://$ORACLE_IP:8001/health → Engine IA" -ForegroundColor Gray

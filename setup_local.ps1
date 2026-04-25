# setup_local.ps1 — Script de configuración del ecosistema amo
Write-Host "--- Iniciando setup local de SmartAuditoria Project ---" -ForegroundColor Cyan

$root = Get-Location

# 1. Engine setup
Write-Host "`n[1/3] Configurando smartauditoria_engine..." -ForegroundColor Yellow
cd "$root\smartauditoria_engine"
python -m venv .venv
& ".\.venv\Scripts\pip" install -e ".[dev]"
cp .env.example .env

# 2. Backend setup
Write-Host "`n[2/3] Configurando smartauditoria_backend..." -ForegroundColor Yellow
cd "$root\smartauditoria_backend"
python -m venv .venv
& ".\.venv\Scripts\pip" install -r requirements.txt
cp .env.example .env

# 3. Frontend setup
Write-Host "`n[3/3] Configurando smartauditoria_frontend..." -ForegroundColor Yellow
cd "$root\smartauditoria_frontend"
npm install
cp .env.example .env

Write-Host "`n✅ Setup completado, amo." -ForegroundColor Green
Write-Host "Próximos pasos:"
Write-Host "1. En la raíz, ejecute: docker-compose up -d"
Write-Host "2. Ejecute los tests: pytest en backend y engine"

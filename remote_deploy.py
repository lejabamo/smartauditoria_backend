#!/usr/bin/env python3
"""
remote_deploy.py — Deploy automatizado de SmartAuditoria en 2 VPS via SSH+SCP
Uso: python remote_deploy.py [oracle|sgsri|both]

Requiere: pip install paramiko scp
"""

import os
import sys
import time
import tarfile
import tempfile
import shutil
from pathlib import Path

# Forzar UTF-8 en Windows para la salida de consola
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    import paramiko
    from scp import SCPClient
except ImportError:
    print("ERROR: Instalar dependencias: pip install paramiko scp")
    sys.exit(1)

# =============================================================================
# Configuración de los VPS
# =============================================================================
PROJECT_DIR = Path(__file__).parent

VPS_ORACLE = {
    "host": "158.69.114.73",
    "port": 22,
    "user": "root",
    "password": "JDc)0#%R/76:]0CH",
    "deploy_dir": "/opt/smartauditoria",
    "name": "Oracle (Engine + ChromaDB)",
}

VPS_SGSRI = {
    "host": "51.79.35.88",
    "port": 22,
    "user": "root",
    "password": "3WkfS*CNHFg0",
    "deploy_dir": "/opt/smartauditoria",
    "name": "SGSRI (Backend + Frontend)",
}

# =============================================================================
# Archivos a excluir del empaquetado
# =============================================================================
EXCLUDE_PATTERNS = {
    "node_modules", ".venv", "__pycache__", ".git",
    "dist", ".next", "data", "*.pyc", "*.log", ".DS_Store",
    "*.egg-info", ".env",  # .env local, no el .env.production
}

# =============================================================================
# Colores
# =============================================================================
GREEN  = "\033[92m"; RED    = "\033[91m"; YELLOW = "\033[93m"
BLUE   = "\033[94m"; BOLD   = "\033[1m";  RESET  = "\033[0m"

def log(msg):   print(f"[{time.strftime('%H:%M:%S')}] {msg}")
def ok(msg):    print(f"  [OK] {msg}")
def warn(msg):  print(f"  [!!] {msg}")
def fail(msg):  print(f"  [ERROR] {msg}"); sys.exit(1)

# =============================================================================
# SSH / SCP helpers
# =============================================================================
def connect_ssh(vps: dict) -> paramiko.SSHClient:
    """Establece conexión SSH con reintentos."""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    for attempt in range(3):
        try:
            log(f"Conectando a {vps['name']} ({vps['host']})... intento {attempt+1}")
            client.connect(
                hostname=vps["host"],
                port=vps["port"],
                username=vps["user"],
                password=vps["password"],
                timeout=30,
                banner_timeout=30,
                auth_timeout=30,
            )
            ok(f"Conectado a {vps['name']}")
            return client
        except Exception as e:
            warn(f"Fallo intento {attempt+1}: {e}")
            time.sleep(5)
    fail(f"No se pudo conectar a {vps['name']} después de 3 intentos")

def run_remote(client: paramiko.SSHClient, cmd: str, timeout: int = 300) -> tuple[str, str, int]:
    """Ejecuta un comando en el servidor remoto."""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    rc  = stdout.channel.recv_exit_status()
    return out, err, rc

def create_tarball(source_dirs: list, exclude_patterns: set) -> str:
    """Crea un tarball del código fuente excluyendo directorios pesados."""
    tmp = tempfile.mktemp(suffix=".tar.gz")
    log(f"Empaquetando código → {tmp}")

    def should_exclude(path: str) -> bool:
        parts = Path(path).parts
        for part in parts:
            for pattern in exclude_patterns:
                if pattern.startswith("*"):
                    if part.endswith(pattern[1:]):
                        return True
                elif part == pattern:
                    return True
        return False

    with tarfile.open(tmp, "w:gz") as tar:
        for src_dir in source_dirs:
            src_path = Path(src_dir)
            if not src_path.exists():
                warn(f"Directorio no encontrado: {src_dir}")
                continue
            log(f"  Añadiendo: {src_path.name}/")
            for item in src_path.rglob("*"):
                rel = item.relative_to(PROJECT_DIR)
                if not should_exclude(str(rel)):
                    tar.add(str(item), arcname=str(rel))

    size_mb = os.path.getsize(tmp) / 1024 / 1024
    ok(f"Tarball creado: {size_mb:.1f} MB")
    return tmp

# =============================================================================
# Deploy VPS Oracle
# =============================================================================
def deploy_oracle():
    log("=" * 55)
    log(f" DEPLOY: {VPS_ORACLE['name']}")
    log("=" * 55)

    client = connect_ssh(VPS_ORACLE)
    deploy_dir = VPS_ORACLE["deploy_dir"]

    # 1. Verificar recursos
    log("Verificando recursos del sistema...")
    out, _, _ = run_remote(client, "df -h / && free -h && docker --version 2>/dev/null || echo 'NO_DOCKER'")
    print(out[:500])

    # 2. Instalar Docker si no está
    if "NO_DOCKER" in out:
        log("Instalando Docker en Oracle...")
        install_cmd = """
apt-get update -qq && \
apt-get install -y -qq ca-certificates curl gnupg lsb-release && \
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
apt-get update -qq && \
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin && \
systemctl enable docker && systemctl start docker && \
echo 'DOCKER_INSTALLED'
"""
        out, err, rc = run_remote(client, install_cmd, timeout=600)
        if "DOCKER_INSTALLED" in out or rc == 0:
            ok("Docker instalado en Oracle")
        else:
            fail(f"Error instalando Docker: {err[:300]}")
    else:
        ok("Docker ya instalado en Oracle")

    # 3. Crear directorios
    log("Creando directorios de datos...")
    run_remote(client, f"mkdir -p {deploy_dir} /data/chromadb /data/models && echo OK")
    ok("Directorios creados")

    # 4. Empaquetar y transferir código
    log("Empaquetando Engine para transferencia...")
    tarball = create_tarball(
        [PROJECT_DIR / "smartauditoria_engine"],
        EXCLUDE_PATTERNS
    )

    # Transferir configs raíz también
    log("Transfiriendo archivos al VPS Oracle...")
    with SCPClient(client.get_transport(), progress=_progress) as scp:
        scp.put(tarball, f"/tmp/smartauditoria_engine.tar.gz")
        scp.put(str(PROJECT_DIR / "docker-compose.oracle.yml"), f"{deploy_dir}/docker-compose.oracle.yml")
        scp.put(str(PROJECT_DIR / "nginx.oracle.conf"), f"{deploy_dir}/nginx.oracle.conf")
        scp.put(str(PROJECT_DIR / "deploy_oracle.sh"), f"{deploy_dir}/deploy_oracle.sh")
    os.unlink(tarball)

    # Descomprimir
    out, err, rc = run_remote(client, f"cd {deploy_dir} && tar -xzf /tmp/smartauditoria_engine.tar.gz && rm /tmp/smartauditoria_engine.tar.gz && echo 'EXTRACTED'")
    if "EXTRACTED" in out:
        ok("Código extraído en Oracle")
    else:
        warn(f"Posible problema extrayendo: {err[:200]}")

    # 5. Verificar .env.production
    out, _, _ = run_remote(client, f"ls {deploy_dir}/smartauditoria_engine/.env.production 2>/dev/null && cat {deploy_dir}/smartauditoria_engine/.env.production | grep 'CAMBIAR_CLAVE' || echo 'ENV_OK'")
    if "CAMBIAR_CLAVE" in out:
        warn("ATENCIÓN: ENGINE_API_KEY aún tiene valor por defecto en .env.production")
        warn("Editar manualmente: nano /opt/smartauditoria/smartauditoria_engine/.env.production")
    else:
        ok(".env.production configurado")

    # 6. Hacer chmod +x al script de deploy
    run_remote(client, f"chmod +x {deploy_dir}/deploy_oracle.sh")

    # 7. Ejecutar deploy
    log("Ejecutando deploy_oracle.sh (puede tardar 10-15 min)...")
    log("Salida en tiempo real:")
    _, _, _ = run_remote(client, f"cd {deploy_dir} && bash deploy_oracle.sh 2>&1 | tee /tmp/deploy_oracle.log", timeout=900)

    # Mostrar últimas líneas del log
    out, _, _ = run_remote(client, "tail -30 /tmp/deploy_oracle.log")
    print(out)

    client.close()
    ok(f"Deploy Oracle completado → http://{VPS_ORACLE['host']}:8001/health")

# =============================================================================
# Deploy VPS SGSRI
# =============================================================================
def deploy_sgsri():
    log("=" * 55)
    log(f" DEPLOY: {VPS_SGSRI['name']}")
    log("=" * 55)

    client = connect_ssh(VPS_SGSRI)
    deploy_dir = VPS_SGSRI["deploy_dir"]

    # 1. Verificar recursos (espacio crítico)
    log("Verificando recursos del sistema...")
    out, _, _ = run_remote(client, "df -h / && free -h && docker --version 2>/dev/null || echo 'NO_DOCKER'")
    print(out[:500])

    # Limpiar antes de empezar
    log("Limpiando recursos Docker no usados...")
    run_remote(client, "docker system prune -f 2>/dev/null || true")

    # 2. Instalar Docker si no está
    if "NO_DOCKER" in out:
        log("Instalando Docker en SGSRI...")
        install_cmd = """
apt-get update -qq && \
apt-get install -y -qq ca-certificates curl gnupg lsb-release && \
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
apt-get update -qq && \
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin && \
systemctl enable docker && systemctl start docker && \
echo 'DOCKER_INSTALLED'
"""
        out, err, rc = run_remote(client, install_cmd, timeout=600)
        if "DOCKER_INSTALLED" in out or rc == 0:
            ok("Docker instalado en SGSRI")
        else:
            fail(f"Error instalando Docker: {err[:300]}")
    else:
        ok("Docker ya instalado en SGSRI")

    # 3. Crear directorios
    log("Creando directorios de datos...")
    run_remote(client, f"mkdir -p {deploy_dir} /data/mariadb && echo OK")

    # 4. Empaquetar y transferir código
    log("Empaquetando Backend + Frontend para transferencia...")
    tarball = create_tarball(
        [
            PROJECT_DIR / "smartauditoria_backend",
            PROJECT_DIR / "smartauditoria_frontend",
        ],
        EXCLUDE_PATTERNS
    )

    log("Transfiriendo archivos al VPS SGSRI...")
    with SCPClient(client.get_transport(), progress=_progress) as scp:
        scp.put(tarball, "/tmp/smartauditoria_sgsri.tar.gz")
        scp.put(str(PROJECT_DIR / "docker-compose.sgsri.yml"), f"{deploy_dir}/docker-compose.sgsri.yml")
        scp.put(str(PROJECT_DIR / "nginx.sgsri.conf"), f"{deploy_dir}/nginx.sgsri.conf")
        scp.put(str(PROJECT_DIR / "deploy_sgsri.sh"), f"{deploy_dir}/deploy_sgsri.sh")
    os.unlink(tarball)

    # Descomprimir
    out, err, rc = run_remote(client, f"cd {deploy_dir} && tar -xzf /tmp/smartauditoria_sgsri.tar.gz && rm /tmp/smartauditoria_sgsri.tar.gz && echo 'EXTRACTED'")
    if "EXTRACTED" in out:
        ok("Código extraído en SGSRI")
    else:
        warn(f"Posible problema extrayendo: {err[:200]}")

    # 5. Verificar .env.production
    out, _, _ = run_remote(client, f"ls {deploy_dir}/smartauditoria_backend/.env.production 2>/dev/null && grep 'CAMBIAR_' {deploy_dir}/smartauditoria_backend/.env.production | wc -l || echo '0'")
    cambiar_count = out.strip().split("\n")[-1]
    if cambiar_count.isdigit() and int(cambiar_count) > 0:
        warn(f"ATENCIÓN: {cambiar_count} variables CAMBIAR_* pendientes en .env.production")
        warn("Editar: nano /opt/smartauditoria/smartauditoria_backend/.env.production")
    else:
        ok(".env.production configurado")

    # 6. chmod y deploy
    run_remote(client, f"chmod +x {deploy_dir}/deploy_sgsri.sh")

    log("Ejecutando deploy_sgsri.sh (puede tardar 10-15 min)...")
    run_remote(client, f"cd {deploy_dir} && bash deploy_sgsri.sh 2>&1 | tee /tmp/deploy_sgsri.log", timeout=900)

    out, _, _ = run_remote(client, "tail -30 /tmp/deploy_sgsri.log")
    print(out)

    client.close()
    ok(f"Deploy SGSRI completado → http://{VPS_SGSRI['host']}")

def _progress(filename, size, sent):
    pct = (sent / size * 100) if size > 0 else 100
    if pct % 20 < 1 or sent == size:
        print(f"  Transfiriendo {filename}: {pct:.0f}%", end="\r")

# =============================================================================
# Main
# =============================================================================
if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "both"

    print(f"\n{BOLD}SmartAuditoria — Deploy Automatizado{RESET}")
    print(f"Target: {target}")
    print(f"Inicio: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    if target in ("oracle", "both"):
        deploy_oracle()

    if target in ("sgsri", "both"):
        # Esperar unos segundos entre deploys si es "both"
        if target == "both":
            log("Esperando 5s antes de iniciar SGSRI...")
            time.sleep(5)
        deploy_sgsri()

    print(f"\n{BOLD}{GREEN}✔ Deploy completado{RESET}")
    print(f"  Engine:   http://158.69.114.73:8001/health")
    print(f"  Frontend: http://51.79.35.88")
    print(f"  API:      http://51.79.35.88/api/health")
    print(f"\n  Para verificar: python test_production.py")

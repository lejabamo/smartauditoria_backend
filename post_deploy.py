#!/usr/bin/env python3
"""Ejecuta migraciones y crea admin en SGSRI + verifica engine en Oracle"""
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ===== SGSRI: Migraciones + Admin =====
print("\n[SGSRI] Connecting...")
c1 = paramiko.SSHClient()
c1.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c1.connect('51.79.35.88', username='root', password='3WkfS*CNHFg0', timeout=30)
print("[SGSRI] Connected")

sgsri_cmd = (
    'echo "=== DB Tables ===" && '
    'docker exec smartauditoria_backend python -c "'
    'from app import create_app; from extensions import db; '
    'app = create_app(); '
    'app.app_context().push(); '
    'db.create_all(); '
    'print(\"Tables created OK\")'
    '" 2>&1 && '
    'echo "=== Create Admin ===" && '
    'docker exec smartauditoria_backend python -c "'
    'import sys; from app import create_app; from extensions import db; '
    'app = create_app(); ctx = app.app_context(); ctx.push(); '
    'try: '
    '  from app.domain.models import User; import bcrypt; '
    '  existing = User.query.filter_by(email=\\\"admin@smartauditoria.co\\\").first(); '
    '  print(\\\"Admin ya existe\\\" if existing else \\\"Creating...\\\"); '
    '  pw = bcrypt.hashpw(\\\"Admin@2024!\\\".encode(), bcrypt.gensalt()).decode() if not existing else None; '
    '  u = User(nombre=\\\"Administrador\\\", email=\\\"admin@smartauditoria.co\\\", password_hash=pw, rol=\\\"admin\\\", activo=True) if not existing else None; '
    '  db.session.add(u) if u else None; '
    '  db.session.commit() if u else None; '
    '  print(\\\"Admin OK\\\"); '
    'except Exception as e: print(f\\\"Error: {e}\\\", file=sys.stderr)'
    '" 2>&1 && '
    'echo "=== Backend health ===" && '
    'curl -sf http://localhost:5000/api/health && '
    'echo "=== Auth test ===" && '
    'curl -sf -X POST http://localhost:5000/api/auth/login '
    '-H "Content-Type: application/json" '
    '-d \'{"email":"admin@smartauditoria.co","password":"Admin@2024!"}\' | '
    'python3 -c "import sys,json; d=json.load(sys.stdin); print(f\'Token: {str(d.get(\\\"token\\\",d.get(\\\"access_token\\\",\\\"NOT_FOUND\\\")))[:40]}...\')" 2>/dev/null || '
    'echo "Login failed - check admin creation" && '
    'echo "[SGSRI DONE]"'
)

_, stdout, _ = c1.exec_command(sgsri_cmd, timeout=120, get_pty=True)
for line in stdout:
    print(line, end='', flush=True)
c1.close()

# ===== Oracle: Engine health =====
print("\n[Oracle] Connecting...")
c2 = paramiko.SSHClient()
c2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c2.connect('158.69.114.73', username='root', password='JDc)0#%R/76:]0CH', timeout=30)
print("[Oracle] Connected")

oracle_cmd = (
    'echo "=== Oracle containers ===" && '
    'docker ps --format "{{.Names}}: {{.Status}}: {{.Ports}}" && '
    'echo "=== Engine health ===" && '
    'curl -sf http://localhost:8001/health 2>/dev/null || echo "engine not ready yet" && '
    'echo "=== Engine /api/v1/health ===" && '
    'curl -sf http://localhost:8001/api/v1/health 2>/dev/null || echo "v1 health N/A" && '
    'echo "[Oracle DONE]"'
)

_, stdout, _ = c2.exec_command(oracle_cmd, timeout=30, get_pty=True)
for line in stdout:
    print(line, end='', flush=True)
c2.close()

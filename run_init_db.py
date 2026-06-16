#!/usr/bin/env python3
"""Transfiere init_db.py al contenedor y ejecuta migraciones + admin"""
import paramiko, sys, io
from scp import SCPClient

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

print("[SGSRI] Connecting for DB initialization...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.79.35.88', username='root', password='3WkfS*CNHFg0', timeout=30)
print("[SGSRI] Connected")

# Copy init_db.py to VPS
print("[INFO] Copying init_db.py to VPS...")
with SCPClient(client.get_transport()) as scp:
    scp.put('init_db.py', '/tmp/init_db.py')
print("[INFO] Copied")

# Copy into container and run
cmd = (
    'docker cp /tmp/init_db.py smartauditoria_backend:/app/init_db.py && '
    'docker exec smartauditoria_backend python /app/init_db.py 2>&1 && '
    'echo "=== Auth test ===" && '
    'curl -sf -X POST http://localhost:5000/api/auth/login '
    '-H "Content-Type: application/json" '
    '-d \'{"email":"admin@smartauditoria.co","password":"Admin@2024!"}\' 2>/dev/null | '
    'python3 -m json.tool 2>/dev/null || echo "Login test - check output above" && '
    'echo "[DB INIT DONE]"'
)

_, stdout, _ = client.exec_command(cmd, timeout=120, get_pty=True)
for line in stdout:
    print(line, end='', flush=True)
client.close()
print("\n[INFO] DB initialization complete")

#!/usr/bin/env python3
"""Script de arranque de SGSRI — ejecutado directamente"""
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.79.35.88', username='root', password='3WkfS*CNHFg0', timeout=30)
print('[OK] Connected to SGSRI')

cmd = (
    'cd /opt/smartauditoria && '
    'docker compose -f docker-compose.sgsri.yml up -d && '
    'echo "Waiting 50s for MariaDB..." && sleep 50 && '
    'docker compose -f docker-compose.sgsri.yml ps && '
    'echo "Backend health:" && '
    'curl -sf http://localhost:5000/api/health 2>/dev/null || echo "not ready yet" && '
    'echo "[DONE]"'
)

print('[INFO] Starting containers on SGSRI...')
_, stdout, _ = client.exec_command(cmd, timeout=300, get_pty=True)
for line in stdout:
    print(line, end='', flush=True)
rc = stdout.channel.recv_exit_status()
print(f'[EXIT] code: {rc}')
client.close()

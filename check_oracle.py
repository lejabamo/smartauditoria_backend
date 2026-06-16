#!/usr/bin/env python3
"""Remover nginx de Oracle y reiniciar. El engine en :8001 es suficiente."""
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('158.69.114.73', username='root', password='JDc)0#%R/76:]0CH', timeout=30)
print('[OK] Connected to Oracle')

# Check what is on port 80
cmd = (
    'echo "=== Port 80 usage ===" && '
    'ss -tlnp | grep ":80" && '
    'echo "=== Running services ===" && '
    'systemctl list-units --state=running | grep -E "nginx|apache|http|web" && '
    'echo "=== Docker containers ===" && '
    'docker ps --format "{{.Names}}: {{.Ports}}" && '
    'echo "[DONE]"'
)

_, stdout, _ = client.exec_command(cmd, timeout=30, get_pty=True)
for line in stdout:
    print(line, end='', flush=True)
client.close()

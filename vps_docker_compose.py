import paramiko

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.79.35.88', username='root', password='3WkfS*CNHFg0', timeout=15)

stdin, stdout, stderr = client.exec_command('cat /opt/smartauditoria/docker-compose.sgsri.yml')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()

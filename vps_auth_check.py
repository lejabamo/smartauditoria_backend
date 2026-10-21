import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('51.79.35.88', username='root', password='3WkfS*CNHFg0', timeout=15)

query = 'docker exec smartauditoria_db mariadb -u sgsri_user -pKV2jiFc7fetfJH7-zFcoWQ -D sgsri_db -e "SELECT id_usuario_auth, username, id_rol, activo, intentos_fallidos, bloqueado_hasta FROM usuarios_auth;"'
stdin, stdout, stderr = client.exec_command(query)
print("--- USUARIOS_AUTH ---")
print(stdout.read().decode('utf-8', errors='replace'))

query2 = 'docker exec smartauditoria_db mariadb -u sgsri_user -pKV2jiFc7fetfJH7-zFcoWQ -D sgsri_db -e "SELECT id_rol, nombre_rol, activo FROM roles_auth;"'
stdin, stdout, stderr = client.exec_command(query2)
print("--- ROLES_AUTH ---")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()

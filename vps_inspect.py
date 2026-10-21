import paramiko

def inspect_vps():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('51.79.35.88', username='root', password='3WkfS*CNHFg0', timeout=15)
    
    print("=== DOCKER CONTAINERS ===")
    stdin, stdout, stderr = client.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"')
    print(stdout.read().decode())
    
    print("=== DIRECTORY /opt/smartauditoria OR SIMILAR ===")
    stdin, stdout, stderr = client.exec_command('ls -la /opt/smartauditoria 2>/dev/null || ls -la /root/smartauditoria 2>/dev/null || ls -la /home 2>/dev/null')
    print(stdout.read().decode())
    
    client.close()

if __name__ == '__main__':
    inspect_vps()

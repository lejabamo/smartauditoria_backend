import os
import sys
import io
import tarfile
import paramiko
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

VPS_HOST = "51.79.35.88"
VPS_USER = "root"
VPS_PASS = "3WkfS*CNHFg0"

def create_dist_tar():
    print("1. Creando archivo tar con frontend/dist...")
    tar_path = "dist_update.tar.gz"
    dist_dir = os.path.join("smartauditoria_frontend", "dist")
    
    with tarfile.open(tar_path, "w:gz") as tar:
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, dist_dir)
                tar.add(full_path, arcname=rel_path)
    size_mb = os.path.getsize(tar_path) / (1024 * 1024)
    print(f"   ✓ dist_update.tar.gz creado ({size_mb:.2f} MB)")
    return tar_path

def deploy():
    tar_file = create_dist_tar()
    
    print("\n2. Conectando al VPS por SSH/SFTP...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=30)
    sftp = ssh.open_sftp()
    print("   ✓ Conexión establecida")
    
    # Subir frontend tar
    print("\n3. Transfiriendo dist_update.tar.gz al VPS...")
    sftp.put(tar_file, "/opt/smartauditoria/dist_update.tar.gz")
    print("   ✓ Frontend transferido")
    
    # Subir backend files modificados
    print("\n4. Transfiriendo archivos de Backend al VPS...")
    backend_files = [
        ("smartauditoria_backend/app/models.py", "/opt/smartauditoria/smartauditoria_backend/app/models.py"),
        ("smartauditoria_backend/app/auth/routes.py", "/opt/smartauditoria/smartauditoria_backend/app/auth/routes.py"),
        ("smartauditoria_backend/app/auth/decorators.py", "/opt/smartauditoria/smartauditoria_backend/app/auth/decorators.py"),
        ("smartauditoria_backend/app/routes/usuarios.py", "/opt/smartauditoria/smartauditoria_backend/app/routes/usuarios.py"),
    ]
    
    for local_f, remote_f in backend_files:
        print(f"   -> Subiendo {local_f}...")
        sftp.put(local_f, remote_f)
    print("   ✓ Archivos de backend transferidos al host")
    
    # Ejecutar comandos en VPS para sincronizar contenedores
    print("\n5. Actualizando contenedores Docker en VPS...")
    vps_commands = [
        # Extraer frontend
        "mkdir -p /opt/smartauditoria/frontend_dist && tar -xzf /opt/smartauditoria/dist_update.tar.gz -C /opt/smartauditoria/frontend_dist",
        # Copiar frontend al contenedor Nginx
        "docker cp /opt/smartauditoria/frontend_dist/. smartauditoria_frontend:/usr/share/nginx/html/",
        # Copiar backend al contenedor Flask
        "docker cp /opt/smartauditoria/smartauditoria_backend/app/models.py smartauditoria_backend:/app/app/models.py",
        "docker cp /opt/smartauditoria/smartauditoria_backend/app/auth/routes.py smartauditoria_backend:/app/app/auth/routes.py",
        "docker cp /opt/smartauditoria/smartauditoria_backend/app/auth/decorators.py smartauditoria_backend:/app/app/auth/decorators.py",
        "docker cp /opt/smartauditoria/smartauditoria_backend/app/routes/usuarios.py smartauditoria_backend:/app/app/routes/usuarios.py",
        # Asegurar permisos y reiniciar contenedores
        "docker restart smartauditoria_backend",
        "docker exec smartauditoria_frontend nginx -s reload"
    ]
    
    for cmd in vps_commands:
        print(f"   [CMD] {cmd[:60]}...")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        if out:
            print(f"      Out: {out}")
        if err and "signal process started" not in err:
            print(f"      Err: {err}")
            
    print("\n6. Esperando a que el backend esté listo...")
    import time
    time.sleep(5)
    
    # Verificar log y salud
    stdin, stdout, stderr = ssh.exec_command("docker logs --tail 10 smartauditoria_backend")
    print("   Logs backend:")
    print("   " + "\n   ".join(stdout.read().decode('utf-8', errors='replace').strip().splitlines()))
    
    sftp.close()
    ssh.close()
    
    if os.path.exists(tar_file):
        os.remove(tar_file)
        
    print("\n7. Validando live en https://riesgosti.tics.sedcauca.gov.co...")
    try:
        # Test health
        r_health = requests.get("https://riesgosti.tics.sedcauca.gov.co/api/health", verify=False, timeout=10)
        print(f"   Health status: {r_health.status_code} -> {r_health.json()}")
        
        # Test login
        r_login = requests.post("https://riesgosti.tics.sedcauca.gov.co/api/auth/login",
                                json={"username": "admin", "password": "AdminPass2026!" if False else "admin123"},
                                verify=False, timeout=10)
        print(f"   Login status: {r_login.status_code}")
        token = None
        if r_login.status_code == 200:
            token = r_login.json().get("token") or r_login.json().get("access_token")
            print(f"   Login OK, user: {r_login.json().get('user', {}).get('username')} - Rol: {r_login.json().get('user', {}).get('rol_nombre') or r_login.json().get('user', {}).get('rol')}")
            
        if token:
            # Test roles
            r_roles = requests.get("https://riesgosti.tics.sedcauca.gov.co/api/usuarios/roles",
                                   headers={"Authorization": f"Bearer {token}"},
                                   verify=False, timeout=10)
            print(f"   Roles en producción: {r_roles.status_code}")
            roles_data = r_roles.json()
            if isinstance(roles_data, list):
                print(f"   Catálogo activo: {[r.get('nombre_rol') for r in roles_data]}")
                
            # Test list users
            r_users = requests.get("https://riesgosti.tics.sedcauca.gov.co/api/usuarios/",
                                   headers={"Authorization": f"Bearer {token}"},
                                   verify=False, timeout=10)
            print(f"   Usuarios endpoint status: {r_users.status_code} (Total: {len(r_users.json()) if isinstance(r_users.json(), list) else 'N/A'})")
            
    except Exception as e:
        print(f"   [Error validando endpoints]: {e}")
        
    print("\n✓ Despliegue en VPS completado con éxito.")

if __name__ == '__main__':
    deploy()

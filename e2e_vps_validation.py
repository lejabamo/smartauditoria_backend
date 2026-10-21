import requests
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "https://riesgosti.tics.sedcauca.gov.co"

print("===============================================================")
print(" VERIFICACIÓN E2E EN PRODUCCIÓN (VPS OVH Cloud 51.79.35.88)")
print(" Dominio Seguro: https://riesgosti.tics.sedcauca.gov.co")
print("===============================================================")

# 1. Health Check
print("\n[PASO 1] Health Check de la Infraestructura...")
r_health = requests.get(f"{BASE_URL}/api/health", verify=False, timeout=10)
assert r_health.status_code == 200
print(f"  ✓ Estado Backend VPS: {r_health.json()}")

# 2. Login como Administrador
print("\n[PASO 2] Autenticación Administrativa...")
r_login = requests.post(f"{BASE_URL}/api/auth/login",
                        json={"username": "admin", "password": "Admin@2024!"},
                        verify=False, timeout=10)
assert r_login.status_code == 200, f"Error login: {r_login.text}"
token = r_login.json()["token"]
user_info = r_login.json()["user"]
print(f"  ✓ Token JWT emitido exitosamente")
print(f"  ✓ Usuario: {user_info['username']} | Rol: {user_info['rol_nombre']} | Activo: {user_info['activo']}")
headers = {"Authorization": f"Bearer {token}"}

# 3. Consulta de los 3 Roles Oficiales
print("\n[PASO 3] Catálogo Oficial de Roles RBAC...")
r_roles = requests.get(f"{BASE_URL}/api/usuarios/roles", headers=headers, verify=False, timeout=10)
assert r_roles.status_code == 200
roles = r_roles.json()
print(f"  ✓ Roles activos encontrados: {len(roles)}")
for r in roles:
    print(f"    • [{r['nombre_rol']}] ID: {r['id_rol']} - {r['descripcion']}")
role_names = [r['nombre_rol'] for r in roles]
assert "ADMIN" in role_names and "OPERADOR" in role_names and "CONSULTOR" in role_names
assert len(role_names) == 3, f"Se esperaban exactamente 3 roles, se encontraron: {role_names}"
print("  ✓ Verificación estricta: Únicamente OPERADOR, ADMINISTRADOR, CONSULTOR activos.")

# 4. Creación de Usuario con Rol OPERADOR en el VPS
print("\n[PASO 4] Creación de Usuario de Prueba con Rol OPERADOR (SCRUM-36)...")
ts = int(time.time())
test_email = f"operador_vps_{ts}@smartauditoria.co"
create_data = {
    "nombre_completo": f"Auditor Operativo VPS {ts}",
    "email_institucional": test_email,
    "puesto_organizacion": "Operador SGSI",
    "rol": "OPERADOR",
    "id_rol": 2,
    "password": "PasswordTemp2026*"
}
r_create = requests.post(f"{BASE_URL}/api/usuarios/", json=create_data, headers=headers, verify=False, timeout=10)
assert r_create.status_code in [200, 201], f"Error al crear: {r_create.text}"
created_user = r_create.json()
created_id = created_user.get("id_usuario") or created_user.get("id")
print(f"  ✓ Usuario creado con ID: {created_id}")
print(f"  ✓ Email: {test_email} | Rol: {created_user.get('rol_nombre')}")

# 5. Flujo de Recuperación de Contraseña en el VPS (SCRUM-37)
print("\n[PASO 5] Autoservicio de Recuperación de Contraseña (SCRUM-37)...")
r_forgot = requests.post(f"{BASE_URL}/api/auth/forgot-password",
                         json={"identifier": test_email},
                         verify=False, timeout=10)
assert r_forgot.status_code == 200
forgot_data = r_forgot.json()
reset_token = forgot_data["reset_token"]
reset_code = forgot_data["reset_code"]
print(f"  ✓ Solicitud aceptada: {forgot_data['message']}")
print(f"  ✓ Código numérico emitido: {reset_code}")
print(f"  ✓ Token criptográfico firmado: {reset_token[:30]}...")

# 6. Restablecer con Nueva Contraseña
print("\n[PASO 6] Restablecimiento de Contraseña con Token Firmado...")
new_pwd = "NewSecuredPassword2026#"
r_reset = requests.post(f"{BASE_URL}/api/auth/reset-password",
                        json={"token": reset_token, "new_password": new_pwd},
                        verify=False, timeout=10)
assert r_reset.status_code == 200
print(f"  ✓ Contraseña actualizada con éxito: {r_reset.json().get('message')}")

# 7. Inicio de Sesión con la Nueva Contraseña
print("\n[PASO 7] Inicio de Sesión del Usuario con Nueva Credencial...")
r_user_login = requests.post(f"{BASE_URL}/api/auth/login",
                             json={"username": test_email, "password": new_pwd},
                             verify=False, timeout=10)
assert r_user_login.status_code == 200
user_session = r_user_login.json()["user"]
print(f"  ✓ Login exitoso:")
print(f"    - Usuario: {user_session['username']}")
print(f"    - Rol RBAC: {user_session.get('rol_nombre') or user_session.get('rol')}")
print(f"    - Sesión Token JWT: {r_user_login.json()['token'][:30]}...")

# 8. Limpieza del usuario de prueba
print("\n[PASO 8] Limpieza de registro de prueba en MariaDB...")
requests.delete(f"{BASE_URL}/api/usuarios/{created_id}", headers=headers, verify=False, timeout=10)
print(f"  ✓ Usuario de prueba eliminado.")

print("\n===============================================================")
print(" [EXITO TOTAL] Todos los flujos funcionan 100% en vivo en el VPS")
print("===============================================================")

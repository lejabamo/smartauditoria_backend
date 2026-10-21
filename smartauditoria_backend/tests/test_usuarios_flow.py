"""
Test end-to-end user management and password recovery flow
SCRUM-36: Gestion de usuarios y roles RBAC
SCRUM-37: Recuperacion y restablecimiento de contrasenas
"""
import pytest
import json
from app import create_app, db
from app.models import UsuarioSistema, UsuarioAuth, Rol

@pytest.fixture(scope="module")
def test_client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["JWT_SECRET_KEY"] = "test-jwt-secret-key-12345"
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Ensure roles
            for rol_name in ["ADMIN", "OPERADOR", "AUXILIAR", "CONSULTOR"]:
                r = Rol.query.filter_by(nombre_rol=rol_name).first()
                if not r:
                    r = Rol(nombre_rol=rol_name, descripcion=f"Rol {rol_name}", permisos="[]", activo=True)
                    db.session.add(r)
            db.session.commit()
            
            # Ensure admin
            admin_rol = Rol.query.filter_by(nombre_rol="ADMIN").first()
            admin_sys = UsuarioSistema.query.filter_by(email_institucional="admin_test@smartauditoria.co").first()
            if not admin_sys:
                admin_sys = UsuarioSistema(
                    nombre_completo="Admin Test",
                    email_institucional="admin_test@smartauditoria.co",
                    puesto_organizacion="Seguridad",
                    estado_usuario="Activo"
                )
                db.session.add(admin_sys)
                db.session.commit()
            
            admin_auth = UsuarioAuth.query.filter_by(username="admin_test@smartauditoria.co").first()
            if not admin_auth:
                admin_auth = UsuarioAuth(
                    id_usuario_sistema=admin_sys.id_usuario,
                    username="admin_test@smartauditoria.co",
                    id_rol=admin_rol.id_rol,
                    activo=True
                )
                admin_auth.set_password("AdminPass123*")
                db.session.add(admin_auth)
                db.session.commit()
            else:
                admin_auth.set_password("AdminPass123*")
                admin_auth.activo = True
                admin_auth.bloqueado = False
                admin_auth.intentos_fallidos = 0
                db.session.commit()

        yield client

def test_user_management_and_password_recovery(test_client):
    # 1. Login as Admin
    login_resp = test_client.post("/api/auth/login", json={
        "username": "admin_test@smartauditoria.co",
        "password": "AdminPass123*"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.data}"
    token = login_resp.json["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Roles
    roles_resp = test_client.get("/api/usuarios/roles", headers=headers)
    assert roles_resp.status_code == 200
    roles_list = roles_resp.json if isinstance(roles_resp.json, list) else roles_resp.json.get("data", [])
    role_names = [r["nombre_rol"] for r in roles_list]
    assert "ADMIN" in role_names
    assert "AUXILIAR" in role_names
    assert "OPERADOR" in role_names
    assert "CONSULTOR" in role_names
    
    auxiliar_rol = next(r for r in roles_list if r["nombre_rol"] == "AUXILIAR")
    
    # 3. Create a new user with AUXILIAR role (SCRUM-36)
    import time
    ts = int(time.time())
    new_user_email = f"auxiliar_auditor_{ts}@smartauditoria.co"
    create_payload = {
        "nombre_completo": f"Carlos Auxiliar Auditor {ts}",
        "email_institucional": new_user_email,
        "puesto_organizacion": "Auditor Junior",
        "rol": "AUXILIAR",
        "id_rol": auxiliar_rol["id_rol"],
        "password": "InitialPass2026!"
    }
    create_resp = test_client.post("/api/usuarios/", json=create_payload, headers=headers)
    assert create_resp.status_code in [200, 201], f"Create user failed: {create_resp.data}"
    created_id = create_resp.json.get("id_usuario") or create_resp.json.get("id")
    assert created_id is not None
    
    # 4. Fetch users and verify RBAC fields
    users_resp = test_client.get("/api/usuarios/", headers=headers)
    assert users_resp.status_code == 200
    users = users_resp.json if isinstance(users_resp.json, list) else users_resp.json.get("data", [])
    created_user = next((u for u in users if u["email_institucional"] == new_user_email), None)
    assert created_user is not None
    assert created_user["rol_nombre"] == "AUXILIAR"
    assert created_user["activo"] is True
    assert created_user["bloqueado"] is False
    
    # 5. Test Password Recovery Flow (SCRUM-37)
    # 5a. Request reset token
    forgot_resp = test_client.post("/api/auth/forgot-password", json={
        "identifier": new_user_email
    })
    assert forgot_resp.status_code == 200
    reset_token = forgot_resp.json.get("reset_token")
    assert reset_token is not None
    assert "reset_code" in forgot_resp.json
    
    # 5b. Reset password with token
    new_password = "RecoveredPassword2026#"
    reset_resp = test_client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": new_password
    })
    assert reset_resp.status_code == 200
    assert reset_resp.json.get("success") is True
    
    # 5c. Login with the new password
    recovered_login = test_client.post("/api/auth/login", json={
        "username": new_user_email,
        "password": new_password
    })
    assert recovered_login.status_code == 200
    assert recovered_login.json.get("user", {}).get("rol") == "AUXILIAR"
    
    # 6. Admin Reset Password (SCRUM-36 / SCRUM-37)
    admin_reset_resp = test_client.post(
        f"/api/usuarios/{created_id}/reset-password",
        json={"new_password": "AdminForcedPass2026$"},
        headers=headers
    )
    assert admin_reset_resp.status_code == 200
    
    # Verify login with admin-set password
    admin_reset_login = test_client.post("/api/auth/login", json={
        "username": new_user_email,
        "password": "AdminForcedPass2026$"
    })
    assert admin_reset_login.status_code == 200
    
    # 7. Toggle Status (Active / Inactive)
    toggle_resp = test_client.post(f"/api/usuarios/{created_id}/toggle-status", headers=headers)
    assert toggle_resp.status_code == 200
    assert toggle_resp.json.get("activo") is False
    
    # Inactive user cannot login
    inactive_login = test_client.post("/api/auth/login", json={
        "username": new_user_email,
        "password": "AdminForcedPass2026$"
    })
    assert inactive_login.status_code == 401
    
    # Toggle back to active
    toggle_resp2 = test_client.post(f"/api/usuarios/{created_id}/toggle-status", headers=headers)
    assert toggle_resp2.status_code == 200
    assert toggle_resp2.json.get("activo") is True
    
    print("\n[OK] All tests passed successfully for SCRUM-36 and SCRUM-37!")

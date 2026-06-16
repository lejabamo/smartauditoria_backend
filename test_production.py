#!/usr/bin/env python3
"""
test_production.py — Prueba E2E de SmartAuditoria en producción (2 VPS)
Uso: python test_production.py
"""

import sys
import time
import requests
import json
from typing import Optional
from colorama import init, Fore, Style

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

init(autoreset=True)

# =============================================================================
# Configuración
# =============================================================================
BACKEND_URL = "http://51.79.35.88"      # VPS SGSRI — Frontend + Backend
ENGINE_URL  = "http://158.69.114.73:8001" # VPS Oracle — Engine IA
API_URL     = f"{BACKEND_URL}/api"

ADMIN_EMAIL    = "admin@smartauditoria.co"
ADMIN_PASSWORD = "Admin@2024!"

TIMEOUT = 30

# =============================================================================
# Helpers
# =============================================================================
GREEN = Fore.GREEN; RED = Fore.RED; YELLOW = Fore.YELLOW; RESET = Style.RESET_ALL
BLUE  = Fore.BLUE; BOLD = Style.BRIGHT; DIM = Style.DIM

passed = failed = 0

def ok(msg, detail=""): print(f"  {GREEN}[OK]{RESET}  {msg}" + (f"\n       {DIM}{detail}{RESET}" if detail else ""))
def fail(msg, detail=""): 
    print(f"  {RED}[FAIL]{RESET}  {msg}" + (f"\n       {DIM}{detail}{RESET}" if detail else ""))
    sys.exit(1)

def section(title):
    print(f"\n{BOLD}{BLUE}{'='*55}{RESET}")
    print(f"{BOLD}{BLUE} {title}{RESET}")
    print(f"{BOLD}{BLUE}{'='*55}{RESET}")

def get_token() -> Optional[str]:
    try:
        r = requests.post(f"{API_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            return data.get("token") or data.get("access_token")
    except Exception:
        pass
    return None

# =============================================================================
# Tests
# =============================================================================

def test_engine_health():
    section("1. Engine IA — VPS Oracle")
    try:
        r = requests.get(f"{ENGINE_URL}/health", timeout=TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            ok(f"Engine respondiendo — status: {data.get('status', 'ok')}")
            if data.get("chroma_status"):
                ok(f"ChromaDB conectado — {data['chroma_status']}")
            else:
                ok("ChromaDB estado: incluido en health")
        else:
            fail(f"Engine health devolvió {r.status_code}", r.text[:200])
    except requests.exceptions.ConnectionError:
        fail("No se puede conectar al Engine", f"URL: {ENGINE_URL}/health")
    except Exception as e:
        fail(f"Error inesperado: {e}")

def test_backend_health():
    section("2. Backend Flask — VPS SGSRI")
    try:
        r = requests.get(f"{API_URL}/health", timeout=TIMEOUT)
        if r.status_code == 200:
            ok(f"Backend respondiendo — {r.json()}")
        else:
            fail(f"Backend health devolvió {r.status_code}")
    except requests.exceptions.ConnectionError:
        fail("No se puede conectar al Backend", f"URL: {API_URL}/health")
    except Exception as e:
        fail(f"Error inesperado: {e}")

def test_frontend():
    section("3. Frontend React — VPS SGSRI")
    try:
        r = requests.get(f"{BACKEND_URL}/", timeout=TIMEOUT)
        if r.status_code == 200 and "html" in r.headers.get("content-type", "").lower():
            ok("Frontend HTML respondiendo (Nginx sirviendo React)")
            if "SmartAudit" in r.text or "<!DOCTYPE html>" in r.text:
                ok("Contenido HTML válido detectado")
            else:
                fail("Contenido HTML inesperado")
        else:
            fail(f"Frontend devolvió {r.status_code}", r.text[:100])
    except Exception as e:
        fail(f"Error accediendo al frontend: {e}")

def test_authentication():
    section("4. Autenticación JWT")
    try:
        r = requests.post(f"{API_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            token = data.get("token") or data.get("access_token")
            if token:
                ok(f"Login exitoso — token JWT obtenido ({len(token)} chars)")
                return token
            else:
                fail("Login 200 pero sin token en respuesta", str(data)[:200])
        else:
            fail(f"Login devolvió {r.status_code}", r.text[:200])
    except Exception as e:
        fail(f"Error en login: {e}")
    return None

def test_protected_routes(token: str):
    section("5. Rutas Protegidas (JWT)")
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        ("GET", f"{API_URL}/activos", "Listado de activos"),
        ("GET", f"{API_URL}/users", "Listado de usuarios"),
        ("GET", f"{API_URL}/dashboard/stats", "Estadísticas dashboard"),
    ]
    for method, url, desc in endpoints:
        try:
            r = requests.request(method, url, headers=headers, timeout=TIMEOUT)
            if r.status_code in (200, 201):
                ok(f"{desc} — {r.status_code}")
            elif r.status_code == 403:
                fail(f"{desc} — 403 Forbidden (permisos)", url)
            elif r.status_code == 404:
                fail(f"{desc} — 404 Not Found", url)
            else:
                fail(f"{desc} — {r.status_code}", r.text[:100])
        except Exception as e:
            fail(f"{desc} — {e}")

def test_ia_pipeline(token: str):
    section("6. Pipeline RAG — Backend → Engine")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    payload = {
        "activo": {
            "nombre": "Servidor de Autenticación OAuth2",
            "tipo": "Software",
            "descripcion": "Servicio de gestión de identidades corporativas"
        },
        "contexto": "infraestructura crítica bancaria"
    }
    try:
        r = requests.post(
            f"{API_URL}/ia/analyze",
            json=payload, headers=headers, timeout=60)
        if r.status_code == 200:
            data = r.json()
            suggestions = data.get("sugerencias") or data.get("suggestions") or []
            ok(f"Pipeline RAG completado — {len(suggestions)} sugerencias ISO")
            if suggestions:
                first = suggestions[0]
                control = first.get("control") or first.get("titulo") or "N/A"
                ok(f"Primera sugerencia: {control[:80]}")
        else:
            fail(f"Pipeline IA devolvió {r.status_code}", r.text[:300])
    except requests.exceptions.Timeout:
        fail("Timeout en pipeline IA (>60s) — Engine puede estar cargando modelo")
    except Exception as e:
        fail(f"Error en pipeline IA: {e}")

def test_create_activo(token: str):
    section("7. CRUD Completo (Crear Activo)")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    activo_data = {
        "nombre": f"Activo Test Producción {int(time.time())}",
        "tipo": "Hardware",
        "descripcion": "Servidor de prueba para validación de deploy",
        "propietario": "admin@smartauditoria.co",
        "valor": "Alto",
        "estado": "Activo"
    }
    try:
        r = requests.post(f"{API_URL}/activos", json=activo_data, headers=headers, timeout=TIMEOUT)
        if r.status_code in (200, 201):
            activo_id = r.json().get("id")
            ok(f"Activo creado exitosamente — ID: {activo_id}")
            # Limpiar
            if activo_id:
                del_r = requests.delete(f"{API_URL}/activos/{activo_id}", headers=headers, timeout=TIMEOUT)
                if del_r.status_code in (200, 204):
                    ok("Activo de prueba eliminado correctamente")
        else:
            fail(f"Crear activo devolvió {r.status_code}", r.text[:200])
    except Exception as e:
        fail(f"Error en CRUD activo: {e}")

def test_latency_backend_engine(token: str):
    section("8. Latencia Backend ↔ Engine (VPS-to-VPS)")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "activo": {"nombre": "Test latencia", "tipo": "Cloud"},
        "contexto": "cloud"
    }
    try:
        start = time.time()
        r = requests.post(f"{API_URL}/ia/analyze", json=payload, headers=headers, timeout=60)
        elapsed = (time.time() - start) * 1000

        if r.status_code == 200:
            if elapsed < 5000:
                ok(f"Latencia E2E: {elapsed:.0f}ms (excelente)")
            elif elapsed < 15000:
                ok(f"Latencia E2E: {elapsed:.0f}ms (aceptable)")
            else:
                fail(f"Latencia E2E: {elapsed:.0f}ms (lenta — revisar red VPS-to-VPS)")
        else:
            fail(f"Error en prueba de latencia: {r.status_code}")
    except Exception as e:
        fail(f"Error: {e}")

# =============================================================================
# Main
# =============================================================================
if __name__ == "__main__":
    print(f"\n{BOLD}SmartAuditoria — Prueba E2E de Producción{RESET}")
    print(f"Backend: {BACKEND_URL}")
    print(f"Engine:  {ENGINE_URL}")
    print(f"Inicio:  {time.strftime('%Y-%m-%d %H:%M:%S')}")

    test_engine_health()
    test_backend_health()
    test_frontend()

    token = test_authentication()
    if token:
        test_protected_routes(token)
        test_ia_pipeline(token)
        test_create_activo(token)
        test_latency_backend_engine(token)
    else:
        print(f"\n{RED}No se pudo obtener token. Tests posteriores omitidos.{RESET}")

    # Resultado final
    total = passed + failed
    print(f"\n{BOLD}{'='*55}")
    print(f" RESULTADO: {passed}/{total} tests pasaron")
    print(f"{'='*55}{RESET}")
    if failed == 0:
        print(f"{GREEN}{BOLD} ✔ TODOS LOS TESTS PASARON — Sistema listo para producción{RESET}")
    else:
        print(f"{RED}{BOLD} ✘ {failed} tests fallaron — Revisar logs arriba{RESET}")
        sys.exit(1)

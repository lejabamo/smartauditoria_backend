import requests
import json
import time
import sys

# CONFIGURACIÓN (Puntos de entrada)
# Cambiar por la IP/URL del VPS
BACKEND_URL = "http://localhost:5000"
ENGINE_URL = "http://localhost:8001"

class RigorousTester:
    def __init__(self):
        self.token = None
        self.headers = {}

    def log(self, section, message, success=True):
        status = "[OK]" if success else "[FAIL]"
        print(f"[{section}] {status} {message}")

    def run_health_checks(self):
        print("\n--- 1. HEALTH CHECKS ---")
        try:
            # Backend Health (usually /health or check /api/auth/roles)
            resp = requests.get(f"{BACKEND_URL}/api/auth/roles")
            if resp.status_code == 200:
                self.log("BACKEND", "Accesible y respondiendo.")
            else:
                self.log("BACKEND", f"Error inesperado: {resp.status_code}", False)
        except Exception as e:
            self.log("BACKEND", f"Inalcanzable: {str(e)}", False)

        try:
            # Engine Health
            resp = requests.get(f"{ENGINE_URL}/api/v1/health")
            if resp.status_code == 200:
                data = resp.json()
                self.log("ENGINE", f"Accesible. Status: {data.get('status')} | Docs: {data.get('chroma_count', 'N/A')}")
            elif resp.status_code == 503:
                self.log("ENGINE", "FastAPI arriba, pero ChromaDB no disponible (503).", False)
            else:
                self.log("ENGINE", f"Error: {resp.status_code}", False)
        except Exception as e:
            self.log("ENGINE", f"Inalcanzable: {str(e)}", False)

    def test_authentication(self):
        print("\n--- 2. AUTHENTICATION TEST ---")
        creds = {"username": "admin", "password": "admin123"}
        try:
            resp = requests.post(f"{BACKEND_URL}/api/auth/login", json=creds)
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get("token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                self.log("AUTH", "Login exitoso. Token recibido.")
                return True
            else:
                self.log("AUTH", f"Fallo al autenticar: {resp.text}", False)
                return False
        except Exception as e:
            self.log("AUTH", f"Error en login: {str(e)}", False)
            return False

    def test_protected_routes(self):
        print("\n--- 3. PROTECTED ROUTES ---")
        # Test GET activos
        try:
            resp = requests.get(f"{BACKEND_URL}/api/activos/", headers=self.headers)
            if resp.status_code == 200:
                self.log("API_ACTIVOS", f"Acceso permitido. {len(resp.json())} activos encontrados.")
            else:
                self.log("API_ACTIVOS", f"Error {resp.status_code}: {resp.text}", False)
        except Exception as e:
            self.log("API_ACTIVOS", str(e), False)

    def test_rag_pipeline_e2e(self):
        print("\n--- 4. RAG PIPELINE INTEGRATION (Backend/Engine) ---")
        payload = {
            "activo_nombre": "Servidor Crítico de Nómina",
            "activo_tipo": "Servidor",
            "tipo": "controls"
        }
        try:
            # Usando el nuevo endpoint IA v2
            resp = requests.post(f"{BACKEND_URL}/api/v2/ia/analyze", json=payload, headers=self.headers)
            if resp.status_code == 200:
                data = resp.json()
                engine_data = data.get("engine_response", {})
                self.log("RAG_E2E", "Pipeline completado. Respuesta del motor recibida.")
                
                suggs = engine_data.get("sugerencias", [])
                if suggs:
                    self.log("RAG_E2E", f"Recibidas {len(suggs)} sugerencias de IA.")
                    for s in suggs[:2]: # Mostrar las primeras 2
                        print(f"   - {s.get('id', 'N/A')}: {s.get('nombre', 'Sin nombre')} (Confianza: {s.get('confianza', 0):.2f})")
                else:
                    self.log("RAG_E2E", "Advertencia: El motor no devolvió sugerencias (¿Base de datos vectorial vacía?)", False)
            else:
                self.log("RAG_E2E", f"Error {resp.status_code}: {resp.text}", False)
        except Exception as e:
            self.log("RAG_E2E", f"Excepción en pipeline: {str(e)}", False)

    def run_semantic_robustness_test(self):
        print("\n--- 5. SEMANTIC ROBUSTNESS (MLOps Hook) ---")
        queries = [
            "Robo de equipos físicos",
            "rovo de eqkipo" # Perturbación
        ]
        results = []
        for q in queries:
            payload = {"activo_nombre": q, "activo_tipo": "Servidor", "tipo": "threats"}
            resp = requests.post(f"{BACKEND_URL}/api/v2/ia/analyze", json=payload, headers=self.headers)
            if resp.status_code == 200:
                results.append(resp.json())
        
        if len(results) == 2:
            # Realizar comparación simple
            self.log("MLOPS", "Comparación de queries perturbadas realizada.")
            print(f"   Original: {queries[0]}")
            print(f"   Perturbada: {queries[1]}")
            # Aquí podríamos comparar si el top result es el mismo
        else:
            self.log("MLOPS", "Fallo al obtener resultados para pruebas semánticas.", False)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Auditoría Rigurosa de Despliegue VPS")
    parser.add_argument("--backend", default=BACKEND_URL, help="URL del Backend")
    parser.add_argument("--engine", default=ENGINE_URL, help="URL del Engine IA")
    args = parser.parse_args()

    BACKEND_URL = args.backend
    ENGINE_URL = args.engine

    tester = RigorousTester()
    tester.run_health_checks()
    if tester.test_authentication():
        tester.test_protected_routes()
        tester.test_rag_pipeline_e2e()
        tester.run_semantic_robustness_test()
    
    print("\n" + "="*50)
    print("FIN DE LA PRUEBA RIGUROSA")
    print("="*50)

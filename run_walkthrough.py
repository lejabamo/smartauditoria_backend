import time
import sys
import os
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def print_status(msg):
    print(f"\n[*] {msg}")
    sys.stdout.flush()

def type_like_human(element, text):
    element.clear()
    for char in text:
        element.send_keys(char)
        time.sleep(0.08) # Human-like typing delay

def select_mui_by_label(driver, wait, label_text, option_text):
    print(f"Buscando dropdown con etiqueta '{label_text}' y opción '{option_text}'...")
    sys.stdout.flush()
    # Find the label element (MUI InputLabel / FormLabel)
    label_xpath = f"//label[contains(text(), '{label_text}') or contains(., '{label_text}')]"
    label_el = wait.until(EC.presence_of_element_located((By.XPATH, label_xpath)))
    
    # Navigate to parent MuiFormControl or parent grid/div that wraps the Select
    parent_form_control = label_el.find_element(By.XPATH, "./ancestor::div[contains(@class, 'MuiFormControl-root') or contains(@class, 'MuiBox-root') or contains(@class, 'grid') or contains(@class, 'MuiGrid-root')][1]")
    
    # Find the clickable Select element inside it
    select_el = parent_form_control.find_element(By.XPATH, ".//div[contains(@class, 'MuiSelect-select') or @role='combobox' or @role='button']")
    
    # Scroll into view
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", select_el)
    time.sleep(0.5)
    
    # Click to open the dropdown
    try:
        select_el.click()
    except Exception:
        driver.execute_script("arguments[0].click();", select_el)
    
    print(f"[*] Dropdown '{label_text}' abierto. Esperando por opción '{option_text}'...")
    sys.stdout.flush()
    time.sleep(1.0)
    
    # Find the list item (MenuItem) in the portal
    option_xpath = f"//li[@role='option' and (contains(text(), '{option_text}') or contains(., '{option_text}'))]"
    try:
        option_el = wait.until(EC.element_to_be_clickable((By.XPATH, option_xpath)))
    except Exception:
        # Fallback if accent marks differ
        if option_text == "Tecnológico":
            option_xpath_alt = "//li[@role='option' and (contains(text(), 'Tecnologico') or contains(., 'Tecnologico'))]"
            option_el = wait.until(EC.element_to_be_clickable((By.XPATH, option_xpath_alt)))
        else:
            raise
            
    # Click the option
    try:
        option_el.click()
    except Exception:
        driver.execute_script("arguments[0].click();", option_el)
        
    print(f"[*] Opción '{option_text}' seleccionada con éxito.")
    sys.stdout.flush()
    time.sleep(1.0)

def main():
    print("=====================================================================")
    print("   AUTOMATIZACION DE SMARTAUDITORIA PARA GRABACION DE OBS   ")
    print("=====================================================================")
    print("\n[!] Reiniciando OBS Studio en modo GRABACIÓN AUTOMÁTICA...")
    sys.stdout.flush()
    
    # 1. Kill and Restart OBS in Recording Mode
    try:
        os.system("taskkill /f /im obs64.exe")
        time.sleep(2)
    except Exception as e:
        print(f"No se pudo matar el proceso OBS anterior o no estaba abierto: {e}")
        
    try:
        obs_dir = r"C:\Program Files\obs-studio\bin\64bit"
        obs_exe = os.path.join(obs_dir, "obs64.exe")
        if os.path.exists(obs_exe):
            subprocess.Popen([obs_exe, "--startrecording"], cwd=obs_dir)
            print_status("OBS Studio iniciado con grabación automática activa.")
            time.sleep(5) # Allow OBS to load and start recording
        else:
            print("[-] ADVERTENCIA: No se encontró OBS Studio en C:\\Program Files\\obs-studio\\bin\\64bit")
    except Exception as e:
        print(f"[-] Error al iniciar OBS Studio: {e}")
        
    print("=====================================================================\n")
    
    print_status("Inicializando Google Chrome...")
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    options.add_argument("--ignore-certificate-errors")
    
    # Init driver with fallback
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        print(f"[-] Error con ChromeDriverManager, intentando inicio directo: {e}")
        driver = webdriver.Chrome(options=options)
        
    driver.implicitly_wait(10)
    wait = WebDriverWait(driver, 15)
    
    try:
        # ----------------- PARTE 1: LOGIN -----------------
        print_status("Paso 1: Navegando a la pantalla de Login...")
        driver.get("http://localhost:5173/login")
        time.sleep(3)
        
        print_status("Ingresando credenciales...")
        user_field = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@label='Usuario' or @type='text']")))
        pass_field = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@label='Contrasena' or @type='password']")))
        
        type_like_human(user_field, "admin")
        time.sleep(0.5)
        type_like_human(pass_field, "admin123")
        time.sleep(1)
        
        print_status("Haciendo clic en 'Iniciar Sesion'...")
        login_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit' or contains(text(), 'Iniciar Sesion')]")))
        login_btn.click()
        
        # ----------------- PARTE 2: TOUR GENERAL POR SECCIONES -----------------
        # Dashboard
        print_status("Paso 2: Recorrido - Dashboard Estratégico...")
        time.sleep(4)
        for scroll in range(1, 6):
            driver.execute_script("window.scrollBy(0, 100);")
            time.sleep(0.3)
        time.sleep(3)
        for scroll in range(1, 6):
            driver.execute_script("window.scrollBy(0, -100);")
            time.sleep(0.2)
        time.sleep(1.5)
        
        # Activos
        print_status("Paso 3: Recorrido - Sección de Activos...")
        driver.get("http://localhost:5173/activos")
        time.sleep(4)
        driver.execute_script("window.scrollBy(0, 150);")
        time.sleep(2)
        driver.execute_script("window.scrollBy(0, -150);")
        time.sleep(1.5)
        
        # Wizard
        print_status("Paso 4: Recorrido - Wizard de Evaluación...")
        driver.get("http://localhost:5173/wizard")
        time.sleep(4)
        driver.execute_script("window.scrollBy(0, 200);")
        time.sleep(2)
        driver.execute_script("window.scrollBy(0, -200);")
        time.sleep(1.5)
        
        # Riesgos
        print_status("Paso 5: Recorrido - Matriz de Riesgos y Ponderaciones...")
        driver.get("http://localhost:5173/riesgos")
        time.sleep(4)
        driver.execute_script("window.scrollBy(0, 200);")
        time.sleep(2)
        driver.execute_script("window.scrollBy(0, -200);")
        time.sleep(1.5)
        
        # Auditoría
        print_status("Paso 6: Recorrido - Módulo de Auditoría y Planes de Acción...")
        driver.get("http://localhost:5173/auditoria")
        time.sleep(4)
        
        # Reportes
        print_status("Paso 7: Recorrido - Sección de Reportes...")
        driver.get("http://localhost:5173/reportes")
        time.sleep(3)
        
        # Informe de Riesgos
        print_status("Paso 8: Recorrido - Informe de Riesgos e Impactos...")
        driver.get("http://localhost:5173/reportes/informe-riesgos")
        time.sleep(4)
        driver.execute_script("window.scrollBy(0, 300);")
        time.sleep(3)
        driver.execute_script("window.scrollBy(0, -300);")
        time.sleep(1.5)
        
        # ----------------- PARTE 3: EVALUACIÓN COMPLETA DE UN ACTIVO -----------------
        print_status("Iniciando Evaluación Completa de un Activo...")
        driver.get("http://localhost:5173/wizard")
        time.sleep(4)
        
        # Paso 0: Selección de Activo
        print_status("Evaluación - Paso 0: Seleccionando primer activo disponible...")
        activo_card = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'MuiCard-root') or contains(@class, 'card')][1]")))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", activo_card)
        time.sleep(1)
        activo_card.click()
        time.sleep(1.5)
        
        next_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Siguiente')]")))
        next_btn.click()
        time.sleep(2)
        
        # Paso 1: Configurar Riesgo
        print_status("Evaluación - Paso 1: Identificación de Riesgo...")
        try:
            manual_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Identificación Manual')]")))
            manual_btn.click()
            time.sleep(1)
        except Exception:
            print("[!] Identificación manual ya activa o no encontrada.")
            
        amenaza_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Ej: Acceso no autorizado']")))
        type_like_human(amenaza_input, "Acceso no autorizado a bases de datos")
        time.sleep(0.5)
        
        vuln_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Ej: Falta de cifrado']")))
        type_like_human(vuln_input, "Falta de cifrado de datos en reposo")
        time.sleep(0.5)
        
        # Select Tipo de Riesgo
        select_mui_by_label(driver, wait, "Tipo de Riesgo", "Tecnológico")
        
        desc_input = wait.until(EC.presence_of_element_located((By.XPATH, "//textarea[@placeholder='La IA ha generado esta descripción base...']")))
        type_like_human(desc_input, "Riesgo de exfiltración de credenciales y registros financieros de la base de datos debido a la ausencia de mecanismos criptográficos adecuados en reposo.")
        time.sleep(1.5)
        
        next_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Siguiente')]")))
        next_btn.click()
        time.sleep(2)
        
        # Paso 2: Evaluación Inherente
        print_status("Evaluación - Paso 2: Evaluación Inherente...")
        select_mui_by_label(driver, wait, "Probabilidad de Ocurrencia", "Probable")
        select_mui_by_label(driver, wait, "Nivel de Impacto", "Mayor")
        
        just_input = wait.until(EC.presence_of_element_located((By.XPATH, "//textarea[contains(@placeholder, 'Explica por qué seleccionaste estos niveles')]")))
        type_like_human(just_input, "Se califica como probable e impacto mayor porque la base de datos contiene registros transaccionales críticos de la operación diaria.")
        time.sleep(1.5)
        
        next_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Siguiente')]")))
        next_btn.click()
        time.sleep(2)
        
        # Paso 3: Selección de Controles
        print_status("Evaluación - Paso 3: Asignación de Controles...")
        try:
            control_card = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Backups') or contains(text(), 'MFA') or contains(text(), 'Control')]")))
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", control_card)
            time.sleep(1)
            control_card.click()
            print("[*] Control recomendado seleccionado.")
        except Exception:
            print("[!] No se pudo seleccionar control de sugerencias, continuando con fallback.")
            
        select_mui_by_label(driver, wait, "Eficacia General de los Controles", "Alta")
        
        just_ctrl = wait.until(EC.presence_of_element_located((By.XPATH, "//textarea[@placeholder='Explica por qué has seleccionado este nivel de eficacia...']")))
        type_like_human(just_ctrl, "El control garantiza copias de respaldo fuera de línea inmunes a ransomware de manera automatizada.")
        time.sleep(1.5)
        
        next_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Siguiente')]")))
        next_btn.click()
        time.sleep(2)
        
        # Paso 4: Evaluación Residual
        print_status("Evaluación - Paso 4: Evaluación Residual...")
        select_mui_by_label(driver, wait, "Probabilidad Residual", "Improbable")
        select_mui_by_label(driver, wait, "Impacto Residual", "Insignificante")
            
        just_res = wait.until(EC.presence_of_element_located((By.XPATH, "//textarea[@placeholder='Detalle por qué el riesgo ha cambiado tras la aplicación de controles...']")))
        type_like_human(just_res, "El riesgo residual disminuye notablemente gracias a la efectividad de las salvaguardas inmutables.")
        time.sleep(1.5)
        
        next_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Siguiente')]")))
        next_btn.click()
        time.sleep(2)
        
        # Paso 5: Plan de Tratamiento
        print_status("Evaluación - Paso 5: Plan de Tratamiento...")
        select_mui_by_label(driver, wait, "Tipo de Tratamiento *", "Mitigar")
            
        resp_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Nombre o Cargo']")))
        type_like_human(resp_input, "Oficial de Seguridad TI")
        time.sleep(0.5)
        
        pres_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='0.00' or @type='number']")))
        type_like_human(pres_input, "4500")
        time.sleep(0.5)
        
        est_input = wait.until(EC.presence_of_element_located((By.XPATH, "//textarea[contains(@placeholder, 'Describa cómo los controles seleccionados mitigarán')]")))
        type_like_human(est_input, "Establecer una rutina diaria con réplica cifrada en la nube y pruebas de restauración mensuales.")
        time.sleep(1.5)
        
        next_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Siguiente')]")))
        next_btn.click()
        time.sleep(2)
        
        # Paso 6: Plan de Acción
        print_status("Evaluación - Paso 6: Revisión de Plan de Acción...")
        next_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Siguiente')]")))
        next_btn.click()
        time.sleep(2)
        
        # Paso 7: Resultados Finales
        print_status("Evaluación - Paso 7: Resultados y Confirmación...")
        save_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Confirmar y Guardar Evaluación')]")))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", save_btn)
        time.sleep(1.5)
        save_btn.click()
        
        print_status("Esperando confirmación de almacenamiento en Base de Datos...")
        time.sleep(5) # Let the toast and DB save complete
        
        # Retorno final al Dashboard
        print_status("Retornando al Dashboard para finalizar la grabación...")
        dash_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Ir al Dashboard')]")))
        dash_btn.click()
        time.sleep(4)
        
        print("\n=====================================================================")
        print("   RECORRIDO Y EVALUACION COMPLETADOS EXITOSAMENTE PARA OBS  ")
        print("=====================================================================")
        
    except Exception as e:
        print(f"\n[-] Ocurrió un error inesperado durante la ejecución: {e}")
        import traceback
        traceback.print_exc()
        
        # Capture screenshot
        try:
            driver.save_screenshot("error_screenshot.png")
            print("[*] Captura de pantalla de error guardada en error_screenshot.png")
        except Exception as se:
            print(f"No se pudo guardar captura de pantalla: {se}")
            
        # Capture DOM
        try:
            with open("error_dom.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            print("[*] HTML del DOM de error guardado en error_dom.html")
        except Exception as de:
            print(f"No se pudo guardar el DOM: {de}")
            
    finally:
        print_status("Cerrando el navegador en 3 segundos...")
        time.sleep(3)
        driver.quit()
        
        # Gracefully stop OBS recording and close OBS Studio
        print_status("Finalizando la grabación de OBS Studio...")
        try:
            os.system("taskkill /im obs64.exe")
            time.sleep(3)
        except Exception as e:
            print(f"Error al detener OBS Studio: {e}")
            
        print("[*] Proceso finalizado.")

if __name__ == "__main__":
    main()

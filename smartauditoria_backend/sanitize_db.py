import mysql.connector
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def sanitize_database():
    print("🚀 Iniciando saneamiento de la base de datos SmartAuditorIA...")
    
    config = {
        'user': 'root',
        'password': '', # Ajustar según tu configuración
        'host': 'localhost',
        'database': 'sgri',
        'charset': 'utf8mb4',
        'collation': 'utf8mb4_unicode_ci'
    }

    # Mapa de corrección de caracteres corruptos (Latin1 -> UTF8 visual fix)
    correcciones = {
        '¡': 'í',
        '¤': 'ñ',
        '??': ' ', # Limpiar interrogantes basura
        '¿': 'é',  # Dependiendo del mapping detectado
        '??': 'í',
        '??': 'ó',
        '??': 'á'
    }

    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()

        tablas = ['activos', 'amenazas', 'vulnerabilidades', 'riesgos', 'controles']
        columnas_criticas = {
            'activos': ['Nombre', 'Descripcion'],
            'amenazas': ['nombre', 'descripcion'],
            'vulnerabilidades': ['nombre', 'descripcion'],
            'riesgos': ['nombre', 'descripcion'],
            'controles': ['nombre', 'descripcion']
        }

        for tabla, columnas in columnas_criticas.items():
            print(f"📦 Procesando tabla: {tabla}...")
            for col in columnas:
                for char_bad, char_good in correcciones.items():
                    query = f"UPDATE {tabla} SET {col} = REPLACE({col}, %s, %s) WHERE {col} LIKE %s"
                    cursor.execute(query, (char_bad, char_good, f"%{char_bad}%"))
            
        conn.commit()
        print("✅ Saneamiento completado con éxito. ¡La pureza ha sido restaurada!")

    except Exception as e:
        print(f"❌ Error durante el saneamiento: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    sanitize_database()

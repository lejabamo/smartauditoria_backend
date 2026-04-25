import os
from sqlalchemy import text, create_engine

# Possible databases to fix
db_names = ['sgri', 'sgsri_db']
credentials = [('root', 'root'), ('root', 'toor')]

for dbname in db_names:
    for user, password in credentials:
        try:
            SQLALCHEMY_DATABASE_URI = f'mysql+mysqlconnector://{user}:{password}@localhost:3306/{dbname}'
            engine = create_engine(SQLALCHEMY_DATABASE_URI)
            
            with engine.connect() as connection:
                print(f"--- PROCESANDO DB: {dbname} (User: {user}) ---")
                
                # Check if vulnerabilidades table exists
                res = connection.execute(text(f"SHOW TABLES LIKE 'vulnerabilidades'")).fetchone()
                if not res:
                    print(f"Table 'vulnerabilidades' not found in {dbname}. Skipping.")
                    continue

                # 1. Update vulnerabilidades
                columns_to_add = [
                    ("categoria", "VARCHAR(255) DEFAULT 'Tecnológica'"),
                    ("severidad", "ENUM('Baja', 'Media', 'Alta', 'Crítica') DEFAULT 'Media'"),
                    ("cve_referencia", "VARCHAR(100)"),
                    ("descripcion_tecnica", "TEXT"),
                    ("impacto_potencial", "TEXT"),
                    ("controles_recomendados", "TEXT"),
                    ("fecha_creacion", "DATETIME"),
                    ("fecha_actualizacion", "DATETIME")
                ]
                
                for col_name, col_def in columns_to_add:
                    try:
                        connection.execute(text(f"ALTER TABLE vulnerabilidades ADD COLUMN {col_name} {col_def}"))
                        print(f"  [vulnerabilidades] Columna {col_name} agregada.")
                    except Exception as e:
                        if "Duplicate column name" in str(e):
                            pass # Already exists
                        else:
                            print(f"  [vulnerabilidades] Error en {col_name}: {e}")

                # 2. Update riesgos
                try:
                    connection.execute(text("ALTER TABLE riesgos ADD COLUMN tipo_riesgo VARCHAR(100) DEFAULT 'Tecnológico'"))
                except Exception as e:
                    if "Duplicate column name" not in str(e): print(f"  [riesgos] Error tipo_riesgo: {e}")
                
                try:
                    connection.execute(text("ALTER TABLE riesgos ADD COLUMN id_vulnerabilidad INT NULL"))
                except Exception as e:
                    if "Duplicate column name" not in str(e): print(f"  [riesgos] Error id_vulnerabilidad: {e}")

                connection.commit()
                print(f"MIGRACIÓN COMPLETADA PARA {dbname}.")

        except Exception as e:
            # print(f"Conexión fallida para {dbname} ({user}): {e}")
            pass

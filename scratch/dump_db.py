
import os
import sys
# Agregar el directorio principal al path para poder importar la app
sys.path.append(os.getcwd())

from app import create_app, db
from app.models import evaluacion_riesgo_activo, Activo, Riesgo

def list_tables():
    app = create_app()
    with app.app_context():
        from sqlalchemy import text
        print("\n--- TABLAS EN LA BASE DE DATOS ---")
        try:
            res = db.session.execute(text("SHOW TABLES")).fetchall()
            for r in res:
                print(r)
        except Exception as e:
            print(f"Error listando tablas: {e}")

def dump_applied_controls():
    app = create_app()
    with app.app_context():
        from sqlalchemy import text
        print("\n--- DATOS DE LA TABLA: riesgocontrolaplicado ---")
        try:
            res = db.session.execute(text("SELECT id_evaluacion_riesgo_activo, ID_Control FROM riesgocontrolaplicado")).fetchall()
            print(f"{'EVAL_ID':<10} | {'ID_CONTROL':<10}")
            for r in res:
                print(f"{r[0]:<10} | {r[1]:<10}")
        except Exception as e:
            print(f"Error volcando aplicado: {e}")

def dump_schema(table_name):
    app = create_app()
    with app.app_context():
        from sqlalchemy import text
        print(f"\n--- ESQUEMA DE LA TABLA: {table_name} ---")
        try:
            res = db.session.execute(text(f"DESCRIBE {table_name}")).fetchall()
            for r in res:
                print(r)
        except Exception as e:
            print(f"Error describiendo {table_name}: {e}")

def dump_evaluations():
    app = create_app()
    with app.app_context():
        print("--- AUDITORÍA DE EVALUACIONES DE RIESGO ---")
        # ... rest of the code ...
        evaluaciones = db.session.query(evaluacion_riesgo_activo).all()
        print(f"Total evaluaciones encontradas: {len(evaluaciones)}")
        print(f"{'ID_EVAL':<10} | {'ID_ACTIVO':<10} | {'ID_RIESGO':<10} | {'ACTIVO_NOMBRE'}")
        print("-" * 60)
        
        for e in evaluaciones:
            activo = db.session.query(Activo).filter_by(ID_Activo=e.ID_Activo).first()
            nombre = activo.Nombre if activo else "¡ACTIVO NO ENCONTRADO!"
            print(f"{e.id_evaluacion_riesgo_activo:<10} | {e.ID_Activo:<10} | {e.ID_Riesgo:<10} | {nombre}")
            
        print("\n--- AUDITORÍA DE ACTIVOS ---")
        activos = db.session.query(Activo).all()
        print(f"Total activos en sistema: {len(activos)}")
        for a in activos:
            print(f"ID: {a.ID_Activo} | Nombre: {a.Nombre}")

def compare_controls():
    app = create_app()
    with app.app_context():
        from sqlalchemy import text
        print("\n--- COMPARACIÓN DE TABLAS DE CONTROLES ---")
        try:
            c1 = db.session.execute(text("SELECT ID_Control, Nombre FROM controles LIMIT 5")).fetchall()
            c2 = db.session.execute(text("SELECT ID_Control, Nombre FROM controles_seguridad LIMIT 5")).fetchall()
            print("CONTROLES (Correcta):")
            for r in c1: print(r)
            print("\nCONTROLES_SEGURIDAD (Legacy):")
            for r in c2: print(r)
        except Exception as e:
            print(f"Error comparando controles: {e}")

if __name__ == "__main__":
    list_tables()
    dump_evaluations()
    dump_applied_controls()
    compare_controls()
    dump_schema("controles")
    dump_schema("controles_seguridad")
    dump_schema("riesgocontrolaplicado")

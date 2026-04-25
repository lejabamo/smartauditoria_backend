
import os
import sys
sys.path.append(os.getcwd())

from app import create_app, db
from sqlalchemy import text

def populate_controles():
    app = create_app()
    with app.app_context():
        print("Iniciando migración de controles...")
        try:
            # 1. Verificar si hay datos en controles
            count = db.session.execute(text("SELECT COUNT(*) FROM controles")).scalar()
            if count > 0:
                print(f"La tabla 'controles' ya tiene {count} registros. Saltando población.")
                return

            # 2. Obtener datos de controles_seguridad
            legacy_controls = db.session.execute(text("SELECT ID_Control, Nombre, Descripcion, Categoria, Tipo FROM controles_seguridad")).fetchall()
            
            if not legacy_controls:
                print("No se encontraron controles en 'controles_seguridad'.")
                # Insertar algunos por defecto si ambas están vacías
                legacy_controls = [
                    (1, 'Control de Acceso', 'Restricción de acceso a usuarios autorizados', 'Tecnologico', 'Preventivo'),
                    (2, 'Cifrado de Datos', 'Protección de datos mediante criptografía', 'Tecnologico', 'Preventivo'),
                    (3, 'Copias de Seguridad', 'Respaldo periódico de información crítica', 'Organizacional', 'Recuperacion'),
                    (4, 'Gestión de Incidentes', 'Protocolos para respuesta ante brechas', 'Organizacional', 'Correctivo'),
                    (5, 'Seguridad Física', 'Protección de perímetros y equipos', 'Fisico', 'Disuasorio')
                ]

            # 3. Mapear e insertar a 'controles'
            iso_mapping = {
                1: 'A.5.1',
                2: 'A.8.2',
                3: 'A.12.1',
                4: 'A.16.1',
                5: 'A.7.1'
            }

            for lc in legacy_controls:
                id_legacy, nombre, desc, cat, tipo = lc
                iso_code = iso_mapping.get(id_legacy, f'A.{id_legacy}')
                
                # Adaptar categoría y tipo a los enums de la nueva tabla
                # enum('Organizacional','Personas','Fisico','Tecnologico','No Aplica ISO')
                new_cat = 'Tecnologico' if 'Tec' in str(cat) else ('Fisico' if 'Fis' in str(cat) else 'Organizacional')
                
                # enum('Preventivo','Detectivo','Correctivo','Disuasorio','Recuperacion')
                new_tipo = 'Preventivo'
                if 'Det' in str(tipo): new_tipo = 'Detectivo'
                elif 'Corr' in str(tipo): new_tipo = 'Correctivo'
                elif 'Rec' in str(tipo): new_tipo = 'Recuperacion'
                elif 'Dis' in str(tipo): new_tipo = 'Disuasorio'

                db.session.execute(
                    text("""
                        INSERT INTO controles (ID_Control, codigo_control_iso, Nombre, Descripcion, Tipo_Control, categoria_control_iso, estado_implementacion)
                        VALUES (:id, :iso, :nombre, :desc, :tipo, :cat, 'Implementado')
                    """),
                    {
                        'id': id_legacy,
                        'iso': iso_code,
                        'nombre': nombre,
                        'desc': desc if desc else f'Descripción de {nombre}',
                        'tipo': new_tipo,
                        'cat': new_cat
                    }
                )
            
            db.session.commit()
            print("Migración completada exitosamente.")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error durante la migración: {e}")

def populate_lookups():
    app = create_app()
    with app.app_context():
        print("Verificando tablas maestras...")
        try:
            # Niveles de Probabilidad (PascalCase)
            if db.session.execute(text("SELECT COUNT(*) FROM nivelesprobabilidad")).scalar() == 0:
                print("Poblando nivelesprobabilidad...")
                db.session.execute(text("INSERT INTO nivelesprobabilidad (ID_NivelProbabilidad, Nombre, Valor_Numerico) VALUES (1, 'Muy Baja', 1), (2, 'Baja', 2), (3, 'Media', 3), (4, 'Alta', 4), (5, 'Muy Alta', 5)"))
            
            # Niveles de Impacto (PascalCase)
            if db.session.execute(text("SELECT COUNT(*) FROM nivelesimpacto")).scalar() == 0:
                print("Poblando nivelesimpacto...")
                db.session.execute(text("INSERT INTO nivelesimpacto (ID_NivelImpacto, Nombre, Valor_Numerico) VALUES (1, 'Insignificante', 1), (2, 'Menor', 2), (3, 'Moderado', 3), (4, 'Mayor', 4), (5, 'Catastrófico', 5)"))

            # Niveles de Riesgo
            if db.session.execute(text("SELECT COUNT(*) FROM nivelesriesgo")).scalar() == 0:
                print("Poblando nivelesriesgo...")
                db.session.execute(text("INSERT INTO nivelesriesgo (ID_NivelRiesgo, Nombre, Valor_Minimo, Valor_Maximo, Color_Hex) VALUES (1, 'Bajo', 1, 5, '#00FF00'), (2, 'Medio', 6, 12, '#FFFF00'), (3, 'Alto', 13, 25, '#FF0000')"))

            # Calificación Eficacia
            if db.session.execute(text("SELECT COUNT(*) FROM calificacioneficaciacontrol")).scalar() == 0:
                print("Poblando calificacioneficaciacontrol...")
                db.session.execute(text("INSERT INTO calificacioneficaciacontrol (ID_CalificacionEficacia, Nombre_Calificacion, Valor_Numerico) VALUES (1, 'Ineficaz', 0), (2, 'Baja', 0.3), (3, 'Media', 0.6), (4, 'Alta', 0.9)"))

            db.session.commit()
            print("Tablas maestras verificadas/pobladas.")
        except Exception as e:
            db.session.rollback()
            print(f"Error poblando maestras: {e}")

if __name__ == "__main__":
    populate_lookups()
    populate_controles()

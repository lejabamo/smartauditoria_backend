import sqlalchemy

def insert_pc():
    engine = sqlalchemy.create_engine('mysql+mysqlconnector://root:root@localhost:3306/sgsri_db')
    with engine.connect() as conn:
        conn.execute(sqlalchemy.text("INSERT INTO activos (Nombre, Descripcion, Tipo_Activo, nivel_criticidad_negocio, estado_activo) VALUES ('Este PC', 'Equipo de cómputo local para pruebas del auditor', 'Hardware', 'Alto', 'En produccion');"))
        conn.commit()
    print("Asset 'Este PC' inserted successfully into sgsri_db.")

if __name__ == '__main__':
    insert_pc()

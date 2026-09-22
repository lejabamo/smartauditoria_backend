-- ==============================================================================
-- Migración 003: Atributos de Función Pública V7 (Capítulo V) - Activos de Información
-- Compatible con MariaDB 10.11 / MySQL 8.0+
-- Idempotente: ADD COLUMN IF NOT EXISTS para evitar errores en reejecución
-- ==============================================================================

-- 1. Datos de Identificación y Ubicación (TRD)
ALTER TABLE activos ADD COLUMN IF NOT EXISTS macroproceso VARCHAR(150) NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS proceso VARCHAR(150) NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS identificador_trd VARCHAR(100) NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS oficina_responsable VARCHAR(150) NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS serie_documental VARCHAR(150) NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS subserie_documental VARCHAR(150) NULL;

-- 2. Características Técnicas y de Conservación (Activos Documentales)
ALTER TABLE activos ADD COLUMN IF NOT EXISTS soporte_registro VARCHAR(50) NULL DEFAULT 'Digital';
ALTER TABLE activos ADD COLUMN IF NOT EXISTS medio_conservacion VARCHAR(150) NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS formato VARCHAR(100) NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS idioma VARCHAR(50) NULL DEFAULT 'Español';
ALTER TABLE activos ADD COLUMN IF NOT EXISTS fecha_generacion DATE NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS fecha_ingreso_archivo DATE NULL;

-- 3. Publicación e Infraestructura Crítica
ALTER TABLE activos ADD COLUMN IF NOT EXISTS es_iccn BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS estado_publicacion VARCHAR(50) NULL DEFAULT 'No Publicada';
ALTER TABLE activos ADD COLUMN IF NOT EXISTS ubicacion_consulta TEXT NULL;

-- 4. Índice de Información Clasificada y Reservada (Ley 1712 de 2014)
ALTER TABLE activos ADD COLUMN IF NOT EXISTS es_clasificada_reservada BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS objeto_legitimo_excepcion TEXT NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS fundamento_legal TEXT NULL;
ALTER TABLE activos ADD COLUMN IF NOT EXISTS excepcion_alcance VARCHAR(50) NULL;

-- 5. Flexibilización de Enums para Compatibilidad Plena DAFP V7
ALTER TABLE activos MODIFY COLUMN Tipo_Activo VARCHAR(100) NOT NULL DEFAULT 'Información y datos';
ALTER TABLE activos MODIFY COLUMN Nivel_Clasificacion_Confidencialidad VARCHAR(50) NOT NULL DEFAULT 'Medio';
ALTER TABLE activos MODIFY COLUMN Nivel_Clasificacion_Integridad VARCHAR(50) NOT NULL DEFAULT 'Medio';
ALTER TABLE activos MODIFY COLUMN Nivel_Clasificacion_Disponibilidad VARCHAR(50) NOT NULL DEFAULT 'Medio';
ALTER TABLE activos MODIFY COLUMN nivel_criticidad_negocio VARCHAR(50) NOT NULL DEFAULT 'Medio';
ALTER TABLE activos MODIFY COLUMN estado_activo VARCHAR(50) NOT NULL DEFAULT 'En produccion';

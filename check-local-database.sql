-- Script para verificar la estructura actual de la base de datos local
-- LABUREMOS - Verificación de base de datos local

-- 1. Información general de la base de datos
SELECT 'INFORMACIÓN GENERAL' as seccion;
SELECT 
    current_database() as base_datos_actual,
    current_user as usuario_actual,
    version() as version_postgresql;

-- 2. Listar todas las tablas existentes
SELECT 'TABLAS EXISTENTES' as seccion;
SELECT 
    schemaname as esquema,
    tablename as tabla,
    tableowner as propietario
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Contar total de tablas
SELECT 'RESUMEN DE TABLAS' as seccion;
SELECT COUNT(*) as total_tablas
FROM pg_tables
WHERE schemaname = 'public';

-- 4. Ver estructura de cada tabla (si existen)
SELECT 'ESTRUCTURA DE TABLAS' as seccion;
SELECT 
    table_name as tabla,
    column_name as columna,
    data_type as tipo_dato,
    is_nullable as permite_nulo,
    column_default as valor_por_defecto
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 5. Verificar si existe configuración de Prisma
SELECT 'CONFIGURACIÓN PRISMA' as seccion;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = '_prisma_migrations'
) as prisma_instalado;

-- 6. Ver migraciones de Prisma (si existen)
SELECT 'MIGRACIONES PRISMA' as seccion;
SELECT * FROM _prisma_migrations 
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = '_prisma_migrations'
)
ORDER BY started_at DESC
LIMIT 5;

-- 7. Verificar extensiones instaladas
SELECT 'EXTENSIONES POSTGRESQL' as seccion;
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname NOT IN ('plpgsql'); -- Excluir extensión por defecto

-- 8. Tamaño de la base de datos
SELECT 'TAMAÑO DE BASE DE DATOS' as seccion;
SELECT 
    pg_database.datname as base_datos,
    pg_size_pretty(pg_database_size(pg_database.datname)) as tamaño
FROM pg_database
WHERE datname = current_database();

-- 9. Ver índices existentes
SELECT 'ÍNDICES EXISTENTES' as seccion;
SELECT 
    schemaname as esquema,
    tablename as tabla,
    indexname as indice,
    indexdef as definicion
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 10. Estado de la base para desarrollo
SELECT 'ESTADO PARA DESARROLLO' as seccion;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'BASE DE DATOS VACÍA - Lista para migraciones'
        WHEN COUNT(*) > 0 THEN 'BASE DE DATOS CON TABLAS - Verificar estructura'
    END as estado
FROM pg_tables
WHERE schemaname = 'public';
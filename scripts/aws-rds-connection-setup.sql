-- ================================================
-- LABUREMOS - AWS RDS PostgreSQL Connection Setup
-- Script para verificar y configurar conexión AWS RDS
-- Endpoint: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com
-- ================================================

-- =============================================
-- PASO 1: VERIFICACIÓN DE CONEXIÓN AWS RDS
-- =============================================

-- Información básica del servidor
SELECT 
    'AWS RDS PostgreSQL Connection Test' as test_name,
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port,
    now() as connection_time;

-- Verificar configuración SSL
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings 
WHERE name LIKE '%ssl%' OR name LIKE '%tls%'
ORDER BY name;

-- Verificar extensiones disponibles
SELECT 
    extname as extension_name,
    extversion as version,
    nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY extname;

-- =============================================
-- PASO 2: CONFIGURACIÓN DE BASE DE DATOS
-- =============================================

-- Crear base de datos laburemos si no existe (solo si tienes permisos)
-- NOTA: En RDS, la base de datos normalmente ya está creada
SELECT 'laburemos' as target_database, 
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_database WHERE datname = 'laburemos') 
           THEN 'Database exists' 
           ELSE 'Database does not exist - create manually' 
       END as status;

-- =============================================
-- PASO 3: VERIFICAR PERMISOS Y ACCESOS
-- =============================================

-- Verificar permisos del usuario actual
SELECT 
    rolname as role_name,
    rolsuper as is_superuser,
    rolcreaterole as can_create_roles,
    rolcreatedb as can_create_databases,
    rolcanlogin as can_login,
    rolconnlimit as connection_limit
FROM pg_roles 
WHERE rolname = current_user;

-- Listar bases de datos accesibles
SELECT 
    datname as database_name,
    datdba as owner_oid,
    encoding,
    datcollate as collation,
    datctype as ctype,
    datacl as access_privileges
FROM pg_database 
WHERE datallowconn = true
ORDER BY datname;

-- =============================================
-- PASO 4: CONFIGURACIONES DE RENDIMIENTO RDS
-- =============================================

-- Configuraciones importantes para AWS RDS
SELECT 
    name as setting_name,
    setting as current_value,
    unit,
    category,
    short_desc as description
FROM pg_settings 
WHERE name IN (
    'max_connections',
    'shared_buffers', 
    'effective_cache_size',
    'maintenance_work_mem',
    'checkpoint_completion_target',
    'wal_buffers',
    'default_statistics_target',
    'random_page_cost',
    'effective_io_concurrency',
    'work_mem'
)
ORDER BY name;

-- Verificar estado de replicación (si aplicable)
SELECT 
    application_name,
    client_addr,
    state,
    sync_state,
    sync_priority
FROM pg_stat_replication;

-- =============================================
-- PASO 5: PREPARAR PARA SCHEMA PRISMA
-- =============================================

-- Crear extensiones necesarias para Prisma (si no existen)
DO $$
BEGIN
    -- UUID extension para IDs únicos
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        RAISE NOTICE 'Extension uuid-ossp created successfully';
    ELSE
        RAISE NOTICE 'Extension uuid-ossp already exists';
    END IF;
    
    -- Crypto extension para hashing
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        RAISE NOTICE 'Extension pgcrypto created successfully';
    ELSE
        RAISE NOTICE 'Extension pgcrypto already exists';
    END IF;
    
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privileges to create extensions. Contact RDS administrator.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating extensions: %', SQLERRM;
END
$$;

-- Verificar que las extensiones estén disponibles
SELECT 
    extname as extension_name,
    extversion as version,
    nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- =============================================
-- PASO 6: INFORMACIÓN DE CONEXIÓN PARA PRISMA
-- =============================================

-- Generar string de conexión para Prisma
SELECT 
    'postgresql://' || 
    current_user || ':' ||
    '[PASSWORD]' || '@' ||
    inet_server_addr() || ':' ||
    inet_server_port() || '/' ||
    current_database() as prisma_connection_string;

-- Información para configurar .env
SELECT 
    'DATABASE_URL' as env_variable,
    'postgresql://postgres:[PASSWORD]@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos' as env_value;

-- =============================================
-- PASO 7: HEALTH CHECK FINAL
-- =============================================

-- Resumen de configuración
SELECT 
    'AWS RDS Health Check' as check_name,
    current_database() as database,
    current_user as user_name,
    version() as pg_version,
    (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
    (SELECT setting FROM pg_settings WHERE name = 'shared_buffers') as shared_buffers,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
    now() as check_time;

-- Estado de la base de datos
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Mostrar información final para PgAdmin 4
SELECT 
    '=== CONFIGURACIÓN PARA PGADMIN 4 ===' as section,
    'Host: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com' as host_info,
    'Port: 5432' as port_info,
    'Database: laburemos' as database_info,
    'Username: postgres (or configured RDS user)' as user_info,
    'SSL Mode: Require' as ssl_info,
    'Connection successful!' as status;
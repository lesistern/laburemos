-- ================================================
-- LABUREMOS - PostgreSQL Local Database Setup
-- Script para configuración inicial de PostgreSQL local
-- Compatible con PgAdmin 4 y Prisma ORM
-- ================================================

-- Crear base de datos LABUREMOS (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'laburemos') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE laburemos');
    END IF;
END
$$;

-- Conectar a la base de datos laburemos
\c laburemos;

-- Crear schema principal si no existe
CREATE SCHEMA IF NOT EXISTS public;

-- Configurar permisos para el usuario postgres
GRANT ALL PRIVILEGES ON DATABASE laburemos TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuraciones de rendimiento para desarrollo local
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configuraciones de logging para desarrollo
ALTER SYSTEM SET log_destination = 'stderr';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Configuraciones de conexión
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET listen_addresses = 'localhost';
ALTER SYSTEM SET port = 5432;

-- Aplicar configuraciones (requiere reinicio del servicio PostgreSQL)  
SELECT pg_reload_conf();

-- Verificar configuración
SELECT name, setting, unit, context 
FROM pg_settings 
WHERE name IN (
    'shared_buffers', 
    'effective_cache_size', 
    'max_connections',
    'port',
    'listen_addresses'
);

-- Crear usuario de aplicación (opcional, para mayor seguridad)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'laburemos_app') THEN
        CREATE USER laburemos_app WITH ENCRYPTED PASSWORD 'laburemos_local_2025';
        GRANT CONNECT ON DATABASE laburemos TO laburemos_app;
        GRANT USAGE ON SCHEMA public TO laburemos_app;
        GRANT CREATE ON SCHEMA public TO laburemos_app;
    END IF;
END
$$;

-- Información de conexión para PgAdmin 4
SELECT 
    'Configuración completada exitosamente' as status,
    'localhost' as host,
    5432 as port,
    'laburemos' as database,
    'postgres' as username,
    'Usar contraseña configurada localmente' as password_note;

-- Mostrar estado de extensiones
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Verificar que Prisma puede conectarse
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    now() as connection_time;
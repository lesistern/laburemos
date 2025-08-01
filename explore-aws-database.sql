-- Script para explorar la base de datos AWS RDS
-- LABUREMOS - Exploración inicial de la base de datos

-- 1. Verificar la conexión y versión
SELECT version();

-- 2. Ver información de la base de datos actual
SELECT current_database(), current_user, inet_server_addr(), inet_server_port();

-- 3. Listar todas las tablas (si existen)
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Contar tablas
SELECT COUNT(*) as total_tablas
FROM pg_tables
WHERE schemaname = 'public';

-- 5. Ver el tamaño de la base de datos
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'laburemos';

-- 6. Listar todos los esquemas
SELECT schema_name 
FROM information_schema.schemata
WHERE schema_name NOT LIKE 'pg_%'
AND schema_name != 'information_schema'
ORDER BY schema_name;

-- 7. Ver configuración de encoding
SHOW server_encoding;
SHOW client_encoding;

-- 8. Verificar si existe el esquema de Prisma (para el backend NestJS)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = '_prisma_migrations'
) as prisma_configurado;

-- 9. Listar extensiones instaladas
SELECT * FROM pg_extension;

-- 10. Ver privilegios del usuario actual
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = current_user;
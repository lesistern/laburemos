-- Test database connection and structure
SELECT 'Testing connection...' as status;
SHOW DATABASES;
USE laburemos_db;
SELECT 'Using laburemos_db database' as status;
SHOW TABLES;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'laburemos_db';
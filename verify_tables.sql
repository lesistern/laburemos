USE laburemos_db;
SHOW TABLES;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'laburemos_db';
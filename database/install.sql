-- ================================
-- LABUREMOS Complete Database Installation
-- Execute this file to install the complete database
-- ================================

-- Source all SQL files in order
SOURCE 01-create-database.sql;
SOURCE 02-trust-signals.sql;
SOURCE 03-projects-payments.sql;
SOURCE 04-communication.sql;
SOURCE 05-initial-data.sql;

-- Final verification
SELECT 
    'LABUREMOS Database Installation Complete!' as Status,
    COUNT(DISTINCT table_name) as 'Total Tables',
    NOW() as 'Installation Date'
FROM information_schema.tables 
WHERE table_schema = 'laburemos_db';

-- Show table summary
SELECT 
    table_name as 'Table Name',
    table_rows as 'Rows',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'laburemos_db' 
ORDER BY table_name;
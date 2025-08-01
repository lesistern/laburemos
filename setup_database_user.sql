-- Setup database and user
DROP DATABASE IF EXISTS laburemos_db;
CREATE DATABASE laburemos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'laburemos_user'@'localhost' IDENTIFIED BY 'Tyr1945@';
GRANT ALL PRIVILEGES ON laburemos_db.* TO 'laburemos_user'@'localhost';
GRANT ALL PRIVILEGES ON laburemos_db.* TO 'laburemos_user'@'%';
FLUSH PRIVILEGES;

USE laburemos_db;
SELECT 'Database created and user configured' as status;
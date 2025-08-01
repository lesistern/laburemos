USE laburemos_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('CLIENT', 'FREELANCER', 'ADMIN') NOT NULL DEFAULT 'CLIENT',
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(255),
    country VARCHAR(255) DEFAULT 'Argentina',
    city VARCHAR(255),
    profile_image TEXT,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'VERIFIED') NOT NULL DEFAULT 'ACTIVE',
    email_verified_at DATETIME,
    phone_verified_at DATETIME,
    last_active DATETIME,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_last_active (last_active)
);

SELECT 'Users table created successfully' as result;
SHOW TABLES;
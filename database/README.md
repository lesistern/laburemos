# 🗄️ LABUREMOS Database Installation

## 📋 Overview

This directory contains the complete database structure for the LABUREMOS platform. The database is designed to support a professional freelance marketplace with local features and MercadoPago integration.

## 🚀 Quick Installation

### Option 1: Complete Installation
```bash
# From MySQL command line or phpMyAdmin
mysql -u root -p < install.sql
```

### Option 2: Step by Step
```bash
mysql -u root -p < 01-create-database.sql
mysql -u root -p < 02-trust-signals.sql
mysql -u root -p < 03-projects-payments.sql
mysql -u root -p < 04-communication.sql
mysql -u root -p < 05-initial-data.sql
```

## 📁 File Structure

| File | Description | Tables Created |
|------|-------------|----------------|
| `01-create-database.sql` | Core system setup | users, user_profiles, categories, services, service_packages |
| `02-trust-signals.sql` | Trust and verification system | trust_signals, afip_verifications, user_reputation, badges |
| `03-projects-payments.sql` | Projects and payment system | projects, payments, invoices, mercadopago_config, escrow_accounts |
| `04-communication.sql` | Chat and notifications | conversations, messages, notifications, reviews, network_connections |
| `05-initial-data.sql` | Sample data and configuration | provinces, payment_methods, system_settings, admin user |
| `install.sql` | Complete installation script | All tables |

## 🔧 Database Configuration

### Default Settings
- **Database Name**: `laburemos_db`
- **Charset**: `utf8mb4_spanish_ci`
- **Engine**: `InnoDB`
- **Default User**: `laburemos_user` (create manually)

### Required MySQL Version
- MySQL 5.7+ or MariaDB 10.3+
- JSON support required

## 👤 Default Admin User

After installation, you can login with:
- **Email**: `admin@laburemos.com`
- **Password**: `LABUREMOS2025!`

## 🧪 Test Users

The installation includes sample test users:

### Freelancer Account
- **Email**: `freelancer@test.com`
- **Password**: `LABUREMOS2025!`
- **Type**: Freelancer
- **Sample Service**: WordPress development

### Client Account
- **Email**: `cliente@test.com`
- **Password**: `LABUREMOS2025!`
- **Type**: Client

## 📊 Database Statistics

After installation, the database will contain:
- **40+ Tables** for complete functionality
- **15 Main Categories** from categorias.txt
- **24 Provinces** + CABA configured
- **10 Payment Methods** for MercadoPago
- **5 Default Badges** for user reputation
- **Complete Trust System** with AFIP integration

## 🔒 Security Features

### Implemented Security
- Password hashing with bcrypt
- Rate limiting tables
- Audit logging system
- Foreign key constraints
- Input validation via constraints

### Database User Creation
```sql
-- Run as MySQL root user
CREATE USER 'laburemos_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON laburemos_db.* TO 'laburemos_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🔧 Post-Installation Setup

### 1. Configure MercadoPago
```sql
-- Update with your actual MercadoPago credentials
UPDATE mercadopago_config 
SET access_token = 'your_access_token',
    public_key = 'your_public_key'
WHERE id = 1;
```

### 2. Update System Settings
```sql
-- Set production mode
UPDATE system_settings 
SET setting_value = 'false' 
WHERE setting_key = 'mercadopago_sandbox';

-- Configure support email
UPDATE system_settings 
SET setting_value = 'your-email@domain.com' 
WHERE setting_key = 'support_email';
```

### 3. Verify Installation
```sql
-- Check all tables are created
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'laburemos_db';

-- Verify sample data
SELECT COUNT(*) as categories FROM categories;
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as services FROM services;
```

## 📈 Performance Optimization

### Recommended Indexes
All necessary indexes are created automatically during installation:
- Search indexes on services
- User lookup indexes
- Date-based indexes for analytics
- Foreign key indexes

### MySQL Configuration
Add to your `my.cnf`:
```ini
[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_spanish_ci
innodb_buffer_pool_size = 256M
```

## 🔄 Migration and Updates

### Backup Before Updates
```bash
mysqldump -u root -p laburemos_db > laburemos_backup_$(date +%Y%m%d).sql
```

### Future Migrations
Migration scripts will be added to `/database/migrations/` directory.

## 🐛 Troubleshooting

### Common Issues

#### 1. Character Set Issues
```sql
-- Fix character set
ALTER DATABASE laburemos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
```

#### 2. Foreign Key Errors
```sql
-- Disable FK checks temporarily
SET FOREIGN_KEY_CHECKS = 0;
-- Run your queries
SET FOREIGN_KEY_CHECKS = 1;
```

#### 3. JSON Column Issues
- Requires MySQL 5.7+ or MariaDB 10.3+
- Ensure JSON functions are available

### Error Logs
Check MySQL error logs:
```bash
# Ubuntu/Debian
tail -f /var/log/mysql/error.log

# CentOS/RHEL
tail -f /var/log/mysqld.log
```

## 📞 Support

For database-related issues:
1. Check this README first
2. Verify MySQL version compatibility
3. Check error logs
4. Ensure proper user permissions

## 🔮 Future Enhancements

Planned database improvements:
- Read replicas for better performance
- Partitioning for large tables
- Advanced analytics tables
- Real-time reporting views

---

*Database created on July 23, 2025 - LABUREMOS Development Team*
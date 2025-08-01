# 🔄 LaburAR - Database Synchronization Guide

**Dual Database Architecture**: PostgreSQL (AWS Production) + MySQL (XAMPP Local)

## 📊 **Current Database Setup**

### **🌐 AWS Production (PostgreSQL)**
- **Host**: `laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com`
- **Engine**: PostgreSQL
- **Script**: `/database/create_laburemos_complete_schema.sql`
- **Status**: 🟢 ACTIVE (Production Ready)

### **💻 Local Development (MySQL/XAMPP)**
- **Host**: `localhost`
- **Engine**: MySQL 8.0+ (XAMPP)
- **Script**: `/database/create_laburemos_mysql.sql`
- **Access**: http://localhost/phpmyadmin
- **Database**: `laburemos_db`

## 🏗️ **Database Structure**

Both databases maintain **identical structure** with 35 tables:

### **Core Tables (Same in both)**
```
users, freelancer_profiles, skills, freelancer_skills
categories, services, service_packages
projects, proposals, project_milestones
conversations, messages, video_calls
wallets, payment_methods, transactions, escrow_accounts
reviews, user_reputation, badges, user_badges
notifications, file_uploads, favorites
disputes, support_tickets, activity_logs
user_analytics, notification_preferences
... (35 tables total)
```

## 🚀 **Deployment Commands**

### **1. Setup Local Development (XAMPP)**
```bash
# Start XAMPP services
cd D:\Laburar
.\start-windows.bat

# Access phpMyAdmin
# → http://localhost/phpmyadmin

# Import MySQL script
# → Import: /database/create_laburemos_mysql.sql
# → Database: laburemos_db (created automatically)
```

### **2. Deploy to AWS Production (PostgreSQL)**
```bash
# Connect to AWS RDS
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d laburemos \
     -f /mnt/d/Laburar/database/create_laburemos_complete_schema.sql

# OR via EC2 instance
ssh -i /tmp/laburemos-key.pem ec2-user@3.81.56.168
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com \
     -U postgres -d laburemos \
     -f create_laburemos_complete_schema.sql
```

## 🔄 **Synchronization Process**

### **Schema Updates**
When updating database structure:

1. **Update ER Diagram**: `/database-er-final-fixed.md`
2. **Regenerate PostgreSQL**: Update `create_laburemos_complete_schema.sql`
3. **Regenerate MySQL**: Update `create_laburemos_mysql.sql`
4. **Deploy Both**: Local XAMPP + AWS RDS

### **Data Migration Commands**
```bash
# Export from Local MySQL to AWS PostgreSQL
mysqldump -u root laburemos_db > backup_mysql.sql
# Convert and import to PostgreSQL (manual process)

# Export from AWS PostgreSQL to Local MySQL  
pg_dump -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com \
        -U postgres laburemos > backup_postgres.sql
# Convert and import to MySQL (manual process)
```

## 🔧 **Development Workflow**

### **Local Development**
```bash
# 1. Develop with MySQL/XAMPP
cd frontend && npm run dev     # → http://localhost:3000
cd backend && npm run start:dev # → http://localhost:3001/docs

# 2. Test with local MySQL
# → Prisma connects to MySQL (see DATABASE_URL in .env)
# → phpMyAdmin for database management
```

### **Production Deployment**
```bash
# 1. Deploy to AWS (automated)
./deploy.sh production

# 2. Backend connects to PostgreSQL RDS
# → Environment variables point to AWS RDS
# → Production Prisma schema uses PostgreSQL
```

## 📋 **Type Equivalences**

| Feature | PostgreSQL (AWS) | MySQL (XAMPP) |
|---------|------------------|---------------|
| **Auto IDs** | `SERIAL` | `AUTO_INCREMENT` |
| **JSON Data** | `JSONB` | `JSON` |
| **IP Addresses** | `INET` | `VARCHAR(45)` |
| **UUIDs** | `UUID` | `CHAR(36)` |
| **Timestamps** | `TIMESTAMP` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |
| **Booleans** | `BOOLEAN` | `TINYINT(1)` |
| **Arrays** | `TEXT[]` | `JSON` |
| **Enums** | `CREATE TYPE` | `ENUM()` inline |

## 🛠️ **NestJS/Prisma Configuration**

### **Local Development (.env.local)**
```env
DATABASE_URL="mysql://root:@localhost:3306/laburemos_db"
```

### **Production (.env.production)**
```env
DATABASE_URL="postgresql://postgres:password@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos"
```

### **Prisma Schema**
```prisma
// Supports both databases
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "mysql" depending on environment
  url      = env("DATABASE_URL")
}
```

## ✅ **Verification Checklist**

### **Local MySQL (XAMPP)**
- [ ] XAMPP running with MySQL started
- [ ] Database `laburemos_db` created
- [ ] All 35 tables present
- [ ] Foreign keys working
- [ ] Sample data loaded
- [ ] phpMyAdmin accessible

### **AWS PostgreSQL (RDS)**
- [ ] RDS instance active
- [ ] Connection from EC2 working
- [ ] All 35 tables present
- [ ] Foreign keys working
- [ ] Sample data loaded
- [ ] Backend API connected

### **Synchronization**
- [ ] Both databases have identical structure
- [ ] Prisma schema supports both
- [ ] Environment variables configured
- [ ] Data migration scripts ready

## 🚨 **Important Notes**

1. **Schema Changes**: Always update BOTH scripts simultaneously
2. **Data Migration**: Manual process between PostgreSQL ↔ MySQL
3. **Primary Keys**: Both use auto-increment (different syntax)
4. **JSON Fields**: Both support JSON (JSONB vs JSON)
5. **Foreign Keys**: InnoDB required for MySQL
6. **Charset**: Use `utf8mb4_unicode_ci` for full UTF-8 support

## 📞 **Support**

- **Local Issues**: Check XAMPP status, restart MySQL service
- **AWS Issues**: Check RDS status, security groups, credentials
- **Prisma Issues**: Verify DATABASE_URL and database provider
- **Sync Issues**: Compare table structures between databases

---

**Last Updated**: 2025-08-01  
**Version**: Dual Database v1.0  
**Status**: 🟢 Both databases ready and synchronized
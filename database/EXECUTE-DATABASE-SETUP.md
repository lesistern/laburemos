# 🚀 LaburAR - Execute Database Setup

**Instrucciones para ejecutar ambas bases de datos funcionales**

## 📋 **Paso 1: Base de Datos Local (MySQL/XAMPP)**

### **A. Verificar XAMPP Running**
```bash
# En Windows (desde D:\Laburar\)
.\start-windows.bat

# Verificar que MySQL esté iniciado:
# → XAMPP Control Panel: MySQL "Running"
# → Apache también debe estar "Running"
```

### **B. Ejecutar Script MySQL**
```bash
# 1. Abrir phpMyAdmin
http://localhost/phpmyadmin

# 2. Crear/verificar base de datos
# → Click "New" en sidebar izquierdo
# → Database name: "laburemos_db"
# → Collation: "utf8mb4_unicode_ci"
# → Click "Create"

# 3. Importar script completo
# → Click en "laburemos_db"
# → Tab "Import"
# → Choose file: "D:\Laburar\database\create_laburemos_mysql.sql"
# → Click "Go"

# 4. Verificar resultado
# → Debe mostrar: "35 tables created successfully"
# → Ver sidebar: 35 tablas listadas
```

### **C. Verificación MySQL**
```sql
-- Ejecutar en phpMyAdmin SQL tab
SHOW TABLES;
-- Debe mostrar 35 tablas

SELECT COUNT(*) FROM users;
-- Debe mostrar al menos 1 (usuario admin)

SELECT * FROM categories;
-- Debe mostrar 8 categorías iniciales
```

## 📋 **Paso 2: Base de Datos AWS (PostgreSQL/RDS)**

### **A. Instalar Cliente PostgreSQL (en WSL/Linux)**
```bash
# Actualizar e instalar
sudo apt update
sudo apt install -y postgresql-client

# Verificar instalación
psql --version
```

### **B. Conectar y Ejecutar Script**
```bash
# Conectar a AWS RDS
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d laburemos \
     -p 5432

# Si pide password, usar la que configuraste al crear RDS

# Una vez conectado, ejecutar script
\i /mnt/d/Laburar/database/create_laburemos_complete_schema.sql

# Verificar resultado
\dt
-- Debe mostrar 35 tablas

SELECT COUNT(*) FROM users;
-- Debe mostrar al menos 1 (usuario admin)
```

### **C. Alternativa: Via EC2**
```bash
# SSH a tu EC2 existente
ssh -i /tmp/laburemos-key.pem ec2-user@3.81.56.168

# Instalar PostgreSQL client en EC2
sudo yum install -y postgresql

# Subir el archivo (desde tu máquina local)
scp -i /tmp/laburemos-key.pem /mnt/d/Laburar/database/create_laburemos_complete_schema.sql ec2-user@3.81.56.168:~/

# Ejecutar desde EC2
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d laburemos \
     -f create_laburemos_complete_schema.sql
```

## 📋 **Paso 3: Verificación Completa**

### **A. Verificar Estructuras**
```bash
# MySQL (phpMyAdmin)
SHOW TABLES;
DESCRIBE users;
SHOW CREATE TABLE users;

# PostgreSQL (psql)
\dt
\d users
\d+ users
```

### **B. Verificar Datos Iniciales**
```sql
-- En ambas bases de datos:

-- Verificar usuario admin
SELECT * FROM users WHERE email = 'admin@laburemos.com.ar';

-- Verificar categorías
SELECT * FROM categories ORDER BY sort_order;

-- Verificar skills
SELECT * FROM skills WHERE is_verified = true;

-- Verificar badge categories
SELECT * FROM badge_categories ORDER BY sort_order;
```

### **C. Verificar Foreign Keys**
```sql
-- MySQL
SELECT 
    TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'laburemos_db'
LIMIT 10;

-- PostgreSQL
SELECT
    tc.table_name, kcu.column_name, tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
LIMIT 10;
```

## 🔧 **Configuración Backend**

### **A. Variables de Entorno**
```bash
# .env.local (desarrollo)
DATABASE_URL="mysql://root:@localhost:3306/laburemos_db"

# .env.production (AWS)
DATABASE_URL="postgresql://postgres:TU_PASSWORD@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos"
```

### **B. Actualizar Prisma Schema**
```bash
# En backend/
npx prisma generate
npx prisma db push  # Sincronizar con tu DB actual
```

## 🎯 **Comandos de Verificación Final**

### **Test de Conexión**
```bash
# Desde backend/
cd D:\Laburar\backend

# Test MySQL local
npm run db:migrate
npm run db:seed

# Test API local
npm run start:dev
# → http://localhost:3001/docs

# Test endpoints básicos
curl http://localhost:3001/api/categories
curl http://localhost:3001/api/users/me
```

## ✅ **Checklist de Finalización**

### **MySQL Local (XAMPP)**
- [ ] XAMPP running (MySQL + Apache)
- [ ] Database "laburemos_db" created
- [ ] 35 tables imported successfully
- [ ] Admin user exists
- [ ] Categories and skills loaded
- [ ] Foreign keys working
- [ ] phpMyAdmin accessible

### **PostgreSQL AWS (RDS)**
- [ ] psql client installed
- [ ] Connection to RDS successful
- [ ] 35 tables created successfully
- [ ] Admin user exists
- [ ] Categories and skills loaded
- [ ] Foreign keys working
- [ ] Backend can connect

### **Synchronization**
- [ ] Both databases have identical structure
- [ ] Same data in both databases
- [ ] Environment variables configured
- [ ] Prisma schema updated
- [ ] Backend API functional

## 🚨 **Si Hay Problemas**

### **MySQL Issues**
```bash
# Si phpMyAdmin no carga
# → Verificar Apache running en XAMPP
# → Verificar puerto 80 libre

# Si import falla
# → Verificar tamaño de archivo en php.ini
# → max_execution_time = 300
# → upload_max_filesize = 100M
```

### **PostgreSQL Issues**
```bash
# Si conexión falla
# → Verificar security groups AWS (puerto 5432)
# → Verificar credenciales RDS
# → Verificar region (us-east-1)

# Si script falla
# → Ejecutar línea por línea
# → Verificar permisos de usuario postgres
```

---

**Ejecutar en orden**: MySQL (XAMPP) → PostgreSQL (AWS) → Verificación  
**Tiempo estimado**: 15-30 minutos  
**Resultado**: Bases de datos funcionales y sincronizadas
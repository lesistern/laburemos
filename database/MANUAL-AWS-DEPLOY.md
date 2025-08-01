# 🚀 Manual AWS Database Deployment Guide

**Implementar base de datos PostgreSQL en AWS RDS manualmente**

## 📋 **Opción 1: Conexión Directa desde WSL**

### **Paso 1: Verificar Credenciales RDS**
```bash
# Necesitas la password del usuario postgres de RDS
# Si no la recuerdas, puedes resetearla en AWS Console:
# → RDS → Databases → laburemos-db → Modify → New master password
```

### **Paso 2: Ejecutar Deployment**
```bash
# Conectar y ejecutar script
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -p 5432

# Una vez conectado:
CREATE DATABASE laburemos;
\c laburemos
\i /mnt/d/Laburar/database/create_laburemos_complete_schema.sql

# Verificar resultado:
\dt
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM categories;
```

## 📋 **Opción 2: Via EC2 (Recomendado)**

### **Paso 1: Obtener clave EC2**
```bash
# Descargar desde AWS Console:
# → EC2 → Key Pairs → laburemos-key → Actions → Download
# → Guardar como: /tmp/laburemos-key.pem
# → chmod 400 /tmp/laburemos-key.pem
```

### **Paso 2: Ejecutar via EC2**
```bash
# Script automático (si tienes la clave)
/mnt/d/Laburar/database/deploy-via-ec2.sh

# O manual:
ssh -i /tmp/laburemos-key.pem ec2-user@3.81.56.168

# Dentro de EC2:
sudo yum install -y postgresql
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres
```

## 📋 **Opción 3: Manual Step-by-Step**

### **A. Preparar archivos**
```bash
# Subir script a EC2
scp -i /tmp/laburemos-key.pem \
    /mnt/d/Laburar/database/create_laburemos_complete_schema.sql \
    ec2-user@3.81.56.168:~/
```

### **B. Ejecutar en EC2**
```bash
# Conectar SSH
ssh -i /tmp/laburemos-key.pem ec2-user@3.81.56.168

# Instalar PostgreSQL client
sudo yum update -y
sudo yum install -y postgresql

# Conectar a RDS
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres

# Crear database
CREATE DATABASE laburemos;
\c laburemos

# Ejecutar script
\i create_laburemos_complete_schema.sql

# Verificar
\dt
SELECT COUNT(*) FROM users WHERE email = 'admin@laburemos.com.ar';
SELECT COUNT(*) FROM categories;
\q
exit
```

## 📋 **Opción 4: Usando AWS CLI + RDS Data API**

### **Prerequisitos**
```bash
# Instalar AWS CLI
sudo apt install -y awscli

# Configurar
aws configure
# → Access Key ID: [tu access key]
# → Secret Access Key: [tu secret key]  
# → Region: us-east-1
# → Format: json
```

### **Habilitar Data API**
```bash
# En AWS Console:
# → RDS → laburemos-db → Configuration
# → Enable Data API: Yes
# → Create secret in Secrets Manager for database credentials
```

### **Ejecutar via Data API**
```bash
# Obtener ARN del cluster y secret
CLUSTER_ARN="arn:aws:rds:us-east-1:529496937346:cluster:laburemos-db"
SECRET_ARN="arn:aws:secretsmanager:us-east-1:529496937346:secret:rds-db-credentials"

# Ejecutar script SQL
aws rds-data execute-statement \
    --resource-arn "$CLUSTER_ARN" \
    --secret-arn "$SECRET_ARN" \
    --database "laburemos" \
    --sql "$(cat /mnt/d/Laburar/database/create_laburemos_complete_schema.sql)"
```

## 🔧 **Troubleshooting**

### **Error de Conexión**
```bash
# Verificar Security Groups en AWS Console:
# → EC2 → Security Groups → rds-launch-wizard-X
# → Inbound rules → Port 5432 → Source: Anywhere (0.0.0.0/0)

# Verificar RDS status:
# → RDS → Databases → laburemos-db → Status: Available
```

### **Error de Credenciales**
```bash
# Reset password en AWS Console:
# → RDS → laburemos-db → Modify → New master password
# → Apply immediately: Yes
```

### **Error de Red desde WSL**
```bash
# Verificar conectividad
ping laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com

# Si falla, usar EC2 como jump server
ssh -i /tmp/laburemos-key.pem ec2-user@3.81.56.168
ping laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com
```

## ✅ **Verificación Final**

### **Comando de Verificación**
```sql
-- Verificar estructura completa
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Debe mostrar 35 tablas

-- Verificar datos iniciales
SELECT * FROM users WHERE email = 'admin@laburemos.com.ar';
SELECT name, slug FROM categories ORDER BY sort_order;
SELECT name FROM skills WHERE is_verified = true LIMIT 5;
```

### **Conexión desde Backend**
```bash
# Actualizar .env.production
DATABASE_URL="postgresql://postgres:TU_PASSWORD@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos"

# Test conexión
cd /mnt/d/Laburar/backend
npm run start:prod
```

## 📱 **Siguiente Paso: Sincronización con XAMPP**

Una vez que AWS esté funcionando, ejecutar:
```bash
# Script de sincronización (próximo paso)
/mnt/d/Laburar/database/sync-aws-xampp.sh
```

---

**¿Cuál opción prefieres usar?**
- **Opción 1**: Si tienes la password de RDS
- **Opción 2**: Si puedes obtener la clave EC2 (recomendado)
- **Opción 3**: Paso a paso manual
- **Opción 4**: Si quieres usar AWS CLI
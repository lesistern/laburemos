# LABUREMOS - Guía Completa PgAdmin 4 + PostgreSQL + AWS RDS

## 🎯 Configuración Completa PostgreSQL con PgAdmin 4

### 📋 Índice
1. [Configuración Servidor Local PostgreSQL](#1-configuración-servidor-local-postgresql)
2. [Configuración AWS RDS PostgreSQL](#2-configuración-aws-rds-postgresql)
3. [Scripts de Migración y Sincronización](#3-scripts-de-migración-y-sincronización)
4. [Procedimientos de Backup y Restore](#4-procedimientos-de-backup-y-restore)
5. [Troubleshooting y Solución de Problemas](#5-troubleshooting-y-solución-de-problemas)
6. [Comandos de Verificación](#6-comandos-de-verificación)

---

## 🔧 1. Configuración Servidor Local PostgreSQL

### **Paso 1: Instalación y Configuración PostgreSQL Local**

#### **1.1 Verificar Instalación PostgreSQL**
```bash
# Verificar PostgreSQL está instalado y ejecutándose
psql --version
sudo systemctl status postgresql   # Linux
net start postgresql-x64-13       # Windows

# Verificar puerto 5432 está disponible
netstat -an | grep 5432
```

#### **1.2 Configurar PostgreSQL para Desarrollo**
```bash
# Ejecutar script de configuración local
cd C:\laburemos\scripts
psql -U postgres -f setup-pgadmin-local-config.sql
```

### **Paso 2: Crear Servidor en PgAdmin 4**

#### **2.1 Abrir PgAdmin 4 y Crear Servidor**
1. **Abrir PgAdmin 4**
2. **Click derecho en "Servers"** → **"Create"** → **"Server..."**

#### **2.2 Configuración Pestaña "General"**
```
Name: LABUREMOS Local PostgreSQL
Server Group: Servers  
Comments: Servidor PostgreSQL local para desarrollo LABUREMOS
Color: #2E8B57 (Verde)
```

#### **2.3 Configuración Pestaña "Connection"**
```
Host name/address: localhost
Port: 5432
Maintenance database: postgres
Username: postgres
Password: [tu_contraseña_postgresql_local]
Save password: ✅ Activado
Role: [Dejar vacío]
Service: [Dejar vacío]
```

#### **2.4 Configuración Pestaña "SSL"**
```
SSL mode: Prefer
Client certificate: [Dejar vacío para local]
Client certificate key: [Dejar vacío para local]
Root certificate: [Dejar vacío para local]
Certificate revocation list: [Dejar vacío para local]
SSL compression: Auto
```

#### **2.5 Configuración Pestaña "Advanced"**
```
DB restriction: laburemos, postgres
Host address: [Dejar vacío]
Connection timeout: 10
```

### **Paso 3: Verificar Conexión Local**
```sql
-- Ejecutar en PgAdmin 4 Query Tool (servidor local)
SELECT 
    'LABUREMOS Local Connection Test' as test_name,
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port,
    now() as connection_time;
```

---

## 🚀 2. Configuración AWS RDS PostgreSQL

### **Paso 1: Verificar Conectividad AWS RDS**

#### **1.1 Verificar Acceso desde Línea de Comandos**
```bash
# Test básico de conectividad
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d postgres

# Test con timeout
timeout 10 psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d postgres -c "SELECT version();"
```

#### **1.2 Verificar Security Groups AWS**
```bash
# Verificar tu IP actual
curl ifconfig.me

# En AWS Console:
# EC2 → Security Groups → Buscar security group de RDS
# Verificar que puerto 5432 esté abierto para tu IP
```

### **Paso 2: Crear Servidor AWS RDS en PgAdmin 4**

#### **2.1 Configuración Pestaña "General"**
```
Name: LABUREMOS AWS RDS Production
Server Group: Servers
Comments: Servidor PostgreSQL de producción en AWS RDS - Endpoint: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com
Color: #FF6347 (Rojo para producción)
```

#### **2.2 Configuración Pestaña "Connection"**
```
Host name/address: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com
Port: 5432
Maintenance database: postgres
Username: postgres
Password: [contraseña_aws_rds_producción]
Save password: ✅ Activado
Role: [Dejar vacío]
Service: [Dejar vacío]
```

#### **2.3 Configuración Pestaña "SSL"**
```
SSL mode: Require
Client certificate: [Dejar vacío]
Client certificate key: [Dejar vacío]
Root certificate: [Opcional - descargar rds-ca-2019-root.pem]
Certificate revocation list: [Dejar vacío]
SSL compression: Auto
```

#### **2.4 Configuración Pestaña "Advanced"**
```
DB restriction: laburemos, postgres
Host address: [Dejar vacío]
Connection timeout: 30
```

### **Paso 3: Verificar Conexión AWS RDS**
```sql
-- Ejecutar en PgAdmin 4 Query Tool (servidor AWS RDS)
SELECT 
    'LABUREMOS AWS RDS Connection Test' as test_name,
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port,
    now() as connection_time;

-- Verificar extensiones disponibles
SELECT extname, extversion 
FROM pg_extension 
ORDER BY extname;

-- Verificar configuración SSL
SHOW ssl;
```

---

## 📊 3. Scripts de Migración y Sincronización

### **3.1 Script Principal de Migración**
```bash
# Hacer ejecutable el script
chmod +x /mnt/c/cursor/laburemos/scripts/database-migration-sync.sh

# Configurar base de datos local
./database-migration-sync.sh local

# Configurar base de datos AWS RDS  
./database-migration-sync.sh aws

# Sincronizar schemas entre local y AWS
./database-migration-sync.sh sync

# Verificar conexiones
./database-migration-sync.sh verify

# Configuración completa
./database-migration-sync.sh all
```

### **3.2 Aplicar Schema Prisma**
```bash
cd /mnt/c/cursor/laburemos/backend

# Para base de datos LOCAL
export DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/laburemos"
npx prisma generate
npx prisma db push

# Para base de datos AWS RDS
export DATABASE_URL="postgresql://postgres:aws_password@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos"
npx prisma generate  
npx prisma db push
```

### **3.3 Verificar Schema en PgAdmin 4**
```sql
-- Contar tablas creadas
SELECT 
    schemaname,
    count(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public'
GROUP BY schemaname;

-- Listar todas las tablas
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

---

## 💾 4. Procedimientos de Backup y Restore

### **4.1 Script de Backup y Restore**
```bash
# Hacer ejecutable el script
chmod +x /mnt/c/cursor/laburemos/scripts/backup-restore-procedures.sh

# Crear backup de base local
./backup-restore-procedures.sh backup-local

# Crear backup de AWS RDS
./backup-restore-procedures.sh backup-aws

# Listar backups disponibles
./backup-restore-procedures.sh list

# Restaurar backup a base local
./backup-restore-procedures.sh restore-local /path/to/backup.custom

# Sincronizar local → AWS RDS
./backup-restore-procedures.sh sync-to-aws

# Sincronizar AWS RDS → local
./backup-restore-procedures.sh sync-to-local

# Limpiar backups antiguos (30 días)
./backup-restore-procedures.sh cleanup
```

### **4.2 Backup Manual desde PgAdmin 4**

#### **Para Servidor Local:**
1. **Click derecho en base "laburemos"** → **"Backup..."**
2. **Configurar:**
   ```
   Filename: /mnt/c/cursor/laburemos/backups/laburemos_local_manual_YYYYMMDD.backup
   Format: Custom
   Compression: 9
   Encoding: UTF8
   ```
3. **Pestaña "Dump Options #1":**
   ```
   ✅ Pre data
   ✅ Data  
   ✅ Post data
   ✅ Only data
   ✅ Only schema
   ```
4. **Pestaña "Dump Options #2":**
   ```
   ✅ Use INSERT commands
   ✅ Include DROP DATABASE statement
   ```

#### **Para Servidor AWS RDS:**
1. **Click derecho en base "laburemos"** → **"Backup..."**  
2. **Usar las mismas configuraciones** pero cambiar filename:
   ```
   Filename: /mnt/c/cursor/laburemos/backups/laburemos_aws_manual_YYYYMMDD.backup
   ```

### **4.3 Restore Manual desde PgAdmin 4**
1. **Click derecho en base "laburemos"** → **"Restore..."**
2. **Seleccionar archivo de backup**
3. **Configurar:**
   ```
   Format: Custom or tar
   ✅ Clean before restore
   ✅ If exists
   ✅ Create
   ✅ Single transaction
   ```

---

## 🔧 5. Troubleshooting y Solución de Problemas

### **5.1 Problemas Comunes de Conexión**

#### **Error: "Connection refused" (Local)**
```bash
# Verificar PostgreSQL está ejecutándose
sudo systemctl status postgresql     # Linux
sc query postgresql-x64-13          # Windows

# Iniciar PostgreSQL si no está ejecutándose
sudo systemctl start postgresql      # Linux
net start postgresql-x64-13         # Windows

# Verificar archivo pg_hba.conf
sudo nano /etc/postgresql/13/main/pg_hba.conf    # Linux
# Verificar línea: local all postgres peer
```

#### **Error: "Authentication failed"**
```bash
# Resetear contraseña PostgreSQL local
sudo -u postgres psql                # Linux
psql -U postgres                     # Windows
\password postgres
# Introducir nueva contraseña
```

#### **Error: "Connection timeout" (AWS RDS)**
```bash
# Verificar Security Group
# AWS Console → EC2 → Security Groups
# Buscar security group de RDS
# Añadir regla: Type: PostgreSQL, Port: 5432, Source: Mi IP

# Verificar desde línea de comandos
telnet laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com 5432
```

#### **Error: "SSL connection failed" (AWS RDS)**
```bash
# Descargar certificado SSL de AWS
cd /tmp
wget https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem

# En PgAdmin 4, configurar SSL:
# SSL mode: require
# Root certificate: /tmp/rds-ca-2019-root.pem
```

### **5.2 Problemas de Schema y Migraciones**

#### **Error: "relation does not exist"**
```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Si no hay tablas, aplicar schema Prisma
-- cd /mnt/c/cursor/laburemos/backend
-- npx prisma db push
```

#### **Error: "column does not exist"**
```sql
-- Verificar estructura de tabla
\d+ users

-- O usando información_schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

### **5.3 Problemas de Permisos**

#### **Error: "permission denied for schema public"**
```sql
-- Otorgar permisos al usuario
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

---

## ✅ 6. Comandos de Verificación

### **6.1 Verificación Completa de Conexiones**
```sql
-- EJECUTAR EN AMBOS SERVIDORES (local y AWS RDS)

-- Test básico de conexión
SELECT 
    current_database() as database,
    current_user as user_name,
    version() as postgresql_version,
    now() as current_time;

-- Verificar configuración
SELECT name, setting FROM pg_settings 
WHERE name IN ('port', 'max_connections', 'shared_buffers', 'ssl');

-- Contar tablas del schema público
SELECT count(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar extensiones
SELECT extname, extversion 
FROM pg_extension 
ORDER BY extname;

-- Test de escritura (CUIDADO: solo en desarrollo)
CREATE TEMP TABLE test_write (id serial, test_time timestamp DEFAULT now());
INSERT INTO test_write (id) VALUES (1);
SELECT * FROM test_write;
DROP TABLE test_write;
```

### **6.2 Verificación de Rendimiento**
```sql
-- Estadísticas de base de datos
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database 
WHERE datname = 'laburemos';

-- Conexiones activas
SELECT 
    state,
    count(*) as connection_count
FROM pg_stat_activity 
WHERE datname = 'laburemos'
GROUP BY state;

-- Tamaño de base de datos
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size_pretty,
    pg_database_size(pg_database.datname) AS size_bytes
FROM pg_database
WHERE datname = 'laburemos';
```

### **6.3 Script de Verificación Automatizada**
```bash
# Crear script de verificación rápida
cat > /mnt/c/cursor/laburemos/scripts/quick-verify.sh << 'EOF'
#!/bin/bash

echo "=== VERIFICACIÓN RÁPIDA LABUREMOS ==="

# Test conexión local
echo "🔍 Verificando conexión local..."
psql -h localhost -p 5432 -U postgres -d laburemos -c "SELECT 'LOCAL OK' as status, current_database(), count(*) as tables FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null && echo "✅ Conexión local OK" || echo "❌ Error conexión local"

# Test conexión AWS RDS
echo "🔍 Verificando conexión AWS RDS..."
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d laburemos -c "SELECT 'AWS RDS OK' as status, current_database(), count(*) as tables FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null && echo "✅ Conexión AWS RDS OK" || echo "❌ Error conexión AWS RDS"

echo "=== VERIFICACIÓN COMPLETADA ==="
EOF

chmod +x /mnt/c/cursor/laburemos/scripts/quick-verify.sh

# Ejecutar verificación
./scripts/quick-verify.sh
```

---

## 📋 7. Checklist Final de Configuración

### **✅ Configuración Local PostgreSQL**
- [ ] PostgreSQL instalado y ejecutándose
- [ ] Servidor "LABUREMOS Local PostgreSQL" creado en PgAdmin 4
- [ ] Conexión exitosa a localhost:5432
- [ ] Base de datos "laburemos" creada y accesible
- [ ] Schema Prisma aplicado correctamente (26+ tablas)
- [ ] Extensiones uuid-ossp y pgcrypto instaladas
- [ ] Permisos configurados para usuario postgres
- [ ] Variables de entorno DATABASE_URL configuradas

### **✅ Configuración AWS RDS PostgreSQL**
- [ ] Servidor "LABUREMOS AWS RDS Production" creado en PgAdmin 4
- [ ] Conexión exitosa a laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432
- [ ] SSL configurado en modo "Require"
- [ ] Base de datos "laburemos" accesible
- [ ] Schema Prisma sincronizado con producción
- [ ] Security Groups AWS configurados correctamente
- [ ] Timeout de conexión configurado (30 segundos)
- [ ] Variables de entorno DATABASE_URL para AWS configuradas

### **✅ Scripts y Herramientas**
- [ ] Script database-migration-sync.sh funcional
- [ ] Script backup-restore-procedures.sh funcional
- [ ] Directorio /backups creado y accesible
- [ ] Script quick-verify.sh funcional
- [ ] Todos los scripts tienen permisos de ejecución

### **✅ Documentación y Seguridad**
- [ ] Contraseñas seguras configuradas y documentadas
- [ ] Variables de entorno configuradas en .env
- [ ] Documentación de troubleshooting disponible
- [ ] Procedimientos de backup documentados
- [ ] Plan de recuperación ante desastres definido

---

## 🔐 8. Información de Credenciales (SEGURA)

### **Configuraciones de Conexión para .env**
```bash
# === DESARROLLO LOCAL ===
DATABASE_URL_LOCAL="postgresql://postgres:[LOCAL_PASSWORD]@localhost:5432/laburemos"

# === PRODUCCIÓN AWS RDS ===  
DATABASE_URL_AWS="postgresql://postgres:[AWS_RDS_PASSWORD]@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos"

# === CONFIGURACIÓN ACTIVA ===
# Cambiar según el entorno actual
DATABASE_URL="${DATABASE_URL_LOCAL}"  # Para desarrollo
# DATABASE_URL="${DATABASE_URL_AWS}"   # Para producción
```

### **Información de Servidores PgAdmin 4**
| Parámetro | Local | AWS RDS |
|-----------|-------|---------|
| **Nombre** | LABUREMOS Local PostgreSQL | LABUREMOS AWS RDS Production |
| **Host** | localhost | laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com |
| **Puerto** | 5432 | 5432 |
| **Base de Datos** | laburemos | laburemos |
| **Usuario** | postgres | postgres |
| **SSL Mode** | Prefer | Require |
| **Timeout** | 10 segundos | 30 segundos |
| **Color** | Verde (#2E8B57) | Rojo (#FF6347) |

---

## 🚀 9. Próximos Pasos

### **Desarrollo y Testing**
1. **Configurar entorno de desarrollo** con base local
2. **Implementar seeds de datos** para testing
3. **Configurar CI/CD** para migraciones automáticas
4. **Implementar monitoring** de performance

### **Producción**  
1. **Configurar backups automáticos** AWS RDS
2. **Implementar replicación** read-only
3. **Configurar alertas** de monitoring
4. **Documentar procedimientos** de emergencia

### **Seguridad**
1. **Implementar rotación** de credenciales
2. **Configurar auditoría** de accesos
3. **Implementar encriptación** adicional
4. **Configurar VPN** para acceso RDS

---

**📄 Archivos Relacionados:**
- `scripts/setup-pgadmin-local-config.sql` - Configuración PostgreSQL local
- `scripts/aws-rds-connection-setup.sql` - Verificación AWS RDS
- `scripts/database-migration-sync.sh` - Migración y sincronización
- `scripts/backup-restore-procedures.sh` - Backup y restore
- `backend/prisma/schema.prisma` - Schema completo de la base de datos

**🔗 Enlaces Útiles:**
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación PgAdmin 4](https://www.pgadmin.org/docs/)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/rds/latest/userguide/CHAP_PostgreSQL.html)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**📅 Última Actualización:** 2025-08-01  
**📧 Soporte:** Consultar documentación técnica del proyecto LABUREMOS  
**⚡ Estado:** ✅ Configuración Completa y Funcional
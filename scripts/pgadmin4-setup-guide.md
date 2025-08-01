# LABUREMOS - Guía de Configuración PgAdmin 4

## 📋 Configuración Completa PostgreSQL + PgAdmin 4

### 🔧 1. Configuración Servidor PostgreSQL Local

#### **Paso 1: Crear Servidor Local en PgAdmin 4**

```bash
# 1. Abrir PgAdmin 4
# 2. Click derecho en "Servers" → "Create" → "Server..."
# 3. Configurar pestaña "General":
```

**Configuración General:**
- **Name**: `LABUREMOS Local PostgreSQL`
- **Server Group**: `Servers`
- **Comments**: `Servidor PostgreSQL local para desarrollo LABUREMOS`

#### **Paso 2: Configurar Conexión Local**

**Pestaña "Connection":**
- **Host name/address**: `localhost`
- **Port**: `5432`
- **Maintenance database**: `postgres`
- **Username**: `postgres`
- **Password**: `[tu_contraseña_postgresql_local]`
- **Save password**: ✅ (Activado)

**Pestaña "Advanced":**
- **DB restriction**: `laburemos, postgres`
- **Connection timeout**: `10`

#### **Paso 3: Configurar SSL (Opcional para Local)**

**Pestaña "SSL":**
- **SSL mode**: `Prefer`
- **Client certificate**: *(Dejar vacío para local)*

### 🚀 2. Configuración AWS RDS PostgreSQL

#### **Paso 1: Preparar Conexión AWS RDS**

```bash
# Verificar conectividad AWS RDS
# Endpoint: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com
# Puerto: 5432
# Base de datos: laburemos
```

#### **Paso 2: Crear Servidor AWS RDS en PgAdmin 4**

**Configuración General:**
- **Name**: `LABUREMOS AWS RDS Production`
- **Server Group**: `Servers`
- **Comments**: `Servidor PostgreSQL de producción en AWS RDS`

#### **Paso 3: Configurar Conexión AWS RDS**

**Pestaña "Connection":**
- **Host name/address**: `laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Maintenance database**: `postgres`
- **Username**: `postgres` *(o usuario configurado en RDS)*
- **Password**: `[contraseña_aws_rds]`
- **Save password**: ✅ (Activado)

**Pestaña "Advanced":**
- **DB restriction**: `laburemos, postgres`
- **Connection timeout**: `30`

#### **Paso 4: Configurar SSL para AWS RDS**

**Pestaña "SSL":**
- **SSL mode**: `Require`
- **Root certificate**: *(Descargar de AWS si es necesario)*

### 📊 3. Verificación de Conexiones

#### **Comando de Verificación Local:**
```sql
-- Ejecutar en PgAdmin 4 Query Tool (servidor local)
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port;
```

#### **Comando de Verificación AWS RDS:**
```sql
-- Ejecutar en PgAdmin 4 Query Tool (servidor AWS RDS)
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port,
    now() as connection_time;
```

### 🗄️ 4. Importar Esquema Prisma

#### **Paso 1: Generar Schema SQL desde Prisma**
```bash
cd /mnt/c/cursor/laburemos/backend

# Generar schema SQL
npx prisma db push --preview-feature
npx prisma generate

# Ver esquema actual
npx prisma db pull
```

#### **Paso 2: Aplicar Schema en PgAdmin 4**

**Para Servidor Local:**
1. Conectar al servidor local
2. Crear base de datos `laburemos` si no existe
3. Ejecutar script: `/scripts/setup-pgladmin-local-config.sql`
4. Ejecutar: `npx prisma db push` desde directorio backend

**Para Servidor AWS RDS:**
1. Conectar al servidor AWS RDS
2. Verificar base de datos `laburemos` existe
3. Sincronizar schema con: `npx prisma db push`

### 🔐 5. Configuración de Seguridad

#### **Variables de Entorno (.env)**
```bash
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:tu_password_local@localhost:5432/laburemos"

# AWS RDS PostgreSQL  
DATABASE_URL="postgresql://postgres:contraseña_rds@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos"
```

#### **Configuración Segura PgAdmin 4**
- **Master Password**: Configurar password maestro en PgAdmin
- **Connection Timeout**: Configurar timeouts apropiados
- **SSL Verification**: Activar para conexiones de producción
- **Query History**: Limpiar regularmente el historial de consultas

### 📋 6. Lista de Verificación Final

#### **✅ Servidor Local PostgreSQL**
- [ ] Servidor creado en PgAdmin 4
- [ ] Conexión exitosa a localhost:5432
- [ ] Base de datos `laburemos` creada
- [ ] Esquema Prisma aplicado
- [ ] Extensiones instaladas (uuid-ossp, pgcrypto)
- [ ] Permisos configurados correctamente

#### **✅ Servidor AWS RDS PostgreSQL**
- [ ] Servidor creado en PgAdmin 4
- [ ] Conexión exitosa a AWS RDS
- [ ] Base de datos `laburemos` accesible
- [ ] SSL configurado (modo require)
- [ ] Esquema sincronizado con producción
- [ ] Timeout configurado (30 segundos)

#### **✅ Configuración General**
- [ ] Variables de entorno configuradas
- [ ] Scripts de migración listos
- [ ] Backup procedures documentados
- [ ] Troubleshooting guide disponible

### 🚨 Troubleshooting Común

#### **Error: "Connection refused"**
```bash
# Verificar PostgreSQL está ejecutándose
sudo systemctl status postgresql   # Linux
net start postgresql-x64-13       # Windows

# Verificar puerto 5432 está abierto
netstat -an | grep 5432
```

#### **Error: "Authentication failed"**
```bash
# Verificar contraseña PostgreSQL
psql -U postgres -h localhost

# Resetear contraseña si es necesario
sudo -u postgres psql
\password postgres
```

#### **Error: "SSL connection failed" (AWS RDS)**
```bash
# Descargar certificado SSL de AWS
wget https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem

# Configurar SSL mode en PgAdmin:
# SSL mode: require
# Root certificate: rds-ca-2019-root.pem
```

#### **Error: "Database does not exist"**
```sql
-- Crear base de datos en servidor
CREATE DATABASE laburemos 
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default;
```

### 📱 Acceso Rápido PgAdmin 4

#### **URLs de Acceso:**
- **PgAdmin 4 Local**: `http://localhost:5050` (si se instaló via Docker)
- **PgAdmin 4 Desktop**: Aplicación de escritorio

#### **Conexiones Rápidas:**
- **Local**: `localhost:5432` → Base: `laburemos` → Usuario: `postgres`
- **AWS RDS**: `laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432` → Base: `laburemos`

---

**📄 Siguiente**: Ejecutar scripts de migración y configurar procedimientos de backup
**🔗 Relacionado**: `setup-pgadmin-local-config.sql`, `pgadmin4-migration-scripts.sql`
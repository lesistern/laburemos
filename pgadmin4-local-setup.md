# 🗄️ Configuración pgAdmin4 Local - LABUREMOS

## 📋 Configuración de Servidor Local

### 1. **Crear Conexión Local en pgAdmin4**

1. **Abre pgAdmin4**
2. **Click derecho en "Servers"** → "Register" → "Server..."

### 2. **Configuración de la Conexión**

#### **Pestaña "General":**
- **Name:** `LaburAR Local Development`

#### **Pestaña "Connection":**
- **Host name/address:** `localhost`
- **Port:** `5432`
- **Maintenance database:** `postgres`
- **Username:** `postgres`
- **Password:** [tu contraseña de PostgreSQL local]
- **Save password:** ✓ (recomendado)

### 3. **Contraseñas Comunes de PostgreSQL Local**

Si no recuerdas tu contraseña, prueba estas opciones comunes:
- `postgres` (más común)
- `admin`
- `root`
- (vacía - sin contraseña)
- La contraseña que configuraste durante la instalación

### 4. **Crear Base de Datos "laburemos"**

Una vez conectado al servidor PostgreSQL local:

1. **Click derecho en "Databases"** → "Create" → "Database..."
2. **Configuración:**
   - **Database:** `laburemos`
   - **Owner:** `postgres`
   - **Encoding:** `UTF8`
3. **Click "Save"**

### 5. **Verificar Conexión**

Con la base de datos "laburemos" creada:

1. **Click derecho en la DB "laburemos"** → "Query Tool"
2. **Ejecuta esta consulta de prueba:**
   ```sql
   -- Verificar conexión y versión
   SELECT version();
   
   -- Verificar base de datos actual
   SELECT current_database();
   
   -- Listar tablas (debería estar vacía inicialmente)
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

## 🔧 Configuración del Backend Local

### 6. **Actualizar archivo .env local**

Crea/actualiza el archivo `.env` en la carpeta `backend`:

```env
# Base de datos local PostgreSQL
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/laburemos?schema=public"

# Configuración local
NODE_ENV=development
PORT=3001

# JWT (para desarrollo local)
JWT_SECRET=local-development-secret
JWT_EXPIRES_IN=7d
```

### 7. **Ejecutar Migraciones de Prisma**

Una vez configurado el .env:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

## 🚀 Flujo de Trabajo Local → AWS

### 8. **Desarrollo Local**
1. Trabaja en pgAdmin4 con la base de datos local
2. Haz cambios en la estructura/datos
3. Prueba todo localmente

### 9. **Sincronización con AWS (cuando estés listo)**

#### **Exportar desde Local:**
```bash
# En pgAdmin4: Click derecho en DB "laburemos" → Backup...
# Guarda como: laburemos_local_backup.sql
```

#### **Importar en AWS:**
```bash
# En pgAdmin4: Conecta a AWS RDS
# Click derecho en DB "laburemos" (AWS) → Restore...
# Selecciona: laburemos_local_backup.sql
```

## 🔍 Solución de Problemas

### **Error: "could not connect to server"**
- ✅ Verifica que PostgreSQL esté corriendo
- ✅ Revisa la contraseña
- ✅ Confirma el puerto 5432

### **Error: "database does not exist"**
- ✅ Conéctate primero a "postgres" (database por defecto)
- ✅ Luego crea la database "laburemos"

### **Error: "authentication failed"**
- ✅ Prueba contraseñas comunes: `postgres`, `admin`, etc.
- ✅ Si no funciona, puedes resetear la contraseña

## 📝 Resumen de Credenciales

### **Local PostgreSQL:**
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `laburemos`
- **Username:** `postgres`
- **Password:** `[tu contraseña local]`

### **AWS RDS (para sincronización posterior):**
- **Host:** `laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com`
- **Port:** `5432`
- **Database:** `laburemos`
- **Username:** `postgres`
- **Password:** `Laburemos2025!`

---

**Próximo paso:** Configure la conexión local en pgAdmin4 y créame la database "laburemos"
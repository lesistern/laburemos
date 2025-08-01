# 🗄️ Guía de Conexión pgAdmin4 con AWS RDS - LABUREMOS

## 📋 Información de la Base de Datos

### Credenciales de Conexión
- **Host/Endpoint**: `laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com` (verificar el endpoint exacto)
- **Puerto**: `5432`
- **Base de datos**: `laburemos`
- **Usuario**: `postgres`
- **Contraseña**: `Laburemos2025!`
- **Región AWS**: `us-east-1`

## 🚀 Pasos para Conectar pgAdmin4

### 1. Ejecutar el Script de Configuración
```bash
cd D:\Laburar
.\setup-pgadmin-aws.sh
```

Este script te ayudará a:
- Obtener el endpoint exacto de RDS
- Crear archivos de configuración
- Generar un script de backup

### 2. Configurar pgAdmin4

1. **Abrir pgAdmin4**
2. **Crear Nueva Conexión**:
   - Click derecho en "Servers" → "Register" → "Server..."

3. **Pestaña "General"**:
   - Name: `LaburAR AWS Production`

4. **Pestaña "Connection"**:
   - Host name/address: `laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com`
   - Port: `5432`
   - Maintenance database: `laburemos`
   - Username: `postgres`
   - Password: `Laburemos2025!`
   - Save password: ✓ (opcional pero recomendado)

5. **Click en "Save"**

## 🔒 Configuración de Seguridad en AWS

### Verificar Security Group

1. **Acceder a AWS Console**:
   - https://console.aws.amazon.com/ec2/
   - Región: `us-east-1`

2. **Buscar el Security Group de RDS**:
   - Ve a "Security Groups" en el menú lateral
   - Busca el grupo asociado a tu instancia RDS

3. **Agregar Regla de Entrada**:
   - Click en "Edit inbound rules"
   - Add rule:
     - Type: `PostgreSQL`
     - Protocol: `TCP`
     - Port: `5432`
     - Source: Tu IP (puedes usar https://whatismyipaddress.com/)
     - Description: `pgAdmin connection from [tu ubicación]`

### Usando AWS CLI (alternativa)
```bash
# Obtener tu IP actual
$myip = (Invoke-WebRequest -Uri "https://api.ipify.org").Content

# Autorizar tu IP en el security group
aws ec2 authorize-security-group-ingress `
  --group-id [SECURITY_GROUP_ID] `
  --protocol tcp `
  --port 5432 `
  --cidr "$myip/32" `
  --region us-east-1
```

## 🧪 Probar la Conexión

### Desde pgAdmin4
- Si la conexión es exitosa, verás la base de datos `laburemos` en el árbol de servidores

### Desde línea de comandos (opcional)
```bash
# Si tienes psql instalado
psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -U postgres -d laburemos -p 5432
```

## 🔧 Solución de Problemas

### Error: "could not connect to server"
1. **Verificar que RDS sea publicly accessible**:
   - AWS Console → RDS → Instances → laburemos-db
   - Publicly accessible: debe estar en "Yes"

2. **Verificar el Security Group**:
   - Asegúrate que tu IP esté permitida
   - El puerto 5432 debe estar abierto

3. **Verificar el endpoint**:
   - Copia el endpoint exacto desde AWS Console
   - No uses el ejemplo, usa el real de tu instancia

### Error: "password authentication failed"
- Verifica que estés usando la contraseña correcta: `Laburemos2025!`
- El usuario debe ser `postgres`

### Error: "database laburemos does not exist"
- Es posible que necesites crear la base de datos primero
- Conéctate a la database `postgres` (default)
- Luego crea la database: `CREATE DATABASE laburemos;`

## 📦 Hacer Backup de la Base de Datos

### Usando el script generado
```bash
cd D:\Laburar
.\backup-aws-db.sh
```

### Manualmente con pg_dump
```powershell
$env:PGPASSWORD="Laburemos2025!"
pg_dump -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -U postgres -d laburemos -p 5432 -f backup_laburemos.sql
```

## 🔄 Sincronización con Base de Datos Local

### Exportar desde AWS RDS
```bash
# Crear backup de producción
pg_dump -h [RDS_ENDPOINT] -U postgres -d laburemos -p 5432 -f aws_production.sql
```

### Importar a PostgreSQL local
```bash
# En tu PostgreSQL local
psql -U postgres -d laburemos_local < aws_production.sql
```

## 📌 Comandos Útiles

### Ver tablas en pgAdmin
```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver estructura de una tabla
\d nombre_tabla

-- Contar registros
SELECT COUNT(*) FROM usuarios;
```

### Monitorear conexiones
```sql
-- Ver conexiones activas
SELECT pid, usename, application_name, client_addr, state 
FROM pg_stat_activity 
WHERE datname = 'laburemos';
```

## 🚨 Seguridad Importante

1. **Nunca compartas las credenciales** en repositorios públicos
2. **Usa IPs específicas** en el Security Group, no 0.0.0.0/0
3. **Rota las contraseñas** regularmente
4. **Habilita logs** de conexión en RDS para auditoría
5. **Usa SSL/TLS** para conexiones en producción

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs en AWS CloudWatch
2. Revisa el estado de RDS en AWS Console
3. Asegúrate que tu IP no haya cambiado
4. Contacta al administrador del sistema

---

**Última actualización**: 2025-08-01
**Base de datos**: AWS RDS PostgreSQL 15.12
**Proyecto**: LABUREMOS - https://laburemos.com.ar
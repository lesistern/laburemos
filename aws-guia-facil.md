# AWS Guía Fácil - LABUREMOS Project Migration

**Guía Completa AWS para Migración LABUREMOS** | Next.js 15.4.4 + NestJS → AWS Cloud

## 🎯 Tu Situación Actual

Estás en la página principal de AWS Console en español, región `US East (N. Virginia)` - **perfecto para comenzar**.

**URL actual**: `https://us-east-1.console.aws.amazon.com/console/home?region=us-east-1`

## 🔧 **PASO 1: Solucionar Error de Credenciales AWS CLI**

### **1.1 Navegar a IAM (Gestión de Identidades)**

Desde tu pantalla actual:

```bash
1. En la barra de búsqueda superior (donde dice "Buscar")
2. Escribir: IAM
3. Clic en "IAM" en los resultados
4. O ir directamente a: Servicios → Seguridad, identidad y conformidad → IAM
```

### **1.2 Crear Nuevo Usuario IAM para CLI**

Una vez en IAM Console:

```bash
1. Panel izquierdo → Clic "Usuarios"
2. Botón naranja "Crear usuario"
3. Configurar:
   ✓ Nombre de usuario: laburemos-cli-user
   ✓ Tipo de acceso: ✅ "Acceso programático"
   ✓ Clic "Siguiente: Permisos"
```

### **1.3 Asignar Permisos (Desarrollo)**

```bash
1. Seleccionar: "Asociar políticas existentes directamente"
2. Buscar y marcar:
   ✅ PowerUserAccess (recomendado para desarrollo)
   
   O para más control específico:
   ✅ AmazonEC2FullAccess
   ✅ AmazonS3FullAccess  
   ✅ AmazonRDSFullAccess
   ✅ CloudWatchFullAccess

3. Clic "Siguiente: Etiquetas" (omitir)
4. Clic "Siguiente: Revisar"
5. Clic "Crear usuario"
```

### **1.4 Descargar Credenciales (¡CRÍTICO!)**

```bash
⚠️ IMPORTANTE: Solo verás el Secret Key UNA vez

1. Clic "Descargar .csv" inmediatamente
2. Copiar y guardar:
   - Access Key ID: AKIA...
   - Secret Access Key: wJalrXUt...
3. Guardar en lugar seguro
```

## 🖥️ **PASO 2: Configurar AWS CLI**

### **2.1 Abrir Terminal/Command Prompt**

```bash
# En Windows: Win + R → cmd → Enter
# O usar terminal integrado de VS Code
```

### **2.2 Configurar con Nuevas Credenciales**

```bash
aws configure

# Cuando pregunte, introducir:
AWS Access Key ID [None]: [pegar tu Access Key ID]
AWS Secret Access Key [None]: [pegar tu Secret Access Key]
Default region name [None]: us-east-1
Default output format [None]: json
```

### **2.3 Probar Configuración**

```bash
# Probar conectividad
aws sts get-caller-identity

# Respuesta esperada:
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012", 
    "Arn": "arn:aws:iam::123456789012:user/laburemos-cli-user"
}
```

## 🏗️ **PASO 3: Servicios AWS para LABUREMOS**

### **3.1 Amazon S3 (Almacenamiento de Archivos)**

**Desde AWS Console:**

```bash
1. Barra búsqueda → escribir "S3"
2. Clic "S3" en resultados
3. Botón "Crear bucket"
4. Configurar:
   ✓ Nombre: laburemos-files-2024 (único globalmente)
   ✓ Región: US East (N. Virginia) us-east-1
   ✓ Acceso público: Mantener bloqueado (seguridad)
5. Clic "Crear bucket"
```

**Via CLI (alternativo):**
```bash
# Crear bucket S3
aws s3 mb s3://laburemos-files-2024 --region us-east-1

# Verificar creación
aws s3 ls
```

### **3.2 Amazon RDS (Base de Datos PostgreSQL)**

**Desde AWS Console:**

```bash
1. Buscar "RDS" → Clic RDS
2. Botón "Crear base de datos"
3. Configurar:
   ✓ Método: Creación estándar
   ✓ Motor: PostgreSQL
   ✓ Plantilla: Nivel gratuito
   ✓ Identificador: laburemos-db
   ✓ Nombre maestro: postgres
   ✓ Contraseña: [crear contraseña segura]
   ✓ Acceso público: Sí (para desarrollo)
4. Clic "Crear base de datos"
```

### **3.3 Amazon EC2 (Servidor Virtual)**

**Desde AWS Console:**

```bash
1. Buscar "EC2" → Clic EC2
2. Botón "Lanzar instancia"
3. Configurar:
   ✓ Nombre: laburemos-backend
   ✓ AMI: Amazon Linux 2023
   ✓ Tipo: t3.micro (apto para nivel gratuito)
   ✓ Par de claves: Crear nuevo "laburemos-key"
   ✓ Grupo seguridad: Crear con puertos:
     - SSH (22) desde tu IP
     - HTTP (80) desde cualquier lugar
     - HTTPS (443) desde cualquier lugar  
     - TCP personalizado (3001) para NestJS
4. Clic "Lanzar instancia"
```

## 🔒 **PASO 4: Seguridad Básica**

### **4.1 Habilitar MFA en Cuenta Root**

```bash
1. Esquina superior derecha → Clic tu nombre de cuenta
2. "Credenciales de seguridad"
3. "Autenticación multifactor (MFA)" → "Asignar dispositivo MFA"
4. Seguir instrucciones de configuración
```

### **4.2 Configurar Alertas de Facturación**

```bash
1. Buscar "Billing" → Clic "Facturación y administración de costos"
2. Panel izquierdo → "Presupuestos"
3. "Crear presupuesto"
4. Configurar:
   ✓ Tipo: Presupuesto de costos
   ✓ Cantidad: $10 USD (o tu límite preferido)
   ✓ Alertas por email cuando alcance 80%
```

### **4.3 Configurar AWS CloudTrail (Registro de Actividad)**

```bash
1. Buscar "CloudTrail" → Clic CloudTrail
2. "Crear seguimiento"
3. Configurar:
   ✓ Nombre: laburemos-trail
   ✓ Bucket S3: Crear nuevo
   ✓ Habilitar registro para cuenta
4. Clic "Crear"
```

## 🚀 **PASO 5: Despliegue LABUREMOS**

### **5.1 Preparar Frontend (Next.js)**

```bash
# En tu proyecto local
cd frontend
npm run build

# Subir a S3
aws s3 sync ./out s3://laburemos-files-2024/frontend/
```

### **5.2 Configurar CloudFront (CDN)**

**Desde AWS Console:**

```bash
1. Buscar "CloudFront" → Clic CloudFront
2. "Crear distribución"
3. Configurar:
   ✓ Dominio origen: tu-bucket-s3.s3.amazonaws.com
   ✓ Comportamiento caché: Mantener predeterminados
   ✓ Clase precio: Usar todas las ubicaciones edge
4. Clic "Crear distribución"
```

### **5.3 Desplegar Backend (NestJS)**

**Conectar a instancia EC2:**

```bash
# Conectar vía SSH
chmod 400 laburemos-key.pem
ssh -i laburemos-key.pem ec2-user@[IP-PUBLICA-EC2]

# En el servidor, instalar Node.js
sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Clonar y configurar tu proyecto
git clone tu-repositorio-laburemos
cd laburemos/backend
npm install
npm run build

# Configurar PM2 para producción
sudo npm install -g pm2
pm2 start dist/main.js --name "laburemos-backend"
pm2 startup
pm2 save
```

## 📊 **PASO 6: Verificación y Monitoreo**

### **6.1 Verificar Servicios**

```bash
# Verificar AWS CLI
aws sts get-caller-identity

# Listar recursos creados
aws s3 ls
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]'
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus]'
```

### **6.2 Configurar Monitoreo CloudWatch**

**Desde AWS Console:**

```bash
1. Buscar "CloudWatch" → Clic CloudWatch
2. Panel izquierdo → "Alarmas" → "Crear alarma"
3. Configurar alarmas para:
   ✓ Uso CPU EC2 > 80%
   ✓ Errores aplicación > 10
   ✓ Tiempo respuesta > 5s
```

## 🔧 **PASO 7: Configuración Variables de Entorno**

### **7.1 En tu aplicación Backend (NestJS)**

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@laburemos-db.region.rds.amazonaws.com:5432/laburemos
AWS_REGION=us-east-1
AWS_S3_BUCKET=laburemos-files-2024
JWT_SECRET=your-super-secure-jwt-secret
```

### **7.2 En tu aplicación Frontend (Next.js)**

```bash
# .env.production
NEXT_PUBLIC_API_URL=http://your-ec2-public-ip:3001
NEXT_PUBLIC_WS_URL=ws://your-ec2-public-ip:3001
NEXT_PUBLIC_CDN_URL=https://your-cloudfront-domain.cloudfront.net
```

## ⚡ **Comandos Útiles AWS CLI**

### **Gestión de Recursos**

```bash
# S3 Operations
aws s3 ls                                    # Listar buckets
aws s3 sync ./local-folder s3://bucket-name  # Sincronizar archivos
aws s3 cp file.txt s3://bucket-name/         # Copiar archivo

# EC2 Operations  
aws ec2 describe-instances                   # Listar instancias
aws ec2 start-instances --instance-ids i-xxx # Iniciar instancia
aws ec2 stop-instances --instance-ids i-xxx  # Detener instancia

# RDS Operations
aws rds describe-db-instances                # Listar bases datos
aws rds create-db-snapshot --db-instance-identifier laburemos-db --db-snapshot-identifier backup-$(date +%Y%m%d)
```

## 🆘 **Solución de Problemas Comunes**

### **Error: InvalidClientTokenId**
```bash
# 1. Verificar configuración
aws configure list

# 2. Reconfigurar si es necesario
aws configure

# 3. Verificar permisos en IAM Console
# 4. Crear nuevas credenciales si es necesario
```

### **Error: AccessDenied**
```bash
# Verificar políticas IAM del usuario
# Asegurar que tiene permisos para el servicio usado
# Verificar si estás en la región correcta
```

### **Error: Region not supported**
```bash
# Especificar región explícitamente
aws s3 ls --region us-east-1

# O configurar variable de entorno
export AWS_DEFAULT_REGION=us-east-1
```

### **Problemas de Conexión EC2**
```bash
# Verificar grupo de seguridad permite SSH (puerto 22)
# Verificar IP pública asignada
# Verificar archivo .pem tiene permisos correctos (400)
chmod 400 laburemos-key.pem
```

## 💰 **Optimización de Costos**

### **Nivel Gratuito AWS (12 meses)**
```yaml
EC2: 750 horas/mes t2.micro o t3.micro
S3: 5GB almacenamiento + 20,000 requests GET
RDS: 750 horas/mes db.t2.micro + 20GB almacenamiento
CloudFront: 50GB transferencia datos + 2,000,000 requests
```

### **Monitoreo de Costos**
```bash
# Ver costos actuales via CLI
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost

# Configurar alertas en Console:
# Billing → Budgets → Create budget
```

## 🎯 **Lista de Verificación Final**

### **AWS CLI y Credenciales**
- ✅ AWS CLI configurado correctamente
- ✅ `aws sts get-caller-identity` funciona sin errores
- ✅ Usuario IAM con permisos apropiados
- ✅ MFA habilitado en cuenta principal

### **Servicios AWS Configurados**
- ✅ S3 bucket para archivos estáticos
- ✅ EC2 instancia para backend NestJS
- ✅ RDS PostgreSQL para base de datos
- ✅ CloudFront para distribución contenido
- ✅ Route 53 para DNS (opcional)

### **Aplicación Desplegada**
- ✅ Frontend Next.js en S3/CloudFront
- ✅ Backend NestJS en EC2 con PM2
- ✅ Variables de entorno configuradas
- ✅ Base de datos conectada y migrada
- ✅ SSL/HTTPS configurado

### **Seguridad y Monitoreo**
- ✅ Grupos de seguridad configurados
- ✅ CloudTrail habilitado
- ✅ CloudWatch alarmas configuradas
- ✅ Backups automáticos RDS
- ✅ Alertas de facturación activas

## 📚 **Recursos Adicionales**

### **Documentación AWS**
- **Guía Usuario IAM**: https://docs.aws.amazon.com/iam/
- **S3 Developer Guide**: https://docs.aws.amazon.com/s3/
- **EC2 User Guide**: https://docs.aws.amazon.com/ec2/
- **RDS User Guide**: https://docs.aws.amazon.com/rds/

### **Herramientas Útiles**
- **AWS CLI Reference**: https://docs.aws.amazon.com/cli/
- **Calculadora Precios**: https://calculator.aws/
- **Estado Servicios**: https://status.aws.amazon.com/
- **AWS Architecture Center**: https://aws.amazon.com/architecture/

### **Comunidad y Soporte**
- **AWS re:Post**: https://repost.aws/
- **Foros AWS**: https://forums.aws.amazon.com/
- **AWS Support**: Disponible en tu Console AWS

---

## 🎯 **Tu Próximo Paso**

1. **Ir a IAM** y crear el usuario `laburemos-cli-user` con las credenciales
2. **Configurar AWS CLI** con las nuevas credenciales
3. **Probar** con `aws sts get-caller-identity`
4. **Comenzar creación** de servicios S3, EC2, RDS según necesites

**¡Estás listo para migrar LABUREMOS a AWS!** 🚀

---

**📄 Document Status**: Guía Completa AWS | **🔄 Last Updated**: 2025-07-30 | **📋 Version**: 1.0

**🔗 Related Documents**: 
- [cloud-oracle.md](./cloud-oracle.md) - Guía Oracle Cloud alternativa
- [CLAUDE.md](./CLAUDE.md) - Configuración proyecto LABUREMOS
- [PROJECT-INDEX.md](./PROJECT-INDEX.md) - Índice completo documentación
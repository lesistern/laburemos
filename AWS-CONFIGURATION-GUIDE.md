# 🚀 Guía de Configuración AWS para LABUREMOS

Esta guía te ayudará a configurar completamente AWS para el proyecto laburemos.com.ar.

## 📋 Pre-requisitos

1. **Credenciales AWS** con permisos para:
   - Route 53 (gestión de DNS)
   - EC2 (acceso a instancias)
   - CloudFront (distribución CDN)
   - ACM (certificados SSL)

2. **Llave SSH** para EC2:
   - Debe estar en `/tmp/laburemos-key.pem`
   - O ajusta la ruta en `restart-ec2-services.sh`

## 🔧 Configuración Paso a Paso

### Paso 1: Configurar Credenciales AWS

```bash
# Ejecutar el script de configuración
./setup-aws-credentials.sh

# Te pedirá:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Region (usar us-east-1)
```

### Paso 2: Configurar DNS y Servicios

```bash
# Ejecutar configuración completa
./configure-aws-complete.sh

# Este script:
# ✅ Configura Route 53 con los registros DNS
# ✅ Verifica servicios backend en EC2
# ✅ Revisa Security Groups
# ✅ Verifica estado del certificado SSL
```

### Paso 3: Configurar Name Servers en NIC.ar

Después de ejecutar el script, obtendrás 4 name servers de AWS.
Debes configurarlos en NIC.ar:

1. Ingresa a [nic.ar](https://nic.ar)
2. Accede a tu dominio laburemos.com.ar
3. Actualiza los DNS con los valores de AWS Route 53

### Paso 4: Verificar/Reiniciar Servicios Backend

```bash
# Si necesitas acceso SSH a EC2
./restart-ec2-services.sh

# Este script:
# - Verifica servicios PM2
# - Muestra logs
# - Permite reiniciar servicios
```

### Paso 5: Actualizar CloudFront (cuando el certificado esté listo)

```bash
# Verificar estado del certificado
./aws/dist/aws acm describe-certificate \
  --certificate-arn "arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886" \
  --region us-east-1 \
  --query 'Certificate.Status'

# Cuando muestre "ISSUED", ejecutar:
./update-cloudfront-domain.sh
```

## 📊 Estado Actual

### ✅ Completado
- EC2 con backend desplegado (3.81.56.168)
- CloudFront distribución activa (E1E1QZ7YLALIAZ)
- S3 bucket configurado (laburemos-files-2025)
- RDS PostgreSQL activo
- Certificado SSL solicitado

### 🔄 En Proceso
- Validación del certificado SSL (puede tomar hasta 48 horas)
- Propagación DNS después de configurar en NIC.ar

### ⏳ Pendiente
- Configurar name servers en NIC.ar
- Actualizar CloudFront con dominio personalizado (cuando certificado esté listo)

## 🌐 URLs de Producción

- **Frontend (temporal)**: https://d2ijlktcsmmfsd.cloudfront.net
- **Frontend (final)**: https://laburemos.com.ar (cuando DNS propague)
- **Backend API**: http://3.81.56.168:3001
- **NestJS Backend**: http://3.81.56.168:3002

## 🆘 Troubleshooting

### Error: "No credentials configured"
```bash
# Configurar credenciales
./setup-aws-credentials.sh
```

### Error: "Certificate not validated"
- El certificado puede tardar hasta 48 horas en validarse
- AWS intentará validar automáticamente via DNS
- Verifica el estado con el comando en el Paso 5

### Error: "Cannot connect to EC2"
- Verifica que tienes la llave SSH correcta en `/tmp/laburemos-key.pem`
- Asegúrate que los Security Groups permiten SSH (puerto 22)

### Los servicios no responden
```bash
# Verificar servicios directamente
curl http://3.81.56.168:3001
curl http://3.81.56.168:3002

# Reiniciar con el script
./restart-ec2-services.sh
```

## 📝 Notas Importantes

1. **Propagación DNS**: Después de configurar los name servers en NIC.ar, la propagación puede tomar 2-48 horas.

2. **Certificado SSL**: La validación es automática via DNS. No requiere acción manual si los registros DNS están correctos.

3. **Seguridad**: Mantén las credenciales AWS seguras y no las compartas.

4. **Costos**: Esta configuración en AWS tiene un costo aproximado de $50-100/mes.

## 🚀 Siguiente Paso

Una vez completada la configuración:

1. El sitio estará disponible en https://laburemos.com.ar
2. El backend seguirá en http://3.81.56.168:3001
3. Considera implementar HTTPS para el backend también

---

**Última actualización**: 2025-07-31
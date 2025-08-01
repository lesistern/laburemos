# 🚀 GUÍA RÁPIDA AWS - LABUREMOS.COM.AR

## 📊 Estado Actual del Diagnóstico

### ❌ Problemas Detectados:
1. **DNS no resuelve**: laburemos.com.ar y www.laburemos.com.ar no tienen registros DNS
2. **Backends inaccesibles**: Puertos 3001 y 3002 en EC2 no responden
3. **CloudFront funciona**: https://d2ijlktcsmmfsd.cloudfront.net está activo

## 🔧 Solución Paso a Paso

### PASO 1: Obtener Credenciales AWS
1. Ingresa a la consola AWS: https://console.aws.amazon.com/
2. Ve a IAM → Users → Tu usuario
3. Click en "Security credentials"
4. Crea un nuevo Access Key si no tienes uno

### PASO 2: Ejecutar Configuración
```bash
# Ejecuta este comando y sigue las instrucciones:
./configure-aws-interactive.sh
```

Te pedirá:
- AWS Access Key ID: (ejemplo: AKIAXXXXXXXXXXXXXXXX)
- AWS Secret Access Key: (ejemplo: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX)
- Default region: us-east-1 (presiona Enter para usar el default)

### PASO 3: Configurar NIC.ar
Cuando el script termine, te mostrará los nameservers de AWS. Debes:

1. Ingresar a tu cuenta en https://nic.ar
2. Buscar tu dominio laburemos.com.ar
3. Cambiar los nameservers a los de AWS:
   - ns-XXXX.awsdns-XX.com
   - ns-XXXX.awsdns-XX.net
   - ns-XXXX.awsdns-XX.org
   - ns-XXXX.awsdns-XX.co.uk

### PASO 4: Reiniciar Servicios EC2
```bash
# Si los backends no responden, ejecuta:
./restart-ec2-services.sh
```

### PASO 5: Esperar y Verificar
- **DNS**: 2-48 horas para propagación completa
- **Certificado SSL**: Puede tomar hasta 48 horas para validación
- **Mientras tanto**: Usa https://d2ijlktcsmmfsd.cloudfront.net

## 📱 URLs de Acceso

### Temporales (Ya funcionan):
- Frontend: https://d2ijlktcsmmfsd.cloudfront.net
- Backend API: http://3.81.56.168:3001 (cuando esté activo)

### Finales (Después de configurar DNS):
- https://laburemos.com.ar
- https://www.laburemos.com.ar

## 🆘 Troubleshooting

### Si el backend no responde:
```bash
# Opción 1: Reiniciar servicios
./restart-ec2-services.sh

# Opción 2: Conectarse manualmente
ssh -i /tmp/laburemos-key.pem ec2-user@3.81.56.168
pm2 restart all
```

### Si el DNS no propaga después de 48h:
1. Verifica en NIC.ar que los nameservers estén correctos
2. Usa https://dnschecker.org/ para verificar propagación
3. Contacta soporte de NIC.ar si es necesario

## ✅ Checklist de Verificación

- [ ] Credenciales AWS configuradas
- [ ] Route 53 configurado con registros DNS
- [ ] Nameservers actualizados en NIC.ar
- [ ] Security Groups abiertos (puertos 3001, 3002)
- [ ] Servicios backend funcionando
- [ ] Certificado SSL validado (puede tomar 48h)
- [ ] CloudFront actualizado con dominio (después del SSL)

## 📞 Soporte

- **AWS Support**: https://console.aws.amazon.com/support/
- **NIC.ar**: https://nic.ar/ayuda
- **Documentación del proyecto**: Ver CLAUDE.md
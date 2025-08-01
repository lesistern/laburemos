# 🌍 Cómo Cambiar el Home Region en Oracle Cloud

## ⚠️ IMPORTANTE: Limitaciones del Home Region

### Lo que NO se puede hacer:
- **NO se puede cambiar** el Home Region después de crearlo
- **NO se puede mover** recursos del Free Tier entre regiones
- **NO se puede transferir** el Free Tier a otra región

### Lo que SÍ se puede hacer:
- Suscribirse a regiones adicionales (pero los recursos Free Tier solo funcionan en Home Region)
- Crear una nueva cuenta con un Home Region diferente
- Usar recursos pagados en otras regiones

## 🔍 Verificar tu Home Region Actual

1. **En la Consola de Oracle Cloud**:
   - Esquina superior derecha → Click en el nombre de la región
   - La que dice **(Home)** es tu Home Region
   - Ejemplo: `US East (Ashburn) (Home)`

2. **Por CLI**:
   ```bash
   oci iam region-subscription list --query 'data[?is-home-region==`true`]'
   ```

## 📋 Opciones Disponibles

### Opción 1: Suscribirse a Regiones Adicionales (NO cambia el Home)
```bash
# Ver regiones disponibles
oci iam region list

# Suscribirse a una nueva región
# NOTA: Los recursos Free Tier NO estarán disponibles en la nueva región
```

**Pasos en la Consola**:
1. Ir a **Administration** → **Tenancy Details**
2. Click en **Manage Regions**
3. Click **Subscribe** en la región deseada
4. Confirmar la suscripción

### Opción 2: Crear Nueva Cuenta (ÚNICA forma de cambiar Home Region)

**⚠️ Consideraciones**:
- Necesitarás un email diferente
- Perderás el progreso actual
- El Free Tier se reinicia

**Pasos**:
1. Cerrar sesión de la cuenta actual
2. Ir a https://www.oracle.com/cloud/free/
3. Click en **Start for free**
4. **IMPORTANTE**: En el registro, seleccionar cuidadosamente:
   - **Country/Territory**: Tu país
   - **Home Region**: La región deseada (¡NO SE PUEDE CAMBIAR DESPUÉS!)

### Opción 3: Migración Manual (Para datos/aplicaciones)

Si necesitas mover recursos a otra región:

```bash
# 1. Hacer backup de tus datos
oci os object bulk-download \
  --bucket-name mi-bucket \
  --download-dir ./backup

# 2. Exportar configuraciones
oci compute instance list --compartment-id <id> > instances.json
oci bv volume list --compartment-id <id> > volumes.json

# 3. Recrear en nueva región (requiere cuenta pagada)
# Los recursos Free Tier solo funcionan en Home Region
```

## 🌐 Regiones Recomendadas por Ubicación

### América Latina:
- **Brazil East (Sao Paulo)** - Mejor latencia para Sudamérica
- **Chile (Santiago)** - Alternativa para cono sur
- **Mexico Central (Queretaro)** - Para México y Centroamérica

### Estados Unidos:
- **US East (Ashburn)** - Principal, más capacidad
- **US West (Phoenix)** - Costa oeste

### Europa:
- **Germany Central (Frankfurt)**
- **UK South (London)**
- **Netherlands Northwest (Amsterdam)**

## 💡 Estrategia Recomendada

### Si REALMENTE necesitas cambiar de región:

1. **Evalúa si es necesario**:
   - ¿Es por latencia? (diferencia real en ms)
   - ¿Es por disponibilidad de recursos?
   - ¿Es por regulaciones legales?

2. **Si decides crear nueva cuenta**:
   ```bash
   # Backup completo antes de migrar
   ./backup-oracle-cloud.sh
   
   # Script de backup
   #!/bin/bash
   echo "Backing up Oracle Cloud resources..."
   
   # Compute instances
   oci compute instance list --all > backup/instances.json
   
   # Block volumes
   oci bv volume list --all > backup/volumes.json
   
   # Object Storage
   oci os bucket list > backup/buckets.json
   
   # Networking
   oci network vcn list --all > backup/vcns.json
   
   # Databases
   oci db database list --all > backup/databases.json
   
   echo "Backup completed in ./backup/"
   ```

3. **Planifica la migración**:
   - Viernes por la noche o fin de semana
   - Tener todo documentado
   - Probar primero en región secundaria si es posible

## 🚀 Optimización sin Cambiar Region

### Mejorar Latencia sin Migrar:
```bash
# 1. Usar CDN para contenido estático
# CloudFlare, Fastly, o Oracle Cloud CDN

# 2. Implementar caching agresivo
# Redis, Memcached

# 3. Optimizar aplicación
# Minificar assets, lazy loading, etc.
```

### Verificar Latencia Actual:
```bash
# Test de latencia a diferentes regiones
#!/bin/bash
regions=(
  "sa-saopaulo-1.oraclecloud.com"
  "us-ashburn-1.oraclecloud.com"
  "us-phoenix-1.oraclecloud.com"
  "eu-frankfurt-1.oraclecloud.com"
)

echo "Testing latency to Oracle regions..."
for region in "${regions[@]}"; do
  echo -n "$region: "
  ping -c 4 $region | tail -1 | awk '{print $4}' | cut -d '/' -f 2
done
```

## ❓ FAQ

**P: ¿Por qué Oracle no permite cambiar el Home Region?**
R: Por temas de infraestructura, compliance y asignación de recursos Free Tier.

**P: ¿Puedo tener Free Tier en múltiples regiones?**
R: No, el Free Tier solo está disponible en tu Home Region.

**P: ¿Qué pasa si mi Home Region no tiene disponibilidad?**
R: Puedes:
- Esperar a que haya disponibilidad
- Usar recursos pagados en otra región
- Crear nueva cuenta con diferente Home Region

**P: ¿Puedo transferir mi Free Tier a otro email?**
R: No, el Free Tier está vinculado a la cuenta y no es transferible.

## 📞 Soporte

Si tienes una razón válida (como cambio de país de residencia), puedes contactar:
- Oracle Cloud Support (solo cuentas pagadas)
- Chat en vivo en el portal
- Foro de la comunidad Oracle

---

**Recomendación**: Antes de crear una nueva cuenta, evalúa si realmente necesitas cambiar de región o si puedes optimizar tu setup actual.
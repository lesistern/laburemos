# 🚨 Solución para Límites de Recursos en Oracle Cloud

## 📊 Verificar Estado de Límites

### 1. Acceder a Service Limits
1. Ingresar a Oracle Cloud Console
2. Ir a **Governance & Administration** → **Tenancy Management** → **Limits, Quotas and Usage**
3. O directamente: **Menu** → **Governance** → **Service Limits**

### 2. Recursos Típicamente Limitados en Free Tier

| Recurso | Límite Free Tier | Estado Común |
|---------|-----------------|--------------|
| **Compute Instances** | 2 VMs (E2.1.Micro) o 1 VM (A1.Flex) | ⚠️ Critical |
| **Boot Volume Storage** | 200 GB total | ⚠️ Warning |
| **Block Volume Storage** | 200 GB total | ⚠️ Warning |
| **Load Balancer** | 1 (10 Mbps) | ✅ OK |
| **VCN (Virtual Cloud Network)** | 2 | ✅ OK |
| **Object Storage** | 10 GB | ⚠️ Warning |
| **Database** | 2 DBs (20 GB cada una) | ✅ OK |

## 🔧 Soluciones Inmediatas

### Opción 1: Liberar Recursos No Utilizados

```bash
# Listar todas las instancias
oci compute instance list --compartment-id <compartment-ocid>

# Terminar instancias no usadas
oci compute instance terminate --instance-id <instance-ocid>

# Eliminar volúmenes no conectados
oci bv volume list --compartment-id <compartment-ocid>
oci bv volume delete --volume-id <volume-ocid>
```

### Opción 2: Optimizar Recursos Existentes

#### A. Reducir Tamaño de Volúmenes
```bash
# 1. Crear snapshot del volumen actual
# 2. Crear nuevo volumen más pequeño desde snapshot
# 3. Reemplazar volumen original

# Ejemplo: Reducir de 100GB a 50GB
sudo resize2fs /dev/sda1 50G
```

#### B. Consolidar Servicios
```bash
# En lugar de múltiples VMs, usar una sola con Docker
docker-compose.yml:
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
  backend:
    build: ./backend
    ports:
      - "3001:3001"
  xampp:
    image: tomsik68/xampp
    ports:
      - "80:80"
      - "3306:3306"
```

### Opción 3: Usar Shapes Más Eficientes

#### Migrar de E2.1.Micro a A1.Flex
```bash
# A1.Flex ofrece más recursos en Free Tier:
# - Hasta 4 OCPUs (vs 1 en E2.1.Micro)
# - Hasta 24 GB RAM (vs 1 GB)
# - Mejor rendimiento general

# Configuración óptima A1.Flex:
Shape: VM.Standard.A1.Flex
OCPUs: 2-4
Memory: 12-24 GB
```

## 💡 Estrategias Alternativas

### 1. Híbrido Local + Cloud
```bash
# Desarrollo local, despliegue en cloud
# Frontend/Backend: Local (tu PC)
# Base de datos: Oracle Cloud Database
# Storage: Oracle Object Storage

# Conexión remota a DB
ssh -L 1521:localhost:1521 opc@<oracle-ip>
```

### 2. Programar Uso de Recursos
```bash
# Script para iniciar/detener instancias según horario
#!/bin/bash
# start-workday.sh
oci compute instance action --action START --instance-id <id>

# stop-workday.sh (ejecutar al final del día)
oci compute instance action --action STOP --instance-id <id>

# Cron para automatizar
0 8 * * 1-5 /home/user/start-workday.sh
0 18 * * 1-5 /home/user/stop-workday.sh
```

### 3. Alternativas Gratuitas Complementarias

#### GitHub Codespaces (para desarrollo)
```yaml
# .devcontainer/devcontainer.json
{
  "image": "mcr.microsoft.com/devcontainers/universal:2",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers/features/php:1": {}
  },
  "forwardPorts": [3000, 3001, 80]
}
```

#### Railway.app (para backend)
```bash
# Desplegar backend gratuitamente
railway login
railway init
railway up
# $5 USD gratis al mes
```

#### Render.com (para frontend)
```yaml
# render.yaml
services:
  - type: web
    name: laburemos-frontend
    env: static
    buildCommand: npm run build
    staticPublishPath: ./out
```

## 🛠️ Configuración Óptima para Desarrollo

### Setup Minimalista en Oracle Cloud
```bash
# 1. Una sola VM A1.Flex con:
- 2 OCPUs
- 12 GB RAM
- 50 GB Boot Volume
- Ubuntu Server (sin GUI para ahorrar recursos)

# 2. Acceso via SSH + Port Forwarding
ssh -L 3000:localhost:3000 \
    -L 3001:localhost:3001 \
    -L 8080:localhost:80 \
    -L 3306:localhost:3306 \
    opc@<oracle-ip>

# 3. Desarrollo con VS Code Remote
code --install-extension ms-vscode-remote.remote-ssh
# Conectar a Oracle Cloud instance
```

### Docker Compose Optimizado
```yaml
version: '3.8'
services:
  # Todo en una sola VM
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - ./:/app
    environment:
      - NODE_ENV=development
    mem_limit: 4g
    cpus: '1.0'
```

## 📈 Monitoreo de Recursos

### Script de Monitoreo
```bash
#!/bin/bash
# monitor-resources.sh
echo "=== Oracle Cloud Resource Monitor ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}'

echo "Memory Usage:"
free -m | awk 'NR==2{printf "%.2f%%\n", $3*100/$2}'

echo "Disk Usage:"
df -h | grep "/$" | awk '{print $5}'

echo "Service Limits Status:"
oci limits service-summary list --compartment-id <id>
```

## 🚀 Plan de Acción Recomendado

1. **Inmediato**: 
   - Verificar qué recurso específico está en estado crítico
   - Eliminar recursos no utilizados

2. **Corto plazo**:
   - Migrar a una configuración más eficiente (A1.Flex)
   - Implementar desarrollo híbrido local/cloud

3. **Largo plazo**:
   - Considerar upgrade a cuenta pagada si el proyecto crece
   - Implementar auto-scaling y gestión de recursos

## 📞 Recursos de Ayuda

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Service Limits Documentation](https://docs.oracle.com/en-us/iaas/Content/General/Concepts/servicelimits.htm)
- [OCI CLI Reference](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/)

---

**Tip**: Si el límite crítico es de Compute, considera usar GitHub Codespaces o GitPod para desarrollo temporal mientras resuelves los límites en Oracle Cloud.
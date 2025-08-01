#!/bin/bash

# Script para verificar y reiniciar servicios en EC2
EC2_IP="3.81.56.168"
KEY_PATH="/tmp/laburemos-key.pem"

echo "=== Verificación y reinicio de servicios EC2 ==="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar si existe la llave SSH
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}❌ No se encuentra la llave SSH en $KEY_PATH${NC}"
    echo "Por favor, asegúrate de tener la llave SSH de EC2"
    exit 1
fi

# Establecer permisos correctos
chmod 400 $KEY_PATH

echo "1. Conectando a EC2 ($EC2_IP)..."

# Función para ejecutar comandos remotos
remote_exec() {
    ssh -o StrictHostKeyChecking=no -i $KEY_PATH ec2-user@$EC2_IP "$1"
}

# Verificar conexión SSH
if ! ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i $KEY_PATH ec2-user@$EC2_IP "echo 'SSH OK'" &> /dev/null; then
    echo -e "${RED}❌ No se puede conectar por SSH a EC2${NC}"
    echo "Verificando conectividad HTTP..."
    
    # Verificar servicios por HTTP
    if curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:3001 | grep -q "200\|404"; then
        echo -e "${GREEN}✅ API en puerto 3001 responde por HTTP${NC}"
    else
        echo -e "${RED}❌ API en puerto 3001 no responde${NC}"
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:3002 | grep -q "200\|404"; then
        echo -e "${GREEN}✅ NestJS en puerto 3002 responde por HTTP${NC}"
    else
        echo -e "${YELLOW}⚠️  NestJS en puerto 3002 no responde${NC}"
    fi
    
    exit 1
fi

echo -e "${GREEN}✅ Conexión SSH establecida${NC}"
echo ""

# Verificar estado de PM2
echo "2. Verificando servicios PM2..."
PM2_LIST=$(remote_exec "pm2 list" 2>&1)

if [[ $PM2_LIST == *"command not found"* ]]; then
    echo -e "${RED}❌ PM2 no está instalado${NC}"
    echo "Instalando PM2..."
    remote_exec "npm install -g pm2"
fi

echo "$PM2_LIST"
echo ""

# Verificar servicios específicos
echo "3. Verificando servicios específicos..."

# Servicio en puerto 3001
SERVICE_3001=$(remote_exec "pm2 show 0 2>/dev/null || echo 'not found'")
if [[ $SERVICE_3001 == *"not found"* ]]; then
    echo -e "${YELLOW}⚠️  Servicio en puerto 3001 no está en PM2${NC}"
    
    # Buscar aplicación simple
    if remote_exec "test -d /home/ec2-user/simple-backend"; then
        echo "Iniciando servicio simple-backend..."
        remote_exec "cd /home/ec2-user/simple-backend && pm2 start app.js --name simple-backend"
    fi
else
    echo -e "${GREEN}✅ Servicio en puerto 3001 encontrado${NC}"
fi

# Servicio en puerto 3002  
SERVICE_3002=$(remote_exec "pm2 show backend 2>/dev/null || echo 'not found'")
if [[ $SERVICE_3002 == *"not found"* ]]; then
    echo -e "${YELLOW}⚠️  NestJS backend no está en PM2${NC}"
    
    # Buscar aplicación NestJS
    if remote_exec "test -d /home/ec2-user/backend"; then
        echo "Iniciando NestJS backend..."
        remote_exec "cd /home/ec2-user/backend && npm run build && pm2 start dist/main.js --name backend -- --port 3002"
    fi
else
    echo -e "${GREEN}✅ NestJS backend encontrado${NC}"
fi

# Mostrar logs recientes
echo ""
echo "4. Logs recientes:"
remote_exec "pm2 logs --lines 10 --nostream"

# Opción de reiniciar
echo ""
echo "5. ¿Deseas reiniciar todos los servicios? (s/n)"
read -r response

if [[ "$response" =~ ^([sS][íiÍI]|[sS])$ ]]; then
    echo "Reiniciando servicios..."
    remote_exec "pm2 restart all"
    echo -e "${GREEN}✅ Servicios reiniciados${NC}"
    
    # Guardar configuración PM2
    remote_exec "pm2 save"
    remote_exec "pm2 startup"
    
    echo ""
    echo "Estado final de servicios:"
    remote_exec "pm2 list"
fi

echo ""
echo "=== Verificación completada ==="
echo ""
echo "URLs de servicio:"
echo "  Simple API: http://$EC2_IP:3001"
echo "  NestJS API: http://$EC2_IP:3002"
echo ""
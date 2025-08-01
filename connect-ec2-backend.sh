#!/bin/bash

# Script para conectarse a EC2 y reiniciar servicios backend

echo "=== Conectando a EC2 para reiniciar servicios backend ==="
echo ""

# Rutas de las llaves SSH posibles
SSH_KEY_PATHS=(
    "/mnt/d/Secure/ssh-key-2025-07-30.key"
    "/mnt/d/Secure/laburemos-key.pem"
    "/mnt/d/Secure/laburar-key.pem"
    "/mnt/d/Secure/aws-key.pem"
    "/mnt/d/Secure/*.pem"
    "/mnt/d/Secure/*.key"
)

# Buscar la llave SSH
SSH_KEY=""
for key_path in "${SSH_KEY_PATHS[@]}"; do
    if [ -f "$key_path" ]; then
        SSH_KEY="$key_path"
        echo "✅ Llave SSH encontrada: $SSH_KEY"
        break
    fi
done

# Si no se encuentra, listar archivos en D:\Secure
if [ -z "$SSH_KEY" ]; then
    echo "❌ No se encontró la llave SSH automáticamente."
    echo ""
    echo "Archivos de llave SSH en D:\\Secure:"
    ls -la /mnt/d/Secure/*.pem /mnt/d/Secure/*.key 2>/dev/null || echo "No se encontraron archivos de llave"
    echo ""
    echo "Por favor, especifica la ruta completa de tu llave SSH:"
    read -p "Ruta de la llave SSH: " SSH_KEY
fi

# Verificar que la llave existe
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: No se encuentra el archivo $SSH_KEY"
    exit 1
fi

# Establecer permisos correctos
echo "Configurando permisos de la llave SSH..."
chmod 400 "$SSH_KEY"

# Información de conexión
EC2_IP="3.81.56.168"
EC2_USER="ec2-user"

echo ""
echo "🔧 COMANDOS PARA REINICIAR SERVICIOS:"
echo "======================================"
echo "Una vez conectado, ejecuta estos comandos:"
echo ""
echo "1. Ver servicios actuales:"
echo "   pm2 list"
echo ""
echo "2. Reiniciar todos los servicios:"
echo "   pm2 restart all"
echo ""
echo "3. Ver logs en tiempo real:"
echo "   pm2 logs"
echo ""
echo "4. Si PM2 no está instalado:"
echo "   cd /home/ec2-user/backend"
echo "   npm install -g pm2"
echo "   pm2 start npm --name 'backend-3001' -- run start:prod -- --port 3001"
echo "   pm2 start npm --name 'backend-3002' -- run start:prod -- --port 3002"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Para salir de los logs: Ctrl+C"
echo "6. Para desconectarte: exit"
echo "======================================"
echo ""
echo "Conectando a EC2..."
echo ""

# Conectar a EC2
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_IP"
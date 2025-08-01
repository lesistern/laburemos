# 🖥️ Configuración de Oracle Cloud para Desarrollo con Cursor, Claude Code y XAMPP

## 📋 Requisitos Previos
- Cuenta Oracle Cloud (Free Tier disponible)
- Cliente SSH (PuTTY para Windows)
- Cliente RDP (Remote Desktop) o VNC Viewer

## 🚀 Paso 1: Crear Instancia VM en Oracle Cloud

### 1.1 Configuración de la VM
```bash
# Especificaciones recomendadas para desarrollo
- Shape: VM.Standard.E2.1.Micro (Free Tier) o VM.Standard.A1.Flex (mejor)
- OCPU: 2-4 cores (A1.Flex permite hasta 4 gratis)
- RAM: 8-24 GB (A1.Flex permite hasta 24GB gratis)
- Boot Volume: 100-200 GB
- OS: Ubuntu 22.04 LTS o Oracle Linux 8
```

### 1.2 Crear la Instancia
1. Ir a **Compute → Instances → Create Instance**
2. Configurar:
   - **Name**: `dev-workstation`
   - **Compartment**: Default
   - **Placement**: Cualquier AD disponible
   - **Image**: Ubuntu 22.04 o Oracle Linux 8
   - **Shape**: 
     - Opción 1: `VM.Standard.E2.1.Micro` (x86, Free)
     - Opción 2: `VM.Standard.A1.Flex` (ARM, más potente, Free)
   - **Networking**: Crear nueva VCN o usar existente
   - **SSH Keys**: Generar nuevo par o subir tu clave pública

### 1.3 Configurar Reglas de Seguridad
```bash
# Abrir puertos necesarios en Security List
- SSH: 22 (ya abierto)
- HTTP: 80
- HTTPS: 443
- RDP: 3389
- VNC: 5901-5910
- XAMPP MySQL: 3306
- Development: 3000-3010, 5000-5010, 8080-8090
```

## 🖥️ Paso 2: Configurar Escritorio Remoto

### 2.1 Para Ubuntu 22.04
```bash
# Conectar por SSH
ssh -i tu-llave.pem ubuntu@[IP-PUBLICA]

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar escritorio XFCE (ligero)
sudo apt install -y xfce4 xfce4-goodies

# Opción A: Configurar RDP (Recomendado para Windows)
sudo apt install -y xrdp
sudo systemctl enable xrdp
sudo adduser xrdp ssl-cert

# Configurar xrdp para usar xfce
echo "xfce4-session" > ~/.xsession
sudo service xrdp restart

# Opción B: Configurar VNC
sudo apt install -y tigervnc-standalone-server tigervnc-common
vncpasswd  # Configurar contraseña
vncserver -geometry 1920x1080 -depth 24
```

### 2.2 Para Oracle Linux 8
```bash
# Conectar por SSH
ssh -i tu-llave.pem opc@[IP-PUBLICA]

# Instalar grupo de escritorio
sudo dnf groupinstall -y "Server with GUI"
sudo systemctl set-default graphical.target

# Instalar y configurar xrdp
sudo dnf install -y epel-release
sudo dnf install -y xrdp
sudo systemctl enable --now xrdp
sudo firewall-cmd --permanent --add-port=3389/tcp
sudo firewall-cmd --reload
```

## 💻 Paso 3: Instalar Herramientas de Desarrollo

### 3.1 Instalar Dependencias Base
```bash
# Node.js y npm (para Claude Code)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Herramientas adicionales
sudo apt install -y curl wget unzip software-properties-common
```

### 3.2 Instalar Cursor
```bash
# Descargar Cursor AppImage
cd ~/Downloads
wget https://downloader.cursor.sh/linux/appImage/x64 -O cursor.AppImage
chmod +x cursor.AppImage

# Crear aplicación de escritorio
mkdir -p ~/.local/share/applications
cat > ~/.local/share/applications/cursor.desktop << EOF
[Desktop Entry]
Name=Cursor
Exec=/home/ubuntu/Downloads/cursor.AppImage
Icon=cursor
Type=Application
Categories=Development;
EOF

# Ejecutar Cursor
./cursor.AppImage
```

### 3.3 Instalar Claude Code CLI
```bash
# Instalar globalmente
sudo npm install -g @anthropic-ai/claude-code

# Verificar instalación
claude-code --version

# Configurar API key
export ANTHROPIC_API_KEY="tu-api-key"
echo 'export ANTHROPIC_API_KEY="tu-api-key"' >> ~/.bashrc
```

### 3.4 Instalar XAMPP
```bash
# Descargar XAMPP para Linux
cd ~/Downloads
wget https://sourceforge.net/projects/xampp/files/XAMPP%20Linux/8.2.12/xampp-linux-x64-8.2.12-0-installer.run/download -O xampp-installer.run
chmod +x xampp-installer.run

# Instalar XAMPP
sudo ./xampp-installer.run

# Iniciar XAMPP
sudo /opt/lampp/lampp start

# Crear acceso directo en escritorio
cat > ~/Desktop/xampp-control.desktop << EOF
[Desktop Entry]
Name=XAMPP Control Panel
Exec=gksu /opt/lampp/manager-linux-x64.run
Icon=/opt/lampp/htdocs/favicon.ico
Type=Application
Categories=Development;
EOF
chmod +x ~/Desktop/xampp-control.desktop
```

## 🔒 Paso 4: Seguridad y Configuración Final

### 4.1 Configurar Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 3389/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000:3010/tcp
sudo ufw allow 5000:5010/tcp
sudo ufw allow 8080:8090/tcp
sudo ufw enable
```

### 4.2 Crear Usuario de Desarrollo
```bash
# Crear usuario específico para desarrollo
sudo adduser developer
sudo usermod -aG sudo developer

# Configurar para RDP
echo "xfce4-session" > /home/developer/.xsession
sudo chown developer:developer /home/developer/.xsession
```

### 4.3 Script de Respaldo Automático
```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-dev.sh
```

Contenido del script:
```bash
#!/bin/bash
# Backup de proyectos y configuraciones
BACKUP_DIR="/home/developer/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de proyectos
tar -czf $BACKUP_DIR/projects_$DATE.tar.gz /home/developer/projects/

# Backup de XAMPP
sudo tar -czf $BACKUP_DIR/xampp_$DATE.tar.gz /opt/lampp/htdocs/ /opt/lampp/etc/

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completado: $DATE"
```

```bash
# Hacer ejecutable y programar
sudo chmod +x /usr/local/bin/backup-dev.sh
sudo crontab -e
# Agregar: 0 2 * * * /usr/local/bin/backup-dev.sh
```

## 🚀 Paso 5: Optimización y Tips

### 5.1 Mejorar Rendimiento
```bash
# Aumentar swap si es necesario
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimizar para desarrollo
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 5.2 Configurar Proyecto Laburemos
```bash
# Clonar proyecto
cd ~
git clone https://github.com/tu-usuario/laburemos.git
cd laburemos

# Configurar frontend
cd frontend
npm install
npm run dev &

# Configurar backend
cd ../backend
npm install
npm run start:dev &

# Copiar a XAMPP si es necesario
sudo cp -r ~/laburemos/legacy-php/* /opt/lampp/htdocs/Laburar/
```

## 📱 Acceso Remoto

### Desde Windows
1. **RDP**: 
   - Abrir "Conexión a Escritorio remoto"
   - Servidor: `[IP-PUBLICA]:3389`
   - Usuario: `developer`

2. **SSH + Port Forwarding** (para desarrollo local):
   ```powershell
   ssh -i tu-llave.pem -L 3000:localhost:3000 -L 3001:localhost:3001 -L 8080:localhost:80 ubuntu@[IP-PUBLICA]
   ```

### Desde Mac/Linux
```bash
# RDP con Remmina o Microsoft Remote Desktop
remmina

# VNC
vncviewer [IP-PUBLICA]:5901
```

## 🛠️ Comandos Útiles

```bash
# Verificar servicios
sudo systemctl status xrdp
sudo /opt/lampp/lampp status

# Reiniciar escritorio
sudo systemctl restart gdm3  # o lightdm

# Monitorear recursos
htop
df -h
free -m

# Logs
sudo tail -f /var/log/xrdp.log
sudo tail -f /opt/lampp/logs/error_log
```

## ⚠️ Consideraciones Importantes

1. **Costos**: 
   - VM.Standard.E2.1.Micro: Gratis (limitado)
   - VM.Standard.A1.Flex: Gratis hasta 4 OCPU y 24GB RAM
   - Ancho de banda: 10TB/mes gratis

2. **Limitaciones Free Tier**:
   - Las instancias pueden ser reclamadas si hay alta demanda
   - Hacer backups regulares
   - Considerar upgrade a paid tier para producción

3. **Seguridad**:
   - Cambiar contraseñas por defecto
   - Usar SSH keys siempre
   - Configurar fail2ban
   - Actualizar regularmente

## 📞 Soporte y Recursos

- [Oracle Cloud Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Cursor Documentation](https://cursor.sh/docs)
- [Claude Code GitHub](https://github.com/anthropics/claude-code)
- [XAMPP FAQ](https://www.apachefriends.org/faq_linux.html)

---

**Última actualización**: 2025-07-31
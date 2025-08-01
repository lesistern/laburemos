# Guía Completa de Migración LABUREMOS a Oracle VirtualBox 7.1.10

**Migración Profesional: Windows → Oracle VirtualBox VM**  
**Stack**: Next.js 15.4.4 + NestJS + PostgreSQL + MySQL + Redis  
**Estado**: Guía para migración de entorno Production Ready

---

## 📋 Índice de Contenidos

1. [Preparación Pre-Migración](#1-preparación-pre-migración)
2. [Configuración Óptima de VM](#2-configuración-óptima-de-vm)
3. [Instalación del Sistema Operativo](#3-instalación-del-sistema-operativo)
4. [Configuración del Entorno de Desarrollo](#4-configuración-del-entorno-de-desarrollo)
5. [Migración de Archivos](#5-migración-de-archivos)
6. [Migración de Bases de Datos](#6-migración-de-bases-de-datos)
7. [Configuración de Servicios](#7-configuración-de-servicios)
8. [Validación y Testing](#8-validación-y-testing)
9. [Troubleshooting](#9-troubleshooting)
10. [Scripts de Automatización](#10-scripts-de-automatización)

---

## 1. Preparación Pre-Migración

### 1.1 Análisis del Sistema Actual

**Estructura del Proyecto LABUREMOS**:
```
C:\xampp\htdocs\Laburar\
├── frontend/          # Next.js 15.4.4 (47 archivos)
├── backend/           # NestJS microservices (5 servicios)
├── database/          # MySQL schemas y migrations
├── dashboard/         # Enterprise dashboard PHP
├── public/            # Assets estáticos
├── app/               # PHP application (MVC)
├── config/            # Archivos de configuración
└── docs/              # Documentación completa
```

**Servicios Actuales**:
- **Frontend**: http://localhost:3000 (Next.js)
- **Backend**: http://localhost:3001/docs (NestJS API)
- **Legacy PHP**: http://localhost/Laburar (PHP + MySQL)
- **Database**: MySQL (XAMPP) + PostgreSQL

### 1.2 Backup Completo del Proyecto

```bash
# 1. Crear directorio de backup
mkdir C:\LABUREMOS_Backup_$(Get-Date -Format "yyyy-MM-dd")
cd C:\LABUREMOS_Backup_$(Get-Date -Format "yyyy-MM-dd")

# 2. Copiar archivos del proyecto
robocopy "C:\xampp\htdocs\Laburar" ".\project" /E /R:2 /W:1

# 3. Exportar base de datos MySQL
C:\xampp\mysql\bin\mysqldump.exe -u root laburar_db > laburar_mysql_backup.sql

# 4. Backup de configuración XAMPP
robocopy "C:\xampp\apache\conf" ".\xampp_config\apache" /E
robocopy "C:\xampp\mysql\data" ".\xampp_config\mysql_data" laburar_db /E

# 5. Exportar configuraciones de desarrollo
copy "C:\xampp\htdocs\Laburar\frontend\.env.local" ".\config\"
copy "C:\xampp\htdocs\Laburar\backend\.env" ".\config\"

# 6. Crear archivo de inventario
echo "=== LABUREMOS Backup Inventory ===" > backup_inventory.txt
echo "Date: $(Get-Date)" >> backup_inventory.txt
echo "Source: C:\xampp\htdocs\Laburar" >> backup_inventory.txt
echo "MySQL Database: laburar_db" >> backup_inventory.txt
echo "Services: Next.js 15.4.4, NestJS, MySQL, PostgreSQL" >> backup_inventory.txt
```

### 1.3 Documentación de Configuraciones

```bash
# Documentar puertos en uso
netstat -ano | findstr :3000 > ports_inventory.txt
netstat -ano | findstr :3001 >> ports_inventory.txt
netstat -ano | findstr :80 >> ports_inventory.txt
netstat -ano | findstr :3306 >> ports_inventory.txt

# Documentar versiones instaladas
node --version > versions.txt
npm --version >> versions.txt
php --version >> versions.txt
mysql --version >> versions.txt
```

---

## 2. Configuración Óptima de VM

### 2.1 Especificaciones Recomendadas

**Para Desarrollo Profesional**:
```yaml
Configuración Mínima:
  RAM: 8 GB
  Storage: 80 GB SSD
  CPU: 4 cores
  Network: NAT + Host-Only

Configuración Recomendada:
  RAM: 16 GB  
  Storage: 120 GB SSD
  CPU: 6-8 cores
  Network: Bridged + Host-Only

Configuración Óptima:
  RAM: 32 GB
  Storage: 200 GB SSD (NVMe preferible)
  CPU: 8+ cores
  Network: Bridged + Host-Only + NAT
```

### 2.2 Creación de la VM en Oracle VirtualBox

**Paso 1: Crear Nueva VM**
```bash
# Abrir VirtualBox Manager
VirtualBox.exe

# Configuración inicial:
Nombre: LABUREMOS-Development
Tipo: Linux
Versión: Ubuntu (64-bit)
```

**Paso 2: Configuración de Hardware**
```bash
# Memoria RAM
Base Memory: 16384 MB (16 GB)
Enable EFI: ✓

# Procesador
Processors: 8 CPUs
Execution Cap: 100%
Enable PAE/NX: ✓
Enable VT-x/AMD-V: ✓

# Almacenamiento
Storage Controller: SATA (AHCI)
Hard Disk: 200 GB, Dynamically allocated
SSD: ✓ (si tienes SSD host)
```

**Paso 3: Configuración de Red**
```bash
# Adapter 1: NAT (Internet access)
Network Adapter 1: Enable
Attached to: NAT
Advanced > Adapter Type: Intel PRO/1000 MT Desktop

# Adapter 2: Host-Only (VM ↔ Host communication)  
Network Adapter 2: Enable
Attached to: Host-only Adapter
Name: vboxnet0 (crear si no existe)
Advanced > Adapter Type: Intel PRO/1000 MT Desktop

# Port Forwarding (NAT adapter)
Name: LABUREMOS-Frontend, Protocol: TCP, Host Port: 3000, Guest Port: 3000
Name: LABUREMOS-Backend, Protocol: TCP, Host Port: 3001, Guest Port: 3001  
Name: LABUREMOS-MySQL, Protocol: TCP, Host Port: 3306, Guest Port: 3306
Name: LABUREMOS-PostgreSQL, Protocol: TCP, Host Port: 5432, Guest Port: 5432
Name: LABUREMOS-SSH, Protocol: TCP, Host Port: 2222, Guest Port: 22
```

### 2.3 Configuración de Display y Graphics

```bash
# Display Settings
Video Memory: 128 MB
Monitor Count: 1
Scale Factor: 100%
Graphics Controller: VBoxSVGA
Enable 3D Acceleration: ✓
Enable 2D Video Acceleration: ✓
```

---

## 3. Instalación del Sistema Operativo

### 3.1 Instalación de Ubuntu 22.04 LTS

**Descargar Ubuntu Server/Desktop**:
- **Ubuntu Server 22.04 LTS**: Para entorno minimalista de desarrollo
- **Ubuntu Desktop 22.04 LTS**: Para entorno con GUI completo

**Proceso de Instalación**:
```bash
# Durante la instalación:
Hostname: laburar-dev
Username: developer  
Password: [contraseña segura]
Partition: Use entire disk with LVM
Software Selection: OpenSSH Server, Docker, Node.js (si está disponible)
```

### 3.2 Post-Instalación Básica

**Actualizar sistema**:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim nano htop tree unzip
```

**Configurar SSH para acceso remoto**:
```bash
# Instalar y configurar SSH
sudo apt install -y openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh

# Configurar firewall
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 3306/tcp
sudo ufw allow 5432/tcp
sudo ufw --force enable
```

**Configurar red estática (opcional)**:
```bash
# Editar configuración de red
sudo nano /etc/netplan/00-installer-config.yaml

# Contenido para IP estática:
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      dhcp4: false
      addresses: [192.168.56.10/24]
      
# Aplicar cambios
sudo netplan apply
```

---

## 4. Configuración del Entorno de Desarrollo

### 4.1 Instalación de Node.js y npm

```bash
# Instalar Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js LTS (v20)
nvm install --lts
nvm use --lts
nvm alias default node

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar v10.x.x

# Configurar npm global
npm config set fund false
npm config set audit-level moderate
npm install -g npm@latest
```

### 4.2 Instalación de Bases de Datos

**PostgreSQL**:
```bash
# Instalar PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib postgresql-client
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Configurar usuario y base de datos
sudo -u postgres psql << EOF
CREATE USER developer WITH PASSWORD 'developer123';
CREATE DATABASE laburar WITH OWNER developer;
GRANT ALL PRIVILEGES ON DATABASE laburar TO developer;
ALTER USER developer CREATEDB;
\q
EOF

# Configurar acceso remoto
sudo nano /etc/postgresql/15/main/postgresql.conf
# Cambiar: listen_addresses = '*'

sudo nano /etc/postgresql/15/main/pg_hba.conf  
# Agregar: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

**MySQL 8.0**:
```bash
# Instalar MySQL 8.0
sudo apt install -y mysql-server mysql-client
sudo systemctl enable mysql
sudo systemctl start mysql

# Configuración segura
sudo mysql_secure_installation
# Root password: root123 (o la que prefieras)
# Remove anonymous users: Y
# Disallow root login remotely: N
# Remove test database: Y
# Reload privilege tables: Y

# Crear base de datos y usuario
sudo mysql -u root -p << EOF
CREATE DATABASE laburar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'developer'@'%' IDENTIFIED BY 'developer123';
GRANT ALL PRIVILEGES ON laburar_db.* TO 'developer'@'%';
FLUSH PRIVILEGES;
EXIT;
EOF

# Configurar acceso remoto
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Cambiar: bind-address = 0.0.0.0

sudo systemctl restart mysql
```

**Redis**:
```bash
# Instalar Redis
sudo apt install -y redis-server redis-tools
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configurar Redis
sudo nano /etc/redis/redis.conf
# Cambiar: bind 0.0.0.0
# Cambiar: protected-mode no

sudo systemctl restart redis-server
```

### 4.3 Instalación de Herramientas de Desarrollo

**Git y configuración**:
```bash
# Git ya debería estar instalado, configurar
git config --global user.name "LABUREMOS Developer"
git config --global user.email "contacto.laburemos@gmail.com"
git config --global init.defaultBranch main
```

**Docker y Docker Compose**:
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sesión para aplicar permisos
logout
```

**PHP y extensiones (para legacy)**:
```bash
# Instalar PHP 8.2
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-cli php8.2-fpm php8.2-mysql php8.2-pgsql \
                    php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-gd \
                    php8.2-json php8.2-bcmath php8.2-tokenizer

# Instalar Apache o Nginx (opcional para legacy)
sudo apt install -y apache2
sudo systemctl enable apache2
sudo systemctl start apache2

# Configurar PHP con Apache
sudo a2enmod php8.2 rewrite
sudo systemctl restart apache2
```

---

## 5. Migración de Archivos

### 5.1 Preparar Estructura de Directorios

```bash
# Crear estructura de desarrollo
sudo mkdir -p /var/www/laburar
sudo chown -R $USER:$USER /var/www/laburar
cd /var/www/laburar

# Crear directorios necesarios
mkdir -p {logs,storage,uploads,backups,config}
chmod -R 755 logs storage uploads backups
```

### 5.2 Transferir Archivos desde Windows

**Opción 1: Usando SCP/SFTP**
```bash
# Desde Windows (PowerShell o CMD)
# Usar WinSCP, FileZilla, o pscp.exe

# Copiar proyecto completo
pscp -r "C:\xampp\htdocs\Laburar\*" developer@192.168.56.10:/var/www/laburar/
```

**Opción 2: Usando Shared Folders de VirtualBox**
```bash
# En VirtualBox Manager:
# VM Settings > Shared Folders > Add New
# Folder Path: C:\xampp\htdocs\Laburar
# Folder Name: laburar-source
# Mount Point: /mnt/laburar-source
# Options: Auto-mount, Make Permanent

# En la VM, copiar archivos
sudo apt install -y virtualbox-guest-additions-iso
sudo mkdir -p /mnt/laburar-source
sudo mount -t vboxsf laburar-source /mnt/laburar-source

# Copiar archivos
cp -r /mnt/laburar-source/* /var/www/laburar/
```

**Opción 3: Usando Git (recomendado)**
```bash
# Si tienes el proyecto en Git
cd /var/www/laburar
git clone https://github.com/tu-usuario/LABUREMOS.git .

# O crear repositorio local
cd /var/www/laburar
git init
# Copiar archivos y hacer commit inicial
```

### 5.3 Configurar Permisos

```bash
# Establecer permisos correctos
cd /var/www/laburar
sudo chown -R $USER:www-data .
chmod -R 755 .
chmod -R 775 logs storage uploads public

# Configurar SELinux/AppArmor si están habilitados
sudo setfacl -R -m u:www-data:rwx logs storage uploads
sudo setfacl -R -d -m u:www-data:rwx logs storage uploads
```

---

## 6. Migración de Bases de Datos

### 6.1 Migración de MySQL

**Importar datos desde Windows**:
```bash
# Copiar archivo SQL de backup
scp developer@[IP-Windows]:C:/LABUREMOS_Backup*/laburar_mysql_backup.sql ./

# O copiar desde shared folder
cp /mnt/laburar-source/database/create_laburar_db.sql ./

# Importar base de datos
mysql -u developer -p laburar_db < laburar_mysql_backup.sql

# O usar el script de creación original
mysql -u developer -p laburar_db < create_laburar_db.sql

# Verificar importación
mysql -u developer -p -e "USE laburar_db; SHOW TABLES; SELECT COUNT(*) FROM users;"
```

**Script de migración automatizada**:
```bash
#!/bin/bash
# migrate-mysql.sh

echo "=== Migración MySQL LABUREMOS ==="

# Variables
DB_NAME="laburar_db"
DB_USER="developer" 
DB_PASS="developer123"
BACKUP_FILE="laburar_mysql_backup.sql"

# Verificar archivo de backup
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Archivo de backup no encontrado: $BACKUP_FILE"
    exit 1
fi

# Crear base de datos si no existe
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importar datos
echo "Importando datos..."
mysql -u $DB_USER -p$DB_PASS $DB_NAME < $BACKUP_FILE

# Verificar
echo "Verificando migración..."
mysql -u $DB_USER -p$DB_PASS -e "USE $DB_NAME; SHOW TABLES;"

echo "Migración MySQL completada ✓"
```

### 6.2 Configuración de PostgreSQL

**Crear esquema inicial**:
```bash
# Navegar al directorio del backend
cd /var/www/laburar/backend

# Instalar dependencias
npm install

# Configurar Prisma
cp .env.example .env
nano .env

# Contenido del .env:
DATABASE_URL="postgresql://developer:developer123@localhost:5432/laburar"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="tu-jwt-secret-seguro"
```

**Ejecutar migraciones**:
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Seed de datos iniciales
npm run db:seed

# Verificar
npx prisma studio  # Abre en http://localhost:5555
```

---

## 7. Configuración de Servicios

### 7.1 Configurar Variables de Entorno

**Frontend (.env.local)**:
```bash
cd /var/www/laburar/frontend
cp .env.example .env.local
nano .env.local

# Contenido:
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
```

**Backend (.env)**:
```bash
cd /var/www/laburar/backend
nano .env

# Contenido completo:
# Database
DATABASE_URL="postgresql://developer:developer123@localhost:5432/laburar"
MYSQL_URL="mysql://developer:developer123@localhost:3306/laburar_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="laburar-jwt-secret-very-secure-2024"
JWT_EXPIRATION="1d"
JWT_REFRESH_SECRET="laburar-refresh-secret-very-secure-2024"
JWT_REFRESH_EXPIRATION="7d"

# API
PORT=3001
NODE_ENV=development
API_PREFIX="/api"

# CORS
CORS_ORIGIN="http://localhost:3000"

# File Upload
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_DEST="./uploads"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"

# Stripe (opcional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 7.2 Instalar Dependencias

**Frontend**:
```bash
cd /var/www/laburar/frontend
npm install

# Verificar instalación
npm run build
npm run type-check
```

**Backend**:
```bash
cd /var/www/laburar/backend  
npm install

# Generar Prisma client
npx prisma generate

# Verificar instalación
npm run build
npm run test
```

### 7.3 Crear Scripts de Inicio

**Script de inicio general**:
```bash
#!/bin/bash
# start-laburar.sh
cd /var/www/laburar

echo "=== Iniciando LABUREMOS en Ubuntu ==="

# Verificar servicios
sudo systemctl start mysql
sudo systemctl start postgresql  
sudo systemctl start redis-server

echo "✓ Servicios de base de datos iniciados"

# Frontend en background
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend iniciado (PID: $FRONTEND_PID)"

# Backend en background
cd ../backend
npm run start:dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend iniciado (PID: $BACKEND_PID)"

# Guardar PIDs
echo $FRONTEND_PID > ../logs/frontend.pid
echo $BACKEND_PID > ../logs/backend.pid

echo ""
echo "=== LABUREMOS en funcionamiento ==="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001/docs"
echo "MySQL:    localhost:3306"
echo "PostgreSQL: localhost:5432"
echo ""
echo "Para detener: ./stop-laburar.sh"
```

**Script de parada**:
```bash
#!/bin/bash
# stop-laburar.sh
cd /var/www/laburar

echo "=== Deteniendo LABUREMOS ==="

# Detener procesos por PID
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    rm logs/frontend.pid
    echo "✓ Frontend detenido"
fi

if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm logs/backend.pid
    echo "✓ Backend detenido"
fi

# Matar procesos de Node.js relacionados con LABUREMOS
pkill -f "next dev"
pkill -f "nest start"

echo "✓ LABUREMOS detenido completamente"
```

**Hacer scripts ejecutables**:
```bash
chmod +x start-laburar.sh stop-laburar.sh
```

---

## 8. Validación y Testing

### 8.1 Verificación de Servicios

**Script de verificación completa**:
```bash
#!/bin/bash
# verify-laburar.sh

echo "=== Verificación Completa LABUREMOS ==="

# Verificar servicios del sistema
echo "1. Verificando servicios del sistema..."
systemctl is-active mysql postgresql redis-server | while read status; do
    if [ "$status" = "active" ]; then
        echo "✓ Servicio activo"
    else
        echo "✗ Servicio inactivo"
    fi
done

# Verificar conectividad de bases de datos
echo ""
echo "2. Verificando conectividad de bases de datos..."

# MySQL
mysql -u developer -pdeveloper123 -e "SELECT 1;" laburar_db > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ MySQL: Conectado"
else
    echo "✗ MySQL: Error de conexión"
fi

# PostgreSQL
PGPASSWORD=developer123 psql -h localhost -U developer -d laburar -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ PostgreSQL: Conectado"
else
    echo "✗ PostgreSQL: Error de conexión"
fi

# Redis
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Redis: Conectado"
else
    echo "✗ Redis: Error de conexión"
fi

# Verificar puertos
echo ""
echo "3. Verificando puertos..."
for port in 3000 3001 3306 5432 6379; do
    if netstat -tuln | grep ":$port " > /dev/null; then
        echo "✓ Puerto $port: Abierto"
    else
        echo "✗ Puerto $port: Cerrado"
    fi
done

# Verificar URLs
echo ""
echo "4. Verificando URLs..."
sleep 5  # Esperar que los servicios se inicien

# Frontend
curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Frontend (http://localhost:3000): Respondiendo"
else
    echo "✗ Frontend (http://localhost:3000): No responde"
fi

# Backend
curl -s http://localhost:3001/docs > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Backend (http://localhost:3001/docs): Respondiendo"
else
    echo "✗ Backend (http://localhost:3001/docs): No responde"
fi

echo ""
echo "=== Verificación completada ==="
```

### 8.2 Test de Funcionalidades

**Test de Frontend**:
```bash
cd /var/www/laburar/frontend

# Test de construcción
npm run build
if [ $? -eq 0 ]; then
    echo "✓ Frontend build: Exitoso"
else
    echo "✗ Frontend build: Falló"
fi

# Test de tipos
npm run type-check
if [ $? -eq 0 ]; then
    echo "✓ TypeScript check: Exitoso"
else
    echo "✗ TypeScript check: Falló"
fi

# Test de linting
npm run lint
if [ $? -eq 0 ]; then
    echo "✓ ESLint: Sin errores"
else
    echo "✗ ESLint: Errores encontrados"
fi
```

**Test de Backend**:
```bash
cd /var/www/laburar/backend

# Test unitarios
npm run test
if [ $? -eq 0 ]; then
    echo "✓ Tests unitarios: Exitosos"
else
    echo "✗ Tests unitarios: Fallaron"
fi

# Test de construcción
npm run build
if [ $? -eq 0 ]; then
    echo "✓ Backend build: Exitoso"
else
    echo "✗ Backend build: Falló"
fi

# Test de Prisma
npx prisma validate
if [ $? -eq 0 ]; then
    echo "✓ Prisma schema: Válido"
else
    echo "✗ Prisma schema: Inválido"
fi
```

### 8.3 Test de Integración E2E

**Instalar Playwright (opcional)**:
```bash
cd /var/www/laburar
npm install -D @playwright/test
npx playwright install

# Crear test básico
mkdir -p tests/e2e
cat > tests/e2e/basic.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('Frontend loads correctly', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/LABUREMOS/);
});

test('Backend API responds', async ({ request }) => {
  const response = await request.get('http://localhost:3001/docs');
  expect(response.ok()).toBeTruthy();
});
EOF

# Ejecutar tests
npx playwright test
```

---

## 9. Troubleshooting

### 9.1 Problemas Comunes y Soluciones

**Error: Puerto en uso**
```bash
# Identificar proceso usando el puerto
sudo lsof -i :3000
sudo lsof -i :3001

# Matar proceso específico
kill -9 [PID]

# O matar todos los procesos Node.js
pkill -f node
```

**Error: Base de datos no conecta**
```bash
# Verificar estado del servicio
sudo systemctl status mysql
sudo systemctl status postgresql

# Reiniciar servicios
sudo systemctl restart mysql
sudo systemctl restart postgresql

# Verificar logs
sudo tail -f /var/log/mysql/error.log
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

**Error: Permisos de archivos**
```bash
# Reestablecer permisos
cd /var/www/laburar
sudo chown -R $USER:www-data .
chmod -R 755 .
chmod -R 775 logs storage uploads
```

**Error: Dependencias faltantes**
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend  
cd ../backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### 9.2 Scripts de Diagnóstico

**Diagnóstico completo**:
```bash
#!/bin/bash
# diagnose-laburar.sh

echo "=== Diagnóstico LABUREMOS ==="

echo "1. Información del sistema:"
uname -a
free -h
df -h /

echo ""
echo "2. Servicios:"
systemctl status mysql --no-pager -l
systemctl status postgresql --no-pager -l
systemctl status redis-server --no-pager -l

echo ""
echo "3. Procesos Node.js:"
ps aux | grep node

echo ""
echo "4. Puertos en uso:"
netstat -tuln | grep -E ":300[01]|:3306|:5432|:6379"

echo ""
echo "5. Logs recientes:"
echo "--- Frontend ---"
tail -n 5 /var/www/laburar/logs/frontend.log 2>/dev/null || echo "No hay logs de frontend"

echo "--- Backend ---"
tail -n 5 /var/www/laburar/logs/backend.log 2>/dev/null || echo "No hay logs de backend"

echo ""
echo "6. Espacio en disco:"
du -sh /var/www/laburar/*

echo ""
echo "=== Diagnóstico completado ==="
```

### 9.3 Recuperación de Errores

**Reset completo del entorno**:
```bash
#!/bin/bash
# reset-laburar.sh

echo "=== Reset completo LABUREMOS ==="
read -p "¿Estás seguro? Esto eliminará todos los datos. (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    # Detener servicios
    ./stop-laburar.sh
    
    # Limpiar bases de datos
    mysql -u root -p -e "DROP DATABASE IF EXISTS laburar_db; CREATE DATABASE laburar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS laburar; CREATE DATABASE laburar OWNER developer;"
    
    # Limpiar Redis
    redis-cli FLUSHALL
    
    # Reinstalar dependencias
    cd /var/www/laburar/frontend
    rm -rf node_modules package-lock.json
    npm install
    
    cd ../backend
    rm -rf node_modules package-lock.json  
    npm install
    npx prisma generate
    npx prisma migrate dev --name reset
    
    echo "✓ Reset completado"
else
    echo "Operación cancelada"
fi
```

---

## 10. Scripts de Automatización

### 10.1 Script de Instalación Completa

```bash
#!/bin/bash
# install-laburar-vm.sh

echo "=== Instalación Automática LABUREMOS en VM ==="

# Variables
PROJECT_DIR="/var/www/laburar"
DB_USER="developer"
DB_PASS="developer123"

# Actualizar sistema
echo "1. Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
echo "2. Instalando dependencias..."
sudo apt install -y curl wget git vim nano htop tree unzip software-properties-common

# Instalar Node.js
echo "3. Instalando Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Instalar bases de datos
echo "4. Instalando MySQL..."
sudo apt install -y mysql-server mysql-client
sudo systemctl enable mysql
sudo systemctl start mysql

echo "5. Instalando PostgreSQL..."
sudo apt install -y postgresql-15 postgresql-contrib postgresql-client
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "6. Instalando Redis..."
sudo apt install -y redis-server redis-tools
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configurar bases de datos
echo "7. Configurando bases de datos..."
sudo mysql -e "CREATE DATABASE laburar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS'; GRANT ALL PRIVILEGES ON laburar_db.* TO '$DB_USER'@'%'; FLUSH PRIVILEGES;"

sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS'; CREATE DATABASE laburar WITH OWNER $DB_USER; GRANT ALL PRIVILEGES ON DATABASE laburar TO $DB_USER; ALTER USER $DB_USER CREATEDB;"

# Crear estructura de directorios
echo "8. Creando estructura de proyecto..."
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR
mkdir -p $PROJECT_DIR/{logs,storage,uploads,backups,config}

# Configurar firewall
echo "9. Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp  
sudo ufw allow 3001/tcp
sudo ufw allow 3306/tcp
sudo ufw allow 5432/tcp
sudo ufw --force enable

echo ""
echo "=== Instalación base completada ==="
echo "Siguiente paso: Copiar archivos del proyecto LABUREMOS"
echo "Luego ejecutar: setup-project.sh"
```

### 10.2 Script de Configuración del Proyecto

```bash
#!/bin/bash
# setup-project.sh

echo "=== Configurando Proyecto LABUREMOS ==="

PROJECT_DIR="/var/www/laburar"
cd $PROJECT_DIR

# Verificar que los archivos están presentes
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/package.json" ]; then
    echo "Error: Archivos del proyecto no encontrados"
    echo "Asegúrate de haber copiado todos los archivos a $PROJECT_DIR"
    exit 1
fi

# Instalar dependencias del frontend
echo "1. Instalando dependencias del frontend..."
cd frontend
npm install

# Crear .env.local
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local 2>/dev/null || cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
EOF
fi

# Instalar dependencias del backend
echo "2. Instalando dependencias del backend..."
cd ../backend
npm install

# Crear .env
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || cat > .env << EOF
DATABASE_URL="postgresql://developer:developer123@localhost:5432/laburar"
MYSQL_URL="mysql://developer:developer123@localhost:3306/laburar_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="laburar-jwt-secret-very-secure-2024"
JWT_EXPIRATION="1d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
EOF
fi

# Configurar Prisma
echo "3. Configurando Prisma..."
npx prisma generate
npx prisma migrate dev --name init

# Importar datos MySQL si existe backup
echo "4. Importando datos MySQL..."
if [ -f "../database/create_laburar_db.sql" ]; then
    mysql -u developer -pdeveloper123 laburar_db < ../database/create_laburar_db.sql
    echo "✓ Datos MySQL importados"
fi

# Configurar permisos
echo "5. Configurando permisos..."
cd ..
sudo chown -R $USER:www-data .
chmod -R 755 .
chmod -R 775 logs storage uploads

# Crear scripts de inicio
echo "6. Creando scripts de inicio..."
cat > start-laburar.sh << 'EOF'
#!/bin/bash
cd /var/www/laburar

echo "=== Iniciando LABUREMOS ==="

# Verificar servicios
sudo systemctl start mysql postgresql redis-server

# Frontend
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
echo $! > ../logs/frontend.pid

# Backend  
cd ../backend
npm run start:dev > ../logs/backend.log 2>&1 &
echo $! > ../logs/backend.pid

echo "✓ LABUREMOS iniciado"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001/docs"
EOF

cat > stop-laburar.sh << 'EOF'
#!/bin/bash
cd /var/www/laburar

echo "=== Deteniendo LABUREMOS ==="

if [ -f logs/frontend.pid ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null
    rm logs/frontend.pid
fi

if [ -f logs/backend.pid ]; then
    kill $(cat logs/backend.pid) 2>/dev/null  
    rm logs/backend.pid
fi

pkill -f "next dev"
pkill -f "nest start"

echo "✓ LABUREMOS detenido"
EOF

chmod +x start-laburar.sh stop-laburar.sh

echo ""
echo "=== Configuración completada ==="
echo "Para iniciar LABUREMOS: ./start-laburar.sh"
echo "Para detener LABUREMOS: ./stop-laburar.sh"
```

### 10.3 Script de Monitoreo

```bash
#!/bin/bash
# monitor-laburar.sh

echo "=== Monitor LABUREMOS (Ctrl+C para salir) ==="

while true; do
    clear
    echo "=== LABUREMOS Status - $(date) ==="
    echo ""
    
    # Servicios del sistema
    echo "🔧 Servicios del Sistema:"
    systemctl is-active mysql && echo "✓ MySQL" || echo "✗ MySQL"
    systemctl is-active postgresql && echo "✓ PostgreSQL" || echo "✗ PostgreSQL"  
    systemctl is-active redis-server && echo "✓ Redis" || echo "✗ Redis"
    echo ""
    
    # Procesos de la aplicación
    echo "🚀 Procesos de Aplicación:"
    if pgrep -f "next dev" > /dev/null; then
        echo "✓ Frontend (Next.js)"
    else
        echo "✗ Frontend (Next.js)"
    fi
    
    if pgrep -f "nest start" > /dev/null; then
        echo "✓ Backend (NestJS)"  
    else
        echo "✗ Backend (NestJS)"
    fi
    echo ""
    
    # URLs
    echo "🌐 URLs:"
    curl -s http://localhost:3000 > /dev/null && echo "✓ Frontend: http://localhost:3000" || echo "✗ Frontend: http://localhost:3000"
    curl -s http://localhost:3001/docs > /dev/null && echo "✓ Backend: http://localhost:3001/docs" || echo "✗ Backend: http://localhost:3001/docs"
    echo ""
    
    # Recursos del sistema
    echo "📊 Recursos del Sistema:"
    echo "RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
    echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " usado)"}')"
    echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
    
    sleep 5
done
```

---

## ✅ Checklist Final de Migración

### Pre-Migración
- [ ] Backup completo de Windows realizado
- [ ] Documentación de configuraciones actual
- [ ] VM creada con especificaciones adecuadas
- [ ] Ubuntu 22.04 LTS instalado

### Configuración Base
- [ ] Sistema actualizado
- [ ] SSH configurado
- [ ] Firewall configurado
- [ ] Node.js LTS instalado
- [ ] MySQL 8.0 instalado y configurado
- [ ] PostgreSQL 15 instalado y configurado
- [ ] Redis instalado y configurado

### Migración de Datos
- [ ] Archivos del proyecto copiados
- [ ] Permisos configurados correctamente
- [ ] Variables de entorno configuradas
- [ ] Base de datos MySQL importada
- [ ] Prisma configurado y migraciones aplicadas

### Validación
- [ ] Dependencias instaladas (Frontend + Backend)
- [ ] Scripts de inicio creados
- [ ] Todos los servicios iniciando correctamente
- [ ] Frontend accesible en http://localhost:3000
- [ ] Backend accesible en http://localhost:3001/docs
- [ ] Bases de datos conectando correctamente
- [ ] Tests básicos pasando

### Post-Migración
- [ ] Scripts de monitoreo configurados
- [ ] Backups automáticos configurados
- [ ] Documentación actualizada
- [ ] Equipo informado de la nueva configuración

---

## 📞 Soporte y Recursos

### Archivos de Configuración Importantes
- **Frontend**: `/var/www/laburar/frontend/.env.local`
- **Backend**: `/var/www/laburar/backend/.env`
- **MySQL**: `/etc/mysql/mysql.conf.d/mysqld.cnf`
- **PostgreSQL**: `/etc/postgresql/15/main/postgresql.conf`
- **Redis**: `/etc/redis/redis.conf`

### Logs de Sistema
- **MySQL**: `/var/log/mysql/error.log`
- **PostgreSQL**: `/var/log/postgresql/postgresql-15-main.log`
- **Redis**: `/var/log/redis/redis-server.log`
- **LABUREMOS**: `/var/www/laburar/logs/`

### Comandos de Ayuda Rápida
```bash
# Estado de servicios
sudo systemctl status mysql postgresql redis-server

# Logs en tiempo real
tail -f /var/www/laburar/logs/frontend.log
tail -f /var/www/laburar/logs/backend.log

# Reinicio completo
./stop-laburar.sh && ./start-laburar.sh

# Diagnóstico completo
./diagnose-laburar.sh
```

---

**Última Actualización**: 2025-07-30  
**Versión**: 1.0  
**Estado**: Guía Completa para Migración a Oracle VirtualBox

Esta guía garantiza una migración completa y funcional de tu proyecto LABUREMOS desde Windows a Oracle VirtualBox, manteniendo toda la funcionalidad del stack moderno Next.js + NestJS + bases de datos híbridas.
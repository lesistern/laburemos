# 🪟 LaburAR - Guía de Instalación para Windows

## 🚀 **Inicio Rápido en Windows**

### 1. **Setup Inicial Automático**
```cmd
# Ejecutar en CMD como Administrador
cd C:\xampp\htdocs\Laburar
setup-windows.bat
```

### 2. **Iniciar Aplicación**
```cmd
# Doble clic o ejecutar en CMD
start-windows.bat
```

### 3. **URLs Disponibles**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/docs  
- **MySQL (XAMPP)**: http://localhost/phpmyadmin
- **PostgreSQL (Docker)**: http://localhost:8080 (Adminer)

---

## 📋 **Requisitos Previos**

### ✅ **Instalado (Ya tienes)**
- ✅ Windows 10/11
- ✅ XAMPP con Apache y MySQL
- ✅ Proyecto LaburAR en `C:\xampp\htdocs\Laburar`

### 📥 **Por Instalar**
1. **Node.js 18+** - https://nodejs.org/
2. **Docker Desktop** (opcional) - https://www.docker.com/products/docker-desktop/

---

## 🔧 **Configuración Manual**

### **Opción A: Usar XAMPP MySQL (Recomendado para Windows)**

1. **Iniciar XAMPP**
   ```cmd
   C:\xampp\xampp-control.exe
   # Iniciar Apache y MySQL
   ```

2. **Importar Base de Datos**
   - Abrir http://localhost/phpmyadmin
   - Crear BD `laburar_db`
   - Importar: `database/create_laburar_db.sql`

3. **Frontend Next.js**
   ```cmd
   cd C:\xampp\htdocs\Laburar\frontend
   npm install
   copy .env.example .env.local
   npm run dev
   ```

4. **Backend NestJS**
   ```cmd
   cd C:\xampp\htdocs\Laburar\backend
   npm install
   copy .env.example .env
   npm run start:dev
   ```

### **Opción B: Usar Docker PostgreSQL**

1. **Instalar Docker Desktop**
   - Descargar desde: https://www.docker.com/products/docker-desktop/
   - Asegurar que WSL2 esté habilitado

2. **Iniciar Contenedores**
   ```cmd
   cd C:\xampp\htdocs\Laburar
   docker-compose -f docker-compose.windows.yml up -d
   ```

3. **Configurar Variables de Entorno**
   ```cmd
   # En backend\.env cambiar:
   DATABASE_URL="postgresql://laburar:laburar123@localhost:5432/laburar"
   DB_TYPE=postgres
   ```

---

## 🛠️ **Comandos Útiles Windows**

### **Gestión de Procesos**
```cmd
# Ver puertos ocupados
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Matar proceso por PID
taskkill /PID 1234 /F

# Reiniciar servicios XAMPP
net stop Apache2.4
net start Apache2.4
```

### **Docker en Windows**
```cmd
# Ver contenedores
docker ps

# Ver logs
docker logs laburar_postgres
docker logs laburar_redis

# Detener todos los contenedores
docker-compose -f docker-compose.windows.yml down

# Reiniciar contenedores
docker-compose -f docker-compose.windows.yml restart
```

### **Desarrollo**
```cmd
# Limpiar caché Node.js
npm cache clean --force

# Reinstalar dependencias
rmdir /s node_modules
del package-lock.json
npm install

# Ver logs en tiempo real
type logs\app.log | more
```

---

## 🐛 **Solución de Problemas Windows**

### **Error: Puerto 3000 ocupado**
```cmd
# Encontrar proceso
netstat -ano | findstr :3000
# Matar proceso (cambiar PID)
taskkill /PID 1234 /F
```

### **Error: No se puede conectar a MySQL**
```cmd
# Verificar XAMPP MySQL
net start MySQL

# Verificar puerto
netstat -ano | findstr :3306

# Reiniciar XAMPP
C:\xampp\xampp-control.exe
```

### **Error: Permission denied en uploads/**
```cmd
# Configurar permisos (CMD como Admin)
icacls C:\xampp\htdocs\Laburar\uploads /grant Everyone:(OI)(CI)F
icacls C:\xampp\htdocs\Laburar\storage /grant Everyone:(OI)(CI)F
```

### **Error: Docker no inicia**
```cmd
# Verificar WSL2
wsl --status

# Reiniciar Docker Desktop
# Docker Desktop > Settings > Reset to factory defaults
```

---

## 📁 **Estructura de Archivos Windows**

```
C:\xampp\htdocs\Laburar\
├── frontend\              # Next.js app
│   ├── .env.local         # Variables frontend
│   └── ...
├── backend\               # NestJS API
│   ├── .env               # Variables backend
│   └── ...
├── database\              # Scripts SQL
├── uploads\               # Archivos subidos
├── storage\               # Almacenamiento
├── logs\                  # Logs aplicación
├── setup-windows.bat      # Setup automático
├── start-windows.bat      # Inicio automático
└── docker-compose.windows.yml
```

---

## 🔄 **Workflows de Desarrollo**

### **Desarrollo Frontend**
```cmd
# Terminal 1: Frontend
cd C:\xampp\htdocs\Laburar\frontend
npm run dev

# Modificar componentes en src/
# Hot reload automático en http://localhost:3000
```

### **Desarrollo Backend**
```cmd
# Terminal 2: Backend
cd C:\xampp\htdocs\Laburar\backend  
npm run start:dev

# Modificar controladores en src/
# API docs en http://localhost:3001/docs
```

### **Base de Datos**
```cmd
# XAMPP: http://localhost/phpmyadmin
# Docker: http://localhost:8080 (Adminer)

# Backup manual
C:\xampp\mysql\bin\mysqldump -u root laburar_db > backup.sql

# Restore manual
C:\xampp\mysql\bin\mysql -u root laburar_db < backup.sql
```

---

## 🚀 **Deployment Windows Server**

### **IIS + Node.js**
```cmd
# Instalar IISNode
# Configurar web.config para Next.js
# Configurar reverse proxy para API
```

### **PM2 para Producción**
```cmd
npm install -g pm2

# Frontend
pm2 start npm --name "laburar-frontend" -- start

# Backend  
pm2 start npm --name "laburar-backend" -- run start:prod

# Monitoring
pm2 monit
```

---

## 📊 **Monitoreo en Windows**

### **Performance Monitor**
```cmd
perfmon
# Agregar contadores de Node.js
# Monitorear CPU, RAM, Network
```

### **Event Viewer**
```cmd
eventvwr
# Ver logs de aplicación
# Configurar alertas críticas
```

---

¡Tu aplicación LaburAR está lista para desarrollar en Windows! 🎉
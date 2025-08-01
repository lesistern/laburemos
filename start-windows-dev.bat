@echo off
setlocal enabledelayedexpansion

echo =========================================
echo  LABUREMOS - DESARROLLO LOCAL MEJORADO
echo =========================================
echo.

REM Configurar variables de entorno para desarrollo
set NODE_ENV=development
set REDIS_ENABLED=false

echo 🔍 Verificando prerequisitos...

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js no esta instalado
    echo 📥 Instala desde: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
    echo Node.js !NODE_VERSION! detectado
)

REM Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo npm no esta disponible
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('npm --version') do set NPM_VERSION=%%v
    echo npm !NPM_VERSION! detectado
)

echo.
echo Verificando base de datos MySQL...

REM Buscar XAMPP en ubicaciones comunes
set XAMPP_PATH=""
if exist "C:\xampp\mysql\bin\mysql.exe" set XAMPP_PATH="C:\xampp\mysql\bin"
if exist "C:\Program Files\xampp\mysql\bin\mysql.exe" set XAMPP_PATH="C:\Program Files\xampp\mysql\bin"
if exist "D:\xampp\mysql\bin\mysql.exe" set XAMPP_PATH="D:\xampp\mysql\bin"

if %XAMPP_PATH%=="" (
    echo XAMPP MySQL no encontrado
    echo Alternativas:
    echo    1. Instalar XAMPP: https://www.apachefriends.org/
    echo    2. Usar MySQL local en puerto 3306
    echo    3. Continuar sin base de datos (modo limitado)
    echo.
    set /p CONTINUE="Continuar sin verificar MySQL? (s/N): "
    if /i not "!CONTINUE!"=="s" (
        pause
        exit /b 1
    )
) else (
    echo XAMPP MySQL encontrado en: %XAMPP_PATH%
    
    REM Verificar si la base de datos existe
    %XAMPP_PATH%\mysql.exe -u root -e "USE laburemos_db;" 2>nul
    if errorlevel 1 (
        echo Base de datos 'laburemos_db' no existe
        echo Creando base de datos...
        
        REM Crear base de datos
        %XAMPP_PATH%\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS laburemos_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        
        if errorlevel 1 (
            echo Error creando base de datos
            echo Crea manualmente en phpMyAdmin: http://localhost/phpmyadmin
        ) else (
            echo Base de datos creada correctamente
            
            REM Importar esquema si existe
            if exist "database\create_laburemos_db.sql" (
                echo Importando esquema...
                %XAMPP_PATH%\mysql.exe -u root laburemos_db < database\create_laburemos_db.sql
                if errorlevel 1 (
                    echo Error importando esquema
                ) else (
                    echo Esquema importado correctamente
                )
            )
        )
    ) else (
        echo Base de datos 'laburemos_db' existe
    )
)

echo.
echo Configurando backend...

REM Ir al directorio backend
if not exist "backend\" (
    echo Directorio backend no encontrado
    echo Asegurate de estar en el directorio raiz del proyecto
    pause
    exit /b 1
)

cd backend

REM Verificar si node_modules existe
if not exist "node_modules\" (
    echo Instalando dependencias del backend...
    call npm install
    if errorlevel 1 (
        echo Error instalando dependencias del backend
        pause
        exit /b 1
    )
)

REM Configurar variables de entorno
if not exist ".env" (
    if exist ".env.development" (
        echo Copiando configuracion de desarrollo...
        copy ".env.development" ".env" >nul
    ) else (
        echo Archivo .env no encontrado, creando configuracion basica...
        echo NODE_ENV=development > .env
        echo DATABASE_URL=mysql://laburemos_user:Tyr1945@localhost:3306/laburemos_db >> .env
        echo REDIS_ENABLED=false >> .env
        echo JWT_SECRET=dev-jwt-secret-key >> .env
        echo API_PORT=3001 >> .env
        echo CORS_ORIGIN=http://localhost:3000 >> .env
    )
    echo Configuracion del backend lista
)

REM Generar cliente Prisma
echo 🔄 Generando cliente Prisma...
call npx prisma generate
if errorlevel 1 (
    echo Error generando cliente Prisma, continuando...
)

cd ..

echo.
echo Configurando frontend...

REM Ir al directorio frontend
if not exist "frontend\" (
    echo Directorio frontend no encontrado
    pause
    exit /b 1
)

cd frontend

REM Verificar si node_modules existe
if not exist "node_modules\" (
    echo Instalando dependencias del frontend...
    call npm install
    if errorlevel 1 (
        echo Error instalando dependencias del frontend
        pause
        exit /b 1
    )
)

cd ..

echo.
echo Iniciando servicios...
echo.
echo URLs de acceso:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo    Swagger:  http://localhost:3001/docs
echo    Admin:    http://localhost:3000/admin
echo.

REM Crear scripts para abrir en nuevas ventanas
echo cd /d "!CD!\frontend" && npm run dev > start_frontend.bat
echo cd /d "!CD!\backend" && npm run start:dev > start_backend.bat

REM Abrir terminales separadas
echo Iniciando Frontend (Next.js)...
start "LABUREMOS Frontend" cmd /k start_frontend.bat

echo ⏳ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo Iniciando Backend (NestJS)...
start "LABUREMOS Backend" cmd /k start_backend.bat

echo ⏳ Esperando 5 segundos...
timeout /t 5 /nobreak >nul

echo.
echo =========================================
echo  🎉 LABUREMOS INICIADO CORRECTAMENTE
echo =========================================
echo.
echo 📱 Accesos rápidos:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:3001/docs
echo    - phpMyAdmin: http://localhost/phpmyadmin
echo.
echo Para detener los servicios:
echo    - Presiona Ctrl+C en cada terminal
echo.
echo En caso de errores:
echo    1. Verifica que XAMPP esté corriendo
echo    2. Ejecuta: .\create-database.bat
echo    3. Reinicia este script
echo.

REM Preguntar si abrir navegador
set /p OPEN_BROWSER="¿Abrir navegador automáticamente? (S/n): "
if /i not "!OPEN_BROWSER!"=="n" (
    echo Abriendo navegador...
    start http://localhost:3000
)

REM Limpiar archivos temporales
if exist "start_frontend.bat" del start_frontend.bat
if exist "start_backend.bat" del start_backend.bat

echo.
echo Script completado. Los servicios estan corriendo en segundo plano.
pause
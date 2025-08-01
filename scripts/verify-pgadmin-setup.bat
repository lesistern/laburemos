@echo off
REM ================================================
REM LABUREMOS - PgAdmin Setup Verification Script
REM Script para verificar configuración PgAdmin 4 + PostgreSQL
REM Compatible con Windows y WSL
REM ================================================

setlocal enabledelayedexpansion

echo.
echo ================================================
echo LABUREMOS - Verificacion PgAdmin + PostgreSQL
echo ================================================
echo.

REM Colores para Windows (si está disponible)
if exist "C:\Windows\System32\choice.exe" (
    set "GREEN=[92m"
    set "RED=[91m"
    set "YELLOW=[93m"
    set "BLUE=[94m"
    set "NC=[0m"
) else (
    set "GREEN="
    set "RED="
    set "YELLOW="
    set "BLUE="
    set "NC="
)

REM Función para imprimir mensajes con timestamp
set "timestamp=%date% %time%"

echo %BLUE%[%timestamp%] Iniciando verificacion de configuracion...%NC%
echo.

REM ================================================
REM PASO 1: Verificar instalación PostgreSQL
REM ================================================

echo %BLUE%=== VERIFICACION POSTGRESQL ===%NC%
echo.

REM Verificar psql está disponible
psql --version >nul 2>&1
if !errorlevel! == 0 (
    echo %GREEN%✓ PostgreSQL client tools instalados%NC%
    for /f "tokens=*" %%i in ('psql --version') do echo   Versión: %%i
) else (
    echo %RED%✗ PostgreSQL client tools NO encontrados%NC%
    echo   Instalar PostgreSQL client tools desde:
    echo   https://www.postgresql.org/download/windows/
    goto :error
)

REM Verificar pg_dump está disponible
pg_dump --version >nul 2>&1
if !errorlevel! == 0 (
    echo %GREEN%✓ pg_dump disponible%NC%
) else (
    echo %RED%✗ pg_dump NO disponible%NC%
)

echo.

REM ================================================
REM PASO 2: Verificar conexión PostgreSQL local
REM ================================================

echo %BLUE%=== VERIFICACION CONEXION LOCAL ===%NC%
echo.

REM Test básico de conexión local (timeout 5 segundos)
timeout 5 psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();" >nul 2>&1
if !errorlevel! == 0 (
    echo %GREEN%✓ Conexión local PostgreSQL exitosa%NC%
    
    REM Verificar base de datos laburemos existe
    timeout 5 psql -h localhost -p 5432 -U postgres -d laburemos -c "SELECT current_database();" >nul 2>&1
    if !errorlevel! == 0 (
        echo %GREEN%✓ Base de datos 'laburemos' accesible%NC%
        
        REM Contar tablas en schema público
        for /f "tokens=*" %%i in ('psql -h localhost -p 5432 -U postgres -d laburemos -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2^>nul') do (
            set "table_count=%%i"
            set "table_count=!table_count: =!"
        )
        
        if defined table_count (
            if !table_count! gtr 0 (
                echo %GREEN%✓ Schema aplicado correctamente (!table_count! tablas)%NC%
            ) else (
                echo %YELLOW%⚠ Schema vacío (0 tablas) - ejecutar migraciones%NC%
            )
        )
    ) else (
        echo %YELLOW%⚠ Base de datos 'laburemos' no accesible%NC%
        echo   Crear base de datos: CREATE DATABASE laburemos;
    )
) else (
    echo %RED%✗ Error conexión PostgreSQL local%NC%
    echo   Verificar PostgreSQL está ejecutándose:
    echo   - Windows: net start postgresql-x64-13
    echo   - Linux: sudo systemctl start postgresql
)

echo.

REM ================================================
REM PASO 3: Verificar conexión AWS RDS (opcional)
REM ================================================

echo %BLUE%=== VERIFICACION CONEXION AWS RDS ===%NC%
echo.

REM Test conexión AWS RDS (timeout 10 segundos)
timeout 10 psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d postgres -c "SELECT version();" >nul 2>&1
if !errorlevel! == 0 (
    echo %GREEN%✓ Conexión AWS RDS exitosa%NC%
    
    REM Verificar base de datos laburemos en AWS RDS
    timeout 10 psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d laburemos -c "SELECT current_database();" >nul 2>&1
    if !errorlevel! == 0 (
        echo %GREEN%✓ Base de datos AWS RDS 'laburemos' accesible%NC%
        
        REM Contar tablas en AWS RDS
        for /f "tokens=*" %%i in ('psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d laburemos -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2^>nul') do (
            set "aws_table_count=%%i"
            set "aws_table_count=!aws_table_count: =!"
        )
        
        if defined aws_table_count (
            if !aws_table_count! gtr 0 (
                echo %GREEN%✓ Schema AWS RDS aplicado (!aws_table_count! tablas)%NC%
            ) else (
                echo %YELLOW%⚠ Schema AWS RDS vacío - sincronizar%NC%
            )
        )
    ) else (
        echo %YELLOW%⚠ Base de datos AWS RDS 'laburemos' no accesible%NC%
    )
) else (
    echo %YELLOW%⚠ Conexión AWS RDS no disponible o timeout%NC%
    echo   Verificar:
    echo   - Credenciales AWS RDS correctas
    echo   - Security Groups permiten conexión desde tu IP
    echo   - VPN/Firewall configurado correctamente
)

echo.

REM ================================================
REM PASO 4: Verificar archivos del proyecto
REM ================================================

echo %BLUE%=== VERIFICACION ARCHIVOS PROYECTO ===%NC%
echo.

REM Verificar directorio backend existe
if exist "backend" (
    echo %GREEN%✓ Directorio backend encontrado%NC%
    
    REM Verificar schema Prisma
    if exist "backend\prisma\schema.prisma" (
        echo %GREEN%✓ Schema Prisma encontrado%NC%
        
        REM Contar líneas del schema
        for /f %%i in ('find /c /v "" ^< "backend\prisma\schema.prisma"') do set "schema_lines=%%i"
        echo   Schema: !schema_lines! líneas
    ) else (
        echo %RED%✗ Schema Prisma NO encontrado%NC%
    )
    
    REM Verificar package.json backend
    if exist "backend\package.json" (
        echo %GREEN%✓ package.json backend encontrado%NC%
    ) else (
        echo %RED%✗ package.json backend NO encontrado%NC%
    )
) else (
    echo %RED%✗ Directorio backend NO encontrado%NC%
    echo   Ejecutar desde directorio raíz del proyecto
)

REM Verificar directorio scripts
if exist "scripts" (
    echo %GREEN%✓ Directorio scripts encontrado%NC%
    
    REM Verificar scripts específicos
    if exist "scripts\database-migration-sync.sh" (
        echo %GREEN%✓ Script migration-sync disponible%NC%
    ) else (
        echo %YELLOW%⚠ Script migration-sync no encontrado%NC%
    )
    
    if exist "scripts\backup-restore-procedures.sh" (
        echo %GREEN%✓ Script backup-restore disponible%NC%
    ) else (
        echo %YELLOW%⚠ Script backup-restore no encontrado%NC%
    )
) else (
    echo %YELLOW%⚠ Directorio scripts no encontrado%NC%
)

echo.

REM ================================================
REM PASO 5: Verificar configuración .env
REM ================================================

echo %BLUE%=== VERIFICACION CONFIGURACION ===%NC%
echo.

REM Verificar archivo .env en backend
if exist "backend\.env" (
    echo %GREEN%✓ Archivo .env encontrado%NC%
    
    REM Verificar DATABASE_URL está configurado
    findstr /C:"DATABASE_URL" "backend\.env" >nul 2>&1
    if !errorlevel! == 0 (
        echo %GREEN%✓ DATABASE_URL configurado%NC%
    ) else (
        echo %YELLOW%⚠ DATABASE_URL no encontrado en .env%NC%
    )
) else (
    echo %YELLOW%⚠ Archivo .env no encontrado%NC%
    if exist "backend\.env.example" (
        echo   Copiar desde .env.example y configurar
    ) else (
        echo %RED%✗ .env.example tampoco encontrado%NC%
    )
)

echo.

REM ================================================
REM PASO 6: Información de configuración PgAdmin 4
REM ================================================

echo %BLUE%=== CONFIGURACION PGADMIN 4 ===%NC%
echo.

echo %BLUE%Servidor Local:%NC%
echo   Nombre: LABUREMOS Local PostgreSQL
echo   Host: localhost
echo   Puerto: 5432
echo   Base: laburemos
echo   Usuario: postgres
echo   SSL: Prefer
echo.

echo %BLUE%Servidor AWS RDS:%NC%
echo   Nombre: LABUREMOS AWS RDS Production
echo   Host: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com
echo   Puerto: 5432
echo   Base: laburemos
echo   Usuario: postgres
echo   SSL: Require
echo.

REM ================================================
REM PASO 7: Resumen y próximos pasos
REM ================================================

echo %BLUE%=== RESUMEN VERIFICACION ===%NC%
echo.

echo %BLUE%Próximos pasos recomendados:%NC%
echo 1. Configurar servidores en PgAdmin 4 según información anterior
echo 2. Aplicar schema Prisma: cd backend ^&^& npx prisma db push
echo 3. Ejecutar scripts de migración: ./scripts/database-migration-sync.sh
echo 4. Configurar backups: ./scripts/backup-restore-procedures.sh
echo 5. Leer guía completa: GUIA-PGLADMIN-AWS-COMPLETA.md
echo.

echo %BLUE%Comandos útiles:%NC%
echo - Verificar conexión: psql -h localhost -U postgres -d laburemos
echo - Aplicar schema: npx prisma db push
echo - Ver tablas: \dt en psql
echo - Backup manual: pg_dump -h localhost -U postgres laburemos ^> backup.sql
echo.

goto :success

:error
echo.
echo %RED%VERIFICACION FALLIDA - Revisar errores anteriores%NC%
exit /b 1

:success
echo.
echo %GREEN%VERIFICACION COMPLETADA - Sistema listo para PgAdmin 4%NC%
echo.
pause
@echo off
echo ====================================
echo   LABUREMOS - Local PostgreSQL Setup
echo ====================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL not found in PATH
    echo    Please install PostgreSQL from https://www.postgresql.org/download/windows/
    echo    Make sure to add PostgreSQL bin directory to PATH
    pause
    exit /b 1
)

echo ✅ PostgreSQL found in PATH

REM Check if PostgreSQL service is running
sc query postgresql-x64-15 | find "RUNNING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  PostgreSQL service not running, attempting to start...
    net start postgresql-x64-15
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to start PostgreSQL service
        echo    Please start PostgreSQL service manually
        pause
        exit /b 1
    )
)

echo ✅ PostgreSQL service is running

REM Test connection
echo Testing PostgreSQL connection...
psql -U postgres -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to PostgreSQL
    echo    Please ensure:
    echo    1. PostgreSQL is running
    echo    2. User 'postgres' exists
    echo    3. Password is 'postgres' or update .env file
    pause
    exit /b 1
)

echo ✅ PostgreSQL connection successful

REM Create database if it doesn't exist
echo Creating LABUREMOS database...
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'laburemos'" | grep -q 1
if %ERRORLEVEL% NEQ 0 (
    psql -U postgres -c "CREATE DATABASE laburemos;"
    echo ✅ Database 'laburemos' created
) else (
    echo ✅ Database 'laburemos' already exists
)

REM Check if NDA table exists (PostgreSQL migration indicator)
echo Checking existing database structure...
psql -U postgres -d laburemos -tc "SELECT to_regclass('user_alpha');" | grep -q user_alpha
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL schema already exists (user_alpha table found)
) else (
    echo ⚠️  PostgreSQL schema not found, will be created by Prisma migrations
)

echo.
echo ====================================
echo   Setup Complete! 🎉
echo ====================================
echo.
echo Next steps:
echo 1. Configure pgAdmin4 connection using database/local-postgresql-config.json
echo 2. Run: npm run setup-local-env
echo 3. Run: npm run db:migrate
echo 4. Start development: npm run start:dev
echo.
echo pgAdmin4 Connection Details:
echo   Host: localhost
echo   Port: 5432
echo   Database: laburemos
echo   Username: postgres
echo   Password: postgres
echo.
pause
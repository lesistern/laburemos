@echo off
echo ====================================
echo   LABUREMOS - Local Development Starter
echo ====================================
echo.

cd /d "D:\Laburar"

echo 🔍 Checking development environment...

REM Check if PostgreSQL is running
sc query postgresql-x64-15 | find "RUNNING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  PostgreSQL service not running, starting...
    net start postgresql-x64-15
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Could not start PostgreSQL service
        echo    Please start it manually or check installation
        pause
        exit /b 1
    )
)
echo ✅ PostgreSQL service is running

REM Check if local database exists
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'laburemos'" | grep -q 1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ LABUREMOS database not found
    echo    Please run: .\scripts\setup-local-postgresql.bat
    pause
    exit /b 1
)
echo ✅ LABUREMOS database exists

REM Check backend configuration
if not exist "backend\.env" (
    echo ❌ Backend .env file not found
    echo    Please run: .\scripts\setup-local-env.bat
    pause
    exit /b 1
)
echo ✅ Backend .env configuration found

REM Check if node_modules exist
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo ✅ Dependencies installed

REM Check database connection
cd backend
echo 🔌 Testing database connection...
npm run db:status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Database migration needed, running migrations...
    npm run db:migrate
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Database migration failed
        echo    Please check your database configuration
        pause
        exit /b 1
    )
)
echo ✅ Database is ready

cd ..

echo.
echo ====================================
echo   Starting Development Servers
echo ====================================
echo.

REM Start backend in new window
echo 🚀 Starting backend server...
start "LABUREMOS Backend" cmd /k "cd /d D:\Laburar\backend && npm run start:dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo 🎨 Starting frontend server...
start "LABUREMOS Frontend" cmd /k "cd /d D:\Laburar\frontend && npm run dev"

REM Wait a moment for services to initialize
timeout /t 5 /nobreak >nul

echo.
echo ====================================
echo   Development Environment Ready! 🎉
echo ====================================
echo.
echo Services:
echo   📡 Backend API: http://localhost:3001
echo   📖 API Docs: http://localhost:3001/docs  
echo   🎨 Frontend: http://localhost:3000
echo   🗄️  Database: PostgreSQL localhost:5432
echo.
echo Useful commands:
echo   📊 Database GUI: npm run db:studio (in backend folder)
echo   🔄 Sync to AWS: .\scripts\sync-local-to-aws.bat
echo   📥 Get AWS data: .\scripts\sync-aws-to-local.bat
echo.
echo pgAdmin4 Connection:
echo   Host: localhost
echo   Port: 5432
echo   Database: laburemos
echo   User: postgres
echo   Password: postgres
echo.

REM Optional: Open browser windows
set /p open_browser="Open browser windows? (y/N): "
if /i "%open_browser%"=="y" (
    start "" "http://localhost:3000"
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:3001/docs"
)

echo.
echo Press any key to exit this window...
echo (Backend and Frontend will continue running in their own windows)
pause >nul
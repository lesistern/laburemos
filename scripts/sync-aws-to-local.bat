@echo off
echo ====================================
echo   LABUREMOS - AWS to Local Database Sync
echo ====================================
echo.

REM Configuration
set LOCAL_HOST=localhost
set LOCAL_PORT=5432
set LOCAL_DB=laburemos
set LOCAL_USER=postgres
set LOCAL_PASSWORD=postgres

set AWS_HOST=laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com
set AWS_PORT=5432
set AWS_DB=laburemos
set AWS_USER=postgres
REM AWS_PASSWORD should be set as environment variable for security

REM Check if AWS password is set
if "%AWS_RDS_PASSWORD%"=="" (
    echo ❌ AWS_RDS_PASSWORD environment variable not set
    echo    Please set it with: set AWS_RDS_PASSWORD=your_aws_password
    echo    Or add it to your system environment variables
    pause
    exit /b 1
)

echo 🔍 Pre-sync validation...

REM Test AWS connection
echo Testing AWS RDS connection...
set PGPASSWORD=%AWS_RDS_PASSWORD%
psql -h %AWS_HOST% -p %AWS_PORT% -U %AWS_USER% -d %AWS_DB% -c "SELECT 'AWS connection OK';" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to AWS RDS
    echo    Please check:
    echo    1. AWS_RDS_PASSWORD is correct
    echo    2. Security groups allow connections from your IP
    echo    3. RDS instance is running
    pause
    exit /b 1
)
echo ✅ AWS RDS connection successful

REM Test local connection
echo Testing local PostgreSQL connection...
set PGPASSWORD=%LOCAL_PASSWORD%
psql -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% -c "SELECT 'Local connection OK';" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to local PostgreSQL
    echo    Please ensure local PostgreSQL is running and accessible
    pause
    exit /b 1
)
echo ✅ Local PostgreSQL connection successful

REM Create backup timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

echo.
echo ⚠️  WARNING: This will synchronize AWS RDS to your local database
echo    This operation will:
echo    1. Create a backup of your local data
echo    2. Replace local data with AWS RDS data
echo    3. This cannot be easily undone
echo.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled
    pause
    exit /b 0
)

echo.
echo 📦 Creating local database backup...
mkdir backups 2>nul
set PGPASSWORD=%LOCAL_PASSWORD%
pg_dump -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% --verbose --no-password > backups\local_backup_%timestamp%.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create local backup
    pause
    exit /b 1
)
echo ✅ Local backup created: backups\local_backup_%timestamp%.sql

echo.
echo 📤 Exporting AWS RDS database...
set PGPASSWORD=%AWS_RDS_PASSWORD%
pg_dump -h %AWS_HOST% -p %AWS_PORT% -U %AWS_USER% -d %AWS_DB% --verbose --no-password > backups\aws_export_%timestamp%.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to export AWS RDS database
    pause
    exit /b 1
)
echo ✅ AWS RDS database exported: backups\aws_export_%timestamp%.sql

echo.
echo 🗑️ Dropping local database content...
set PGPASSWORD=%LOCAL_PASSWORD%
psql -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to clear local database
    echo    You may need to restore from backup manually
    pause
    exit /b 1
)
echo ✅ Local database cleared

echo.
echo 📥 Importing AWS RDS data to local database...
set PGPASSWORD=%LOCAL_PASSWORD%
psql -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% < backups\aws_export_%timestamp%.sql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to import AWS RDS data to local database
    echo    Attempting to restore local backup...
    psql -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% < backups\local_backup_%timestamp%.sql >nul 2>&1
    echo    Please check the logs and try again
    pause
    exit /b 1
)
echo ✅ AWS RDS data imported to local database successfully

echo.
echo 🔍 Verification...
set PGPASSWORD=%LOCAL_PASSWORD%
psql -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% -c "SELECT COUNT(*) as user_count FROM users;" 2>nul
echo.

echo ====================================
echo   Sync Complete! 🎉
echo ====================================
echo.
echo Summary:
echo ✅ Local backup created: backups\local_backup_%timestamp%.sql
echo ✅ AWS RDS export created: backups\aws_export_%timestamp%.sql  
echo ✅ AWS RDS data synchronized to local database
echo.
echo Next steps:
echo 1. Test your local development environment
echo 2. Run: npm run start:dev
echo 3. Verify all features work with production data
echo.
echo If you need to rollback:
echo   psql -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% < backups\local_backup_%timestamp%.sql
echo.
pause
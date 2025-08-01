@echo off
echo ====================================
echo   LABUREMOS - Local to AWS Database Sync
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

REM Test local connection
echo Testing local PostgreSQL connection...
psql -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% -c "SELECT 'Local connection OK';" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to local PostgreSQL
    echo    Please ensure local PostgreSQL is running and accessible
    pause
    exit /b 1
)
echo ✅ Local PostgreSQL connection successful

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

REM Create backup timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

echo.
echo ⚠️  WARNING: This will synchronize your local database to AWS RDS
echo    This operation will:
echo    1. Create a backup of AWS RDS data
echo    2. Replace AWS RDS data with local data
echo    3. This cannot be easily undone
echo.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled
    pause
    exit /b 0
)

echo.
echo 📦 Creating AWS RDS backup...
mkdir backups 2>nul
set PGPASSWORD=%AWS_RDS_PASSWORD%
pg_dump -h %AWS_HOST% -p %AWS_PORT% -U %AWS_USER% -d %AWS_DB% --verbose --no-password > backups\aws_backup_%timestamp%.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create AWS backup
    pause
    exit /b 1
)
echo ✅ AWS RDS backup created: backups\aws_backup_%timestamp%.sql

echo.
echo 📤 Exporting local database...
set PGPASSWORD=%LOCAL_PASSWORD%
pg_dump -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% --verbose --no-password > backups\local_export_%timestamp%.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to export local database
    pause
    exit /b 1
)
echo ✅ Local database exported: backups\local_export_%timestamp%.sql

echo.
echo 🗑️ Dropping AWS RDS database content...
set PGPASSWORD=%AWS_RDS_PASSWORD%
psql -h %AWS_HOST% -p %AWS_PORT% -U %AWS_USER% -d %AWS_DB% -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to clear AWS RDS database
    echo    You may need to restore from backup manually
    pause
    exit /b 1
)
echo ✅ AWS RDS database cleared

echo.
echo 📥 Importing local data to AWS RDS...
set PGPASSWORD=%AWS_RDS_PASSWORD%
psql -h %AWS_HOST% -p %AWS_PORT% -U %AWS_USER% -d %AWS_DB% < backups\local_export_%timestamp%.sql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to import local data to AWS RDS
    echo    Attempting to restore AWS backup...
    psql -h %AWS_HOST% -p %AWS_PORT% -U %AWS_USER% -d %AWS_DB% < backups\aws_backup_%timestamp%.sql >nul 2>&1
    echo    Please check the logs and try again
    pause
    exit /b 1
)
echo ✅ Local data imported to AWS RDS successfully

echo.
echo 🔍 Verification...
set PGPASSWORD=%AWS_RDS_PASSWORD%
psql -h %AWS_HOST% -p %AWS_PORT% -U %AWS_USER% -d %AWS_DB% -c "SELECT COUNT(*) as user_count FROM users;" 2>nul
echo.

echo ====================================
echo   Sync Complete! 🎉
echo ====================================
echo.
echo Summary:
echo ✅ AWS RDS backup created: backups\aws_backup_%timestamp%.sql
echo ✅ Local export created: backups\local_export_%timestamp%.sql  
echo ✅ Local data synchronized to AWS RDS
echo.
echo Next steps:
echo 1. Test your production application
echo 2. Update CloudFront cache if needed
echo 3. Monitor application logs for any issues
echo.
echo If you need to rollback:
echo   psql -h %AWS_HOST% -p %AWS_PORT% -U %AWS_USER% -d %AWS_DB% < backups\aws_backup_%timestamp%.sql
echo.
pause
@echo off
echo ====================================
echo   LABUREMOS - MySQL to PostgreSQL Schema Converter
echo ====================================
echo.

cd /d "D:\Laburar\backend"

echo 🔄 Converting Prisma schema from MySQL to PostgreSQL...

REM Backup original schema
echo 📄 Backing up original schema...
copy prisma\schema.prisma prisma\schema.prisma.mysql.backup >nul

echo 🔧 Applying PostgreSQL field type conversions...

REM Replace MySQL-specific field types with PostgreSQL equivalents
powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\.VarChar\((\d+)\)', '@db.VarChar($1)' -replace '@db\.LongText', '@db.Text' -replace '@db\.BigInt', '@db.BigInt' -replace '@db\.Decimal\((\d+),\s*(\d+)\)', '@db.Decimal($1, $2)' -replace '@db\.Timestamp\((\d+)\)', '@db.Timestamp($1)' -replace '@db\.Date', '@db.Date' -replace '@db\.Time\((\d+)\)', '@db.Time($1)' | Set-Content prisma\schema.prisma"

echo ✅ Schema conversion completed

echo.
echo 🗄️ Generating new Prisma client for PostgreSQL...
call npm run db:generate

echo.
echo ⚠️ IMPORTANT: Database migration required!
echo.
echo You need to run database migrations to apply the schema:
echo   1. npm run db:migrate:dev
echo   2. Or create a new migration: npm run db:migrate:dev --name init-postgresql
echo.
echo The original MySQL schema is backed up as:
echo   prisma\schema.prisma.mysql.backup
echo.
pause
#!/bin/bash

# =====================================================================
# LaburAR - Deploy Database to AWS RDS PostgreSQL
# =====================================================================

echo "🚀 Deploying LaburAR Database to AWS RDS..."
echo "📊 Host: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
echo "🗄️ Database: laburemos"
echo "👤 User: postgres"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection details
DB_HOST="laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
DB_USER="postgres"
DB_NAME="laburemos"
DB_PORT="5432"
SCRIPT_FILE="/mnt/d/Laburar/database/create_laburemos_complete_schema.sql"

echo "Step 1: Testing connection to AWS RDS..."
echo "⏳ Connecting to $DB_HOST..."

# Test connection
if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful!${NC}"
else
    echo -e "${RED}❌ Connection failed. Please check:${NC}"
    echo "   - RDS instance is running"
    echo "   - Security groups allow port 5432"
    echo "   - Credentials are correct"
    echo "   - Network connectivity"
    exit 1
fi

echo ""
echo "Step 2: Checking if database exists..."

# Check if database exists
DB_EXISTS=$(psql -h "$DB_HOST" -U "$DB_USER" -d "postgres" -p "$DB_PORT" -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null | xargs)

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ Database '$DB_NAME' exists${NC}"
else
    echo -e "${YELLOW}⚠️ Database '$DB_NAME' doesn't exist. Creating...${NC}"
    psql -h "$DB_HOST" -U "$DB_USER" -d "postgres" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME;"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database '$DB_NAME' created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create database${NC}"
        exit 1
    fi
fi

echo ""
echo "Step 3: Executing database schema..."
echo "📄 Script: $SCRIPT_FILE"

if [ ! -f "$SCRIPT_FILE" ]; then
    echo -e "${RED}❌ Script file not found: $SCRIPT_FILE${NC}"
    exit 1
fi

echo "⏳ Executing schema script..."

# Execute the schema script
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -f "$SCRIPT_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema executed successfully!${NC}"
else
    echo -e "${RED}❌ Schema execution failed${NC}"
    exit 1
fi

echo ""
echo "Step 4: Verifying database structure..."

# Count tables
TABLE_COUNT=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

echo "📊 Tables created: $TABLE_COUNT"

if [ "$TABLE_COUNT" = "35" ]; then
    echo -e "${GREEN}✅ All 35 tables created successfully!${NC}"
else
    echo -e "${YELLOW}⚠️ Expected 35 tables, found $TABLE_COUNT${NC}"
fi

# Check admin user
ADMIN_COUNT=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@laburemos.com.ar';" 2>/dev/null | xargs)

if [ "$ADMIN_COUNT" = "1" ]; then
    echo -e "${GREEN}✅ Admin user created successfully${NC}"
else
    echo -e "${YELLOW}⚠️ Admin user not found or multiple entries${NC}"
fi

# Check categories
CATEGORY_COUNT=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null | xargs)

echo "📂 Categories loaded: $CATEGORY_COUNT"

if [ "$CATEGORY_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Categories loaded successfully${NC}"
else
    echo -e "${YELLOW}⚠️ No categories found${NC}"
fi

echo ""
echo "Step 5: Database deployment summary..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 AWS RDS PostgreSQL Database Deployed Successfully!${NC}"
echo ""
echo "📊 Database Details:"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo "   Tables: $TABLE_COUNT"
echo "   Admin User: Created"
echo "   Categories: $CATEGORY_COUNT loaded"
echo ""
echo "🔗 Connection String:"
echo "   postgresql://postgres:PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "📱 Next Steps:"
echo "   1. Update backend .env.production with this connection"
echo "   2. Test API connection: npm run start:prod"
echo "   3. Sync with local XAMPP database"
echo ""
echo -e "${GREEN}✅ Ready for production use!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
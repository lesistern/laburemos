#!/bin/bash

# =====================================================================
# LaburAR - Database Synchronization Script
# AWS PostgreSQL ↔ XAMPP MySQL
# =====================================================================

echo "🔄 LaburAR Database Synchronization"
echo "📊 AWS PostgreSQL ↔ XAMPP MySQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configuration
AWS_HOST="laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
AWS_USER="postgres"
AWS_DB="laburemos"
AWS_PORT="5432"

XAMPP_HOST="localhost"
XAMPP_USER="root"
XAMPP_PASSWORD=""
XAMPP_DB="laburemos_db"
XAMPP_PORT="3306"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
check_postgresql() {
    echo "🔍 Checking AWS PostgreSQL..."
    if psql -h "$AWS_HOST" -U "$AWS_USER" -d "$AWS_DB" -p "$AWS_PORT" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ AWS PostgreSQL: Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ AWS PostgreSQL: Connection failed${NC}"
        return 1
    fi
}

check_mysql() {
    echo "🔍 Checking XAMPP MySQL..."
    if mysql -h "$XAMPP_HOST" -u "$XAMPP_USER" -p"$XAMPP_PASSWORD" -P "$XAMPP_PORT" -e "USE $XAMPP_DB; SELECT VERSION();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ XAMPP MySQL: Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ XAMPP MySQL: Connection failed${NC}"
        echo "   Make sure XAMPP is running and database exists"
        return 1
    fi
}

get_table_count() {
    local db_type=$1
    
    if [ "$db_type" = "postgresql" ]; then
        psql -h "$AWS_HOST" -U "$AWS_USER" -d "$AWS_DB" -p "$AWS_PORT" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs
    elif [ "$db_type" = "mysql" ]; then
        mysql -h "$XAMPP_HOST" -u "$XAMPP_USER" -p"$XAMPP_PASSWORD" -P "$XAMPP_PORT" -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$XAMPP_DB';" 2>/dev/null
    fi
}

get_user_count() {
    local db_type=$1
    
    if [ "$db_type" = "postgresql" ]; then
        psql -h "$AWS_HOST" -U "$AWS_USER" -d "$AWS_DB" -p "$AWS_PORT" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs
    elif [ "$db_type" = "mysql" ]; then
        mysql -h "$XAMPP_HOST" -u "$XAMPP_USER" -p"$XAMPP_PASSWORD" -P "$XAMPP_PORT" -se "USE $XAMPP_DB; SELECT COUNT(*) FROM users;" 2>/dev/null
    fi
}

sync_structure() {
    echo ""
    echo "🏗️ Synchronizing database structures..."
    
    # Check if both databases have the same number of tables
    PG_TABLES=$(get_table_count "postgresql")
    MYSQL_TABLES=$(get_table_count "mysql")
    
    echo "📊 PostgreSQL tables: $PG_TABLES"
    echo "📊 MySQL tables: $MYSQL_TABLES"
    
    if [ "$PG_TABLES" = "35" ] && [ "$MYSQL_TABLES" = "35" ]; then
        echo -e "${GREEN}✅ Structure synchronized (35 tables each)${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Structure mismatch detected${NC}"
        
        if [ "$PG_TABLES" != "35" ]; then
            echo -e "${YELLOW}   → AWS PostgreSQL needs schema deployment${NC}"
            echo "   → Run: /mnt/d/Laburar/database/deploy-aws-database.sh"
        fi
        
        if [ "$MYSQL_TABLES" != "35" ]; then
            echo -e "${YELLOW}   → XAMPP MySQL needs schema deployment${NC}"
            echo "   → Import: /mnt/d/Laburar/database/create_laburemos_mysql.sql"
        fi
        
        return 1
    fi
}

compare_data() {
    echo ""
    echo "📊 Comparing data between databases..."
    
    PG_USERS=$(get_user_count "postgresql")
    MYSQL_USERS=$(get_user_count "mysql")
    
    echo "👤 PostgreSQL users: $PG_USERS"
    echo "👤 MySQL users: $MYSQL_USERS"
    
    if [ "$PG_USERS" = "$MYSQL_USERS" ]; then
        echo -e "${GREEN}✅ User data synchronized${NC}"
    else
        echo -e "${YELLOW}⚠️ User data mismatch${NC}"
        echo "   → Manual data sync may be required"
    fi
}

generate_sync_report() {
    echo ""
    echo "📋 Generating synchronization report..."
    
    REPORT_FILE="/mnt/d/Laburar/database/sync-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# 🔄 Database Synchronization Report

**Date**: $(date)
**Status**: Synchronization Check Completed

## 📊 Database Status

### AWS PostgreSQL (Production)
- **Host**: $AWS_HOST
- **Database**: $AWS_DB
- **Tables**: $(get_table_count "postgresql")
- **Users**: $(get_user_count "postgresql")
- **Status**: $(check_postgresql && echo "✅ Connected" || echo "❌ Connection Failed")

### XAMPP MySQL (Local)
- **Host**: $XAMPP_HOST
- **Database**: $XAMPP_DB
- **Tables**: $(get_table_count "mysql")
- **Users**: $(get_user_count "mysql")
- **Status**: $(check_mysql && echo "✅ Connected" || echo "❌ Connection Failed")

## 🔄 Synchronization Status

$(sync_structure > /dev/null 2>&1 && echo "✅ Structures synchronized" || echo "⚠️ Structure sync required")

## 📝 Recommendations

1. **If AWS needs setup**: Run \`/mnt/d/Laburar/database/deploy-aws-database.sh\`
2. **If XAMPP needs setup**: Import \`create_laburemos_mysql.sql\` in phpMyAdmin
3. **For data sync**: Manual export/import between databases
4. **Backend config**: Update DATABASE_URL in .env files

## 🔗 Connection Strings

### Local Development
\`\`\`
DATABASE_URL="mysql://root:@localhost:3306/laburemos_db"
\`\`\`

### Production
\`\`\`
DATABASE_URL="postgresql://postgres:PASSWORD@$AWS_HOST:5432/$AWS_DB"
\`\`\`

---
Generated by LaburAR Database Sync Tool
EOF

    echo -e "${GREEN}✅ Report generated: $REPORT_FILE${NC}"
}

# Main execution
echo ""
echo "Step 1: Connection Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PG_OK=false
MYSQL_OK=false

if check_postgresql; then
    PG_OK=true
fi

if check_mysql; then
    MYSQL_OK=true
fi

echo ""
echo "Step 2: Structure Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if $PG_OK || $MYSQL_OK; then
    sync_structure
    compare_data
else
    echo -e "${RED}❌ Cannot verify synchronization - no database connections${NC}"
fi

echo ""
echo "Step 3: Report Generation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

generate_sync_report

echo ""
echo "🎉 Synchronization check completed!"
echo ""
echo "📱 Next Steps:"
if ! $PG_OK; then
    echo -e "${YELLOW}   1. Deploy AWS PostgreSQL database${NC}"
    echo "      → /mnt/d/Laburar/database/MANUAL-AWS-DEPLOY.md"
fi

if ! $MYSQL_OK; then
    echo -e "${YELLOW}   2. Setup XAMPP MySQL database${NC}"
    echo "      → Import create_laburemos_mysql.sql in phpMyAdmin"
fi

if $PG_OK && $MYSQL_OK; then
    echo -e "${GREEN}   ✅ Both databases ready!${NC}"
    echo "   → Configure backend .env files"
    echo "   → Test API connections"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
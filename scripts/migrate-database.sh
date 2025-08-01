#!/bin/bash
# LaburAR Database Migration Script - Local to AWS RDS
# Usage: ./migrate-database.sh [environment] [rds-endpoint]

set -e

# Configuration
ENVIRONMENT=${1:-production}
RDS_ENDPOINT=${2}
LOCAL_DB_NAME="laburar_db"
AWS_DB_NAME="laburar_${ENVIRONMENT}"
BACKUP_DIR="./database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if RDS endpoint provided
    if [ -z "$RDS_ENDPOINT" ]; then
        error "RDS endpoint not provided. Usage: $0 [environment] [rds-endpoint]"
        exit 1
    fi
    
    # Check MySQL client (for local database)
    if ! command -v mysql >/dev/null 2>&1; then
        error "MySQL client not found. Please install MySQL client."
        exit 1
    fi
    
    # Check PostgreSQL client (for RDS)
    if ! command -v psql >/dev/null 2>&1; then
        error "PostgreSQL client not found. Please install PostgreSQL client."
        info "Install with: sudo apt-get install postgresql-client (Ubuntu/Debian)"
        info "Install with: brew install postgresql (macOS)"
        exit 1
    fi
    
    # Check mysqldump
    if ! command -v mysqldump >/dev/null 2>&1; then
        error "mysqldump not found. Please install MySQL client tools."
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws >/dev/null 2>&1; then
        warn "AWS CLI not found. Some features may not be available."
    fi
    
    log "Prerequisites check completed ✓"
}

# Create backup directory
setup_backup_directory() {
    log "Setting up backup directory..."
    
    mkdir -p "$BACKUP_DIR"
    
    log "Backup directory created: $BACKUP_DIR"
}

# Test database connections
test_connections() {
    log "Testing database connections..."
    
    # Test local MySQL connection
    info "Testing local MySQL connection..."
    if mysql -h localhost -u root -e "USE $LOCAL_DB_NAME; SELECT 'Connection successful' as status;" > /dev/null 2>&1; then
        log "Local MySQL connection successful ✓"
    else
        error "Cannot connect to local MySQL database"
        error "Please ensure XAMPP MySQL is running and database exists"
        exit 1
    fi
    
    # Test RDS PostgreSQL connection
    info "Testing RDS PostgreSQL connection..."
    export PGPASSWORD="SecurePassword123!"  # This should match your Terraform password
    if psql -h "$RDS_ENDPOINT" -U laburar_admin -d postgres -c "SELECT 'Connection successful' as status;" > /dev/null 2>&1; then
        log "RDS PostgreSQL connection successful ✓"
    else
        error "Cannot connect to RDS PostgreSQL database"
        error "Please check:"
        error "1. RDS endpoint is correct: $RDS_ENDPOINT"
        error "2. Security groups allow connection from your IP"
        error "3. Database credentials are correct"
        exit 1
    fi
}

# Backup local MySQL database
backup_local_database() {
    log "Backing up local MySQL database..."
    
    local backup_file="$BACKUP_DIR/${LOCAL_DB_NAME}_mysql_${TIMESTAMP}.sql"
    
    info "Creating MySQL dump..."
    mysqldump -h localhost -u root \
        --single-transaction \
        --routines \
        --triggers \
        --databases "$LOCAL_DB_NAME" > "$backup_file"
    
    # Compress backup
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
    
    local file_size=$(du -h "$backup_file" | cut -f1)
    log "MySQL backup completed: $backup_file ($file_size)"
    
    # Store backup file path for later use
    echo "$backup_file" > "$BACKUP_DIR/latest_mysql_backup.txt"
}

# Convert MySQL dump to PostgreSQL format
convert_mysql_to_postgresql() {
    log "Converting MySQL dump to PostgreSQL format..."
    
    local mysql_backup=$(cat "$BACKUP_DIR/latest_mysql_backup.txt")
    local postgres_file="$BACKUP_DIR/${AWS_DB_NAME}_postgres_${TIMESTAMP}.sql"
    
    # Decompress MySQL backup
    local mysql_sql="${mysql_backup%.gz}"
    gunzip -c "$mysql_backup" > "$mysql_sql"
    
    info "Converting MySQL syntax to PostgreSQL..."
    
    # Create PostgreSQL-compatible SQL
    cat > "$postgres_file" << 'EOF'
-- LaburAR Database Schema for PostgreSQL
-- Converted from MySQL dump

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

EOF
    
    # Convert MySQL dump to PostgreSQL
    # This is a simplified conversion - you may need to adjust based on your schema
    sed -e 's/AUTO_INCREMENT/SERIAL/g' \
        -e 's/ENGINE=InnoDB//g' \
        -e 's/DEFAULT CHARSET=.*;//g' \
        -e 's/COLLATE=.*//g' \
        -e 's/unsigned//g' \
        -e 's/tinyint(1)/boolean/g' \
        -e 's/datetime/timestamp/g' \
        -e 's/CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/DEFAULT CURRENT_TIMESTAMP/g' \
        -e 's/`([^`]*)`/\1/g' \
        -e 's/INSERT INTO \([^ ]*\)/INSERT INTO "\1"/g' \
        -e 's/CREATE TABLE \([^ ]*\)/CREATE TABLE "\1"/g' \
        "$mysql_sql" >> "$postgres_file"
    
    # Add PostgreSQL-specific optimizations
    cat >> "$postgres_file" << 'EOF'

-- Update sequences after data import
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'SELECT setval(pg_get_serial_sequence(''' || r.schemaname || '.' || r.tablename || ''', ''id''), COALESCE(MAX(id), 1)) FROM ' || r.schemaname || '.' || r.tablename || ';';
    END LOOP;
END$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Analyze tables for query optimization
ANALYZE;

EOF
    
    # Clean up temporary MySQL file
    rm "$mysql_sql"
    
    # Compress PostgreSQL file
    gzip "$postgres_file"
    postgres_file="${postgres_file}.gz"
    
    local file_size=$(du -h "$postgres_file" | cut -f1)
    log "PostgreSQL conversion completed: $postgres_file ($file_size)"
    
    # Store PostgreSQL backup file path
    echo "$postgres_file" > "$BACKUP_DIR/latest_postgres_backup.txt"
}

# Create PostgreSQL database
create_postgresql_database() {
    log "Creating PostgreSQL database on RDS..."
    
    info "Creating database: $AWS_DB_NAME"
    export PGPASSWORD="SecurePassword123!"
    
    # Create database
    psql -h "$RDS_ENDPOINT" -U laburar_admin -d postgres \
        -c "DROP DATABASE IF EXISTS \"$AWS_DB_NAME\";" \
        -c "CREATE DATABASE \"$AWS_DB_NAME\" WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';"
    
    log "PostgreSQL database created successfully ✓"
}

# Import data to PostgreSQL
import_to_postgresql() {
    log "Importing data to PostgreSQL..."
    
    local postgres_backup=$(cat "$BACKUP_DIR/latest_postgres_backup.txt")
    local postgres_sql="${postgres_backup%.gz}"
    
    # Decompress backup
    gunzip -c "$postgres_backup" > "$postgres_sql"
    
    info "Importing data to RDS PostgreSQL..."
    export PGPASSWORD="SecurePassword123!"
    
    # Import data
    if psql -h "$RDS_ENDPOINT" -U laburar_admin -d "$AWS_DB_NAME" -f "$postgres_sql"; then
        log "Data import completed successfully ✓"
    else
        error "Data import failed"
        warn "Check the PostgreSQL log for details"
        exit 1
    fi
    
    # Clean up temporary file
    rm "$postgres_sql"
}

# Verify migration
verify_migration() {
    log "Verifying migration..."
    
    export PGPASSWORD="SecurePassword123!"
    
    info "Checking table counts..."
    
    # Get table list and counts
    psql -h "$RDS_ENDPOINT" -U laburar_admin -d "$AWS_DB_NAME" \
        -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
        "
    
    # Test some basic queries
    info "Testing basic queries..."
    
    local user_count=$(psql -h "$RDS_ENDPOINT" -U laburar_admin -d "$AWS_DB_NAME" \
        -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
    
    info "Users table: $user_count records"
    
    if [ "$user_count" -gt 0 ]; then
        log "Migration verification successful ✓"
    else
        warn "No users found - this might be expected for a new database"
    fi
}

# Update application configuration
update_application_config() {
    log "Updating application configuration..."
    
    # Create database configuration for backend
    cat > "./backend/.env.production" << EOF
# Production Database Configuration
NODE_ENV=production
DATABASE_URL=postgresql://laburar_admin:SecurePassword123!@${RDS_ENDPOINT}:5432/${AWS_DB_NAME}
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=\$(openssl rand -base64 32)
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Application Configuration
APP_PORT=3001
APP_URL=https://your-domain.com

# Email Configuration (configure with your provider)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Stripe Configuration (update with your keys)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AWS Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=laburar-${ENVIRONMENT}-assets

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/application.log
EOF
    
    # Create Prisma configuration
    if [ -f "./backend/prisma/schema.prisma" ]; then
        info "Updating Prisma schema for PostgreSQL..."
        
        # Backup original schema
        cp "./backend/prisma/schema.prisma" "./backend/prisma/schema.prisma.backup"
        
        # Update datasource to use PostgreSQL
        sed -i 's/provider = "mysql"/provider = "postgresql"/' "./backend/prisma/schema.prisma"
        sed -i 's/mysql/postgresql/' "./backend/prisma/schema.prisma"
    fi
    
    log "Application configuration updated ✓"
}

# Create migration report
create_migration_report() {
    log "Creating migration report..."
    
    local report_file="$BACKUP_DIR/migration_report_${TIMESTAMP}.md"
    
    cat > "$report_file" << EOF
# LaburAR Database Migration Report

**Migration Date**: $(date)
**Environment**: $ENVIRONMENT
**Source**: MySQL ($LOCAL_DB_NAME)
**Destination**: PostgreSQL ($AWS_DB_NAME)
**RDS Endpoint**: $RDS_ENDPOINT

## Migration Summary

- **Status**: $(if [ $? -eq 0 ]; then echo "✅ Successful"; else echo "❌ Failed"; fi)
- **MySQL Backup**: $(cat "$BACKUP_DIR/latest_mysql_backup.txt" 2>/dev/null || echo "Not found")
- **PostgreSQL Backup**: $(cat "$BACKUP_DIR/latest_postgres_backup.txt" 2>/dev/null || echo "Not found")

## Database Statistics

$(export PGPASSWORD="SecurePassword123!" && psql -h "$RDS_ENDPOINT" -U laburar_admin -d "$AWS_DB_NAME" -c "
SELECT 
    'Tables' as metric,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Records' as metric,
    SUM(n_tup_ins) as count
FROM pg_stat_user_tables 
WHERE schemaname = 'public';
" 2>/dev/null || echo "Could not retrieve statistics")

## Next Steps

1. **Update Application Configuration**
   - Update backend/.env.production with new database URL
   - Update Prisma schema if using Prisma ORM

2. **Deploy Application**
   - Deploy backend with new database configuration
   - Run any additional migrations if needed

3. **Test Application**
   - Verify all functionality works with PostgreSQL
   - Test user authentication, data retrieval, etc.

4. **Monitor Performance**
   - Set up CloudWatch monitoring for RDS
   - Monitor application logs for any issues

## Configuration Files Updated

- \`backend/.env.production\`
- \`backend/prisma/schema.prisma\` (if exists)

## Rollback Instructions

If needed, you can rollback by:

1. Restore from MySQL backup: \`$(cat "$BACKUP_DIR/latest_mysql_backup.txt" 2>/dev/null)\`
2. Revert application configuration files
3. Update database connection strings back to MySQL

## Support

If you encounter issues:

1. Check application logs
2. Verify database connectivity
3. Ensure all environment variables are set correctly
4. Review PostgreSQL logs in RDS console

Migration completed by: Database Migration Script v1.0
EOF
    
    log "Migration report created: $report_file"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove any temporary SQL files
    find "$BACKUP_DIR" -name "*.sql" -not -name "*_${TIMESTAMP}*" -delete 2>/dev/null || true
    
    # Unset password environment variable
    unset PGPASSWORD
}

# Main migration process
main() {
    log "Starting LaburAR database migration..."
    log "Environment: $ENVIRONMENT"
    log "RDS Endpoint: $RDS_ENDPOINT"
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    check_prerequisites
    setup_backup_directory
    test_connections
    backup_local_database
    convert_mysql_to_postgresql
    create_postgresql_database
    import_to_postgresql
    verify_migration
    update_application_config
    create_migration_report
    
    log "🎉 Database migration completed successfully!"
    
    info "Summary:"
    info "✓ MySQL database backed up"
    info "✓ Data converted to PostgreSQL format"
    info "✓ PostgreSQL database created on RDS"
    info "✓ Data imported successfully"
    info "✓ Application configuration updated"
    
    warn "Next steps:"
    warn "1. Review and test the migrated database"
    warn "2. Update your application's database connection"
    warn "3. Deploy the updated application"
    warn "4. Test all functionality thoroughly"
    
    info "Backup files location: $BACKUP_DIR"
    info "Migration report: $BACKUP_DIR/migration_report_${TIMESTAMP}.md"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
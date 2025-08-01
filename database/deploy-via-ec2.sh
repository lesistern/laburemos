#!/bin/bash

# =====================================================================
# LaburAR - Deploy Database via EC2 Jump Server
# =====================================================================

echo "🚀 Deploying LaburAR Database via EC2..."
echo "📊 EC2: 3.81.56.168"
echo "🗄️ RDS: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
echo ""

EC2_HOST="3.81.56.168"
EC2_USER="ec2-user"
EC2_KEY="/tmp/laburemos-key.pem"
RDS_HOST="laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
SCRIPT_FILE="/mnt/d/Laburar/database/create_laburemos_complete_schema.sql"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Step 1: Checking EC2 key file..."
if [ ! -f "$EC2_KEY" ]; then
    echo -e "${RED}❌ EC2 key not found: $EC2_KEY${NC}"
    echo "Please ensure the key file exists with correct permissions:"
    echo "   chmod 400 $EC2_KEY"
    exit 1
fi

echo -e "${GREEN}✅ EC2 key found${NC}"

echo ""
echo "Step 2: Testing EC2 connection..."
if ssh -o ConnectTimeout=10 -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "echo 'EC2 connected'" 2>/dev/null; then
    echo -e "${GREEN}✅ EC2 connection successful${NC}"
else
    echo -e "${RED}❌ EC2 connection failed${NC}"
    echo "Please check:"
    echo "   - EC2 instance is running"
    echo "   - Key permissions: chmod 400 $EC2_KEY"
    echo "   - Security group allows SSH (port 22)"
    exit 1
fi

echo ""
echo "Step 3: Installing PostgreSQL client on EC2..."
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    if ! command -v psql &> /dev/null; then
        echo 'Installing PostgreSQL client...'
        sudo yum update -y
        sudo yum install -y postgresql
    else
        echo 'PostgreSQL client already installed'
    fi
"

echo ""
echo "Step 4: Copying database script to EC2..."
scp -i "$EC2_KEY" "$SCRIPT_FILE" "$EC2_USER@$EC2_HOST:~/laburemos_schema.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Script copied to EC2${NC}"
else
    echo -e "${RED}❌ Failed to copy script${NC}"
    exit 1
fi

echo ""
echo "Step 5: Executing database deployment on EC2..."
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    echo '🗄️ Connecting to RDS from EC2...'
    
    # Test RDS connection from EC2
    if psql -h '$RDS_HOST' -U postgres -d postgres -c 'SELECT version();' > /dev/null 2>&1; then
        echo '✅ RDS connection successful from EC2'
    else
        echo '❌ RDS connection failed from EC2'
        echo 'Please check RDS credentials and security groups'
        exit 1
    fi
    
    # Create database if not exists
    echo '📊 Creating database if not exists...'
    psql -h '$RDS_HOST' -U postgres -d postgres -c 'CREATE DATABASE laburemos;' 2>/dev/null || echo 'Database may already exist'
    
    # Execute schema
    echo '⚡ Executing schema...'
    psql -h '$RDS_HOST' -U postgres -d laburemos -f ~/laburemos_schema.sql
    
    if [ \$? -eq 0 ]; then
        echo '✅ Schema executed successfully'
        
        # Verify tables
        TABLE_COUNT=\$(psql -h '$RDS_HOST' -U postgres -d laburemos -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\" | xargs)
        echo \"📊 Tables created: \$TABLE_COUNT\"
        
        # Check admin user
        ADMIN_COUNT=\$(psql -h '$RDS_HOST' -U postgres -d laburemos -t -c \"SELECT COUNT(*) FROM users WHERE email = 'admin@laburemos.com.ar';\" | xargs)
        echo \"👤 Admin users: \$ADMIN_COUNT\"
        
        # Check categories
        CATEGORY_COUNT=\$(psql -h '$RDS_HOST' -U postgres -d laburemos -t -c \"SELECT COUNT(*) FROM categories;\" | xargs)
        echo \"📂 Categories: \$CATEGORY_COUNT\"
        
        echo '🎉 Database deployment completed!'
    else
        echo '❌ Schema execution failed'
        exit 1
    fi
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 AWS RDS Deployment via EC2 Completed!${NC}"
echo ""
echo "📱 Next: Run sync with XAMPP database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
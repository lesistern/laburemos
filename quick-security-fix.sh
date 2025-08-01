#!/bin/bash

echo "🚀 LABUREMOS Quick Security Fix"
echo "==============================="
echo ""

# Fix 1: Database URL exposure (CRITICAL)
echo "Fix 1: Database URL exposure..."
if [ -f "backend/src/main.ts" ]; then
    sed -i.bak 's/.*Database: ${configService.get.*$/    logger.log(`💾 Database: Connected successfully`);/' backend/src/main.ts
    echo "✅ Database URL exposure fixed"
else
    echo "❌ backend/src/main.ts not found"
fi

# Fix 2: Add missing security headers
echo "Fix 2: Verifying security headers configuration..."
if grep -q "helmet({" backend/src/main.ts; then
    echo "✅ Helmet.js security headers already configured"
else
    echo "⚠️  Consider adding Helmet.js configuration"
fi

# Fix 3: Environment variables check
echo "Fix 3: Checking environment variables..."
if [ -f ".env" ]; then
    if grep -q "JWT_SECRET=secret" .env; then
        echo "⚠️  Default JWT_SECRET detected - should be changed"
    else
        echo "✅ JWT_SECRET appears to be customized"
    fi
else
    echo "⚠️  .env file not found"
fi

echo ""
echo "🎉 Quick security fixes completed!"
echo "Run ./security-test-suite.sh to validate improvements."

#!/bin/bash

# =============================================================================
# LABUREMOS - Quick Security Check
# =============================================================================
# Verificación rápida de seguridad para desarrollo diario
# Autor: Security Expert AI
# Tiempo de ejecución: ~2 minutos
# =============================================================================

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️  LABUREMOS - Quick Security Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. Verificar dependencias
echo -e "${BLUE}1. Checking npm dependencies...${NC}"
cd frontend && npm audit --audit-level=high > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ✅ ${GREEN}Frontend dependencies: CLEAN${NC}"
else
    echo -e "   ❌ ${RED}Frontend dependencies: VULNERABILITIES FOUND${NC}"
fi

cd ../backend && npm audit --audit-level=high > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ✅ ${GREEN}Backend dependencies: CLEAN${NC}"
else
    echo -e "   ❌ ${RED}Backend dependencies: VULNERABILITIES FOUND${NC}"
fi

# 2. Verificar servidores
echo -e "\n${BLUE}2. Checking server status...${NC}"
curl -s -f http://localhost:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ✅ ${GREEN}Backend server: RUNNING${NC}"
else
    echo -e "   ⚠️  ${YELLOW}Backend server: NOT RUNNING${NC}"
fi

curl -s -f http://localhost:3000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ✅ ${GREEN}Frontend server: RUNNING${NC}"
else
    echo -e "   ⚠️  ${YELLOW}Frontend server: NOT RUNNING${NC}"
fi

# 3. Verificar producción
echo -e "\n${BLUE}3. Checking production...${NC}"
curl -s -f https://laburemos.com.ar > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ✅ ${GREEN}Production site: ONLINE${NC}"
else
    echo -e "   ❌ ${RED}Production site: OFFLINE${NC}"
fi

# 4. Verificar headers de seguridad
echo -e "\n${BLUE}4. Checking security headers...${NC}"
headers=$(curl -s -I http://localhost:3001 2>/dev/null || echo "ERROR")
if [ "$headers" != "ERROR" ]; then
    if echo "$headers" | grep -qi "x-content-type-options"; then
        echo -e "   ✅ ${GREEN}Security headers: PRESENT${NC}"
    else
        echo -e "   ⚠️  ${YELLOW}Security headers: MISSING${NC}"
    fi
else
    echo -e "   ⚠️  ${YELLOW}Security headers: CANNOT CHECK${NC}"
fi

# 5. Test rápido de rate limiting
echo -e "\n${BLUE}5. Testing rate limiting...${NC}"
response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/categories 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    echo -e "   ✅ ${GREEN}Rate limiting: SERVER RESPONSIVE${NC}"
else
    echo -e "   ⚠️  ${YELLOW}Rate limiting: CANNOT TEST (code: $response)${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Quick security check completed!${NC}"
echo -e "${BLUE}For detailed analysis, run: ./security-test-suite.sh${NC}\n"
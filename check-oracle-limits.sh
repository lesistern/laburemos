#!/bin/bash
# Script para verificar límites de Oracle Cloud

echo "🔍 Verificando límites de recursos en Oracle Cloud..."
echo "===================================================="

# Colores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Función para verificar recursos locales primero
check_local_resources() {
    echo -e "\n📊 Recursos Locales Actuales:"
    echo "----------------------------"
    
    # CPU
    echo -n "CPU Cores: "
    nproc
    
    # RAM
    echo -n "RAM Total: "
    free -h | grep "^Mem:" | awk '{print $2}'
    echo -n "RAM Usada: "
    free -h | grep "^Mem:" | awk '{print $3}'
    
    # Disco
    echo -n "Disco Total: "
    df -h / | tail -1 | awk '{print $2}'
    echo -n "Disco Usado: "
    df -h / | tail -1 | awk '{print $5}'
}

# Verificar si OCI CLI está instalado
if ! command -v oci &> /dev/null; then
    echo -e "${YELLOW}⚠️ OCI CLI no está instalado.${NC}"
    echo "Para instalar: bash -c \"\$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)\""
    echo ""
    echo "Mientras tanto, verifica manualmente en:"
    echo "1. Ingresa a: https://cloud.oracle.com"
    echo "2. Ve a: Menu → Governance → Limits, Quotas and Usage"
    echo ""
    check_local_resources
    exit 0
fi

# Si OCI CLI está instalado
echo "✅ OCI CLI detectado. Verificando límites..."

# Obtener compartment ID
COMPARTMENT_ID=$(oci iam compartment list --query "data[0].id" --raw-output 2>/dev/null)

if [ -z "$COMPARTMENT_ID" ]; then
    echo -e "${RED}❌ No se pudo obtener el Compartment ID.${NC}"
    echo "Verifica tu configuración con: oci setup config"
    exit 1
fi

# Verificar límites de servicios principales
echo -e "\n📋 Límites de Servicios Free Tier:"
echo "-----------------------------------"

# Compute
echo -e "\n${YELLOW}Compute Instances:${NC}"
oci limits service-summary list \
    --compartment-id $COMPARTMENT_ID \
    --service-name compute \
    --query 'data[?contains(name, `instance`)].{Recurso:name, Limite:value}' \
    --output table 2>/dev/null || echo "Error obteniendo límites de Compute"

# Storage
echo -e "\n${YELLOW}Storage:${NC}"
oci limits service-summary list \
    --compartment-id $COMPARTMENT_ID \
    --service-name blockstorage \
    --query 'data[?contains(name, `volume`)].{Recurso:name, Limite:value}' \
    --output table 2>/dev/null || echo "Error obteniendo límites de Storage"

# Verificar uso actual
echo -e "\n📊 Uso Actual de Recursos:"
echo "-------------------------"

# Instancias activas
INSTANCES=$(oci compute instance list --compartment-id $COMPARTMENT_ID --lifecycle-state RUNNING --query 'length(data)' 2>/dev/null)
echo "Instancias en ejecución: ${INSTANCES:-0}"

# Volúmenes
VOLUMES=$(oci bv volume list --compartment-id $COMPARTMENT_ID --query 'length(data)' 2>/dev/null)
echo "Volúmenes totales: ${VOLUMES:-0}"

# Recomendaciones basadas en estado
echo -e "\n💡 Recomendaciones:"
echo "-------------------"

if [ "${INSTANCES:-0}" -ge 2 ]; then
    echo -e "${RED}⚠️ Tienes 2 o más instancias activas (límite Free Tier).${NC}"
    echo "   → Considera terminar instancias no utilizadas"
fi

if [ "${VOLUMES:-0}" -gt 2 ]; then
    echo -e "${YELLOW}⚠️ Tienes múltiples volúmenes creados.${NC}"
    echo "   → Revisa si todos son necesarios"
fi

echo -e "\n${GREEN}✅ Acciones sugeridas:${NC}"
echo "1. Revisar instancias: oci compute instance list --compartment-id $COMPARTMENT_ID"
echo "2. Revisar volúmenes: oci bv volume list --compartment-id $COMPARTMENT_ID"
echo "3. Liberar recursos no usados para evitar límites"
echo ""
echo "Para más detalles, visita:"
echo "https://cloud.oracle.com → Governance → Limits, Quotas and Usage"
#!/bin/bash
# Script para probar latencia a diferentes regiones de Oracle Cloud

echo "🌍 Oracle Cloud - Test de Latencia por Región"
echo "============================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Regiones de Oracle Cloud
declare -A regions=(
    ["US East (Ashburn)"]="us-ashburn-1.oraclecloud.com"
    ["US West (Phoenix)"]="us-phoenix-1.oraclecloud.com"
    ["US West (San Jose)"]="us-sanjose-1.oraclecloud.com"
    ["Brazil East (Sao Paulo)"]="sa-saopaulo-1.oraclecloud.com"
    ["Brazil Southeast (Vinhedo)"]="sa-vinhedo-1.oraclecloud.com"
    ["Chile (Santiago)"]="sa-santiago-1.oraclecloud.com"
    ["Canada Southeast (Toronto)"]="ca-toronto-1.oraclecloud.com"
    ["Canada Southeast (Montreal)"]="ca-montreal-1.oraclecloud.com"
    ["UK South (London)"]="uk-london-1.oraclecloud.com"
    ["UK West (Newport)"]="uk-cardiff-1.oraclecloud.com"
    ["Germany Central (Frankfurt)"]="eu-frankfurt-1.oraclecloud.com"
    ["Netherlands Northwest (Amsterdam)"]="eu-amsterdam-1.oraclecloud.com"
    ["Switzerland North (Zurich)"]="eu-zurich-1.oraclecloud.com"
    ["India West (Mumbai)"]="ap-mumbai-1.oraclecloud.com"
    ["India South (Hyderabad)"]="ap-hyderabad-1.oraclecloud.com"
    ["Japan East (Tokyo)"]="ap-tokyo-1.oraclecloud.com"
    ["Japan Central (Osaka)"]="ap-osaka-1.oraclecloud.com"
    ["South Korea Central (Seoul)"]="ap-seoul-1.oraclecloud.com"
    ["Australia East (Sydney)"]="ap-sydney-1.oraclecloud.com"
    ["Australia Southeast (Melbourne)"]="ap-melbourne-1.oraclecloud.com"
)

# Función para obtener latencia
get_latency() {
    local host=$1
    local result=$(ping -c 4 -W 2 $host 2>/dev/null | tail -1 | awk -F '/' '{print $5}')
    
    if [ -z "$result" ]; then
        echo "N/A"
    else
        echo "${result}ms"
    fi
}

# Función para obtener color según latencia
get_color() {
    local latency=$1
    local num=$(echo $latency | sed 's/ms//')
    
    if [ "$latency" = "N/A" ]; then
        echo $RED
    elif (( $(echo "$num < 50" | bc -l) )); then
        echo $GREEN
    elif (( $(echo "$num < 150" | bc -l) )); then
        echo $YELLOW
    else
        echo $RED
    fi
}

# Arrays para almacenar resultados
declare -a region_names
declare -a latencies

echo "Probando conectividad a regiones de Oracle Cloud..."
echo "(Este proceso puede tomar unos minutos)"
echo ""

# Probar cada región
i=0
for region in "${!regions[@]}"; do
    echo -n "Testing $region... "
    latency=$(get_latency ${regions[$region]})
    region_names[$i]="$region"
    latencies[$i]="$latency"
    echo "$latency"
    ((i++))
done

# Ordenar resultados por latencia
echo ""
echo "📊 Resultados ordenados por latencia:"
echo "====================================="
echo ""

# Crear archivo temporal para ordenar
temp_file=$(mktemp)
for ((i=0; i<${#region_names[@]}; i++)); do
    lat="${latencies[$i]}"
    if [ "$lat" != "N/A" ]; then
        # Extraer número para ordenar
        num=$(echo $lat | sed 's/ms//')
        echo "$num ${region_names[$i]} $lat" >> $temp_file
    fi
done

# Mostrar regiones accesibles ordenadas
if [ -s $temp_file ]; then
    echo "✅ Regiones Accesibles (mejor a peor latencia):"
    echo ""
    sort -n $temp_file | while read num region lat; do
        # Reconstruir nombre de región
        region_name=$(echo $region $lat | sed "s/ [^ ]*$//")
        latency="${lat}ms"
        color=$(get_color $latency)
        printf "${color}%-35s %10s${NC}\n" "$region_name" "$latency"
    done
fi

# Mostrar regiones no accesibles
echo ""
echo "❌ Regiones No Accesibles:"
echo ""
for ((i=0; i<${#region_names[@]}; i++)); do
    if [ "${latencies[$i]}" = "N/A" ]; then
        printf "${RED}%-35s %10s${NC}\n" "${region_names[$i]}" "N/A"
    fi
done

# Limpiar
rm -f $temp_file

# Recomendaciones
echo ""
echo "💡 Recomendaciones:"
echo "=================="
echo ""

# Encontrar mejor latencia
best_latency=9999
best_region=""
for ((i=0; i<${#region_names[@]}; i++)); do
    if [ "${latencies[$i]}" != "N/A" ]; then
        num=$(echo ${latencies[$i]} | sed 's/ms//')
        if (( $(echo "$num < $best_latency" | bc -l) )); then
            best_latency=$num
            best_region="${region_names[$i]}"
        fi
    fi
done

if [ -n "$best_region" ]; then
    echo "🎯 Mejor región para tu ubicación: ${GREEN}$best_region${NC} (${best_latency}ms)"
    echo ""
    echo "Consideraciones:"
    echo "- Latencia < 50ms: Excelente ✨"
    echo "- Latencia 50-150ms: Buena 👍"
    echo "- Latencia > 150ms: Regular 😐"
    echo "- N/A: Región no accesible desde tu ubicación 🚫"
else
    echo "${RED}No se pudo conectar a ninguna región de Oracle Cloud${NC}"
    echo "Verifica tu conexión a internet o firewall"
fi

echo ""
echo "📝 Nota: El Home Region solo se puede elegir al crear la cuenta."
echo "   Los recursos Free Tier solo están disponibles en el Home Region."
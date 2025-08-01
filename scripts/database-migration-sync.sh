#!/bin/bash

# ================================================
# LABUREMOS - Database Migration & Sync Scripts
# Script para migración y sincronización de esquemas
# Soporta PostgreSQL Local y AWS RDS
# ================================================

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_ROOT="/mnt/c/cursor/laburemos"
BACKEND_DIR="$PROJECT_ROOT/backend"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Función para imprimir mensajes
print_message() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar prerrequisitos
check_prerequisites() {
    print_message "Verificando prerrequisitos..."
    
    # Verificar Node.js y npm
    if ! command -v node &> /dev/null; then
        print_error "Node.js no encontrado. Instalar Node.js v18+."
        exit 1
    fi
    
    # Verificar Prisma CLI
    if ! command -v npx &> /dev/null; then
        print_error "npx no encontrado. Instalar npm."
        exit 1
    fi
    
    # Verificar directorio backend
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Directorio backend no encontrado: $BACKEND_DIR"
        exit 1
    fi
    
    # Verificar prisma schema
    if [ ! -f "$BACKEND_DIR/prisma/schema.prisma" ]; then
        print_error "Schema Prisma no encontrado: $BACKEND_DIR/prisma/schema.prisma"
        exit 1
    fi
    
    print_success "Prerrequisitos verificados correctamente"
}

# Función para setup local PostgreSQL
setup_local_database() {
    print_message "Configurando base de datos PostgreSQL local..."
    
    cd "$BACKEND_DIR"
    
    # Verificar archivo .env
    if [ ! -f ".env" ]; then
        print_warning "Archivo .env no encontrado, creando desde .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_message "Editar archivo .env con credenciales locales correctas"
        else
            print_error "Archivo .env.example no encontrado"
            exit 1
        fi
    fi
    
    # Generar cliente Prisma
    print_message "Generando cliente Prisma..."
    npx prisma generate
    
    # Aplicar migraciones
    print_message "Aplicando migraciones a base de datos local..."
    npx prisma db push
    
    print_success "Base de datos local configurada correctamente"
}

# Función para setup AWS RDS
setup_aws_database() {
    print_message "Configurando base de datos AWS RDS..."
    
    cd "$BACKEND_DIR"
    
    # Verificar conexión a AWS RDS
    print_message "Verificando conexión a AWS RDS..."
    
    # Backup del .env actual
    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        print_message "Backup de .env creado"
    fi
    
    # Configurar URL de conexión AWS RDS
    print_warning "CONFIGURAR MANUALMENTE:"
    echo "DATABASE_URL=\"postgresql://postgres:[PASSWORD]@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos\""
    
    read -p "¿Has configurado la DATABASE_URL para AWS RDS? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Configura DATABASE_URL antes de continuar"
        exit 1
    fi
    
    # Generar cliente Prisma
    print_message "Generando cliente Prisma para AWS RDS..."
    npx prisma generate
    
    # Aplicar schema a AWS RDS
    print_message "Aplicando schema a AWS RDS..."
    npx prisma db push
    
    print_success "Base de datos AWS RDS configurada correctamente"
}

# Función para sincronizar schemas
sync_schemas() {
    print_message "Sincronizando schemas entre local y AWS RDS..."
    
    cd "$BACKEND_DIR"
    
    # Extraer schema actual
    print_message "Extrayendo schema actual..."
    npx prisma db pull
    
    # Generar migraciones
    print_message "Generando migraciones..."
    npx prisma migrate dev --name sync_schemas
    
    print_success "Schemas sincronizados"
}

# Función para crear seed data
create_seed_data() {
    print_message "Creando datos de prueba..."
    
    cd "$BACKEND_DIR"
    
    # Verificar si existe seed script
    if [ -f "prisma/seed.ts" ]; then
        print_message "Ejecutando seed script..."
        npx prisma db seed
        print_success "Datos de prueba creados"
    else
        print_warning "Seed script no encontrado en prisma/seed.ts"
    fi
}

# Función para verificar conexiones
verify_connections() {
    print_message "Verificando conexiones de base de datos..."
    
    cd "$BACKEND_DIR"
    
    # Crear script temporal de verificación
    cat > /tmp/verify_connection.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

async function verifyConnection() {
    const prisma = new PrismaClient();
    
    try {
        // Test connection
        await prisma.$connect();
        console.log('✅ Conexión exitosa a la base de datos');
        
        // Test query
        const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
        console.log('📊 Información de la base de datos:', result[0]);
        
        // Count tables
        const tables = await prisma.$queryRaw`
            SELECT count(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('📋 Número de tablas:', tables[0].table_count);
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyConnection();
EOF

    # Ejecutar verificación
    node /tmp/verify_connection.js
    
    # Limpiar archivo temporal
    rm /tmp/verify_connection.js
    
    print_success "Verificación de conexión completada"
}

# Función para mostrar información de configuración
show_config_info() {
    print_message "Información de configuración de PgAdmin 4:"
    
    echo -e "\n${BLUE}=== CONFIGURACIÓN SERVIDOR LOCAL ===${NC}"
    echo "Host: localhost"
    echo "Port: 5432"  
    echo "Database: laburemos"
    echo "Username: postgres"
    echo "SSL Mode: Prefer"
    
    echo -e "\n${BLUE}=== CONFIGURACIÓN SERVIDOR AWS RDS ===${NC}"
    echo "Host: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
    echo "Port: 5432"
    echo "Database: laburemos"
    echo "Username: postgres"
    echo "SSL Mode: Require"
    
    echo -e "\n${BLUE}=== ARCHIVOS IMPORTANTES ===${NC}"
    echo "Schema Prisma: $BACKEND_DIR/prisma/schema.prisma"
    echo "Configuración: $BACKEND_DIR/.env"
    echo "Migraciones: $BACKEND_DIR/prisma/migrations/"
    
    echo -e "\n${BLUE}=== COMANDOS ÚTILES ===${NC}"
    echo "Generar cliente: npx prisma generate"
    echo "Aplicar cambios: npx prisma db push"
    echo "Ver estado: npx prisma migrate status"
    echo "Reset DB (dev): npx prisma migrate reset"
}

# Función principal
main() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "LABUREMOS - Database Migration & Sync Tool"
    echo "================================================"
    echo -e "${NC}"
    
    case "${1:-help}" in
        "local")
            check_prerequisites
            setup_local_database
            verify_connections
            show_config_info
            ;;
        "aws")
            check_prerequisites
            setup_aws_database
            verify_connections
            show_config_info
            ;;
        "sync")
            check_prerequisites
            sync_schemas
            verify_connections
            ;;
        "seed")
            check_prerequisites
            create_seed_data
            ;;
        "verify")
            check_prerequisites
            verify_connections
            ;;
        "info")
            show_config_info
            ;;
        "all")
            check_prerequisites
            setup_local_database
            setup_aws_database
            sync_schemas
            create_seed_data
            verify_connections
            show_config_info
            ;;
        *)
            echo -e "${YELLOW}Uso: $0 {local|aws|sync|seed|verify|info|all}${NC}"
            echo ""
            echo "Comandos disponibles:"
            echo "  local   - Configurar base de datos PostgreSQL local"
            echo "  aws     - Configurar base de datos AWS RDS"
            echo "  sync    - Sincronizar schemas entre local y AWS"
            echo "  seed    - Crear datos de prueba"
            echo "  verify  - Verificar conexiones"
            echo "  info    - Mostrar información de configuración"
            echo "  all     - Ejecutar configuración completa"
            echo ""
            echo "Ejemplos:"
            echo "  $0 local    # Configurar solo base local"
            echo "  $0 aws      # Configurar solo AWS RDS"
            echo "  $0 verify   # Verificar conexiones"
            ;;
    esac
}

# Ejecutar función principal
main "$@"
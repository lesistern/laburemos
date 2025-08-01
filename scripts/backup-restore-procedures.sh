#!/bin/bash

# ================================================
# LABUREMOS - Database Backup & Restore Procedures
# Script para backup y restore de PostgreSQL Local y AWS RDS
# Compatible con PgAdmin 4 y línea de comandos
# ================================================

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuración
PROJECT_ROOT="/mnt/c/cursor/laburemos"
BACKUP_DIR="$PROJECT_ROOT/backups"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Variables de conexión
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="laburemos"

AWS_HOST="laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
AWS_PORT="5432"
AWS_USER="postgres"
AWS_DB="laburemos"

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

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Verificar prerrequisitos
check_prerequisites() {
    print_message "Verificando prerrequisitos para backup/restore..."
    
    # Verificar pg_dump
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump no encontrado. Instalar PostgreSQL client tools."
        exit 1
    fi
    
    # Verificar pg_restore
    if ! command -v pg_restore &> /dev/null; then
        print_error "pg_restore no encontrado. Instalar PostgreSQL client tools."
        exit 1
    fi
    
    # Verificar psql
    if ! command -v psql &> /dev/null; then
        print_error "psql no encontrado. Instalar PostgreSQL client tools."
        exit 1
    fi
    
    print_success "Prerrequisitos verificados correctamente"
}

# Función para backup local
backup_local_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/laburemos_local_backup_$timestamp.sql"
    local custom_backup="$BACKUP_DIR/laburemos_local_backup_$timestamp.custom"
    
    print_message "Creando backup de base de datos local..."
    
    # Backup formato SQL
    print_info "Creando backup formato SQL..."
    PGPASSWORD="$LOCAL_PASSWORD" pg_dump \
        -h "$LOCAL_HOST" \
        -p "$LOCAL_PORT" \
        -U "$LOCAL_USER" \
        -d "$LOCAL_DB" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --file="$backup_file"
    
    # Backup formato custom (comprimido)
    print_info "Creando backup formato custom..."
    PGPASSWORD="$LOCAL_PASSWORD" pg_dump \
        -h "$LOCAL_HOST" \
        -p "$LOCAL_PORT" \
        -U "$LOCAL_USER" \
        -d "$LOCAL_DB" \
        --verbose \
        --format=custom \
        --compress=9 \
        --file="$custom_backup"
    
    # Comprimir backup SQL
    print_info "Comprimiendo backup SQL..."
    gzip "$backup_file"
    
    print_success "Backup local completado:"
    print_info "  SQL comprimido: ${backup_file}.gz"
    print_info "  Custom format: $custom_backup"
    
    # Mostrar información del backup
    ls -lh "$BACKUP_DIR/laburemos_local_backup_$timestamp"*
}

# Función para backup AWS RDS
backup_aws_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/laburemos_aws_backup_$timestamp.sql"
    local custom_backup="$BACKUP_DIR/laburemos_aws_backup_$timestamp.custom"
    
    print_message "Creando backup de base de datos AWS RDS..."
    
    # Solicitar contraseña si no está en variable de entorno
    if [ -z "$AWS_PASSWORD" ]; then
        read -s -p "Contraseña AWS RDS: " AWS_PASSWORD
        echo
    fi
    
    # Backup formato SQL
    print_info "Creando backup formato SQL..."
    PGPASSWORD="$AWS_PASSWORD" pg_dump \
        -h "$AWS_HOST" \
        -p "$AWS_PORT" \
        -U "$AWS_USER" \
        -d "$AWS_DB" \
        --verbose \
        --clean \
        --if-exists \
        --format=plain \
        --file="$backup_file"
    
    # Backup formato custom (comprimido)
    print_info "Creando backup formato custom..."
    PGPASSWORD="$AWS_PASSWORD" pg_dump \
        -h "$AWS_HOST" \
        -p "$AWS_PORT" \
        -U "$AWS_USER" \
        -d "$AWS_DB" \
        --verbose \
        --format=custom \
        --compress=9 \
        --file="$custom_backup"
    
    # Comprimir backup SQL
    print_info "Comprimiendo backup SQL..."
    gzip "$backup_file"
    
    print_success "Backup AWS RDS completado:"
    print_info "  SQL comprimido: ${backup_file}.gz"
    print_info "  Custom format: $custom_backup"
    
    # Mostrar información del backup
    ls -lh "$BACKUP_DIR/laburemos_aws_backup_$timestamp"*
}

# Función para restaurar a base local
restore_to_local() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        print_error "Archivo de backup no especificado o no existe: $backup_file"
        list_backups
        return 1
    fi
    
    print_message "Restaurando backup a base de datos local..."
    print_warning "ATENCIÓN: Esta operación eliminará todos los datos actuales"
    
    read -p "¿Continuar con la restauración? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restauración cancelada"
        return 0
    fi
    
    # Solicitar contraseña si no está en variable de entorno
    if [ -z "$LOCAL_PASSWORD" ]; then
        read -s -p "Contraseña PostgreSQL local: " LOCAL_PASSWORD
        echo
    fi
    
    # Determinar tipo de archivo
    if [[ "$backup_file" == *.sql.gz ]]; then
        print_info "Restaurando desde archivo SQL comprimido..."
        gunzip -c "$backup_file" | PGPASSWORD="$LOCAL_PASSWORD" psql \
            -h "$LOCAL_HOST" \
            -p "$LOCAL_PORT" \
            -U "$LOCAL_USER" \
            -d postgres \
            --quiet
    elif [[ "$backup_file" == *.sql ]]; then
        print_info "Restaurando desde archivo SQL..."
        PGPASSWORD="$LOCAL_PASSWORD" psql \
            -h "$LOCAL_HOST" \
            -p "$LOCAL_PORT" \
            -U "$LOCAL_USER" \
            -d postgres \
            --quiet \
            -f "$backup_file"
    elif [[ "$backup_file" == *.custom ]]; then
        print_info "Restaurando desde archivo custom..."
        
        # Crear base si no existe
        PGPASSWORD="$LOCAL_PASSWORD" createdb \
            -h "$LOCAL_HOST" \
            -p "$LOCAL_PORT" \
            -U "$LOCAL_USER" \
            "$LOCAL_DB" 2>/dev/null || true
        
        PGPASSWORD="$LOCAL_PASSWORD" pg_restore \
            -h "$LOCAL_HOST" \
            -p "$LOCAL_PORT" \
            -U "$LOCAL_USER" \
            -d "$LOCAL_DB" \
            --verbose \
            --clean \
            --if-exists \
            --create \
            "$backup_file"
    else
        print_error "Formato de archivo no soportado: $backup_file"
        return 1
    fi
    
    print_success "Restauración completada en base de datos local"
}

# Función para restaurar a AWS RDS
restore_to_aws() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        print_error "Archivo de backup no especificado o no existe: $backup_file"
        list_backups
        return 1
    fi
    
    print_message "Restaurando backup a AWS RDS..."
    print_warning "ATENCIÓN: Esta operación eliminará todos los datos actuales en PRODUCCIÓN"
    
    read -p "¿CONFIRMAR restauración a AWS RDS? (escribir 'CONFIRMO'): " confirmation
    if [ "$confirmation" != "CONFIRMO" ]; then
        print_info "Restauración cancelada"
        return 0
    fi
    
    # Solicitar contraseña si no está en variable de entorno
    if [ -z "$AWS_PASSWORD" ]; then
        read -s -p "Contraseña AWS RDS: " AWS_PASSWORD
        echo
    fi
    
    # Determinar tipo de archivo
    if [[ "$backup_file" == *.sql.gz ]]; then
        print_info "Restaurando desde archivo SQL comprimido..."
        gunzip -c "$backup_file" | PGPASSWORD="$AWS_PASSWORD" psql \
            -h "$AWS_HOST" \
            -p "$AWS_PORT" \
            -U "$AWS_USER" \
            -d postgres \
            --quiet
    elif [[ "$backup_file" == *.sql ]]; then
        print_info "Restaurando desde archivo SQL..."
        PGPASSWORD="$AWS_PASSWORD" psql \
            -h "$AWS_HOST" \
            -p "$AWS_PORT" \
            -U "$AWS_USER" \
            -d postgres \
            --quiet \
            -f "$backup_file"
    elif [[ "$backup_file" == *.custom ]]; then
        print_info "Restaurando desde archivo custom..."
        PGPASSWORD="$AWS_PASSWORD" pg_restore \
            -h "$AWS_HOST" \
            -p "$AWS_PORT" \
            -U "$AWS_USER" \
            -d "$AWS_DB" \
            --verbose \
            --clean \
            --if-exists \
            "$backup_file"
    else
        print_error "Formato de archivo no soportado: $backup_file"
        return 1
    fi
    
    print_success "Restauración completada en AWS RDS"
}

# Función para listar backups disponibles
list_backups() {
    print_message "Backups disponibles en $BACKUP_DIR:"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        print_warning "No hay backups disponibles"
        return 0
    fi
    
    echo -e "\n${BLUE}=== BACKUPS LOCALES ===${NC}"
    ls -lht "$BACKUP_DIR"/laburemos_local_backup_* 2>/dev/null || echo "No hay backups locales"
    
    echo -e "\n${BLUE}=== BACKUPS AWS RDS ===${NC}"
    ls -lht "$BACKUP_DIR"/laburemos_aws_backup_* 2>/dev/null || echo "No hay backups de AWS RDS"
    
    echo -e "\n${BLUE}=== TODOS LOS BACKUPS ===${NC}"
    ls -lht "$BACKUP_DIR"/ 2>/dev/null || echo "Directorio de backups vacío"
}

# Función para limpiar backups antiguos
cleanup_old_backups() {
    local days=${1:-30}
    
    print_message "Limpiando backups anteriores a $days días..."
    
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm "$file"
        print_info "Eliminado: $(basename "$file")"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "laburemos_*_backup_*" -mtime +$days -print0 2>/dev/null)
    
    if [ $deleted_count -eq 0 ]; then
        print_info "No hay backups antiguos para eliminar"
    else
        print_success "Eliminados $deleted_count backups antiguos"
    fi
}

# Función para sincronizar de local a AWS
sync_local_to_aws() {
    print_message "Sincronizando de base local a AWS RDS..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local temp_backup="$BACKUP_DIR/temp_sync_$timestamp.custom"
    
    # Crear backup temporal de local
    print_info "Creando backup temporal de base local..."
    PGPASSWORD="$LOCAL_PASSWORD" pg_dump \
        -h "$LOCAL_HOST" \
        -p "$LOCAL_PORT" \
        -U "$LOCAL_USER" \
        -d "$LOCAL_DB" \
        --format=custom \
        --compress=9 \
        --file="$temp_backup"
    
    # Restaurar a AWS RDS
    print_info "Restaurando a AWS RDS..."
    restore_to_aws "$temp_backup"
    
    # Limpiar backup temporal
    rm "$temp_backup"
    
    print_success "Sincronización local → AWS completada"
}

# Función para sincronizar de AWS a local
sync_aws_to_local() {
    print_message "Sincronizando de AWS RDS a base local..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local temp_backup="$BACKUP_DIR/temp_sync_$timestamp.custom"
    
    # Crear backup temporal de AWS
    print_info "Creando backup temporal de AWS RDS..."
    PGPASSWORD="$AWS_PASSWORD" pg_dump \
        -h "$AWS_HOST" \
        -p "$AWS_PORT" \
        -U "$AWS_USER" \
        -d "$AWS_DB" \
        --format=custom \
        --compress=9 \
        --file="$temp_backup"
    
    # Restaurar a local
    print_info "Restaurando a base local..."
    restore_to_local "$temp_backup"
    
    # Limpiar backup temporal
    rm "$temp_backup"
    
    print_success "Sincronización AWS → local completada"
}

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "LABUREMOS - Database Backup & Restore Tool"  
    echo "================================================"
    echo -e "${NC}"
    
    echo "Uso: $0 {comando} [opciones]"
    echo ""
    echo "COMANDOS DE BACKUP:"
    echo "  backup-local          - Crear backup de base de datos local"
    echo "  backup-aws           - Crear backup de base de datos AWS RDS"
    echo "  backup-all           - Crear backup de ambas bases de datos"
    echo ""
    echo "COMANDOS DE RESTORE:"
    echo "  restore-local <file> - Restaurar backup a base de datos local"
    echo "  restore-aws <file>   - Restaurar backup a AWS RDS"
    echo ""
    echo "COMANDOS DE SINCRONIZACIÓN:"
    echo "  sync-to-aws         - Sincronizar local → AWS RDS"
    echo "  sync-to-local       - Sincronizar AWS RDS → local"
    echo ""
    echo "COMANDOS DE GESTIÓN:"
    echo "  list                - Listar backups disponibles"
    echo "  cleanup [days]      - Limpiar backups antiguos (default: 30 días)"
    echo ""
    echo "VARIABLES DE ENTORNO:"
    echo "  LOCAL_PASSWORD      - Contraseña PostgreSQL local"
    echo "  AWS_PASSWORD        - Contraseña AWS RDS"
    echo ""
    echo "EJEMPLOS:"
    echo "  $0 backup-local"
    echo "  $0 restore-local /path/to/backup.custom"
    echo "  $0 sync-to-aws"
    echo "  $0 cleanup 7"
}

# Función principal
main() {
    case "${1:-help}" in
        "backup-local")
            check_prerequisites
            backup_local_database
            ;;
        "backup-aws")
            check_prerequisites
            backup_aws_database
            ;;
        "backup-all")
            check_prerequisites
            backup_local_database
            backup_aws_database
            ;;
        "restore-local")
            check_prerequisites
            restore_to_local "$2"
            ;;
        "restore-aws")
            check_prerequisites
            restore_to_aws "$2"
            ;;
        "sync-to-aws")
            check_prerequisites
            sync_local_to_aws
            ;;
        "sync-to-local")
            check_prerequisites
            sync_aws_to_local
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups "$2"
            ;;
        *)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
# Script para verificar instalación de PostgreSQL
Write-Host "=== Verificando PostgreSQL en el sistema ===" -ForegroundColor Cyan
Write-Host ""

# Buscar PostgreSQL en ubicaciones comunes
$commonPaths = @(
    "C:\Program Files\PostgreSQL\*\bin",
    "C:\Program Files (x86)\PostgreSQL\*\bin",
    "C:\postgresql\*\bin",
    "C:\xampp\postgresql\bin",
    "C:\wamp64\bin\postgresql\*\bin"
)

$pgFound = $false
$pgPath = $null

Write-Host "Buscando PostgreSQL en ubicaciones comunes..." -ForegroundColor Yellow

foreach ($path in $commonPaths) {
    $directories = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
    if ($directories) {
        foreach ($dir in $directories) {
            $psqlPath = Join-Path $dir.FullName "psql.exe"
            if (Test-Path $psqlPath) {
                Write-Host "✅ PostgreSQL encontrado en: $($dir.FullName)" -ForegroundColor Green
                $pgFound = $true
                $pgPath = $dir.FullName
                
                # Verificar versión
                try {
                    $version = & "$psqlPath" --version 2>$null
                    Write-Host "   Versión: $version" -ForegroundColor Green
                } catch {
                    Write-Host "   Versión: No se pudo determinar" -ForegroundColor Yellow
                }
                break
            }
        }
        if ($pgFound) { break }
    }
}

if (-not $pgFound) {
    Write-Host "❌ PostgreSQL no encontrado en ubicaciones comunes" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opciones disponibles:" -ForegroundColor Yellow
    Write-Host "1. Instalar PostgreSQL standalone"
    Write-Host "2. Usar PostgreSQL de XAMPP (si está instalado)"
    Write-Host "3. Usar Docker PostgreSQL"
    Write-Host ""
    
    # Verificar si XAMPP está instalado
    $xamppPath = "C:\xampp"
    if (Test-Path $xamppPath) {
        Write-Host "✅ XAMPP encontrado en: $xamppPath" -ForegroundColor Green
        
        # Verificar si tiene PostgreSQL
        $xamppPgPath = "$xamppPath\postgresql"
        if (Test-Path $xamppPgPath) {
            Write-Host "✅ PostgreSQL de XAMPP disponible" -ForegroundColor Green
            Write-Host "   Para usarlo, inicia XAMPP Control Panel y arranca PostgreSQL" -ForegroundColor Cyan
        } else {
            Write-Host "❌ PostgreSQL no está incluido en esta instalación de XAMPP" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "=== INSTRUCCIONES DE INSTALACIÓN ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "OPCIÓN 1 - PostgreSQL Standalone (Recomendado):" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://www.postgresql.org/download/windows/"
    Write-Host "2. Descarga PostgreSQL (versión 14, 15 o 16)"
    Write-Host "3. Durante la instalación:"
    Write-Host "   - Puerto: 5432"
    Write-Host "   - Contraseña del superusuario: postgres"
    Write-Host "   - ✅ Marcar 'Add to PATH'"
    Write-Host ""
    Write-Host "OPCIÓN 2 - Usando Docker:" -ForegroundColor Yellow
    Write-Host "docker run --name laburemos-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15"
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "✅ PostgreSQL disponible" -ForegroundColor Green
    Write-Host "Ruta: $pgPath" -ForegroundColor Green
    
    # Verificar si está en PATH
    try {
        $pathVersion = psql --version 2>$null
        Write-Host "✅ PostgreSQL está en PATH del sistema" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  PostgreSQL encontrado pero NO está en PATH" -ForegroundColor Yellow
        Write-Host "Para agregarlo al PATH:" -ForegroundColor Yellow
        Write-Host "1. Presiona Win + R, escribe 'sysdm.cpl'"
        Write-Host "2. Pestaña 'Advanced' → 'Environment Variables'"
        Write-Host "3. En 'System Variables', selecciona 'Path' → 'Edit'"
        Write-Host "4. Agrega: $pgPath"
    }
    
    Write-Host ""
    Write-Host "Probando conexión local..." -ForegroundColor Yellow
    try {
        $testConnection = & "$psqlPath" -h localhost -U postgres -d postgres -c "SELECT version();" 2>$null
        if ($testConnection) {
            Write-Host "✅ Conexión local exitosa" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  No se pudo conectar (normal si PostgreSQL no está corriendo)" -ForegroundColor Yellow
        Write-Host "Inicia el servicio PostgreSQL:" -ForegroundColor Cyan
        Write-Host "- Servicios de Windows: busca 'postgresql'"
        Write-Host "- O desde XAMPP Control Panel si usas XAMPP"
    }
}

Write-Host ""
Write-Host "=== CONFIGURACIÓN PARA pgAdmin4 ===" -ForegroundColor Cyan
Write-Host "Una vez que PostgreSQL esté corriendo:" -ForegroundColor Yellow
Write-Host "Host: localhost"
Write-Host "Port: 5432"
Write-Host "Username: postgres"
Write-Host "Password: postgres (o la que configuraste)"
Write-Host "Database: postgres (para conectar inicialmente)"
/**
 * Playwright Configuration for LaburAR Testing
 * 
 * Configuración optimizada para testing de la plataforma argentina LaburAR
 * Incluye configuración específica para timezone argentino y features locales
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

const { defineConfig, devices } = require('@playwright/test');

// Configuración específica para Argentina
const ARGENTINA_CONFIG = {
    timezone: 'America/Argentina/Buenos_Aires',
    locale: 'es-AR',
    currency: 'ARS',
    baseURL: process.env.BASE_URL || 'http://localhost/Laburar'
};

module.exports = defineConfig({
    // Directorio de tests
    testDir: './tests',
    
    // Patrones de archivos de test
    testMatch: [
        '**/e2e/**/*.spec.js',
        '**/integration/**/*.test.js',
        '**/security/**/*.spec.js'
    ],
    
    // Ejecutar tests en paralelo
    fullyParallel: true,
    
    // Fallar si hay tests que no se pueden ejecutar en CI
    forbidOnly: !!process.env.CI,
    
    // Reintentos en caso de fallo
    retries: process.env.CI ? 2 : 1,
    
    // Workers en paralelo
    workers: process.env.CI ? 1 : undefined,
    
    // Timeout global para tests
    timeout: 30000,
    
    // Timeout para expect
    expect: {
        timeout: 10000,
        // Configurar para timezone argentino
        toHaveScreenshot: {
            // Threshold para screenshots en diferentes timezones
            threshold: 0.3
        }
    },
    
    // Configuración de reportes
    reporter: [
        // Reporter HTML para desarrollo
        ['html', { 
            outputFolder: 'tests/reports',
            open: 'never',
            host: 'localhost',
            port: 9323
        }],
        
        // Reporter JSON para CI/CD
        ['json', { 
            outputFile: 'tests/reports/results.json' 
        }],
        
        // Reporter de línea para consola
        ['line'],
        
        // Reporter JUnit para integración con CI
        ['junit', { 
            outputFile: 'tests/reports/junit-results.xml' 
        }]
    ],
    
    // Configuración global para todos los tests
    use: {
        // URL base para todos los tests
        baseURL: ARGENTINA_CONFIG.baseURL,
        
        // Timezone argentino para todos los tests
        timezoneId: ARGENTINA_CONFIG.timezone,
        
        // Locale argentino
        locale: ARGENTINA_CONFIG.locale,
        
        // Configuración de viewport
        viewport: { width: 1280, height: 720 },
        
        // Configuración de video y screenshots
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        
        // Configuración de trazas para debugging
        trace: 'retain-on-failure',
        
        // Headers específicos para LaburAR
        extraHTTPHeaders: {
            'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
            'X-Test-Environment': 'playwright'
        },
        
        // Geolocalización argentina (Buenos Aires)
        geolocation: { 
            latitude: -34.6118, 
            longitude: -58.3960 
        },
        permissions: ['geolocation'],
        
        // Configuración específica para testing argentino
        colorScheme: 'light',
        
        // Timeout para navegación
        navigationTimeout: 15000,
        
        // Timeout para acciones
        actionTimeout: 10000
    },
    
    // Configuración de proyectos (browsers)
    projects: [
        // Desktop Chrome - Principal para desarrollo
        {
            name: 'chromium',
            use: { 
                ...devices['Desktop Chrome'],
                // Configurar para simular usuario argentino
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LaburAR-Test'
            }
        },
        
        // Desktop Firefox - Testing de compatibilidad
        {
            name: 'firefox',
            use: { 
                ...devices['Desktop Firefox'],
                // Configurar preferences específicas
                launchOptions: {
                    firefoxUserPrefs: {
                        'intl.accept_languages': 'es-AR,es,en',
                        'browser.search.region': 'AR'
                    }
                }
            }
        },
        
        // Desktop Safari - Testing en macOS
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] }
        },
        
        // Mobile Chrome - Testing responsive argentino
        {
            name: 'Mobile Chrome',
            use: { 
                ...devices['Pixel 5'],
                // Simular conexión móvil argentina
                geolocation: { 
                    latitude: -34.6118, 
                    longitude: -58.3960 
                }
            }
        },
        
        // Mobile Safari - Testing iOS
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] }
        },
        
        // Tablet - Testing en dispositivos medianos
        {
            name: 'iPad',
            use: { ...devices['iPad Pro'] }
        }
    ],
    
    // Configuración de servidor de desarrollo
    webServer: {
        // Auto-start del servidor XAMPP si no está corriendo
        command: process.env.CI ? null : 'echo "Verificar que XAMPP esté corriendo..."',
        url: ARGENTINA_CONFIG.baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30000
    },
    
    // Configuración específica para testing argentino
    globalSetup: require.resolve('./tests/global-setup.js'),
    globalTeardown: require.resolve('./tests/global-teardown.js'),
    
    // Directorios de output
    outputDir: 'tests/test-results',
    
    // Configuración de archivos estáticos
    snapshotDir: 'tests/screenshots',
    
    // Configuración de metadata para reportes
    metadata: {
        platform: 'LaburAR',
        country: 'Argentina',
        timezone: ARGENTINA_CONFIG.timezone,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'test'
    }
});

// Configuración específica para diferentes ambientes
if (process.env.NODE_ENV === 'production') {
    module.exports.use.baseURL = 'https://laburar.com.ar';
    module.exports.retries = 3;
    module.exports.workers = 2;
}

if (process.env.NODE_ENV === 'staging') {
    module.exports.use.baseURL = 'https://staging.laburar.com.ar';
    module.exports.retries = 2;
}
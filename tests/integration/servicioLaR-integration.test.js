/**
 * ServicioLaR Integration Test Suite
 * 
 * Suite completa de testing de integración para el sistema ServicioLaR
 * Prueba integración entre componentes, APIs, base de datos y servicios externos
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');

// Testing configuration
const INTEGRATION_CONFIG = {
    database: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'laburar_test'
    },
    apis: {
        baseUrl: 'http://localhost/Laburar/api',
        timeout: 5000
    },
    argentina: {
        timezone: 'America/Argentina/Buenos_Aires',
        currency: 'ARS',
        cuitValidator: true,
        mercadoPagoTestMode: true
    }
};

// Test data específico para integración
const INTEGRATION_DATA = {
    freelancer: {
        id: 1,
        email: 'freelancer.test@laburar.com',
        username: 'test_freelancer',
        cuit: '20-12345678-9'
    },
    client: {
        id: 2,
        email: 'client.test@laburar.com',
        username: 'test_client',
        cuit: '20-98765432-1'
    },
    service: {
        title: 'Test Service Integration',
        category_id: 1,
        base_price: 25000,
        service_type: 'hybrid'
    },
    packages: [
        {
            package_type: 'basico',
            name: 'Paquete Básico Test',
            price: 15000,
            delivery_days: 3,
            features: ['Logo simple', '2 revisiones']
        },
        {
            package_type: 'completo',
            name: 'Paquete Completo Test',
            price: 35000,
            delivery_days: 7,
            features: ['Logo + manual', '5 revisiones', 'Videollamada']
        },
        {
            package_type: 'premium',
            name: 'Paquete Premium Test',
            price: 75000,
            delivery_days: 14,
            features: ['Identidad completa', '10 revisiones', 'Videollamada', 'Cuotas']
        }
    ],
    trustSignals: [
        {
            signal_type: 'monotributo',
            verified: true,
            metadata: { afip_verified: true }
        },
        {
            signal_type: 'universidad',
            verified: true,
            metadata: { institution: 'UBA', degree: 'Diseño Gráfico' }
        }
    ]
};

let dbConnection;

test.describe('ServicioLaR Integration Tests', () => {
    
    test.beforeAll(async () => {
        // Establecer conexión a base de datos de testing
        dbConnection = await mysql.createConnection(INTEGRATION_CONFIG.database);
        
        // Preparar base de datos para testing
        await setupTestDatabase();
    });
    
    test.afterAll(async () => {
        // Limpiar base de datos después de tests
        await cleanupTestDatabase();
        await dbConnection.end();
    });
    
    test.beforeEach(async () => {
        // Reset data antes de cada test
        await resetTestData();
    });

    test.describe('1. Service Package Integration', () => {
        
        test('should create service with packages through complete flow', async ({ request }) => {
            // 1. Crear servicio base
            const serviceResponse = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/ServiceController.php`, {
                data: {
                    action: 'create',
                    ...INTEGRATION_DATA.service,
                    user_id: INTEGRATION_DATA.freelancer.id
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_jwt_token'
                }
            });
            
            expect(serviceResponse.status()).toBe(200);
            const serviceData = await serviceResponse.json();
            expect(serviceData.success).toBe(true);
            
            const serviceId = serviceData.service_id;
            
            // 2. Crear paquetes para el servicio
            const packagesResponse = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/ServicePackageController.php`, {
                data: {
                    action: 'create_packages',
                    service_id: serviceId,
                    packages: INTEGRATION_DATA.packages
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_jwt_token'
                }
            });
            
            expect(packagesResponse.status()).toBe(200);
            const packagesData = await packagesResponse.json();
            expect(packagesData.success).toBe(true);
            
            // 3. Verificar en base de datos
            const [rows] = await dbConnection.execute(
                'SELECT * FROM service_packages WHERE service_id = ?',
                [serviceId]
            );
            
            expect(rows).toHaveLength(3);
            expect(rows[0].package_type).toBe('basico');
            expect(rows[1].package_type).toBe('completo');
            expect(rows[2].package_type).toBe('premium');
            
            // 4. Verificar pricing argentino
            const premiumPackage = rows.find(p => p.package_type === 'premium');
            expect(premiumPackage.price).toBe(75000);
            expect(premiumPackage.currency).toBe('ARS');
            expect(premiumPackage.cuotas_disponibles).toBe(1);
        });
        
        test('should retrieve packages with argentinian pricing', async ({ request }) => {
            // Setup: crear servicio con paquetes
            const serviceId = await createTestServiceWithPackages();
            
            // Obtener paquetes con pricing
            const response = await request.get(
                `${INTEGRATION_CONFIG.apis.baseUrl}/ServicePackageController.php?action=get_packages_with_pricing&service_id=${serviceId}`
            );
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            
            const packages = data.packages;
            expect(packages).toHaveLength(3);
            
            // Verificar conversión de moneda y cuotas
            const premiumPackage = packages.find(p => p.package_type === 'premium');
            expect(premiumPackage.price_ars).toBe(75000);
            expect(premiumPackage.payment_info).toContain('cuotas sin interés');
            
            const basicPackage = packages.find(p => p.package_type === 'basico');
            expect(basicPackage.payment_info).toBe('Solo contado');
        });
    });
    
    test.describe('2. Trust Signals Integration', () => {
        
        test('should create and verify argentinian trust signals', async ({ request }) => {
            const freelancerId = INTEGRATION_DATA.freelancer.id;
            
            // 1. Crear trust signals
            for (const signal of INTEGRATION_DATA.trustSignals) {
                const response = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/TrustSignalController.php`, {
                    data: {
                        action: 'create',
                        user_id: freelancerId,
                        ...signal
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer admin_jwt_token'
                    }
                });
                
                expect(response.status()).toBe(200);
                const data = await response.json();
                expect(data.success).toBe(true);
            }
            
            // 2. Calcular trust score argentino
            const trustResponse = await request.get(
                `${INTEGRATION_CONFIG.apis.baseUrl}/TrustSignalController.php?action=calculate_trust&user_id=${freelancerId}`
            );
            
            expect(trustResponse.status()).toBe(200);
            const trustData = await trustResponse.json();
            expect(trustData.success).toBe(true);
            
            // Verificar scoring argentino
            expect(trustData.score).toBeGreaterThanOrEqual(40); // Monotributo (25) + Universidad (15)
            expect(trustData.level).toBe('pro');
            expect(trustData.badges).toContainEqual(
                expect.objectContaining({
                    type: 'monotributo_verificado',
                    label: 'Monotributista Verificado'
                })
            );
            expect(trustData.badges).toContainEqual(
                expect.objectContaining({
                    type: 'talento_argentino',
                    label: 'Talento Argentino'
                })
            );
        });
        
        test('should integrate trust signals with service display', async ({ request }) => {
            const freelancerId = INTEGRATION_DATA.freelancer.id;
            
            // Setup: crear freelancer con trust signals
            await createTestTrustSignals(freelancerId);
            
            // Crear servicio
            const serviceId = await createTestServiceWithPackages();
            
            // Obtener servicio con trust signals integrados
            const response = await request.get(
                `${INTEGRATION_CONFIG.apis.baseUrl}/SearchController.php?action=get_service_with_trust&service_id=${serviceId}`
            );
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            
            const service = data.service;
            expect(service.trust_score).toBeGreaterThan(0);
            expect(service.trust_badges).toBeDefined();
            expect(service.trust_badges.length).toBeGreaterThan(0);
            expect(service.talento_argentino_badge).toBe(true);
        });
    });
    
    test.describe('3. Search and Filters Integration', () => {
        
        test('should search services with argentinian filters', async ({ request }) => {
            // Setup: crear servicios de test con diferentes características
            await createTestServicesWithFilters();
            
            // Buscar con filtros argentinos
            const response = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/SearchController.php`, {
                data: {
                    action: 'searchWithArgentinianFilters',
                    filters: {
                        monotributo_verified: true,
                        videollamada_available: true,
                        cuotas_disponibles: true,
                        ubicacion: 'Buenos Aires',
                        precio_max: 50000
                    }
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            
            const services = data.services;
            expect(services.length).toBeGreaterThan(0);
            
            // Verificar que todos los servicios cumplan los filtros
            for (const service of services) {
                expect(service.monotributo_verified).toBe(true);
                expect(service.videollamada_available).toBe(true);
                expect(service.cuotas_disponibles).toBe(true);
                expect(service.ubicacion_argentina).toContain('Buenos Aires');
                expect(service.starting_price).toBeLessThanOrEqual(50000);
            }
        });
        
        test('should handle complex search with multiple criteria', async ({ request }) => {
            const response = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/SearchController.php`, {
                data: {
                    action: 'advancedSearch',
                    criteria: {
                        category: 'diseño-grafico',
                        price_range: { min: 10000, max: 100000 },
                        trust_level: 'pro',
                        argentina_only: true,
                        package_types: ['completo', 'premium'],
                        delivery_max: 14
                    }
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.total_results).toBeGreaterThan(0);
        });
    });
    
    test.describe('4. MercadoPago Integration', () => {
        
        test('should calculate pricing with argentinian taxes and cuotas', async ({ request }) => {
            const packageId = await createTestPackage({
                price: 50000,
                cuotas_disponibles: true
            });
            
            const response = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/ServicePackageController.php`, {
                data: {
                    action: 'calculatePricing',
                    package_id: packageId,
                    invoice_type: 'responsable_inscripto',
                    installments: 6
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            
            const pricing = data.pricing;
            expect(pricing.base_price).toBe(50000);
            expect(pricing.iva_amount).toBe(10500); // 21% IVA
            expect(pricing.total_amount).toBe(60500);
            expect(pricing.installment_amount).toBe(10083.33); // 6 cuotas
            expect(pricing.currency).toBe('ARS');
        });
        
        test('should integrate with MercadoPago preference creation', async ({ request }) => {
            const packageId = await createTestPackage({
                price: 25000,
                cuotas_disponibles: true
            });
            
            const response = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/PaymentController.php`, {
                data: {
                    action: 'create_mercadopago_preference',
                    package_id: packageId,
                    buyer: INTEGRATION_DATA.client,
                    installments: 3
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_jwt_token'
                }
            });
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.preference_id).toBeDefined();
            expect(data.init_point).toContain('mercadopago');
        });
    });
    
    test.describe('5. Mi Red System Integration', () => {
        
        test('should create connection and update relationship score', async ({ request }) => {
            const freelancerId = INTEGRATION_DATA.freelancer.id;
            const clientId = INTEGRATION_DATA.client.id;
            
            // 1. Crear conexión en Mi Red
            const connectionResponse = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/MiRedController.php`, {
                data: {
                    action: 'create_connection',
                    freelancer_id: freelancerId,
                    client_id: clientId,
                    connection_type: 'trusted'
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_jwt_token'
                }
            });
            
            expect(connectionResponse.status()).toBe(200);
            const connectionData = await connectionResponse.json();
            expect(connectionData.success).toBe(true);
            
            const connectionId = connectionData.connection_id;
            
            // 2. Simular interacciones para actualizar score
            await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/MiRedController.php`, {
                data: {
                    action: 'update_score',
                    connection_id: connectionId,
                    interaction_type: 'project_complete',
                    impact_score: 2.0
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_jwt_token'
                }
            });
            
            // 3. Verificar score actualizado
            const scoreResponse = await request.get(
                `${INTEGRATION_CONFIG.apis.baseUrl}/MiRedController.php?action=get_connection&connection_id=${connectionId}`
            );
            
            const scoreData = await scoreResponse.json();
            expect(scoreData.connection.relationship_score).toBeGreaterThan(3.0);
            
            // 4. Verificar en base de datos
            const [rows] = await dbConnection.execute(
                'SELECT * FROM red_connections WHERE id = ?',
                [connectionId]
            );
            
            expect(rows[0].relationship_score).toBeGreaterThan(3.0);
            expect(rows[0].connection_type).toBe('trusted');
        });
        
        test('should get network recommendations', async ({ request }) => {
            const clientId = INTEGRATION_DATA.client.id;
            
            // Setup: crear red con varias conexiones
            await createTestNetworkConnections(clientId);
            
            const response = await request.get(
                `${INTEGRATION_CONFIG.apis.baseUrl}/MiRedController.php?action=get_suggestions&user_id=${clientId}&user_type=client&limit=5`
            );
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.suggestions.length).toBeLessThanOrEqual(5);
            
            // Verificar que las sugerencias tienen score de compatibilidad
            for (const suggestion of data.suggestions) {
                expect(suggestion.compatibility_score).toBeGreaterThan(0);
                expect(suggestion.suggestion_reason).toBeDefined();
            }
        });
    });
    
    test.describe('6. Videollamadas Integration', () => {
        
        test('should schedule videollamada with argentinian timezone', async ({ request }) => {
            const freelancerId = INTEGRATION_DATA.freelancer.id;
            const clientId = INTEGRATION_DATA.client.id;
            
            // Crear conexión en Mi Red primero
            const connectionId = await createTestConnection(freelancerId, clientId);
            
            // Programar videollamada
            const response = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/VideollamadasController.php`, {
                data: {
                    action: 'schedule',
                    connection_id: connectionId,
                    call_type: 'consultation',
                    scheduled_at: '2025-07-25 14:30:00'
                    duration: 60,
                    agenda: 'Discutir nuevo proyecto de diseño',
                    recording: true,
                    transcription: true
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_jwt_token'
                }
            });
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.meeting_link).toBeDefined();
            
            // Verificar en base de datos con timezone correcto
            const [rows] = await dbConnection.execute(
                'SELECT *, CONVERT_TZ(scheduled_at, "+00:00", "-03:00") as argentina_time FROM videollamadas WHERE id = ?',
                [data.call_id]
            );
            
            expect(rows[0].status).toBe('scheduled');
            expect(rows[0].argentina_time).toContain('2025-07-25 14:30:00');
        });
        
        test('should integrate videollamada with Mi Red scoring', async ({ request }) => {
            // Setup: crear videollamada y completarla
            const callId = await createTestVideollamada();
            
            // Simular completion de videollamada
            const completeResponse = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/VideollamadasController.php`, {
                data: {
                    action: 'complete',
                    call_id: callId,
                    rating: 5,
                    notes: 'Excelente sesión de consultoría'
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_jwt_token'
                }
            });
            
            expect(completeResponse.status()).toBe(200);
            
            // Verificar que se actualizó el score en Mi Red
            const [connectionRows] = await dbConnection.execute(
                'SELECT relationship_score FROM red_connections WHERE id = (SELECT connection_id FROM videollamadas WHERE id = ?)',
                [callId]
            );
            
            expect(connectionRows[0].relationship_score).toBeGreaterThan(3.0);
        });
    });
    
    test.describe('7. End-to-End Workflow Integration', () => {
        
        test('should complete full service purchase workflow', async ({ request }) => {
            // 1. Buscar servicio
            const searchResponse = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/SearchController.php`, {
                data: {
                    action: 'searchWithArgentinianFilters',
                    filters: { categoria: 'diseño-grafico' }
                }
            });
            
            const services = (await searchResponse.json()).services;
            const serviceId = services[0].id;
            
            // 2. Obtener paquetes
            const packagesResponse = await request.get(
                `${INTEGRATION_CONFIG.apis.baseUrl}/ServicePackageController.php?action=get_packages_with_pricing&service_id=${serviceId}`
            );
            
            const packages = (await packagesResponse.json()).packages;
            const premiumPackage = packages.find(p => p.package_type === 'premium');
            
            // 3. Crear preferencia de MercadoPago
            const preferenceResponse = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/PaymentController.php`, {
                data: {
                    action: 'create_mercadopago_preference',
                    package_id: premiumPackage.id,
                    buyer: INTEGRATION_DATA.client,
                    installments: 6
                },
                headers: {
                    'Authorization': 'Bearer test_jwt_token'
                }
            });
            
            const preference = await preferenceResponse.json();
            expect(preference.success).toBe(true);
            
            // 4. Simular webhook de pago exitoso
            const webhookResponse = await request.post(`${INTEGRATION_CONFIG.apis.baseUrl}/PaymentController.php?action=webhook`, {
                data: {
                    type: 'payment',
                    data: { id: '12345678' },
                    preference_id: preference.preference_id
                }
            });
            
            expect(webhookResponse.status()).toBe(200);
            
            // 5. Verificar creación de proyecto
            const [projectRows] = await dbConnection.execute(
                'SELECT * FROM projects WHERE package_id = ? ORDER BY created_at DESC LIMIT 1',
                [premiumPackage.id]
            );
            
            expect(projectRows.length).toBe(1);
            expect(projectRows[0].status).toBe('active');
            
            // 6. Verificar creación automática de conexión en Mi Red
            const [connectionRows] = await dbConnection.execute(
                'SELECT * FROM red_connections WHERE freelancer_id = ? AND client_id = ?',
                [INTEGRATION_DATA.freelancer.id, INTEGRATION_DATA.client.id]
            );
            
            expect(connectionRows.length).toBe(1);
            expect(connectionRows[0].connection_type).toBe('favorite');
        });
    });
});

// Utility functions para setup de testing
async function setupTestDatabase() {
    // Crear tablas de testing si no existen
    await dbConnection.execute(`
        CREATE TABLE IF NOT EXISTS test_services (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            service_type ENUM('gig', 'custom', 'hybrid') DEFAULT 'gig',
            monotributo_verified BOOLEAN DEFAULT FALSE,
            videollamada_available BOOLEAN DEFAULT FALSE,
            cuotas_disponibles BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    await dbConnection.execute(`
        CREATE TABLE IF NOT EXISTS test_service_packages (
            id INT PRIMARY KEY AUTO_INCREMENT,
            service_id INT NOT NULL,
            package_type ENUM('basico', 'completo', 'premium', 'colaborativo') NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            currency ENUM('ARS', 'USD') DEFAULT 'ARS',
            cuotas_disponibles BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function cleanupTestDatabase() {
    await dbConnection.execute('DROP TABLE IF EXISTS test_services');
    await dbConnection.execute('DROP TABLE IF EXISTS test_service_packages');
    await dbConnection.execute('DELETE FROM red_connections WHERE id > 1000');
    await dbConnection.execute('DELETE FROM videollamadas WHERE id > 1000');
}

async function resetTestData() {
    await dbConnection.execute('DELETE FROM test_services');
    await dbConnection.execute('DELETE FROM test_service_packages');
}

async function createTestServiceWithPackages() {
    const [result] = await dbConnection.execute(
        'INSERT INTO test_services (user_id, title, service_type, monotributo_verified, videollamada_available, cuotas_disponibles) VALUES (?, ?, ?, ?, ?, ?)',
        [INTEGRATION_DATA.freelancer.id, INTEGRATION_DATA.service.title, 'hybrid', true, true, true]
    );
    
    const serviceId = result.insertId;
    
    for (const pkg of INTEGRATION_DATA.packages) {
        await dbConnection.execute(
            'INSERT INTO test_service_packages (service_id, package_type, price, cuotas_disponibles) VALUES (?, ?, ?, ?)',
            [serviceId, pkg.package_type, pkg.price, pkg.package_type === 'premium']
        );
    }
    
    return serviceId;
}

async function createTestTrustSignals(userId) {
    for (const signal of INTEGRATION_DATA.trustSignals) {
        await dbConnection.execute(
            'INSERT INTO argentina_trust_signals (user_id, signal_type, verified, metadata) VALUES (?, ?, ?, ?)',
            [userId, signal.signal_type, signal.verified, JSON.stringify(signal.metadata)]
        );
    }
}

async function createTestServicesWithFilters() {
    // Crear varios servicios con diferentes características para testing de filtros
    const services = [
        { monotributo: true, videollamada: true, cuotas: true, ubicacion: 'Buenos Aires', precio: 25000 },
        { monotributo: false, videollamada: true, cuotas: false, ubicacion: 'Córdoba', precio: 35000 },
        { monotributo: true, videollamada: false, cuotas: true, ubicacion: 'Buenos Aires', precio: 45000 },
        { monotributo: true, videollamada: true, cuotas: false, ubicacion: 'Rosario', precio: 55000 }
    ];
    
    for (const service of services) {
        await dbConnection.execute(
            'INSERT INTO test_services (user_id, title, monotributo_verified, videollamada_available, cuotas_disponibles) VALUES (?, ?, ?, ?, ?)',
            [INTEGRATION_DATA.freelancer.id, `Test Service ${Math.random()}`, service.monotributo, service.videollamada, service.cuotas]
        );
    }
}

async function createTestPackage(packageData) {
    const [result] = await dbConnection.execute(
        'INSERT INTO test_service_packages (service_id, package_type, price, cuotas_disponibles) VALUES (?, ?, ?, ?)',
        [1, 'premium', packageData.price, packageData.cuotas_disponibles]
    );
    
    return result.insertId;
}

async function createTestConnection(freelancerId, clientId) {
    const [result] = await dbConnection.execute(
        'INSERT INTO red_connections (freelancer_id, client_id, connection_type, relationship_score) VALUES (?, ?, ?, ?)',
        [freelancerId, clientId, 'trusted', 3.5]
    );
    
    return result.insertId;
}

async function createTestNetworkConnections(clientId) {
    // Crear varias conexiones para testing de recomendaciones
    for (let i = 0; i < 5; i++) {
        await dbConnection.execute(
            'INSERT INTO red_connections (freelancer_id, client_id, connection_type, projects_together, total_spent) VALUES (?, ?, ?, ?, ?)',
            [i + 10, clientId, 'trusted', Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 100000) + 10000]
        );
    }
}

async function createTestVideollamada() {
    const connectionId = await createTestConnection(INTEGRATION_DATA.freelancer.id, INTEGRATION_DATA.client.id);
    
    const [result] = await dbConnection.execute(
        'INSERT INTO videollamadas (connection_id, call_type, scheduled_at, duration, status) VALUES (?, ?, ?, ?, ?)',
        [connectionId, 'consultation', '2025-07-25 14:30:00', 60, 'scheduled']
    );
    
    return result.insertId;
}

module.exports = {
    INTEGRATION_CONFIG,
    INTEGRATION_DATA,
    setupTestDatabase,
    cleanupTestDatabase
};
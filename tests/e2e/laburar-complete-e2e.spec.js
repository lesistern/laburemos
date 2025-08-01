/**
 * LaburAR Complete E2E Test Suite
 * 
 * Suite completa de testing end-to-end para toda la plataforma LaburAR
 * Incluye: Auth, Marketplace, Proyectos, Pagos, Reviews, Chat, ServicioLaR
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

const { test, expect } = require('@playwright/test');

// Configuración global para tests argentinos
const ARGENTINA_CONFIG = {
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    locale: 'es-AR',
    baseUrl: 'http://localhost/Laburar'
};

// Test data para escenarios argentinos
const TEST_DATA = {
    freelancer: {
        email: 'maria.gonzalez@laburar.test',
        password: 'LaburAR2025!',
        username: 'maria_diseñadora',
        firstName: 'María',
        lastName: 'González',
        cuit: '20-12345678-9',
        location: 'Buenos Aires, Argentina',
        profession: 'Diseñadora Gráfica'
    },
    client: {
        email: 'carlos.rodriguez@laburar.test',
        password: 'LaburAR2025!',
        username: 'carlos_empresario',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        cuit: '20-98765432-1',
        location: 'Córdoba, Argentina',
        company: 'TechCorp Argentina SA'
    },
    service: {
        title: 'Diseño de Logo Empresarial Argentino',
        description: 'Diseño profesional de logos con identidad argentina',
        category: 'diseño-grafico',
        basePrice: 15000,
        deliveryDays: 5
    },
    project: {
        title: 'Logo para startup fintech argentina',
        budget: 25000,
        description: 'Necesito un logo moderno para mi startup de fintech argentina',
        deadline: '2025-08-15'
    }
};

test.describe('LaburAR Platform - Complete E2E Suite', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            // Override timezone para tests
            Object.defineProperty(Intl, 'DateTimeFormat', {
                value: function(...args) {
                    args[1] = args[1] || {};
                    args[1].timeZone = 'America/Argentina/Buenos_Aires';
                    return new Intl.DateTimeFormat(...args);
                }
            });
        });
        
        await page.goto(ARGENTINA_CONFIG.baseUrl);
    });

    test.describe('1. Sistema de Autenticación Enterprise', () => {
        
        test('should register new freelancer with argentina verification', async ({ page }) => {
            await page.click('[data-testid="register-btn"]');
            await page.click('[data-testid="register-freelancer"]');
            
            // Formulario de registro freelancer
            await page.fill('#firstName', TEST_DATA.freelancer.firstName);
            await page.fill('#lastName', TEST_DATA.freelancer.lastName);
            await page.fill('#email', TEST_DATA.freelancer.email);
            await page.fill('#username', TEST_DATA.freelancer.username);
            await page.fill('#password', TEST_DATA.freelancer.password);
            await page.fill('#confirmPassword', TEST_DATA.freelancer.password);
            
            // Datos argentinos específicos
            await page.fill('#cuit', TEST_DATA.freelancer.cuit);
            await page.selectOption('#location', 'Buenos Aires');
            await page.fill('#profession', TEST_DATA.freelancer.profession);
            
            // Trust signals argentinos
            await page.check('#monotributo_check');
            await page.check('#terms_argentina');
            
            await page.click('[data-testid="register-submit"]');
            
            // Verificar redirección a verificación de email
            await expect(page).toHaveURL(/.*verificacion/);
            await expect(page.locator('.verification-message')).toContainText('Te enviamos un email de verificación');
        });
        
        test('should login with 2FA and JWT tokens', async ({ page }) => {
            await page.click('[data-testid="login-btn"]');
            
            await page.fill('#loginEmail', TEST_DATA.freelancer.email);
            await page.fill('#loginPassword', TEST_DATA.freelancer.password);
            await page.click('[data-testid="login-submit"]');
            
            // Verificar 2FA si está habilitado
            if (await page.isVisible('#totp-code')) {
                await page.fill('#totp-code', '123456'); // Mock TOTP
                await page.click('[data-testid="verify-2fa"]');
            }
            
            // Verificar login exitoso y JWT
            await expect(page).toHaveURL(/.*dashboard/);
            
            // Verificar que el JWT token esté presente
            const localStorage = await page.evaluate(() => window.localStorage);
            expect(localStorage.authToken).toBeTruthy();
        });
        
        test('should update freelancer profile with portfolio', async ({ page }) => {
            // Login primero
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/login.html`);
            await page.fill('#loginEmail', TEST_DATA.freelancer.email);
            await page.fill('#loginPassword', TEST_DATA.freelancer.password);
            await page.click('[data-testid="login-submit"]');
            
            // Ir a perfil
            await page.click('[data-testid="profile-menu"]');
            await page.click('[data-testid="edit-profile"]');
            
            // Actualizar información profesional
            await page.fill('#bio', 'Diseñadora gráfica especializada en identidad corporativa argentina');
            await page.fill('#hourlyRate', '2500');
            await page.selectOption('#experienceLevel', 'intermediate');
            
            await page.fill('#skills', 'Diseño gráfico, Identidad corporativa, Branding argentino');
            
            // Upload portfolio (mock)
            await page.setInputFiles('#portfolioUpload', {
                name: 'portfolio.pdf',
                mimeType: 'application/pdf',
                buffer: Buffer.from('mock portfolio content')
            });
            
            await page.click('[data-testid="save-profile"]');
            
            await expect(page.locator('.success-message')).toContainText('Perfil actualizado');
        });
    });
    
    test.describe('2. ServicioLaR System - Modelo Híbrido Argentino', () => {
        
        test('should create service with argentinian packages', async ({ page }) => {
            // Login como freelancer
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/login.html`);
            await page.fill('#loginEmail', TEST_DATA.freelancer.email);
            await page.fill('#loginPassword', TEST_DATA.freelancer.password);
            await page.click('[data-testid="login-submit"]');
            
            // Crear nuevo servicio
            await page.click('[data-testid="create-service"]');
            
            // Información básica del servicio
            await page.fill('#serviceTitle', TEST_DATA.service.title);
            await page.fill('#serviceDescription', TEST_DATA.service.description);
            await page.selectOption('#serviceCategory', TEST_DATA.service.category);
            
            // Configurar paquetes argentinos
            await page.check('#enablePackages');
            
            // Paquete Básico
            await page.fill('#basicName', 'Logo Simple');
            await page.fill('#basicPrice', '15000');
            await page.fill('#basicDelivery', '3');
            await page.fill('#basicRevisions', '2');
            await page.fill('#basicDescription', 'Logo básico con 2 propuestas');
            
            // Paquete Completo
            await page.fill('#completeName', 'Logo + Manual de Marca');
            await page.fill('#completePrice', '35000');
            await page.fill('#completeDelivery', '7');
            await page.fill('#completeRevisions', '5');
            await page.check('#completeVideollamada');
            await page.fill('#completeDescription', 'Logo + manual básico de marca');
            
            // Paquete Premium
            await page.fill('#premiumName', 'Identidad Completa');
            await page.fill('#premiumPrice', '75000');
            await page.fill('#premiumDelivery', '14');
            await page.fill('#premiumRevisions', '10');
            await page.check('#premiumVideollamada');
            await page.check('#premiumCuotas');
            await page.fill('#premiumDescription', 'Identidad corporativa completa con aplicaciones');
            
            // Features argentinos
            await page.check('#acepta_pesos');
            await page.check('#videollamada_available');
            await page.check('#cuotas_disponibles');
            
            await page.click('[data-testid="publish-service"]');
            
            await expect(page.locator('.success-message')).toContainText('Servicio publicado exitosamente');
        });
        
        test('should search services with argentinian filters', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/marketplace.html`);
            
            // Aplicar filtros argentinos
            await page.check('#filtro-monotributo');
            await page.check('#filtro-videollamada');
            await page.check('#filtro-cuotas');
            await page.selectOption('#filtro-ubicacion', 'Buenos Aires');
            await page.fill('#filtro-precio-max', '50000');
            
            await page.click('[data-testid="apply-filters"]');
            
            // Verificar resultados filtrados
            await expect(page.locator('.service-card')).toHaveCount({ min: 1 });
            await expect(page.locator('.trust-badge')).toBeVisible();
            await expect(page.locator('.feature-tag.argentina')).toBeVisible();
        });
        
        test('should select package and show MercadoPago options', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/marketplace.html`);
            
            // Hacer clic en primera service card
            await page.click('.service-card:first-child');
            
            // Seleccionar paquete completo
            await page.click('[data-package-type="completo"]');
            
            // Verificar que se muestran las opciones de pago
            await expect(page.locator('.package-actions')).toBeVisible();
            await expect(page.locator('.btn-comprar')).toContainText('Comprar AR$');
            await expect(page.locator('.payment-options')).toContainText('MercadoPago');
            await expect(page.locator('.payment-options')).toContainText('Cuotas disponibles');
            
            // Hacer clic en comprar
            await page.click('.btn-comprar');
            
            // Verificar redirección a checkout
            await expect(page).toHaveURL(/.*checkout/);
        });
    });
    
    test.describe('3. Sistema de Proyectos Enterprise', () => {
        
        test('should create project and receive proposals', async ({ page }) => {
            // Login como cliente
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/login.html`);
            await page.fill('#loginEmail', TEST_DATA.client.email);
            await page.fill('#loginPassword', TEST_DATA.client.password);
            await page.click('[data-testid="login-submit"]');
            
            // Crear nuevo proyecto
            await page.click('[data-testid="create-project"]');
            
            await page.fill('#projectTitle', TEST_DATA.project.title);
            await page.fill('#projectDescription', TEST_DATA.project.description);
            await page.fill('#projectBudget', TEST_DATA.project.budget.toString());
            await page.fill('#projectDeadline', TEST_DATA.project.deadline);
            await page.selectOption('#projectCategory', 'diseño-grafico');
            
            await page.selectOption('#currency', 'ARS');
            await page.selectOption('#location', 'Argentina');
            await page.check('#require_argentina_freelancer');
            
            await page.click('[data-testid="publish-project"]');
            
            await expect(page.locator('.success-message')).toContainText('Proyecto publicado');
        });
        
        test('should manage project milestones and payments', async ({ page }) => {
            // Login y navegar a proyecto existente
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/projects.html`);
            await page.click('.project-card:first-child');
            
            // Crear milestone
            await page.click('[data-testid="add-milestone"]');
            await page.fill('#milestoneName', 'Diseño inicial');
            await page.fill('#milestoneAmount', '10000');
            await page.fill('#milestoneDescription', 'Primera propuesta de diseño');
            await page.click('[data-testid="create-milestone"]');
            
            // Aprobar milestone
            await page.click('[data-testid="approve-milestone"]');
            
            // Verificar estado actualizado
            await expect(page.locator('.milestone-status')).toContainText('Aprobado');
        });
    });
    
    test.describe('4. Sistema de Pagos MercadoPago', () => {
        
        test('should process payment with MercadoPago cuotas', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/checkout.html`);
            
            // Seleccionar método de pago
            await page.click('#mercadopago-option');
            
            // Seleccionar cuotas
            await page.selectOption('#installments', '6'); // 6 cuotas sin interés
            
            // Completar datos de tarjeta (mock)
            await page.fill('#cardNumber', '4509953566233704'); // Visa test
            await page.fill('#cardName', TEST_DATA.client.firstName + ' ' + TEST_DATA.client.lastName);
            await page.fill('#cardExpiry', '12/25');
            await page.fill('#cardCvc', '123');
            
            await page.fill('#billingCuit', TEST_DATA.client.cuit);
            await page.selectOption('#invoiceType', 'consumidor_final');
            
            await page.click('[data-testid="process-payment"]');
            
            // Verificar procesamiento
            await expect(page.locator('.payment-processing')).toBeVisible();
            
            // Simular respuesta exitosa de MercadoPago
            await page.waitForSelector('.payment-success', { timeout: 10000 });
            await expect(page.locator('.payment-success')).toContainText('Pago procesado exitosamente');
        });
        
        test('should handle escrow release', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/payments.html`);
            
            // Ver pago en escrow
            await page.click('.escrow-payment:first-child');
            
            // Liberar pago
            await page.click('[data-testid="release-payment"]');
            await page.fill('#releaseNotes', 'Trabajo completado satisfactoriamente');
            await page.click('[data-testid="confirm-release"]');
            
            await expect(page.locator('.success-message')).toContainText('Pago liberado');
        });
    });
    
    test.describe('5. Sistema de Reviews & Reputación', () => {
        
        test('should leave review with anti-fraud validation', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/projects.html`);
            await page.click('.completed-project:first-child');
            
            // Dejar review
            await page.click('[data-testid="leave-review"]');
            
            // Rating multidimensional
            await page.click('[data-rating="communication"][data-stars="5"]');
            await page.click('[data-rating="quality"][data-stars="5"]');
            await page.click('[data-rating="delivery"][data-stars="4"]');
            await page.click('[data-rating="value"][data-stars="5"]');
            
            await page.fill('#reviewText', 'Excelente trabajo, muy profesional y cumplió con los tiempos. Recomendado para proyectos de diseño en Argentina.');
            await page.check('#recommendFreelancer');
            
            await page.click('[data-testid="submit-review"]');
            
            // Verificar validación anti-fraude
            await expect(page.locator('.review-pending')).toContainText('Review en moderación');
        });
        
        test('should display trust badges and reputation', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/freelancer/maria_diseñadora`);
            
            // Verificar badges argentinos
            await expect(page.locator('.trust-badge')).toBeVisible();
            await expect(page.locator('.badge-monotributo')).toBeVisible();
            await expect(page.locator('.badge-talento-argentino')).toBeVisible();
            
            // Verificar métricas de reputación
            await expect(page.locator('.reputation-score')).toBeVisible();
            await expect(page.locator('.completed-projects')).toBeVisible();
            await expect(page.locator('.client-satisfaction')).toBeVisible();
        });
    });
    
    test.describe('6. Chat & Notificaciones Real-time', () => {
        
        test('should send and receive messages in real-time', async ({ page, context }) => {
            // Abrir dos pestañas (freelancer y cliente)
            const freelancerPage = page;
            const clientPage = await context.newPage();
            
            // Login freelancer
            await freelancerPage.goto(`${ARGENTINA_CONFIG.baseUrl}/login.html`);
            await freelancerPage.fill('#loginEmail', TEST_DATA.freelancer.email);
            await freelancerPage.fill('#loginPassword', TEST_DATA.freelancer.password);
            await freelancerPage.click('[data-testid="login-submit"]');
            
            // Login cliente
            await clientPage.goto(`${ARGENTINA_CONFIG.baseUrl}/login.html`);
            await clientPage.fill('#loginEmail', TEST_DATA.client.email);
            await clientPage.fill('#loginPassword', TEST_DATA.client.password);
            await clientPage.click('[data-testid="login-submit"]');
            
            // Abrir chat desde cliente
            await clientPage.goto(`${ARGENTINA_CONFIG.baseUrl}/chat.html`);
            await clientPage.click(`[data-user="${TEST_DATA.freelancer.username}"]`);
            
            // Enviar mensaje
            await clientPage.fill('#messageInput', 'Hola María, me interesa tu servicio de diseño de logos');
            await clientPage.click('[data-testid="send-message"]');
            
            // Verificar recepción en tiempo real en freelancer
            await freelancerPage.goto(`${ARGENTINA_CONFIG.baseUrl}/chat.html`);
            await expect(freelancerPage.locator('.chat-message:last-child')).toContainText('me interesa tu servicio');
            
            // Responder desde freelancer
            await freelancerPage.fill('#messageInput', 'Hola Carlos! Perfecto, contame más detalles del proyecto');
            await freelancerPage.click('[data-testid="send-message"]');
            
            // Verificar recepción en cliente
            await expect(clientPage.locator('.chat-message:last-child')).toContainText('contame más detalles');
        });
        
        test('should receive push notifications', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/notifications.html`);
            
            // Verificar notificaciones existentes
            await expect(page.locator('.notification-item')).toHaveCount({ min: 1 });
            
            // Marcar como leída
            await page.click('.notification-item:first-child [data-testid="mark-read"]');
            
            // Verificar estado actualizado
            await expect(page.locator('.notification-item:first-child')).toHaveClass(/read/);
        });
    });
    
    test.describe('7. Mi Red System - Relaciones a Largo Plazo', () => {
        
        test('should add freelancer to Mi Red', async ({ page }) => {
            // Login como cliente
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/login.html`);
            await page.fill('#loginEmail', TEST_DATA.client.email);
            await page.fill('#loginPassword', TEST_DATA.client.password);
            await page.click('[data-testid="login-submit"]');
            
            // Ir a perfil de freelancer
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/freelancer/maria_diseñadora`);
            
            // Agregar a Mi Red
            await page.click('[data-testid="add-to-mi-red"]');
            await page.selectOption('#connection-type', 'trusted');
            await page.fill('#connection-notes', 'Excelente diseñadora, trabajo de calidad');
            await page.click('[data-testid="confirm-add-mi-red"]');
            
            await expect(page.locator('.success-message')).toContainText('Agregado a Mi Red');
        });
        
        test('should schedule videollamada with argentinian timezone', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/videollamadas.html`);
            
            // Programar videollamada
            await page.click('[data-testid="schedule-call"]');
            await page.selectOption('#call-participant', 'maria_diseñadora');
            await page.selectOption('#call-type', 'consultation');
            
            await page.fill('#call-date', '2025-07-25');
            await page.selectOption('#call-time', '14:30');
            await page.fill('#call-agenda', 'Discutir detalles del nuevo proyecto de branding');
            
            await page.check('#call-recording');
            await page.check('#call-transcription');
            
            await page.click('[data-testid="schedule-videollamada"]');
            
            // Verificar programación exitosa
            await expect(page.locator('.success-message')).toContainText('Videollamada programada');
            await expect(page.locator('.timezone-info')).toContainText('Argentina');
        });
    });
    
    test.describe('8. Security & Performance Tests', () => {
        
        test('should validate CSRF protection', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/login.html`);
            
            // Verificar que existe CSRF token
            const csrfToken = await page.locator('meta[name="csrf-token"]').getAttribute('content');
            expect(csrfToken).toBeTruthy();
            
            // Intentar request sin CSRF token (debe fallar)
            const response = await page.request.post('/api/PaymentController.php', {
                data: { action: 'create_payment', amount: 1000 }
            });
            expect(response.status()).toBe(403);
        });
        
        test('should validate XSS protection', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/marketplace.html`);
            
            // Intentar XSS en búsqueda
            await page.fill('#search-input', '<script>alert("xss")</script>');
            await page.click('[data-testid="search-btn"]');
            
            // Verificar que el script no se ejecuta
            const alertDialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
            const dialog = await alertDialogPromise;
            expect(dialog).toBeNull();
        });
        
        test('should test page load performance', async ({ page }) => {
            const startTime = Date.now();
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/marketplace.html`);
            await page.waitForLoadState('networkidle');
            const loadTime = Date.now() - startTime;
            
            // Verificar que la página carga en menos de 3 segundos
            expect(loadTime).toBeLessThan(3000);
            
            // Verificar métricas de performance
            const performanceMetrics = await page.evaluate(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                return {
                    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    firstPaint: performance.getEntriesByType('paint')[0]?.startTime
                };
            });
            
            expect(performanceMetrics.loadTime).toBeLessThan(1000);
        });
    });
    
    test.describe('9. Argentina Compliance Tests', () => {
        
        test('should validate CUIT argentino format', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/register.html`);
            
            // CUIT inválido
            await page.fill('#cuit', '11-11111111-1');
            await page.blur('#cuit');
            await expect(page.locator('.cuit-error')).toContainText('CUIT inválido');
            
            // CUIT válido
            await page.fill('#cuit', '20-12345678-9');
            await page.blur('#cuit');
            await expect(page.locator('.cuit-error')).not.toBeVisible();
        });
        
        test('should format currency as pesos argentinos', async ({ page }) => {
            await page.goto(`${ARGENTINA_CONFIG.baseUrl}/marketplace.html`);
            
            // Verificar formato de precio argentino
            await expect(page.locator('.price')).toContainText('AR$');
            await expect(page.locator('.price:first-child')).toContainText(/AR\$ \d{1,3}(\.\d{3})*/);
        });
        
        test('should handle MercadoPago webhook', async ({ page }) => {
            // Simular webhook de MercadoPago
            const webhookResponse = await page.request.post('/api/PaymentController.php?action=webhook', {
                data: {
                    type: 'payment',
                    data: {
                        id: '12345678'
                    }
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            expect(webhookResponse.status()).toBe(200);
        });
    });
});

// Test utilities
class ArgentinaTestUtils {
    static generateValidCUIT() {
        // Genera CUIT válido para testing
        const base = '20123456789';
        const digits = base.split('').map(Number);
        const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        
        let sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += digits[i] * multipliers[i];
        }
        
        const remainder = sum % 11;
        let checkDigit = 11 - remainder;
        
        if (checkDigit === 11) checkDigit = 0;
        if (checkDigit === 10) checkDigit = 9;
        
        return `20-12345678-${checkDigit}`;
    }
    
    static formatArgentinianPrice(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    }
    
    static getArgentinianBusinessHours() {
        return ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    }
}

// Export utilities
module.exports = { ArgentinaTestUtils, TEST_DATA, ARGENTINA_CONFIG };
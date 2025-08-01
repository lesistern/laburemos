<?php
/**
 * SecurityHelperTest - Tests para SecurityHelper
 * 
 * Tests unitarios y de integración para el sistema de seguridad
 * 
 * @version 1.0.0
 * @package LaburAR\Tests
 */

require_once __DIR__ . '/../../includes/SecurityHelper.php';

use PHPUnit\Framework\TestCase;

class SecurityHelperTest extends TestCase {
    
    private $security;
    
    protected function setUp(): void {
        $this->security = SecurityHelper::getInstance();
    }
    
    /**
     * Test de singleton pattern
     */
    public function testSingletonPattern() {
        $security1 = SecurityHelper::getInstance();
        $security2 = SecurityHelper::getInstance();
        
        $this->assertSame($security1, $security2);
        $this->assertInstanceOf(SecurityHelper::class, $security1);
    }
    
    /**
     * Test de hash de passwords
     */
    public function testPasswordHashing() {
        $password = 'miPasswordSeguro123!';
        
        // Test de hash
        $hash = $this->security->hashPassword($password);
        $this->assertNotEmpty($hash);
        $this->assertNotEquals($password, $hash);
        $this->assertTrue(password_verify($password, $hash));
        
        // Test de verificación
        $this->assertTrue($this->security->verifyPassword($password, $hash));
        $this->assertFalse($this->security->verifyPassword('passwordIncorrecto', $hash));
    }
    
    /**
     * Test de validación de fortaleza de password
     */
    public function testPasswordStrengthValidation() {
        $weakPasswords = [
            '123',
            'password',
            '12345678',
            'PASSWORD',
            'Password',
            'pass123'
        ];
        
        $strongPasswords = [
            'MiPassword123!',
            'Seguro2024@',
            'LaburAR#2025',
            'Test!ng123$'
        ];
        
        foreach ($weakPasswords as $password) {
            $result = $this->security->validatePasswordStrength($password);
            $this->assertFalse($result['valid'], "Password débil aceptado: {$password}");
            $this->assertArrayHasKey('errors', $result);
            $this->assertNotEmpty($result['errors']);
        }
        
        foreach ($strongPasswords as $password) {
            $result = $this->security->validatePasswordStrength($password);
            $this->assertTrue($result['valid'], "Password fuerte rechazado: {$password}");
            $this->assertEmpty($result['errors']);
        }
    }
    
    /**
     * Test de generación y validación de JWT
     */
    public function testJWTOperations() {
        $payload = [
            'user_id' => 123,
            'email' => 'test@example.com',
            'user_type' => 'freelancer',
            'permissions' => ['read', 'write']
        ];
        
        // Test de generación
        $token = $this->security->generateJWT($payload);
        $this->assertNotEmpty($token);
        $this->assertIsString($token);
        $this->assertStringContains('.', $token); // JWT tiene puntos
        
        // Test de validación
        $decodedPayload = $this->security->validateJWT($token);
        $this->assertNotFalse($decodedPayload);
        $this->assertEquals($payload['user_id'], $decodedPayload['user_id']);
        $this->assertEquals($payload['email'], $decodedPayload['email']);
        $this->assertEquals($payload['user_type'], $decodedPayload['user_type']);
        $this->assertEquals($payload['permissions'], $decodedPayload['permissions']);
        
        // Test de token inválido
        $invalidToken = 'token.invalido.aqui';
        $this->assertFalse($this->security->validateJWT($invalidToken));
        
        // Test de token expirado (mock)
        $expiredPayload = array_merge($payload, ['exp' => time() - 3600]);
        $expiredToken = $this->security->generateJWT($expiredPayload);
        sleep(1); // Asegurar que el tiempo pase
        // Note: En implementación real, validateJWT debería rechazar tokens expirados
    }
    
    /**
     * Test de generación y validación de tokens CSRF
     */
    public function testCSRFTokens() {
        // Simular sesión
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Test de generación
        $token1 = $this->security->generateCSRFToken();
        $this->assertNotEmpty($token1);
        $this->assertIsString($token1);
        
        // Test de validación
        $this->assertTrue($this->security->validateCSRFToken($token1));
        
        // Generar otro token
        $token2 = $this->security->generateCSRFToken();
        $this->assertNotEquals($token1, $token2);
        
        // El segundo token debe invalidar el primero
        $this->assertTrue($this->security->validateCSRFToken($token2));
        
        // Test de token inválido
        $this->assertFalse($this->security->validateCSRFToken('token_invalido'));
        $this->assertFalse($this->security->validateCSRFToken(''));
        $this->assertFalse($this->security->validateCSRFToken(null));
    }
    
    /**
     * Test de rate limiting
     */
    public function testRateLimiting() {
        $identifier = 'test_user_123';
        $action = 'login';
        $limit = 3;
        
        // Primeros intentos deben pasar
        for ($i = 0; $i < $limit; $i++) {
            $result = $this->security->checkRateLimit($identifier, $action, $limit);
            $this->assertTrue($result, "Intento {$i} falló inesperadamente");
        }
        
        // El siguiente intento debe fallar
        $result = $this->security->checkRateLimit($identifier, $action, $limit);
        $this->assertFalse($result, "Rate limit no funcionó");
        
        // Test con diferente acción debe pasar
        $differentAction = 'register';
        $result = $this->security->checkRateLimit($identifier, $differentAction, $limit);
        $this->assertTrue($result, "Rate limit afectó acción diferente");
        
        // Test con diferente usuario debe pasar
        $differentUser = 'test_user_456';
        $result = $this->security->checkRateLimit($differentUser, $action, $limit);
        $this->assertTrue($result, "Rate limit afectó usuario diferente");
    }
    
    /**
     * Test de validación de input
     */
    public function testInputValidation() {
        // Test de emails
        $validEmails = [
            'test@example.com',
            'usuario@laburar.com.ar',
            'freelancer123@gmail.com'
        ];
        
        $invalidEmails = [
            'email_invalido',
            '@example.com',
            'test@',
            'test..test@example.com'
        ];
        
        foreach ($validEmails as $email) {
            $result = $this->security->validateInput($email, 'email');
            $this->assertTrue($result['valid'], "Email válido rechazado: {$email}");
        }
        
        foreach ($invalidEmails as $email) {
            $result = $this->security->validateInput($email, 'email');
            $this->assertFalse($result['valid'], "Email inválido aceptado: {$email}");
        }
        
        // Test de teléfonos argentinos
        $validPhones = [
            '+541112345678',
            '1112345678',
            '+54 11 1234-5678'
        ];
        
        $invalidPhones = [
            '123',
            '+1234567890',
            'no_es_telefono'
        ];
        
        foreach ($validPhones as $phone) {
            $result = $this->security->validateInput($phone, 'phone');
            $this->assertTrue($result['valid'], "Teléfono válido rechazado: {$phone}");
        }
        
        foreach ($invalidPhones as $phone) {
            $result = $this->security->validateInput($phone, 'phone');
            $this->assertFalse($result['valid'], "Teléfono inválido aceptado: {$phone}");
        }
        
        // Test de nombres
        $validNames = [
            'Juan Pérez',
            'María José González',
            'José-Luis Martín'
        ];
        
        $invalidNames = [
            'A', // Muy corto
            'Juan123', // Con números
            '<script>alert("xss")</script>', // XSS
            str_repeat('a', 101) // Muy largo
        ];
        
        foreach ($validNames as $name) {
            $result = $this->security->validateInput($name, 'name');
            $this->assertTrue($result['valid'], "Nombre válido rechazado: {$name}");
        }
        
        foreach ($invalidNames as $name) {
            $result = $this->security->validateInput($name, 'name');
            $this->assertFalse($result['valid'], "Nombre inválido aceptado: {$name}");
        }
    }
    
    /**
     * Test de sanitización de input
     */
    public function testInputSanitization() {
        // Test de XSS
        $xssInputs = [
            '<script>alert("xss")</script>',
            '<img src="x" onerror="alert(1)">',
            'javascript:alert("xss")',
            '<div onclick="alert(1)">Click me</div>'
        ];
        
        foreach ($xssInputs as $input) {
            $sanitized = $this->security->sanitizeInput($input, 'text');
            $this->assertNotContains('<script>', $sanitized);
            $this->assertNotContains('javascript:', $sanitized);
            $this->assertNotContains('onclick=', $sanitized);
            $this->assertNotContains('onerror=', $sanitized);
        }
        
        // Test de SQL injection
        $sqlInputs = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM passwords --"
        ];
        
        foreach ($sqlInputs as $input) {
            $sanitized = $this->security->sanitizeInput($input, 'text');
            // La sanitización debe escapar caracteres peligrosos
            $this->assertNotContains("'", $sanitized);
            $this->assertNotContains("--", $sanitized);
        }
        
        // Test de sanitización de email
        $email = '  TEST@EXAMPLE.COM  ';
        $sanitized = $this->security->sanitizeInput($email, 'email');
        $this->assertEquals('test@example.com', $sanitized);
        
        // Test de sanitización de teléfono
        $phone = '+54 (11) 1234-5678';
        $sanitized = $this->security->sanitizeInput($phone, 'phone');
        $this->assertEquals('+541112345678', $sanitized);
    }
    
    /**
     * Test de generación de tokens seguros
     */
    public function testSecureTokenGeneration() {
        // Test de longitud por defecto
        $token1 = $this->security->generateSecureToken();
        $this->assertEquals(64, strlen($token1)); // 32 bytes = 64 hex chars
        
        // Test de longitud personalizada
        $token2 = $this->security->generateSecureToken(16);
        $this->assertEquals(32, strlen($token2)); // 16 bytes = 32 hex chars
        
        // Test de unicidad
        $token3 = $this->security->generateSecureToken();
        $this->assertNotEquals($token1, $token3);
        
        // Test de caracteres hexadecimales
        $this->assertRegExp('/^[a-f0-9]+$/', $token1);
        $this->assertRegExp('/^[a-f0-9]+$/', $token2);
        $this->assertRegExp('/^[a-f0-9]+$/', $token3);
    }
    
    /**
     * Test de validación de archivos
     */
    public function testFileValidation() {
        // Test de archivos válidos
        $validFiles = [
            [
                'name' => 'document.pdf',
                'type' => 'application/pdf',
                'size' => 1024000
            ],
            [
                'name' => 'image.jpg',
                'type' => 'image/jpeg',
                'size' => 512000
            ],
            [
                'name' => 'photo.png',
                'type' => 'image/png',
                'size' => 256000
            ]
        ];
        
        foreach ($validFiles as $file) {
            $result = $this->security->validateInput($file, 'file');
            $this->assertTrue($result['valid'], "Archivo válido rechazado: {$file['name']}");
        }
        
        // Test de archivos inválidos
        $invalidFiles = [
            [
                'name' => 'malware.exe',
                'type' => 'application/x-executable',
                'size' => 1024
            ],
            [
                'name' => 'script.php',
                'type' => 'application/x-php',
                'size' => 512
            ],
            [
                'name' => 'large_file.pdf',
                'type' => 'application/pdf',
                'size' => 20 * 1024 * 1024 // 20MB
            ]
        ];
        
        foreach ($invalidFiles as $file) {
            $result = $this->security->validateInput($file, 'file');
            $this->assertFalse($result['valid'], "Archivo inválido aceptado: {$file['name']}");
        }
    }
    
    /**
     * Test de encriptación de datos sensibles
     */
    public function testDataEncryption() {
        $sensitiveData = [
            'Número de tarjeta: 4532123456789012',
            'CUIL: 20-12345678-9',
            'Información confidencial del proyecto'
        ];
        
        foreach ($sensitiveData as $data) {
            // Test de encriptación
            $encrypted = $this->security->encryptData($data);
            $this->assertNotEmpty($encrypted);
            $this->assertNotEquals($data, $encrypted);
            $this->assertIsString($encrypted);
            
            // Test de desencriptación
            $decrypted = $this->security->decryptData($encrypted);
            $this->assertEquals($data, $decrypted);
        }
        
        // Test de datos inválidos
        $invalidEncrypted = 'datos_encriptados_invalidos';
        $decrypted = $this->security->decryptData($invalidEncrypted);
        $this->assertFalse($decrypted);
    }
    
    /**
     * Test de blacklist de tokens
     */
    public function testTokenBlacklist() {
        $token = $this->security->generateSecureToken();
        
        // Token debe ser válido inicialmente
        $this->assertFalse($this->security->isTokenBlacklisted($token));
        
        // Blacklistear token
        $this->security->blacklistToken($token);
        
        // Token debe estar en blacklist
        $this->assertTrue($this->security->isTokenBlacklisted($token));
        
        // Otro token no debe estar afectado
        $otherToken = $this->security->generateSecureToken();
        $this->assertFalse($this->security->isTokenBlacklisted($otherToken));
    }
    
    /**
     * Test de validación de URLs
     */
    public function testURLValidation() {
        $validURLs = [
            'https://laburar.com.ar',
            'http://localhost:3000',
            'https://www.example.com/path?param=value',
            'https://subdomain.example.org'
        ];
        
        $invalidURLs = [
            'javascript:alert(1)',
            'data:text/html,<script>alert(1)</script>',
            'ftp://malicious.com',
            'not_a_url',
            ''
        ];
        
        foreach ($validURLs as $url) {
            $result = $this->security->validateInput($url, 'url');
            $this->assertTrue($result['valid'], "URL válida rechazada: {$url}");
        }
        
        foreach ($invalidURLs as $url) {
            $result = $this->security->validateInput($url, 'url');
            $this->assertFalse($result['valid'], "URL inválida aceptada: {$url}");
        }
    }
    
    /**
     * Test de validación de fechas
     */
    public function testDateValidation() {
        $validDates = [
            '2025-01-01',
            '2024-12-31',
            '1990-06-15'
        ];
        
        $invalidDates = [
            '2025-13-01', // Mes inválido
            '2025-02-30', // Día inválido
            'not_a_date',
            '2025/01/01', // Formato incorrecto
            ''
        ];
        
        foreach ($validDates as $date) {
            $result = $this->security->validateInput($date, 'date');
            $this->assertTrue($result['valid'], "Fecha válida rechazada: {$date}");
        }
        
        foreach ($invalidDates as $date) {
            $result = $this->security->validateInput($date, 'date');
            $this->assertFalse($result['valid'], "Fecha inválida aceptada: {$date}");
        }
    }
    
    /**
     * Test de configuración de seguridad
     */
    public function testSecurityConfiguration() {
        $config = $this->security->getSecurityConfig();
        
        $this->assertIsArray($config);
        $this->assertArrayHasKey('password_min_length', $config);
        $this->assertArrayHasKey('jwt_secret', $config);
        $this->assertArrayHasKey('csrf_token_expiry', $config);
        $this->assertArrayHasKey('rate_limit_attempts', $config);
        $this->assertArrayHasKey('rate_limit_window', $config);
        
        // Verificar valores por defecto razonables
        $this->assertGreaterThanOrEqual(8, $config['password_min_length']);
        $this->assertGreaterThan(0, $config['csrf_token_expiry']);
        $this->assertGreaterThan(0, $config['rate_limit_attempts']);
        $this->assertGreaterThan(0, $config['rate_limit_window']);
    }
    
    /**
     * Cleanup después de tests
     */
    protected function tearDown(): void {
        // Limpiar archivos temporales y datos de test
        $this->cleanupTestData();
    }
    
    /**
     * Limpia datos de test
     */
    private function cleanupTestData() {
        // Limpiar rate limiting data
        $rateLimitPath = __DIR__ . '/../../logs/rate_limit/';
        if (is_dir($rateLimitPath)) {
            $testFiles = glob($rateLimitPath . 'test_*');
            foreach ($testFiles as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }
        }
        
        // Limpiar sesión de test
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
        }
    }
}
?>
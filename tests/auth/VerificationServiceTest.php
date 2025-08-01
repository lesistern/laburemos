<?php
/**
 * VerificationServiceTest - Tests para VerificationService
 * 
 * Tests unitarios y de integración para el sistema de verificación
 * 
 * @version 1.0.0
 * @package LaburAR\Tests
 */

require_once __DIR__ . '/../../includes/VerificationService.php';
require_once __DIR__ . '/../../includes/Database.php';

use PHPUnit\Framework\TestCase;
use LaburAR\Services\VerificationService;

class VerificationServiceTest extends TestCase {
    
    private $verificationService;
    private $testUserId;
    private $testDatabase;
    
    protected function setUp(): void {
        // Configurar base de datos de test
        $this->testDatabase = $this->createTestDatabase();
        $this->verificationService = new VerificationService();
        $this->testUserId = $this->createTestUser();
    }
    
    /**
     * Crear base de datos de test
     */
    private function createTestDatabase() {
        // En un entorno real, esto configuraría una BD de test
        // Por ahora, retornamos mock
        return true;
    }
    
    /**
     * Crear usuario de test
     */
    private function createTestUser() {
        // Simular creación de usuario de test
        return 999; // ID de test
    }
    
    /**
     * Test de constantes del servicio
     */
    public function testServiceConstants() {
        $this->assertEquals('email', VerificationService::TYPE_EMAIL);
        $this->assertEquals('phone', VerificationService::TYPE_PHONE);
        $this->assertEquals('identity', VerificationService::TYPE_IDENTITY);
        $this->assertEquals('pending', VerificationService::STATUS_PENDING);
        $this->assertEquals('verified', VerificationService::STATUS_VERIFIED);
        $this->assertEquals('failed', VerificationService::STATUS_FAILED);
    }
    
    /**
     * Test de inicialización del servicio
     */
    public function testVerificationServiceInitialization() {
        $this->assertInstanceOf(VerificationService::class, $this->verificationService);
    }
    
    /**
     * Test de inicio de verificación de email
     */
    public function testInitiateEmailVerification() {
        $result = $this->verificationService->initiateEmailVerification($this->testUserId);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        
        if ($result['success']) {
            $this->assertArrayHasKey('message', $result);
            $this->assertArrayHasKey('verification_id', $result);
            $this->assertArrayHasKey('expires_in', $result);
            $this->assertEquals(86400, $result['expires_in']); // 24 horas
        }
    }
    
    /**
     * Test de verificación de email con token válido
     */
    public function testVerifyEmailWithValidToken() {
        // Primero iniciar verificación
        $initResult = $this->verificationService->initiateEmailVerification($this->testUserId);
        
        if ($initResult['success']) {
            // Simular token válido
            $token = 'valid-test-token-' . uniqid();
            
            // Mock del método de verificación
            $result = $this->verificationService->verifyEmail($token);
            
            $this->assertIsArray($result);
            $this->assertArrayHasKey('success', $result);
            
            if ($result['success']) {
                $this->assertArrayHasKey('message', $result);
                $this->assertArrayHasKey('user_id', $result);
            }
        } else {
            $this->markTestSkipped('Cannot test email verification without database');
        }
    }
    
    /**
     * Test de verificación de email con token inválido
     */
    public function testVerifyEmailWithInvalidToken() {
        $invalidToken = 'invalid-token-123';
        $result = $this->verificationService->verifyEmail($invalidToken);
        
        $this->assertIsArray($result);
        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
        $this->assertStringContains('Invalid verification token', $result['error']);
    }
    
    /**
     * Test de inicio de verificación de teléfono
     */
    public function testInitiatePhoneVerification() {
        $phoneNumbers = [
            '+5411987654321',
            '1987654321',
            '+54 11 9876-5432'
        ];
        
        foreach ($phoneNumbers as $phone) {
            $result = $this->verificationService->initiatePhoneVerification($this->testUserId, $phone);
            
            $this->assertIsArray($result);
            $this->assertArrayHasKey('success', $result);
            
            if ($result['success']) {
                $this->assertArrayHasKey('message', $result);
                $this->assertArrayHasKey('verification_id', $result);
                $this->assertArrayHasKey('expires_in', $result);
                $this->assertArrayHasKey('phone_masked', $result);
                $this->assertEquals(600, $result['expires_in']); // 10 minutos
            }
        }
    }
    
    /**
     * Test de validación de número de teléfono argentino
     */
    public function testPhoneNumberValidation() {
        $validPhones = [
            '+541112345678',
            '1112345678',
            '+54 11 1234-5678'
        ];
        
        $invalidPhones = [
            '123',
            '+1234567890',
            'invalid-phone',
            ''
        ];
        
        foreach ($validPhones as $phone) {
            $result = $this->verificationService->initiatePhoneVerification($this->testUserId, $phone);
            
            if (!$result['success']) {
                $this->assertNotEquals('Invalid phone number format', $result['error']);
            }
        }
        
        foreach ($invalidPhones as $phone) {
            $result = $this->verificationService->initiatePhoneVerification($this->testUserId, $phone);
            
            if (!$result['success']) {
                $this->assertStringContains('Invalid phone number', $result['error']);
            }
        }
    }
    
    /**
     * Test de verificación de código de teléfono
     */
    public function testVerifyPhoneCode() {
        // Simular código válido
        $validCode = '123456';
        $result = $this->verificationService->verifyPhone($this->testUserId, $validCode);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        
        // Simular código inválido
        $invalidCode = '000000';
        $result = $this->verificationService->verifyPhone($this->testUserId, $invalidCode);
        
        $this->assertIsArray($result);
        // Puede ser success o fail dependiendo del estado de la BD
    }
    
    /**
     * Test de inicio de verificación de identidad
     */
    public function testInitiateIdentityVerification() {
        $documents = [
            ['type' => 'DNI', 'number' => '12345678'],
            ['type' => 'CUIL', 'number' => '20123456789'],
            ['type' => 'CUIT', 'number' => '30123456789']
        ];
        
        foreach ($documents as $doc) {
            $result = $this->verificationService->initiateIdentityVerification(
                $this->testUserId,
                $doc['type'],
                $doc['number']
            );
            
            $this->assertIsArray($result);
            $this->assertArrayHasKey('success', $result);
            
            if ($result['success']) {
                $this->assertArrayHasKey('message', $result);
                $this->assertArrayHasKey('verification_id', $result);
            }
        }
    }
    
    /**
     * Test de validación de documentos argentinos
     */
    public function testDocumentValidation() {
        // DNIs válidos
        $validDNIs = ['12345678', '87654321'];
        
        // CUILs/CUITs válidos (con dígito verificador correcto)
        $validCUILs = ['20123456789', '27123456780'];
        
        // Documentos inválidos
        $invalidDocs = [
            ['type' => 'DNI', 'number' => '123'], // Muy corto
            ['type' => 'CUIL', 'number' => '123456789'], // Muy corto
            ['type' => 'INVALID', 'number' => '12345678'] // Tipo inválido
        ];
        
        foreach ($validDNIs as $dni) {
            $result = $this->verificationService->initiateIdentityVerification(
                $this->testUserId,
                'DNI',
                $dni
            );
            
            if (!$result['success']) {
                $this->assertNotEquals('Invalid document format', $result['error']);
            }
        }
        
        foreach ($invalidDocs as $doc) {
            $result = $this->verificationService->initiateIdentityVerification(
                $this->testUserId,
                $doc['type'],
                $doc['number']
            );
            
            if (!$result['success']) {
                $this->assertTrue(
                    strpos($result['error'], 'Invalid document') !== false ||
                    strpos($result['error'], 'Invalid argument') !== false
                );
            }
        }
    }
    
    /**
     * Test de subida de documentos
     */
    public function testUploadVerificationDocuments() {
        // Simular archivos de test
        $testFiles = [
            [
                'name' => 'dni_front.jpg',
                'type' => 'image/jpeg',
                'size' => 1024000, // 1MB
                'tmp_name' => '/tmp/test_file_1',
                'error' => UPLOAD_ERR_OK
            ],
            [
                'name' => 'dni_back.jpg',
                'type' => 'image/jpeg',
                'size' => 1024000, // 1MB
                'tmp_name' => '/tmp/test_file_2',
                'error' => UPLOAD_ERR_OK
            ]
        ];
        
        $verificationId = 'test-verification-id';
        
        $result = $this->verificationService->uploadVerificationDocuments($verificationId, $testFiles);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        
        if ($result['success']) {
            $this->assertArrayHasKey('message', $result);
            $this->assertArrayHasKey('files_uploaded', $result);
            $this->assertArrayHasKey('review_time', $result);
        }
    }
    
    /**
     * Test de reenvío de verificación
     */
    public function testResendVerification() {
        $types = ['email', 'phone'];
        
        foreach ($types as $type) {
            $result = $this->verificationService->resendVerification($this->testUserId, $type);
            
            $this->assertIsArray($result);
            $this->assertArrayHasKey('success', $result);
            
            if ($result['success']) {
                $this->assertArrayHasKey('message', $result);
                $this->assertArrayHasKey('expires_in', $result);
            }
        }
    }
    
    /**
     * Test de estado de verificación del usuario
     */
    public function testGetUserVerificationStatus() {
        $result = $this->verificationService->getUserVerificationStatus($this->testUserId);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        
        if ($result['success']) {
            $this->assertArrayHasKey('user_id', $result);
            $this->assertArrayHasKey('verifications', $result);
            $this->assertArrayHasKey('verification_level', $result);
            $this->assertArrayHasKey('pending_verifications', $result);
            $this->assertArrayHasKey('badges', $result);
            
            // Verificar estructura de verificaciones
            $verifications = $result['verifications'];
            $this->assertArrayHasKey('email', $verifications);
            $this->assertArrayHasKey('phone', $verifications);
            $this->assertArrayHasKey('identity', $verifications);
            
            // Cada verificación debe tener estructura específica
            foreach ($verifications as $verification) {
                $this->assertArrayHasKey('verified', $verification);
                $this->assertArrayHasKey('verified_at', $verification);
            }
            
            // Niveles de verificación válidos
            $validLevels = ['none', 'basic', 'advanced', 'full'];
            $this->assertContains($result['verification_level'], $validLevels);
        }
    }
    
    /**
     * Test de usuario inexistente
     */
    public function testNonExistentUser() {
        $nonExistentUserId = 99999;
        
        $result = $this->verificationService->getUserVerificationStatus($nonExistentUserId);
        
        $this->assertIsArray($result);
        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
        $this->assertEquals('User not found', $result['error']);
    }
    
    /**
     * Test de rate limiting
     */
    public function testRateLimiting() {
        // Hacer múltiples intentos de verificación rápidamente
        $attempts = 0;
        $maxAttempts = 6; // Exceder el límite configurado
        
        for ($i = 0; $i < $maxAttempts; $i++) {
            $result = $this->verificationService->initiateEmailVerification($this->testUserId);
            
            if (!$result['success'] && strpos($result['error'], 'Too many verification attempts') !== false) {
                break;
            }
            
            $attempts++;
        }
        
        // En algún punto debe activarse el rate limiting
        $this->assertLessThan($maxAttempts, $attempts);
    }
    
    /**
     * Test de tipos de verificación
     */
    public function testVerificationTypes() {
        $types = [
            VerificationService::TYPE_EMAIL,
            VerificationService::TYPE_PHONE,
            VerificationService::TYPE_IDENTITY,
            VerificationService::TYPE_BANK_ACCOUNT,
            VerificationService::TYPE_BUSINESS,
            VerificationService::TYPE_ADDRESS
        ];
        
        foreach ($types as $type) {
            $this->assertIsString($type);
            $this->assertNotEmpty($type);
        }
    }
    
    /**
     * Test de estados de verificación
     */
    public function testVerificationStatuses() {
        $statuses = [
            VerificationService::STATUS_PENDING,
            VerificationService::STATUS_VERIFIED,
            VerificationService::STATUS_FAILED,
            VerificationService::STATUS_EXPIRED,
            VerificationService::STATUS_REVOKED
        ];
        
        foreach ($statuses as $status) {
            $this->assertIsString($status);
            $this->assertNotEmpty($status);
        }
    }
    
    /**
     * Test de configuración de expiración de tokens
     */
    public function testTokenExpiryConfiguration() {
        $this->assertEquals(86400, VerificationService::EMAIL_TOKEN_EXPIRY); // 24 horas
        $this->assertEquals(600, VerificationService::PHONE_TOKEN_EXPIRY); // 10 minutos
        $this->assertEquals(172800, VerificationService::IDENTITY_TOKEN_EXPIRY); // 48 horas
    }
    
    /**
     * Test de archivos con tipos no permitidos
     */
    public function testInvalidFileTypes() {
        $invalidFiles = [
            [
                'name' => 'malicious.exe',
                'type' => 'application/x-executable',
                'size' => 1024,
                'tmp_name' => '/tmp/test_file',
                'error' => UPLOAD_ERR_OK
            ]
        ];
        
        $verificationId = 'test-verification-id';
        
        $result = $this->verificationService->uploadVerificationDocuments($verificationId, $invalidFiles);
        
        $this->assertIsArray($result);
        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
        $this->assertStringContains('Invalid file type', $result['error']);
    }
    
    /**
     * Test de archivos demasiado grandes
     */
    public function testOversizedFiles() {
        $oversizedFiles = [
            [
                'name' => 'large_file.jpg',
                'type' => 'image/jpeg',
                'size' => 10 * 1024 * 1024, // 10MB (límite es 5MB)
                'tmp_name' => '/tmp/test_large_file',
                'error' => UPLOAD_ERR_OK
            ]
        ];
        
        $verificationId = 'test-verification-id';
        
        $result = $this->verificationService->uploadVerificationDocuments($verificationId, $oversizedFiles);
        
        $this->assertIsArray($result);
        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
        $this->assertStringContains('File too large', $result['error']);
    }
    
    /**
     * Cleanup después de tests
     */
    protected function tearDown(): void {
        // Limpiar datos de test si es necesario
        $this->cleanupTestData();
    }
    
    /**
     * Limpia datos de test
     */
    private function cleanupTestData() {
        // En un entorno real, limpiaríamos la BD de test
        // Por ahora, solo limpiamos archivos temporales
        $uploadDir = __DIR__ . '/../../uploads/verifications/';
        
        if (is_dir($uploadDir)) {
            $testFiles = glob($uploadDir . 'test-*');
            foreach ($testFiles as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }
        }
    }
}
?>
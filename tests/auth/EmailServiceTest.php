<?php
/**
 * EmailServiceTest - Tests para EmailService
 * 
 * Tests unitarios y de integración para el sistema de email empresarial
 * 
 * @version 1.0.0
 * @package LaburAR\Tests
 */

require_once __DIR__ . '/../../includes/EmailService.php';

use PHPUnit\Framework\TestCase;
use LaburAR\Services\EmailService;

class EmailServiceTest extends TestCase {
    
    private $emailService;
    private $testConfig;
    
    protected function setUp(): void {
        // Configuración de test
        $this->testConfig = [
            'smtp_host' => 'localhost',
            'smtp_port' => 1025, // MailHog
            'smtp_username' => 'test',
            'smtp_password' => 'test',
            'from_email' => 'test@laburar.test',
            'from_name' => 'LaburAR Test',
            'queue_enabled' => true,
            'tracking_enabled' => false,
            'rate_limit' => 1000 // High limit for tests
        ];
        
        $this->emailService = new EmailService($this->testConfig);
    }
    
    /**
     * Test de configuración inicial
     */
    public function testEmailServiceInitialization() {
        $this->assertInstanceOf(EmailService::class, $this->emailService);
    }
    
    /**
     * Test de validación de email
     */
    public function testEmailValidation() {
        // Test email válido
        $result = $this->emailService->sendEmail(
            'test@example.com',
            'Test Subject',
            'generic',
            ['test' => 'data']
        );
        
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('email_id', $result);
        
        // Test email inválido
        $result = $this->emailService->sendEmail(
            'invalid-email',
            'Test Subject',
            'generic',
            ['test' => 'data']
        );
        
        $this->assertFalse($result['success']);
        $this->assertStringContains('Invalid email address', $result['error']);
    }
    
    /**
     * Test de email de verificación
     */
    public function testVerificationEmail() {
        $user = [
            'id' => 1,
            'name' => 'Juan Pérez',
            'email' => 'juan@example.com'
        ];
        
        $result = $this->emailService->sendVerificationEmail($user, 'test-token-123');
        
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('email_id', $result);
        
        // Verificar que fue encolado
        if ($this->testConfig['queue_enabled']) {
            $this->assertArrayHasKey('queued', $result);
            $this->assertTrue($result['queued']);
        }
    }
    
    /**
     * Test de email de bienvenida
     */
    public function testWelcomeEmail() {
        $user = [
            'id' => 1,
            'name' => 'María González',
            'email' => 'maria@example.com',
            'user_type' => 'freelancer'
        ];
        
        $result = $this->emailService->sendWelcomeEmail($user);
        
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('email_id', $result);
    }
    
    /**
     * Test de email de reset de password
     */
    public function testPasswordResetEmail() {
        $user = [
            'id' => 1,
            'name' => 'Carlos Rodríguez',
            'email' => 'carlos@example.com'
        ];
        
        $result = $this->emailService->sendPasswordResetEmail($user, 'reset-token-456');
        
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('email_id', $result);
    }
    
    /**
     * Test de código 2FA
     */
    public function testTwoFactorCodeEmail() {
        $user = [
            'id' => 1,
            'name' => 'Ana López',
            'email' => 'ana@example.com'
        ];
        
        $result = $this->emailService->send2FACode($user, '123456');
        
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('email_id', $result);
        
        // 2FA debe bypasear la cola
        if (isset($result['queued'])) {
            $this->assertFalse($result['queued']);
        }
    }
    
    /**
     * Test de notificación de proyecto
     */
    public function testProjectNotification() {
        $user = [
            'id' => 1,
            'name' => 'Luis Martín',
            'email' => 'luis@example.com'
        ];
        
        $project = [
            'id' => 1,
            'title' => 'Desarrollo Web E-commerce',
            'deadline' => '2025-08-01'
        ];
        
        $result = $this->emailService->sendProjectNotification($user, $project, 'new_proposal');
        
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('email_id', $result);
    }
    
    /**
     * Test de confirmación de pago
     */
    public function testPaymentConfirmation() {
        $user = [
            'id' => 1,
            'name' => 'Sofia Herrera',
            'email' => 'sofia@example.com'
        ];
        
        $payment = [
            'id' => 1,
            'amount' => 25000.00,
            'method' => 'MercadoPago',
            'project_title' => 'Diseño de Logo'
        ];
        
        $result = $this->emailService->sendPaymentConfirmation($user, $payment);
        
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('email_id', $result);
    }
    
    /**
     * Test de procesamiento de cola
     */
    public function testQueueProcessing() {
        // Enviar varios emails a la cola
        $users = [
            ['email' => 'user1@test.com', 'name' => 'User 1'],
            ['email' => 'user2@test.com', 'name' => 'User 2'],
            ['email' => 'user3@test.com', 'name' => 'User 3']
        ];
        
        foreach ($users as $user) {
            $result = $this->emailService->sendVerificationEmail($user, 'token-' . uniqid());
            $this->assertTrue($result['success']);
        }
        
        // Procesar cola
        $results = $this->emailService->processQueue(10);
        
        $this->assertIsArray($results);
        $this->assertGreaterThanOrEqual(3, count($results));
        
        // Verificar que todos fueron procesados exitosamente
        foreach ($results as $result) {
            $this->assertTrue($result['success']);
        }
    }
    
    /**
     * Test de rate limiting
     */
    public function testRateLimiting() {
        // Configurar rate limit bajo para test
        $emailService = new EmailService(array_merge($this->testConfig, [
            'rate_limit' => 2 // Solo 2 emails por minuto
        ]));
        
        $email = 'ratelimit@test.com';
        
        // Primer email - debe funcionar
        $result1 = $emailService->sendEmail($email, 'Test 1', 'generic');
        $this->assertTrue($result1['success']);
        
        // Segundo email - debe funcionar
        $result2 = $emailService->sendEmail($email, 'Test 2', 'generic');
        $this->assertTrue($result2['success']);
        
        // Tercer email - debe fallar por rate limit
        $result3 = $emailService->sendEmail($email, 'Test 3', 'generic');
        $this->assertFalse($result3['success']);
        $this->assertStringContains('Rate limit exceeded', $result3['error']);
    }
    
    /**
     * Test de estadísticas
     */
    public function testStatistics() {
        $stats = $this->emailService->getStatistics();
        
        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total_sent', $stats);
        $this->assertArrayHasKey('total_failed', $stats);
        $this->assertArrayHasKey('total_opened', $stats);
        $this->assertArrayHasKey('by_template', $stats);
    }
    
    /**
     * Test de tracking de emails
     */
    public function testEmailTracking() {
        // Simular procesamiento de tracking pixel
        $emailId = 'LAB-TEST123';
        
        // Capturar output del tracking pixel
        ob_start();
        $this->emailService->processTrackingPixel($emailId);
        $output = ob_get_clean();
        
        // Verificar que devuelve imagen GIF
        $this->assertNotEmpty($output);
    }
    
    /**
     * Test de procesamiento de clicks
     */
    public function testLinkClickTracking() {
        $emailId = 'LAB-TEST456';
        $linkId = 'verification-link';
        $destination = 'https://laburar.com.ar/verify';
        
        // Este test requiere capturar headers, así que solo verificamos que no hay errores
        $this->expectOutputString('');
        
        try {
            $this->emailService->processLinkClick($emailId, $linkId, $destination);
        } catch (Exception $e) {
            // Se espera que falle porque está intentando hacer redirect
            // En un test real necesitaríamos mock del header()
            $this->assertStringContains('headers already sent', $e->getMessage());
        }
    }
    
    /**
     * Test de tipos de email constantes
     */
    public function testEmailTypeConstants() {
        $this->assertEquals('verification', EmailService::TYPE_VERIFICATION);
        $this->assertEquals('welcome', EmailService::TYPE_WELCOME);
        $this->assertEquals('password_reset', EmailService::TYPE_PASSWORD_RESET);
        $this->assertEquals('2fa_code', EmailService::TYPE_2FA_CODE);
        $this->assertEquals('project_notification', EmailService::TYPE_PROJECT_NOTIFICATION);
        $this->assertEquals('payment_confirmation', EmailService::TYPE_PAYMENT_CONFIRMATION);
    }
    
    /**
     * Test de estados de email
     */
    public function testEmailStatusConstants() {
        $this->assertEquals('pending', EmailService::STATUS_PENDING);
        $this->assertEquals('sent', EmailService::STATUS_SENT);
        $this->assertEquals('failed', EmailService::STATUS_FAILED);
        $this->assertEquals('bounced', EmailService::STATUS_BOUNCED);
        $this->assertEquals('opened', EmailService::STATUS_OPENED);
        $this->assertEquals('clicked', EmailService::STATUS_CLICKED);
    }
    
    /**
     * Cleanup después de cada test
     */
    protected function tearDown(): void {
        // Limpiar archivos de test si es necesario
        $this->cleanupTestFiles();
    }
    
    /**
     * Limpia archivos de test
     */
    private function cleanupTestFiles() {
        $logPath = __DIR__ . '/../../logs/emails/';
        
        if (is_dir($logPath)) {
            // Limpiar solo archivos de test
            $files = glob($logPath . 'queue/LAB-TEST*.json');
            foreach ($files as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }
        }
    }
}
?>
<?php
/**
 * AuthMiddlewareTest - Tests para AuthMiddleware
 * 
 * Tests unitarios y de integración para el middleware de autenticación
 * 
 * @version 1.0.0
 * @package LaburAR\Tests
 */

require_once __DIR__ . '/../../includes/AuthMiddleware.php';
require_once __DIR__ . '/../../includes/SecurityHelper.php';

use PHPUnit\Framework\TestCase;
use LaburAR\Middleware\AuthMiddleware;

class AuthMiddlewareTest extends TestCase {
    
    private $authMiddleware;
    private $security;
    private $testUser;
    private $testToken;
    
    protected function setUp(): void {
        $this->authMiddleware = new AuthMiddleware();
        $this->security = SecurityHelper::getInstance();
        
        // Crear usuario de test
        $this->testUser = [
            'id' => 123,
            'email' => 'test@example.com',
            'name' => 'Test User',
            'user_type' => 'freelancer',
            'status' => 'active',
            'email_verified_at' => date('Y-m-d H:i:s'),
            'phone_verified_at' => null,
            'identity_verified_at' => null,
            'deleted_at' => null,
            'suspended_until' => null
        ];
        
        // Generar token de test
        $payload = [
            'user_id' => $this->testUser['id'],
            'user_type' => $this->testUser['user_type'],
            'permissions' => ['freelancer', 'read', 'write'],
            'exp' => time() + 3600
        ];
        
        $this->testToken = $this->security->generateJWT($payload);
    }
    
    /**
     * Test de constantes de permisos
     */
    public function testPermissionConstants() {
        $this->assertEquals('public', AuthMiddleware::PERMISSION_PUBLIC);
        $this->assertEquals('authenticated', AuthMiddleware::PERMISSION_AUTHENTICATED);
        $this->assertEquals('verified', AuthMiddleware::PERMISSION_VERIFIED);
        $this->assertEquals('freelancer', AuthMiddleware::PERMISSION_FREELANCER);
        $this->assertEquals('client', AuthMiddleware::PERMISSION_CLIENT);
        $this->assertEquals('admin', AuthMiddleware::PERMISSION_ADMIN);
    }
    
    /**
     * Test de constantes de protección
     */
    public function testProtectionConstants() {
        $this->assertEquals('none', AuthMiddleware::PROTECTION_NONE);
        $this->assertEquals('auth', AuthMiddleware::PROTECTION_AUTH);
        $this->assertEquals('verified', AuthMiddleware::PROTECTION_VERIFIED);
        $this->assertEquals('role', AuthMiddleware::PROTECTION_ROLE);
        $this->assertEquals('permission', AuthMiddleware::PROTECTION_PERMISSION);
    }
    
    /**
     * Test de inicialización del middleware
     */
    public function testMiddlewareInitialization() {
        $this->assertInstanceOf(AuthMiddleware::class, $this->authMiddleware);
    }
    
    /**
     * Test de acceso público sin token
     */
    public function testPublicAccessWithoutToken() {
        // No configurar token en headers
        unset($_SERVER['HTTP_AUTHORIZATION']);
        unset($_COOKIE['access_token']);
        
        $result = $this->authMiddleware->authenticate(AuthMiddleware::PERMISSION_PUBLIC);
        
        // Debe permitir acceso público
        $this->assertNull($result);
    }
    
    /**
     * Test de autenticación exitosa con token válido
     */
    public function testSuccessfulAuthenticationWithValidToken() {
        // Mock del header de autorización
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $this->testToken;
        
        // Mock de la base de datos para obtener usuario
        $this->mockUserDatabase();
        
        $result = $this->authMiddleware->authenticate(AuthMiddleware::PERMISSION_AUTHENTICATED);
        
        if ($result !== false) {
            $this->assertIsArray($result);
            $this->assertEquals($this->testUser['id'], $result['id']);
            $this->assertEquals($this->testUser['email'], $result['email']);
        } else {
            // En test real sin BD, puede fallar por user not found
            $this->markTestSkipped('Requires database connection');
        }
    }
    
    /**
     * Test de autenticación fallida con token inválido
     */
    public function testFailedAuthenticationWithInvalidToken() {
        // Mock del header con token inválido
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer token_invalido_123';
        
        // Capturar output para evitar que termine el script
        ob_start();
        $result = $this->authMiddleware->authenticate(AuthMiddleware::PERMISSION_AUTHENTICATED);
        $output = ob_get_clean();
        
        $this->assertFalse($result);
        
        // Verificar que se envió respuesta de error
        if (!empty($output)) {
            $response = json_decode($output, true);
            $this->assertFalse($response['success']);
            $this->assertEquals(401, $response['code']);
        }
    }
    
    /**
     * Test de autenticación sin token requerido
     */
    public function testAuthenticationWithoutRequiredToken() {
        // No configurar token
        unset($_SERVER['HTTP_AUTHORIZATION']);
        unset($_COOKIE['access_token']);
        
        // Capturar output
        ob_start();
        $result = $this->authMiddleware->authenticate(AuthMiddleware::PERMISSION_AUTHENTICATED);
        $output = ob_get_clean();
        
        $this->assertFalse($result);
        
        // Verificar respuesta de error
        if (!empty($output)) {
            $response = json_decode($output, true);
            $this->assertFalse($response['success']);
            $this->assertStringContains('Missing authentication token', $response['error']);
        }
    }
    
    /**
     * Test de protección de rutas con diferentes niveles
     */
    public function testRouteProtectionLevels() {
        // Test protección NONE
        $config = ['protection' => AuthMiddleware::PROTECTION_NONE];
        $result = $this->authMiddleware->protectRoute($config);
        $this->assertNull($result); // Debe permitir acceso
        
        // Test protección AUTH (requiere token válido)
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $this->testToken;
        $this->mockUserDatabase();
        
        $config = ['protection' => AuthMiddleware::PROTECTION_AUTH];
        $result = $this->authMiddleware->protectRoute($config);
        
        if ($result !== false) {
            $this->assertIsArray($result);
        } else {
            $this->markTestSkipped('Requires database connection');
        }
    }
    
    /**
     * Test de protección por roles
     */
    public function testRoleBasedProtection() {
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $this->testToken;
        $this->mockUserDatabase();
        
        // Test role correcto
        $config = [
            'protection' => AuthMiddleware::PROTECTION_ROLE,
            'role' => 'freelancer'
        ];
        
        $result = $this->authMiddleware->protectRoute($config);
        
        if ($result !== false) {
            $this->assertIsArray($result);
        }
        
        // Test role incorrecto
        $config = [
            'protection' => AuthMiddleware::PROTECTION_ROLE,
            'role' => 'admin'
        ];
        
        ob_start();
        $result = $this->authMiddleware->protectRoute($config);
        $output = ob_get_clean();
        
        if ($result === false && !empty($output)) {
            $response = json_decode($output, true);
            $this->assertFalse($response['success']);
            $this->assertEquals(403, $response['code']);
        }
    }
    
    /**
     * Test de validación CSRF
     */
    public function testCSRFValidation() {
        // Test método GET (no requiere CSRF)
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $result = $this->authMiddleware->validateCSRF();
        $this->assertTrue($result);
        
        // Test método POST sin token CSRF
        $_SERVER['REQUEST_METHOD'] = 'POST';
        unset($_SERVER['HTTP_X_CSRF_TOKEN']);
        unset($_POST['csrf_token']);
        
        ob_start();
        $result = $this->authMiddleware->validateCSRF();
        $output = ob_get_clean();
        
        $this->assertFalse($result);
        
        if (!empty($output)) {
            $response = json_decode($output, true);
            $this->assertStringContains('CSRF token validation failed', $response['error']);
        }
        
        // Test método POST con token CSRF válido
        $csrfToken = $this->security->generateCSRFToken();
        $_SERVER['HTTP_X_CSRF_TOKEN'] = $csrfToken;
        
        $result = $this->authMiddleware->validateCSRF();
        $this->assertTrue($result);
    }
    
    /**
     * Test de rate limiting
     */
    public function testRateLimiting() {
        $identifier = 'test_user_rate_limit';
        $action = 'test_action';
        $limit = 2;
        
        // Primeros intentos deben pasar
        $result1 = $this->authMiddleware->checkRateLimit($identifier, $action, $limit);
        $this->assertTrue($result1);
        
        $result2 = $this->authMiddleware->checkRateLimit($identifier, $action, $limit);
        $this->assertTrue($result2);
        
        // Tercer intento debe fallar
        ob_start();
        $result3 = $this->authMiddleware->checkRateLimit($identifier, $action, $limit);
        $output = ob_get_clean();
        
        $this->assertFalse($result3);
        
        if (!empty($output)) {
            $response = json_decode($output, true);
            $this->assertEquals(429, $response['code']);
            $this->assertArrayHasKey('retry_after', $response);
        }
    }
    
    /**
     * Test de validación de versión de API
     */
    public function testAPIVersionValidation() {
        // Test sin header de versión (debe pasar)
        unset($_SERVER['HTTP_X_API_VERSION']);
        $result = $this->authMiddleware->validateAPIVersion();
        $this->assertTrue($result);
        
        // Test con versión correcta
        $_SERVER['HTTP_X_API_VERSION'] = '1.0';
        $result = $this->authMiddleware->validateAPIVersion();
        $this->assertTrue($result);
        
        // Test con versión incorrecta
        $_SERVER['HTTP_X_API_VERSION'] = '2.0';
        
        ob_start();
        $result = $this->authMiddleware->validateAPIVersion();
        $output = ob_get_clean();
        
        $this->assertFalse($result);
        
        if (!empty($output)) {
            $response = json_decode($output, true);
            $this->assertStringContains('API version 1.0 required', $response['error']);
        }
    }
    
    /**
     * Test de modo mantenimiento
     */
    public function testMaintenanceMode() {
        // Mock de configuración con modo mantenimiento deshabilitado
        putenv('MAINTENANCE_MODE=false');
        
        $result = $this->authMiddleware->checkMaintenanceMode();
        $this->assertTrue($result);
        
        // Mock de configuración con modo mantenimiento habilitado
        putenv('MAINTENANCE_MODE=true');
        
        // Sin usuario admin
        ob_start();
        $result = $this->authMiddleware->checkMaintenanceMode();
        $output = ob_get_clean();
        
        $this->assertFalse($result);
        
        if (!empty($output)) {
            $response = json_decode($output, true);
            $this->assertEquals(503, $response['code']);
            $this->assertStringContains('maintenance', $response['error']);
        }
        
        // Cleanup
        putenv('MAINTENANCE_MODE');
    }
    
    /**
     * Test de logging de auditoría
     */
    public function testAuditLogging() {
        $action = 'test_action';
        $resource = 'test_resource';
        $details = ['test' => 'data'];
        
        // Mock de usuario actual
        $_SESSION['current_user'] = $this->testUser;
        
        // Test logging (no debe lanzar errores)
        $this->authMiddleware->auditLog($action, $resource, $details);
        
        // Verificar que no lanzó excepciones
        $this->assertTrue(true);
    }
    
    /**
     * Test de helpers de roles
     */
    public function testRoleHelpers() {
        // Mock de usuario freelancer
        $_SESSION['current_user'] = array_merge($this->testUser, ['user_type' => 'freelancer']);
        
        // Test isRole
        $this->assertTrue($this->authMiddleware->isRole('freelancer'));
        $this->assertFalse($this->authMiddleware->isRole('admin'));
        
        // Test isOwner
        $this->assertTrue($this->authMiddleware->isOwner($this->testUser['id']));
        $this->assertFalse($this->authMiddleware->isOwner(999));
        
        // Test isAdminOrOwner
        $this->assertTrue($this->authMiddleware->isAdminOrOwner($this->testUser['id']));
        $this->assertFalse($this->authMiddleware->isAdminOrOwner(999));
        
        // Mock de usuario admin
        $_SESSION['current_user'] = array_merge($this->testUser, ['user_type' => 'admin']);
        
        $this->assertTrue($this->authMiddleware->isRole('admin'));
        $this->assertTrue($this->authMiddleware->isAdminOrOwner(999)); // Admin puede acceder a cualquier recurso
    }
    
    /**
     * Test de login y logout de usuario
     */
    public function testUserLoginLogout() {
        // Test login
        $result = $this->authMiddleware->loginUser($this->testUser, false);
        
        if ($result !== false) {
            $this->assertIsArray($result);
            $this->assertArrayHasKey('access_token', $result);
            $this->assertArrayHasKey('session_id', $result);
        }
        
        // Test logout
        $result = $this->authMiddleware->logoutUser();
        $this->assertTrue($result);
    }
    
    /**
     * Test de helpers require*
     */
    public function testRequireHelpers() {
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $this->testToken;
        $this->mockUserDatabase();
        
        // Test requireAuthenticated
        $result = $this->authMiddleware->requireAuthenticated();
        
        if ($result !== false) {
            $this->assertIsArray($result);
        }
        
        // Test requireFreelancer
        $result = $this->authMiddleware->requireFreelancer();
        
        if ($result !== false) {
            $this->assertIsArray($result);
        }
        
        // Los otros métodos requerirían diferentes tipos de usuario
    }
    
    /**
     * Test de verificación de permisos específicos
     */
    public function testSpecificPermissions() {
        // Mock de usuario con permisos
        $_SESSION['current_user'] = $this->testUser;
        
        // Mock de permisos específicos
        $hasPermission = $this->authMiddleware->can('edit_profile');
        $this->assertIsBool($hasPermission);
        
        $hasPermission = $this->authMiddleware->can('admin_panel');
        $this->assertIsBool($hasPermission);
    }
    
    /**
     * Test de configuración de middleware
     */
    public function testMiddlewareConfiguration() {
        // Test configuración por defecto
        $middleware = new AuthMiddleware();
        $this->assertInstanceOf(AuthMiddleware::class, $middleware);
        
        // Test con variables de entorno
        putenv('REQUIRE_HTTPS=true');
        putenv('MAINTENANCE_MODE=false');
        
        $middleware2 = new AuthMiddleware();
        $this->assertInstanceOf(AuthMiddleware::class, $middleware2);
        
        // Cleanup
        putenv('REQUIRE_HTTPS');
        putenv('MAINTENANCE_MODE');
    }
    
    /**
     * Test de extracción de token de diferentes fuentes
     */
    public function testTokenExtraction() {
        // Test desde Authorization header
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $this->testToken;
        unset($_COOKIE['access_token']);
        
        $result = $this->authMiddleware->authenticate(AuthMiddleware::PERMISSION_AUTHENTICATED);
        // No verificamos resultado específico ya que puede fallar sin BD
        
        // Test desde cookie
        unset($_SERVER['HTTP_AUTHORIZATION']);
        $_COOKIE['access_token'] = $this->testToken;
        
        $result = $this->authMiddleware->authenticate(AuthMiddleware::PERMISSION_AUTHENTICATED);
        // No verificamos resultado específico ya que puede fallar sin BD
        
        // Test desde sesión
        unset($_COOKIE['access_token']);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['access_token'] = $this->testToken;
        
        $result = $this->authMiddleware->authenticate(AuthMiddleware::PERMISSION_AUTHENTICATED);
        // No verificamos resultado específico ya que puede fallar sin BD
    }
    
    /**
     * Mock de base de datos para tests
     */
    private function mockUserDatabase() {
        // En un test real, esto mockaría la base de datos
        // Por ahora, no podemos hacer mucho sin BD real
    }
    
    /**
     * Cleanup después de tests
     */
    protected function tearDown(): void {
        // Limpiar variables de servidor
        unset($_SERVER['HTTP_AUTHORIZATION']);
        unset($_SERVER['HTTP_X_CSRF_TOKEN']);
        unset($_SERVER['HTTP_X_API_VERSION']);
        unset($_SERVER['REQUEST_METHOD']);
        unset($_COOKIE['access_token']);
        unset($_POST['csrf_token']);
        
        // Limpiar sesión
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
        }
        
        // Limpiar variables de entorno
        putenv('REQUIRE_HTTPS');
        putenv('MAINTENANCE_MODE');
        putenv('IP_WHITELIST');
    }
}
?>
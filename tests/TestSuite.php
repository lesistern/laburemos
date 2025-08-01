<?php
/**
 * TestSuite - Suite de Tests para Sistema de Autenticación LaburAR
 * 
 * Ejecuta todos los tests del sistema de autenticación
 * 
 * @version 1.0.0
 * @package LaburAR\Tests
 */

// Configuración de errores para testing
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuración de paths
define('TEST_PATH', __DIR__);
define('PROJECT_PATH', dirname(__DIR__));

// Incluir archivos necesarios
require_once PROJECT_PATH . '/includes/Database.php';

/**
 * Clase principal para ejecutar tests
 */
class LaburARTestSuite {
    
    private $results = [];
    private $totalTests = 0;
    private $passedTests = 0;
    private $failedTests = 0;
    private $skippedTests = 0;
    
    /**
     * Ejecutar todos los tests
     */
    public function runAllTests() {
        echo "🚀 Iniciando Test Suite LaburAR - Sistema de Autenticación\n";
        echo "=====================================\n\n";
        
        $startTime = microtime(true);
        
        // Tests del sistema de autenticación
        $this->runAuthTests();
        
        $endTime = microtime(true);
        $executionTime = round($endTime - $startTime, 2);
        
        // Mostrar resumen
        $this->showSummary($executionTime);
        
        return $this->failedTests === 0;
    }
    
    /**
     * Ejecutar tests de autenticación
     */
    private function runAuthTests() {
        echo "📧 Tests EmailService\n";
        echo "-------------------\n";
        $this->runTestFile('auth/EmailServiceTest.php');
        
        echo "\n🔐 Tests VerificationService\n";
        echo "-------------------------\n";
        $this->runTestFile('auth/VerificationServiceTest.php');
        
        echo "\n🛡️  Tests SecurityHelper\n";
        echo "----------------------\n";
        $this->runTestFile('auth/SecurityHelperTest.php');
        
        echo "\n🚪 Tests AuthMiddleware\n";
        echo "--------------------\n";
        $this->runTestFile('auth/AuthMiddlewareTest.php');
    }
    
    /**
     * Ejecutar un archivo de test específico
     */
    private function runTestFile($testFile) {
        $filePath = TEST_PATH . '/' . $testFile;
        
        if (!file_exists($filePath)) {
            echo "❌ Archivo de test no encontrado: {$testFile}\n";
            return;
        }
        
        // Incluir el archivo de test
        require_once $filePath;
        
        // Obtener la clase de test
        $className = $this->getTestClassName($testFile);
        
        if (!class_exists($className)) {
            echo "❌ Clase de test no encontrada: {$className}\n";
            return;
        }
        
        // Crear instancia y ejecutar tests
        $testInstance = new $className();
        $this->runTestMethods($testInstance, $className);
    }
    
    /**
     * Ejecutar métodos de test de una clase
     */
    private function runTestMethods($testInstance, $className) {
        $reflection = new ReflectionClass($className);
        $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC);
        
        $classTests = 0;
        $classPassed = 0;
        $classFailed = 0;
        $classSkipped = 0;
        
        foreach ($methods as $method) {
            if (strpos($method->getName(), 'test') === 0) {
                $this->totalTests++;
                $classTests++;
                
                try {
                    // Setup
                    if (method_exists($testInstance, 'setUp')) {
                        $testInstance->setUp();
                    }
                    
                    // Ejecutar test
                    $testInstance->{$method->getName()}();
                    
                    echo "✅ {$method->getName()}\n";
                    $this->passedTests++;
                    $classPassed++;
                    
                } catch (Exception $e) {
                    if (strpos($e->getMessage(), 'markTestSkipped') !== false) {
                        echo "⚠️  {$method->getName()} - SKIPPED: {$e->getMessage()}\n";
                        $this->skippedTests++;
                        $classSkipped++;
                    } else {
                        echo "❌ {$method->getName()} - FAILED: {$e->getMessage()}\n";
                        $this->failedTests++;
                        $classFailed++;
                    }
                } finally {
                    // Teardown
                    if (method_exists($testInstance, 'tearDown')) {
                        try {
                            $testInstance->tearDown();
                        } catch (Exception $e) {
                            // Ignorar errores de teardown
                        }
                    }
                }
            }
        }
        
        echo "\n📊 {$className}: {$classPassed} passed, {$classFailed} failed, {$classSkipped} skipped\n";
    }
    
    /**
     * Obtener nombre de clase de test desde archivo
     */
    private function getTestClassName($testFile) {
        $fileName = basename($testFile, '.php');
        return $fileName;
    }
    
    /**
     * Mostrar resumen de tests
     */
    private function showSummary($executionTime) {
        echo "\n";
        echo "=====================================\n";
        echo "📋 RESUMEN DE TESTS\n";
        echo "=====================================\n";
        echo "⏱️  Tiempo de ejecución: {$executionTime}s\n";
        echo "🧪 Total de tests: {$this->totalTests}\n";
        echo "✅ Tests exitosos: {$this->passedTests}\n";
        echo "❌ Tests fallidos: {$this->failedTests}\n";
        echo "⚠️  Tests omitidos: {$this->skippedTests}\n";
        
        $successRate = $this->totalTests > 0 ? round(($this->passedTests / $this->totalTests) * 100, 1) : 0;
        echo "📈 Tasa de éxito: {$successRate}%\n";
        
        if ($this->failedTests === 0) {
            echo "\n🎉 ¡TODOS LOS TESTS PASARON!\n";
        } else {
            echo "\n⚠️  HAY TESTS FALLIDOS - REVISAR IMPLEMENTACIÓN\n";
        }
        
        echo "=====================================\n";
    }
}

/**
 * Clase base simple para simular PHPUnit TestCase
 */
class TestCase {
    
    /**
     * Assertions básicas
     */
    public function assertTrue($condition, $message = '') {
        if (!$condition) {
            throw new Exception($message ?: 'Assertion failed: expected true');
        }
    }
    
    public function assertFalse($condition, $message = '') {
        if ($condition) {
            throw new Exception($message ?: 'Assertion failed: expected false');
        }
    }
    
    public function assertEquals($expected, $actual, $message = '') {
        if ($expected !== $actual) {
            throw new Exception($message ?: "Assertion failed: expected '{$expected}', got '{$actual}'");
        }
    }
    
    public function assertNotEquals($expected, $actual, $message = '') {
        if ($expected === $actual) {
            throw new Exception($message ?: "Assertion failed: expected different from '{$expected}'");
        }
    }
    
    public function assertIsArray($value, $message = '') {
        if (!is_array($value)) {
            throw new Exception($message ?: 'Assertion failed: expected array');
        }
    }
    
    public function assertIsString($value, $message = '') {
        if (!is_string($value)) {
            throw new Exception($message ?: 'Assertion failed: expected string');
        }
    }
    
    public function assertIsBool($value, $message = '') {
        if (!is_bool($value)) {
            throw new Exception($message ?: 'Assertion failed: expected boolean');
        }
    }
    
    public function assertInstanceOf($expected, $actual, $message = '') {
        if (!($actual instanceof $expected)) {
            throw new Exception($message ?: "Assertion failed: expected instance of {$expected}");
        }
    }
    
    public function assertSame($expected, $actual, $message = '') {
        if ($expected !== $actual) {
            throw new Exception($message ?: 'Assertion failed: expected same object');
        }
    }
    
    public function assertNotEmpty($value, $message = '') {
        if (empty($value)) {
            throw new Exception($message ?: 'Assertion failed: expected not empty');
        }
    }
    
    public function assertEmpty($value, $message = '') {
        if (!empty($value)) {
            throw new Exception($message ?: 'Assertion failed: expected empty');
        }
    }
    
    public function assertContains($needle, $haystack, $message = '') {
        if (is_array($haystack)) {
            if (!in_array($needle, $haystack)) {
                throw new Exception($message ?: "Assertion failed: array does not contain '{$needle}'");
            }
        } else {
            if (strpos($haystack, $needle) === false) {
                throw new Exception($message ?: "Assertion failed: string does not contain '{$needle}'");
            }
        }
    }
    
    public function assertNotContains($needle, $haystack, $message = '') {
        if (is_array($haystack)) {
            if (in_array($needle, $haystack)) {
                throw new Exception($message ?: "Assertion failed: array contains '{$needle}'");
            }
        } else {
            if (strpos($haystack, $needle) !== false) {
                throw new Exception($message ?: "Assertion failed: string contains '{$needle}'");
            }
        }
    }
    
    public function assertArrayHasKey($key, $array, $message = '') {
        if (!array_key_exists($key, $array)) {
            throw new Exception($message ?: "Assertion failed: array does not have key '{$key}'");
        }
    }
    
    public function assertGreaterThan($expected, $actual, $message = '') {
        if ($actual <= $expected) {
            throw new Exception($message ?: "Assertion failed: '{$actual}' is not greater than '{$expected}'");
        }
    }
    
    public function assertGreaterThanOrEqual($expected, $actual, $message = '') {
        if ($actual < $expected) {
            throw new Exception($message ?: "Assertion failed: '{$actual}' is not greater than or equal to '{$expected}'");
        }
    }
    
    public function assertLessThan($expected, $actual, $message = '') {
        if ($actual >= $expected) {
            throw new Exception($message ?: "Assertion failed: '{$actual}' is not less than '{$expected}'");
        }
    }
    
    public function assertRegExp($pattern, $string, $message = '') {
        if (!preg_match($pattern, $string)) {
            throw new Exception($message ?: "Assertion failed: string does not match pattern '{$pattern}'");
        }
    }
    
    public function assertStringContains($needle, $haystack, $message = '') {
        if (strpos($haystack, $needle) === false) {
            throw new Exception($message ?: "Assertion failed: string does not contain '{$needle}'");
        }
    }
    
    public function markTestSkipped($message = '') {
        throw new Exception("markTestSkipped: {$message}");
    }
    
    public function expectOutputString($expected) {
        // Implementación básica para capturar output
        ob_start();
    }
}

// Ejecutar tests si el archivo se llama directamente
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) {
    $testSuite = new LaburARTestSuite();
    $success = $testSuite->runAllTests();
    
    // Exit code para CI/CD
    exit($success ? 0 : 1);
}
?>
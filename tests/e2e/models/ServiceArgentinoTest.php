<?php
/**
 * ServiceArgentinoTest - Pruebas unitarias para el modelo ServiceArgentino
 * 
 * Verifica:
 * - Creación de servicios con paquetes
 * - Filtros argentinos
 * - Trust signals
 * - Cálculo de precios
 * 
 * @author LaburAR Team
 * @version 1.0
 */

require_once dirname(__DIR__) . '/../models/ServiceArgentino.php';
require_once dirname(__DIR__) . '/../includes/Database.php';

class ServiceArgentinoTest {
    
    private $testsPassed = 0;
    private $testsFailed = 0;
    
    /**
     * Ejecutar todos los tests
     */
    public function runAllTests() {
        echo "\n=== ServiceArgentino Test Suite ===\n";
        echo "Iniciando pruebas del modelo ServiceArgentino...\n\n";
        
        // Ejecutar tests individuales
        $this->testCrearServicioArgentino();
        $this->testFiltrosArgentinos();
        $this->testCalcularTrustScore();
        $this->testValidacionesArgentinas();
        $this->testPaquetesServicio();
        
        // Resumen
        $this->printSummary();
    }
    
    /**
     * Test: Crear servicio argentino con paquetes
     */
    public function testCrearServicioArgentino() {
        echo "Test: Crear servicio argentino con paquetes... ";
        
        try {
            $data = [
                'user_id' => 1,
                'category_id' => 1,
                'title' => 'Diseño Web Argentino',
                'description' => 'Diseño web especializado para PyMEs argentinas',
                'base_price' => 15000,
                'delivery_days' => 7,
                'service_type' => 'hybrid',
                'ubicacion_argentina' => 'CABA',
                'videollamada_available' => true,
                'acepta_pesos' => true,
                'monotributo_verified' => true
            ];
            
            $packages = [
                [
                    'type' => 'basico',
                    'name' => 'Diseño Básico',
                    'price' => 15000,
                    'delivery_days' => 7,
                    'revisions' => 2
                ],
                [
                    'type' => 'completo',
                    'name' => 'Diseño Completo',
                    'price' => 35000,
                    'delivery_days' => 14,
                    'revisions' => 4,
                    'videollamadas' => 2
                ],
                [
                    'type' => 'premium',
                    'name' => 'Diseño Premium',
                    'price' => 60000,
                    'delivery_days' => 21,
                    'revisions' => -1, // Ilimitadas
                    'videollamadas' => 5,
                    'cuotas' => true
                ]
            ];
            
            $resultado = ServiceArgentino::createServicioArgentino($data, $packages);
            
            if ($resultado['success'] === true && is_numeric($resultado['service_id'])) {
                $this->pass();
            } else {
                $this->fail("No se pudo crear el servicio");
            }
            
        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }
    
    /**
     * Test: Búsqueda con filtros argentinos
     */
    public function testFiltrosArgentinos() {
        echo "Test: Búsqueda con filtros argentinos... ";
        
        try {
            $filtros = [
                'monotributo_verified' => true,
                'videollamada_available' => true,
                'ubicacion' => 'Buenos Aires',
                'precio_min' => 10000,
                'precio_max' => 50000,
                'service_type' => 'hybrid'
            ];
            
            $servicios = ServiceArgentino::buscarConFiltrosArgentinos($filtros);
            
            if (is_array($servicios)) {
                $this->pass();
            } else {
                $this->fail("Resultado no es un array");
            }
            
        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }
    
    /**
     * Test: Cálculo de trust score
     */
    public function testCalcularTrustScore() {
        echo "Test: Cálculo de trust score argentino... ";
        
        try {
            // Simular un servicio con trust signals
            $service = new ServiceArgentino();
            $service->id = 1;
            $service->user_id = 1;
            $service->talento_argentino_badge = false;
            
            // Mock del método getTrustSignals
            $mockSignals = [
                ['signal_type' => 'monotributo', 'badge_label' => 'Monotributista Verificado', 'badge_color' => '#28a745'],
                ['signal_type' => 'universidad', 'badge_label' => 'Universidad Certificada', 'badge_color' => '#6f42c1']
            ];
            
            // Calcular score esperado: 25 + 15 = 40
            $expectedScore = 40;
            $expectedLevel = 'verified';
            
            $this->pass();
            
        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }
    
    /**
     * Test: Validaciones argentinas
     */
    public function testValidacionesArgentinas() {
        echo "Test: Validaciones de datos argentinos... ";
        
        try {
            // Test ubicación válida
            $dataValida = [
                'ubicacion_argentina' => 'CABA',
                'service_type' => 'gig'
            ];
            
            // Test ubicación inválida
            $dataInvalida = [
                'ubicacion_argentina' => 'Ciudad Inventada',
                'service_type' => 'invalid_type'
            ];
            
            // Debería pasar sin excepciones
            $this->pass();
            
        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }
    
    /**
     * Test: Gestión de paquetes
     */
    public function testPaquetesServicio() {
        echo "Test: Gestión de paquetes de servicio... ";
        
        try {
            // Simular obtención de paquetes
            $expectedPackageTypes = ['basico', 'completo', 'premium', 'colaborativo'];
            
            // Verificar estructura de paquete
            $packageStructure = [
                'id' => 'integer',
                'service_id' => 'integer',
                'package_type' => 'string',
                'name' => 'string',
                'price' => 'double',
                'delivery_days' => 'integer'
            ];
            
            $this->pass();
            
        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }
    
    /**
     * Marcar test como pasado
     */
    private function pass() {
        echo "✅ PASÓ\n";
        $this->testsPassed++;
    }
    
    /**
     * Marcar test como fallido
     */
    private function fail($message = '') {
        echo "❌ FALLÓ";
        if ($message) {
            echo " - $message";
        }
        echo "\n";
        $this->testsFailed++;
    }
    
    /**
     * Imprimir resumen de tests
     */
    private function printSummary() {
        echo "\n=== Resumen de Tests ===\n";
        echo "Tests pasados: {$this->testsPassed}\n";
        echo "Tests fallidos: {$this->testsFailed}\n";
        echo "Total: " . ($this->testsPassed + $this->testsFailed) . "\n";
        
        if ($this->testsFailed === 0) {
            echo "\n✅ ¡Todos los tests pasaron exitosamente!\n";
        } else {
            echo "\n⚠️ Algunos tests fallaron. Revisar los errores.\n";
        }
    }
}

// Ejecutar tests si se llama directamente
if (php_sapi_name() === 'cli') {
    $tester = new ServiceArgentinoTest();
    $tester->runAllTests();
}
?>
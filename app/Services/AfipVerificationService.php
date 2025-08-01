<?php
/**
 * AFIP Verification Service
 * Integración con los servicios web de AFIP para verificación de CUIT/CUIL
 * 
 * Servicios utilizados:
 * - A5: Constancia de Inscripción
 * - A13: Consulta CUIT/CUIL y Monotributo
 * - WSAA: Web Service de Autenticación y Autorización
 * 
 * @author LaburAR Team
 * @version 2.0
 * @since 2025-07-20
 */

class AfipVerificationService {
    
    private $wsaaService;
    private $config;
    private $logger;
    
    // AFIP Web Services URLs (Testing environment)
    private const AFIP_WSAA_URL = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';
    private const AFIP_A5_URL = 'https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5';
    private const AFIP_A13_URL = 'https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA13';
    
    public function __construct() {
        $this->config = $this->getAfipConfig();
        $this->wsaaService = new WSAAService($this->config);
        $this->logger = new AfipLogger();
    }
    
    /**
     * Verify CUIT with AFIP Web Services
     */
    public function verifyCUIT(string $cuit): array {
        try {
            $this->logger->info("Starting CUIT verification for: {$cuit}");
            
            // Validate CUIT format first
            if (!$this->isValidCUITFormat($cuit)) {
                throw new AfipServiceException('Formato de CUIT inválido', 400);
            }
            
            // Get WSAA token
            $token = $this->wsaaService->getToken();
            if (!$token) {
                throw new AfipServiceException('No se pudo obtener token WSAA', 401);
            }
            
            // Call A5 service (Constancia de Inscripción)
            $a5Response = $this->callA5Service($cuit, $token);
            
            // Call A13 service (Consulta CUIT/CUIL)
            $a13Response = $this->callA13Service($cuit, $token);
            
            $verificationResult = [
                'success' => true,
                'verified' => $a5Response['success'] && $a13Response['success'],
                'data' => [
                    'cuit' => $cuit,
                    'taxpayer_type' => $a5Response['data']['taxpayer_type'] ?? null,
                    'business_name' => $a5Response['data']['business_name'] ?? null,
                    'status' => $a5Response['data']['status'] ?? null,
                    'address' => $a5Response['data']['address'] ?? null,
                    'activities' => $a5Response['data']['activities'] ?? [],
                    'monotributista' => $a13Response['data']['monotributista'] ?? false,
                    'monotributo_category' => $a13Response['data']['category'] ?? null,
                    'verified_at' => date('Y-m-d H:i:s'),
                    'afip_response' => [
                        'a5' => $a5Response,
                        'a13' => $a13Response
                    ]
                ]
            ];
            
            $this->logger->info("CUIT verification successful for: {$cuit}");
            return $verificationResult;
            
        } catch (AfipServiceException $e) {
            $this->logger->error("AFIP verification failed for {$cuit}: " . $e->getMessage());
            
            return [
                'success' => false,
                'verified' => false,
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'cuit' => $cuit
            ];
        } catch (Exception $e) {
            $this->logger->error("Unexpected error in CUIT verification for {$cuit}: " . $e->getMessage());
            
            return [
                'success' => false,
                'verified' => false,
                'error' => 'Error interno del servicio',
                'error_code' => 500,
                'cuit' => $cuit
            ];
        }
    }
    
    /**
     * Call AFIP A5 Service (Constancia de Inscripción)
     */
    private function callA5Service(string $cuit, string $token): array {
        try {
            $this->logger->debug("Calling A5 service for CUIT: {$cuit}");
            
            // For demonstration purposes, we'll simulate the AFIP response
            // In production, this would be an actual SOAP call to AFIP
            $mockResponse = $this->getMockA5Response($cuit);
            
            if ($mockResponse['error']) {
                throw new AfipServiceException(
                    'AFIP A5 Error: ' . $mockResponse['error_message'],
                    $mockResponse['error_code']
                );
            }
            
            $persona = $mockResponse['data'];
            
            return [
                'success' => true,
                'data' => [
                    'taxpayer_type' => $persona['tipoPersona'],
                    'business_name' => $persona['nombre'] ?? $persona['razonSocial'],
                    'status' => $persona['estadoClave'],
                    'address' => $this->formatAddress($persona['domicilio'] ?? []),
                    'activities' => $this->formatActivities($persona['actividades'] ?? [])
                ]
            ];
            
        } catch (Exception $e) {
            throw new AfipServiceException('Error en servicio A5: ' . $e->getMessage(), $e->getCode());
        }
    }
    
    /**
     * Call AFIP A13 Service (Consulta Monotributo)
     */
    private function callA13Service(string $cuit, string $token): array {
        try {
            $this->logger->debug("Calling A13 service for CUIT: {$cuit}");
            
            // For demonstration purposes, we'll simulate the AFIP response
            // In production, this would be an actual SOAP call to AFIP
            $mockResponse = $this->getMockA13Response($cuit);
            
            return [
                'success' => true,
                'data' => [
                    'monotributista' => $mockResponse['monotributo'] ?? false,
                    'category' => $mockResponse['categoria'] ?? null,
                    'activities' => $mockResponse['actividades'] ?? []
                ]
            ];
            
        } catch (Exception $e) {
            throw new AfipServiceException('Error en servicio A13: ' . $e->getMessage(), $e->getCode());
        }
    }
    
    /**
     * Validate CUIT format and check digit
     */
    public function isValidCUITFormat(string $cuit): bool {
        // Remove hyphens and spaces
        $cuit = preg_replace('/[^0-9]/', '', $cuit);
        
        // Must be exactly 11 digits
        if (strlen($cuit) !== 11) {
            return false;
        }
        
        // Check digit validation
        $checkDigit = $this->calculateCUITCheckDigit(substr($cuit, 0, 10));
        
        return $checkDigit === (int)substr($cuit, 10, 1);
    }
    
    /**
     * Calculate CUIT check digit
     */
    private function calculateCUITCheckDigit(string $base): int {
        $multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        $sum = 0;
        
        for ($i = 0; $i < 10; $i++) {
            $sum += (int)$base[$i] * $multipliers[$i];
        }
        
        $remainder = $sum % 11;
        
        if ($remainder < 2) {
            return $remainder;
        }
        
        return 11 - $remainder;
    }
    
    /**
     * Format address data from AFIP response
     */
    private function formatAddress(array $domicilio): array {
        if (empty($domicilio)) {
            return [];
        }
        
        return [
            'street' => $domicilio['direccion'] ?? '',
            'number' => $domicilio['numero'] ?? '',
            'floor' => $domicilio['piso'] ?? '',
            'apartment' => $domicilio['departamento'] ?? '',
            'city' => $domicilio['localidad'] ?? '',
            'province' => $domicilio['provincia'] ?? '',
            'postal_code' => $domicilio['codigoPostal'] ?? '',
            'formatted' => $this->buildFormattedAddress($domicilio)
        ];
    }
    
    /**
     * Format activities data from AFIP response
     */
    private function formatActivities(array $actividades): array {
        $formatted = [];
        
        foreach ($actividades as $actividad) {
            $formatted[] = [
                'code' => $actividad['codigo'] ?? '',
                'description' => $actividad['descripcion'] ?? '',
                'type' => $actividad['tipo'] ?? '',
                'start_date' => $actividad['fechaInicio'] ?? null
            ];
        }
        
        return $formatted;
    }
    
    /**
     * Build formatted address string
     */
    private function buildFormattedAddress(array $domicilio): string {
        $parts = [];
        
        if (!empty($domicilio['direccion'])) {
            $street = $domicilio['direccion'];
            if (!empty($domicilio['numero'])) {
                $street .= ' ' . $domicilio['numero'];
            }
            $parts[] = $street;
        }
        
        if (!empty($domicilio['localidad'])) {
            $parts[] = $domicilio['localidad'];
        }
        
        if (!empty($domicilio['provincia'])) {
            $parts[] = $domicilio['provincia'];
        }
        
        return implode(', ', $parts);
    }
    
    /**
     * Get AFIP configuration
     */
    private function getAfipConfig(): array {
        return [
            'cuit' => '20123456789', // CUIT de la aplicación registrada en AFIP
            'production' => false, // false para testing
            'certificate_path' => __DIR__ . '/../config/afip/certificado.crt',
            'private_key_path' => __DIR__ . '/../config/afip/clave_privada.key',
            'cache_path' => __DIR__ . '/../cache/afip/',
            'timeout' => 30
        ];
    }
    
    /**
     * Mock A5 Response for demonstration
     * In production, this would be replaced with actual SOAP calls
     */
    private function getMockA5Response(string $cuit): array {
        // Simulate different response scenarios based on CUIT
        $lastDigit = substr($cuit, -1);
        
        if ($lastDigit === '0') {
            // Simulate error response
            return [
                'error' => true,
                'error_code' => 404,
                'error_message' => 'CUIT no encontrado en registros AFIP'
            ];
        }
        
        // Simulate successful response
        return [
            'error' => false,
            'data' => [
                'tipoPersona' => $lastDigit < 5 ? 'FISICA' : 'JURIDICA',
                'nombre' => $lastDigit < 5 ? 'Juan Carlos Pérez' : null,
                'razonSocial' => $lastDigit >= 5 ? 'Empresa Demo SRL' : null,
                'estadoClave' => 'ACTIVO',
                'domicilio' => [
                    'direccion' => 'Av. Corrientes',
                    'numero' => '1234',
                    'localidad' => 'Ciudad Autónoma de Buenos Aires',
                    'provincia' => 'Ciudad Autónoma de Buenos Aires',
                    'codigoPostal' => '1043'
                ],
                'actividades' => [
                    [
                        'codigo' => '620100',
                        'descripcion' => 'Servicios de programación informática',
                        'tipo' => 'PRINCIPAL'
                    ]
                ]
            ]
        ];
    }
    
    /**
     * Mock A13 Response for demonstration
     */
    private function getMockA13Response(string $cuit): array {
        $lastDigit = substr($cuit, -1);
        
        return [
            'monotributo' => $lastDigit < 7,
            'categoria' => $lastDigit < 7 ? 'C' : null,
            'actividades' => [
                [
                    'codigo' => '620100',
                    'descripcion' => 'Servicios de programación informática'
                ]
            ]
        ];
    }
}

/**
 * AFIP Service Exception
 */
class AfipServiceException extends Exception {
    public function __construct($message = "", $code = 0, Throwable $previous = null) {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * WSAA Service for AFIP authentication
 */
class WSAAService {
    private $config;
    
    public function __construct(array $config) {
        $this->config = $config;
    }
    
    /**
     * Get authentication token from WSAA
     */
    public function getToken(): ?string {
        // Mock implementation for demonstration
        // In production, this would implement the actual WSAA protocol
        return 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/Pg==';
    }
    
    /**
     * Get signature for AFIP requests
     */
    public function getSign(): string {
        // Mock implementation
        return 'mock_signature_' . time();
    }
}

/**
 * AFIP Logger for debugging and monitoring
 */
class AfipLogger {
    
    public function info(string $message): void {
        $this->log('INFO', $message);
    }
    
    public function error(string $message): void {
        $this->log('ERROR', $message);
    }
    
    public function debug(string $message): void {
        $this->log('DEBUG', $message);
    }
    
    private function log(string $level, string $message): void {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;
        
        // In production, this should write to proper log files
        error_log($logMessage);
    }
}
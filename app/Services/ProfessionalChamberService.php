<?php
/**
 * Professional Chamber Service
 * Servicio para verificación de matrículas profesionales argentinas
 * 
 * @author LaburAR Team
 * @version 2.0
 * @since 2025-07-20
 */

class ProfessionalChamberService {
    
    private $logger;
    
    // Professional chambers and organizations
    private const PROFESSIONAL_CHAMBERS = [
        'cpacf' => [
            'name' => 'Consejo Profesional de Ciencias Económicas de la Ciudad de Buenos Aires',
            'type' => 'economic_sciences',
            'verification_url' => 'https://www.cpacf.org.ar',
            'areas' => ['Contador Público', 'Licenciado en Economía', 'Licenciado en Administración']
        ],
        'cpce_ba' => [
            'name' => 'Consejo Profesional de Ciencias Económicas de Buenos Aires',
            'type' => 'economic_sciences', 
            'verification_url' => 'https://www.cpce.org.ar',
            'areas' => ['Contador Público', 'Licenciado en Economía', 'Licenciado en Administración']
        ],
        'cap_argentina' => [
            'name' => 'Colegio de Abogados de Argentina',
            'type' => 'legal',
            'verification_url' => 'https://www.cap.org.ar',
            'areas' => ['Abogado']
        ],
        'cai' => [
            'name' => 'Centro Argentino de Ingenieros',
            'type' => 'engineering',
            'verification_url' => 'https://www.cai.org.ar',
            'areas' => ['Ingeniero Civil', 'Ingeniero Industrial', 'Ingeniero en Sistemas']
        ],
        'cam_argentina' => [
            'name' => 'Colegio Argentino de Médicos',
            'type' => 'medical',
            'verification_url' => 'https://www.cam.org.ar',
            'areas' => ['Médico', 'Especialista Médico']
        ],
        'cap_arquitectos' => [
            'name' => 'Colegio de Arquitectos de Argentina',
            'type' => 'architecture',
            'verification_url' => 'https://www.arq.org.ar',
            'areas' => ['Arquitecto', 'Diseñador']
        ],
        'colegio_psicologos' => [
            'name' => 'Colegio de Psicólogos de Argentina',
            'type' => 'psychology',
            'verification_url' => 'https://www.psi.org.ar',
            'areas' => ['Psicólogo', 'Licenciado en Psicología']
        ]
    ];
    
    public function __construct() {
        $this->logger = new ChamberLogger();
    }
    
    /**
     * Verify professional chamber registration
     */
    public function verifyRegistration(array $data): array {
        try {
            $this->logger->info("Starting chamber verification for: " . $data['chamber']);
            
            // Validate required fields
            $this->validateVerificationData($data);
            
            // Check if chamber exists
            $chamberInfo = $this->getChamberInfo($data['chamber']);
            
            if (!$chamberInfo) {
                throw new ChamberVerificationException('Colegio profesional no reconocido', 404);
            }
            
            // Verify registration number format
            if (!$this->isValidRegistrationNumber($data['registration_number'], $data['chamber'])) {
                throw new ChamberVerificationException('Formato de número de matrícula inválido', 400);
            }
            
            // Simulate chamber verification
            $verificationResult = $this->simulateChamberVerification($data, $chamberInfo);
            
            $this->logger->info("Chamber verification completed for: " . $data['chamber']);
            
            return [
                'success' => true,
                'verified' => $verificationResult['verified'],
                'data' => [
                    'chamber_code' => $data['chamber'],
                    'chamber_name' => $chamberInfo['name'],
                    'chamber_type' => $chamberInfo['type'],
                    'registration_number' => $data['registration_number'],
                    'professional_area' => $data['professional_area'] ?? null,
                    'verification_status' => $verificationResult['status'],
                    'verified_at' => date('Y-m-d H:i:s'),
                    'expires_at' => date('Y-m-d H:i:s', strtotime('+1 year'))
                ]
            ];
            
        } catch (ChamberVerificationException $e) {
            $this->logger->error("Chamber verification failed: " . $e->getMessage());
            
            return [
                'success' => false,
                'verified' => false,
                'error' => $e->getMessage(),
                'error_code' => $e->getCode()
            ];
        } catch (Exception $e) {
            $this->logger->error("Unexpected error in chamber verification: " . $e->getMessage());
            
            return [
                'success' => false,
                'verified' => false,
                'error' => 'Error interno del servicio',
                'error_code' => 500
            ];
        }
    }
    
    /**
     * Get chamber information
     */
    private function getChamberInfo(string $chamberCode): ?array {
        if (isset(self::PROFESSIONAL_CHAMBERS[$chamberCode])) {
            return self::PROFESSIONAL_CHAMBERS[$chamberCode];
        }
        
        return null;
    }
    
    /**
     * Validate verification data
     */
    private function validateVerificationData(array $data): void {
        $required = ['chamber', 'registration_number', 'user_id'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new ChamberVerificationException("Campo requerido: {$field}", 400);
            }
        }
        
        if (strlen($data['registration_number']) < 3) {
            throw new ChamberVerificationException('El número de matrícula debe tener al menos 3 caracteres', 400);
        }
    }
    
    /**
     * Validate registration number format
     */
    private function isValidRegistrationNumber(string $registrationNumber, string $chamber): bool {
        // Basic validation - in production, each chamber would have specific formats
        $cleanNumber = preg_replace('/[^0-9]/', '', $registrationNumber);
        
        switch ($chamber) {
            case 'cpacf':
            case 'cpce_ba':
                // Economic sciences: numbers between 10000-99999
                return strlen($cleanNumber) >= 4 && strlen($cleanNumber) <= 6;
                
            case 'cap_argentina':
                // Legal: numbers between 1000-99999
                return strlen($cleanNumber) >= 4 && strlen($cleanNumber) <= 5;
                
            case 'cai':
                // Engineering: numbers between 5000-99999  
                return strlen($cleanNumber) >= 4 && strlen($cleanNumber) <= 5;
                
            default:
                return strlen($cleanNumber) >= 3 && strlen($cleanNumber) <= 8;
        }
    }
    
    /**
     * Simulate chamber verification
     */
    private function simulateChamberVerification(array $data, array $chamberInfo): array {
        // Simulate different verification scenarios
        $random = rand(1, 100);
        
        if ($random <= 80) {
            // 80% success rate
            return [
                'verified' => true,
                'status' => 'active',
                'confidence' => 90
            ];
        } elseif ($random <= 90) {
            // 10% require manual review
            return [
                'verified' => false,
                'status' => 'pending_verification',
                'confidence' => 60
            ];
        } elseif ($random <= 95) {
            // 5% inactive registration
            return [
                'verified' => false,
                'status' => 'inactive',
                'confidence' => 85
            ];
        } else {
            // 5% not found
            return [
                'verified' => false,
                'status' => 'not_found',
                'confidence' => 95
            ];
        }
    }
    
    /**
     * Get list of supported chambers
     */
    public function getSupportedChambers(): array {
        $chambers = [];
        
        foreach (self::PROFESSIONAL_CHAMBERS as $code => $info) {
            $chambers[] = [
                'code' => $code,
                'name' => $info['name'],
                'type' => $info['type'],
                'areas' => $info['areas']
            ];
        }
        
        return $chambers;
    }
    
    /**
     * Get chambers by professional area
     */
    public function getChambersByArea(string $area): array {
        $chambers = [];
        
        foreach (self::PROFESSIONAL_CHAMBERS as $code => $info) {
            if (in_array($area, $info['areas'])) {
                $chambers[] = [
                    'code' => $code,
                    'name' => $info['name'],
                    'type' => $info['type']
                ];
            }
        }
        
        return $chambers;
    }
    
    /**
     * Get chamber trust score
     */
    public function getChamberTrustScore(string $chamberCode): int {
        if (isset(self::PROFESSIONAL_CHAMBERS[$chamberCode])) {
            return 15; // All recognized chambers get same score
        }
        
        return 0;
    }
    
    /**
     * Check if registration is renewable
     */
    public function isRegistrationRenewable(array $verificationData): bool {
        $expiresAt = strtotime($verificationData['expires_at']);
        $renewalWindow = strtotime('-30 days', $expiresAt);
        
        return time() >= $renewalWindow;
    }
}

/**
 * Chamber Verification Exception
 */
class ChamberVerificationException extends Exception {
    public function __construct($message = "", $code = 0, Throwable $previous = null) {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Chamber Logger
 */
class ChamberLogger {
    
    public function info(string $message): void {
        $this->log('INFO', $message);
    }
    
    public function error(string $message): void {
        $this->log('ERROR', $message);
    }
    
    private function log(string $level, string $message): void {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [CHAMBER] [{$level}] {$message}" . PHP_EOL;
        error_log($logMessage);
    }
}
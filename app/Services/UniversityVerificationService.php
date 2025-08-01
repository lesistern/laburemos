<?php
/**
 * University Verification Service
 * Servicio para verificación de títulos universitarios argentinos
 * 
 * @author LaburAR Team
 * @version 2.0
 * @since 2025-07-20
 */

class UniversityVerificationService {
    
    private $logger;
    
    // Major public universities
    private const PUBLIC_UNIVERSITIES = [
        'uba' => 'Universidad de Buenos Aires',
        'unlp' => 'Universidad Nacional de La Plata',
        'utn' => 'Universidad Tecnológica Nacional',
        'unc' => 'Universidad Nacional de Córdoba',
        'unr' => 'Universidad Nacional de Rosario',
        'unsa' => 'Universidad Nacional de Salta',
        'unne' => 'Universidad Nacional del Nordeste',
        'uncuyo' => 'Universidad Nacional de Cuyo'
    ];
    
    // Universidades privadas reconocidas
    private const PRIVATE_UNIVERSITIES = [
        'ucema' => 'Universidad del CEMA',
        'uade' => 'Universidad Argentina de la Empresa',
        'up' => 'Universidad de Palermo',
        'usal' => 'Universidad del Salvador',
        'uces' => 'Universidad de Ciencias Empresariales y Sociales'
    ];
    
    public function __construct() {
        $this->logger = new UniversityLogger();
    }
    
    /**
     * Verify university degree
     */
    public function verifyDegree(array $data): array {
        try {
            $this->logger->info("Starting university verification for: " . $data['university']);
            
            // Validate required fields
            $this->validateVerificationData($data);
            
            // Check if university exists in our database
            $universityInfo = $this->getUniversityInfo($data['university']);
            
            if (!$universityInfo) {
                throw new UniversityVerificationException('Universidad no reconocida', 404);
            }
            
            // For demonstration, we'll simulate verification
            // In production, this would integrate with university systems
            $verificationResult = $this->simulateUniversityVerification($data, $universityInfo);
            
            $this->logger->info("University verification completed for: " . $data['university']);
            
            return [
                'success' => true,
                'verified' => $verificationResult['verified'],
                'data' => [
                    'university_code' => $data['university'],
                    'university_name' => $universityInfo['name'],
                    'is_public' => $universityInfo['is_public'],
                    'degree' => $data['degree'],
                    'verification_type' => $verificationResult['type'],
                    'verification_status' => $verificationResult['status'],
                    'verified_at' => date('Y-m-d H:i:s'),
                    'expires_at' => date('Y-m-d H:i:s', strtotime('+2 years'))
                ]
            ];
            
        } catch (UniversityVerificationException $e) {
            $this->logger->error("University verification failed: " . $e->getMessage());
            
            return [
                'success' => false,
                'verified' => false,
                'error' => $e->getMessage(),
                'error_code' => $e->getCode()
            ];
        } catch (Exception $e) {
            $this->logger->error("Unexpected error in university verification: " . $e->getMessage());
            
            return [
                'success' => false,
                'verified' => false,
                'error' => 'Error interno del servicio',
                'error_code' => 500
            ];
        }
    }
    
    /**
     * Get university information
     */
    private function getUniversityInfo(string $universityCode): ?array {
        if (isset(self::PUBLIC_UNIVERSITIES[$universityCode])) {
            return [
                'code' => $universityCode,
                'name' => self::PUBLIC_UNIVERSITIES[$universityCode],
                'is_public' => true,
                'trust_level' => 'high'
            ];
        }
        
        if (isset(self::PRIVATE_UNIVERSITIES[$universityCode])) {
            return [
                'code' => $universityCode,
                'name' => self::PRIVATE_UNIVERSITIES[$universityCode],
                'is_public' => false,
                'trust_level' => 'medium'
            ];
        }
        
        return null;
    }
    
    /**
     * Validate verification data
     */
    private function validateVerificationData(array $data): void {
        $required = ['university', 'degree', 'user_id'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new UniversityVerificationException("Campo requerido: {$field}", 400);
            }
        }
        
        if (strlen($data['degree']) < 3) {
            throw new UniversityVerificationException('El título debe tener al menos 3 caracteres', 400);
        }
    }
    
    /**
     * Simulate university verification
     * In production, this would integrate with actual university systems
     */
    private function simulateUniversityVerification(array $data, array $universityInfo): array {
        // Simulate different verification scenarios
        $random = rand(1, 100);
        
        if ($random <= 85) {
            // 85% success rate for demonstration
            return [
                'verified' => true,
                'type' => 'automated',
                'status' => 'verified',
                'confidence' => 95
            ];
        } elseif ($random <= 95) {
            // 10% require manual review
            return [
                'verified' => false,
                'type' => 'manual_review',
                'status' => 'pending_review',
                'confidence' => 70
            ];
        } else {
            // 5% verification failed
            return [
                'verified' => false,
                'type' => 'automated',
                'status' => 'verification_failed',
                'confidence' => 0
            ];
        }
    }
    
    /**
     * Get list of supported universities
     */
    public function getSupportedUniversities(): array {
        $universities = [];
        
        foreach (self::PUBLIC_UNIVERSITIES as $code => $name) {
            $universities[] = [
                'code' => $code,
                'name' => $name,
                'type' => 'public',
                'is_public' => true
            ];
        }
        
        foreach (self::PRIVATE_UNIVERSITIES as $code => $name) {
            $universities[] = [
                'code' => $code,
                'name' => $name,
                'type' => 'private',
                'is_public' => false
            ];
        }
        
        return $universities;
    }
    
    /**
     * Check if university is public
     */
    public function isPublicUniversity(string $universityCode): bool {
        return isset(self::PUBLIC_UNIVERSITIES[$universityCode]);
    }
    
    /**
     * Get university trust score
     */
    public function getUniversityTrustScore(string $universityCode): int {
        if (isset(self::PUBLIC_UNIVERSITIES[$universityCode])) {
            return 15; // Public universities get higher score
        }
        
        if (isset(self::PRIVATE_UNIVERSITIES[$universityCode])) {
            return 10; // Private universities get medium score
        }
        
        return 0; // Unknown university
    }
}

/**
 * University Verification Exception
 */
class UniversityVerificationException extends Exception {
    public function __construct($message = "", $code = 0, Throwable $previous = null) {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * University Logger
 */
class UniversityLogger {
    
    public function info(string $message): void {
        $this->log('INFO', $message);
    }
    
    public function error(string $message): void {
        $this->log('ERROR', $message);
    }
    
    private function log(string $level, string $message): void {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [UNIVERSITY] [{$level}] {$message}" . PHP_EOL;
        error_log($logMessage);
    }
}
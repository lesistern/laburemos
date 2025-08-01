<?php
/**
 * Trust Signal Engine Professional
 * Sistema avanzado de confianza y verificación para LaburAR
 * 
 * Implementa verificaciones argentinas específicas:
 * - CUIT/CUIL con AFIP
 * - Títulos universitarios
 * - Matrículas profesionales
 * - MercadoPago verification
 * 
 * @author LaburAR Team  
 * @version 2.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/TrustSignalEngine.php';
require_once __DIR__ . '/AfipVerificationService.php';
require_once __DIR__ . '/UniversityVerificationService.php';
require_once __DIR__ . '/ProfessionalChamberService.php';
require_once __DIR__ . '/MercadoPagoVerificationService.php';
require_once __DIR__ . '/DatabaseHelper.php';

class TrustSignalEnginePro extends TrustSignalEngine {
    
    private $afipService;
    private $universityService;
    private $chamberService;
    private $mercadoPagoService;
    
    public function __construct() {
        parent::__construct();
        $this->afipService = new AfipVerificationService();
        $this->universityService = new UniversityVerificationService();
        $this->chamberService = new ProfessionalChamberService();
        $this->mercadoPagoService = new MercadoPagoVerificationService();
    }
    
    /**
     * Get comprehensive trust score with Argentine specifics
     */
    public function calculateTrustScore($user): array {
        $score = 0;
        $maxScore = 100;
        $factors = [];
        
        // Base verification factors
        $verificationScore = $this->calculateVerificationScore($user);
        $score += $verificationScore['score'];
        $factors['verification'] = $verificationScore;
        
        // Performance factors
        $performanceScore = $this->calculatePerformanceScore($user);
        $score += $performanceScore['score'];
        $factors['performance'] = $performanceScore;
        
        // Argentine-specific factors
        $argentineScore = $this->calculateArgentineScore($user);
        $score += $argentineScore['score'];
        $factors['argentine_factors'] = $argentineScore;
        
        // Professional credentials
        $professionalScore = $this->calculateProfessionalScore($user);
        $score += $professionalScore['score'];
        $factors['professional'] = $professionalScore;
        
        return [
            'total_score' => min($score, $maxScore),
            'percentage' => min(($score / $maxScore) * 100, 100),
            'level' => $this->determineTrustLevel($score),
            'factors' => $factors,
            'badges' => $this->generateTrustBadges($user, $factors),
            'next_milestone' => $this->getNextMilestone($score),
            'updated_at' => date('Y-m-d H:i:s')
        ];
    }
    
    private function calculateVerificationScore($user): array {
        $score = 0;
        $details = [];
        
        // Email verification (basic requirement)
        if ($user['email_verified_at']) {
            $score += 5;
            $details['email'] = ['verified' => true, 'points' => 5];
        }
        
        // Phone verification
        if ($user['phone_verified_at']) {
            $score += 10;
            $details['phone'] = ['verified' => true, 'points' => 10];
        }
        
        $cuitData = $this->getCUITVerification($user);
        if ($cuitData['verified']) {
            $score += 20;
            $details['cuit'] = [
                'verified' => true, 
                'points' => 20,
                'type' => $cuitData['type'],
                'verified_at' => $cuitData['verified_at']
            ];
        }
        
        // Government ID verification
        $idData = $this->getIDVerification($user);
        if ($idData['verified']) {
            $score += 15;
            $details['government_id'] = [
                'verified' => true,
                'points' => 15,
                'document_type' => $idData['document_type']
            ];
        }
        
        // MercadoPago verification
        $mpData = $this->getMercadoPagoVerification($user);
        if ($mpData['verified']) {
            $score += 15;
            $details['mercadopago'] = [
                'verified' => true,
                'points' => 15,
                'account_level' => $mpData['account_level']
            ];
        }
        
        return [
            'score' => $score,
            'max_score' => 65,
            'details' => $details
        ];
    }
    
    private function calculateArgentineScore($user): array {
        $score = 0;
        $details = [];
        
        $universityData = $this->getUniversityVerification($user);
        if ($universityData['verified']) {
            $points = $universityData['is_public'] ? 15 : 10; // Public universities get more points
            $score += $points;
            $details['university'] = [
                'verified' => true,
                'points' => $points,
                'university' => $universityData['university_name'],
                'degree' => $universityData['degree'],
                'is_public' => $universityData['is_public']
            ];
        }
        
        // Professional chamber membership
        $chamberData = $this->getChamberVerification($user);
        if ($chamberData['verified']) {
            $score += 15;
            $details['professional_chamber'] = [
                'verified' => true,
                'points' => 15,
                'chamber' => $chamberData['chamber_name'],
                'registration_number' => $chamberData['registration_number'],
                'status' => $chamberData['status']
            ];
        }
        
        // Argentine business registration
        $businessData = $this->getBusinessRegistration($user);
        if ($businessData['verified']) {
            $score += 10;
            $details['business_registration'] = [
                'verified' => true,
                'points' => 10,
                'business_name' => $businessData['business_name'],
                'registration_type' => $businessData['type']
            ];
        }
        
        return [
            'score' => $score,
            'max_score' => 40,
            'details' => $details
        ];
    }
    
    private function calculatePerformanceScore($user): array {
        $score = 0;
        $details = [];
        
        // Completion rate
        $completionRate = $this->getUserCompletionRate($user['id']);
        if ($completionRate >= 98) {
            $score += 10;
        } elseif ($completionRate >= 95) {
            $score += 8;
        } elseif ($completionRate >= 90) {
            $score += 5;
        }
        $details['completion_rate'] = [
            'rate' => $completionRate,
            'points' => $this->getCompletionPoints($completionRate)
        ];
        
        // Average rating
        $avgRating = $this->getUserAverageRating($user['id']);
        if ($avgRating >= 4.9) {
            $score += 10;
        } elseif ($avgRating >= 4.7) {
            $score += 8;
        } elseif ($avgRating >= 4.5) {
            $score += 5;
        }
        
        // Response time
        $avgResponseTime = $this->getUserAverageResponseTime($user['id']); // in minutes
        if ($avgResponseTime <= 60) {
            $score += 5;
        } elseif ($avgResponseTime <= 180) {
            $score += 3;
        }
        
        // Project count
        $projectCount = $this->getUserCompletedProjectsCount($user['id']);
        if ($projectCount >= 100) {
            $score += 10;
        } elseif ($projectCount >= 50) {
            $score += 8;
        } elseif ($projectCount >= 20) {
            $score += 5;
        } elseif ($projectCount >= 10) {
            $score += 3;
        }
        
        return [
            'score' => $score,
            'max_score' => 35,
            'details' => $details
        ];
    }
    
    private function calculateProfessionalScore($user): array {
        $score = 0;
        $details = [];
        
        // Portfolio completeness
        $portfolioScore = $this->calculatePortfolioScore($user);
        $score += $portfolioScore;
        $details['portfolio'] = ['score' => $portfolioScore, 'max' => 10];
        
        // Skills verification
        $skillsScore = $this->calculateSkillsScore($user);
        $score += $skillsScore;
        $details['skills'] = ['score' => $skillsScore, 'max' => 5];
        
        return [
            'score' => $score,
            'max_score' => 15,
            'details' => $details
        ];
    }
    
    /**
     * Generate trust badges based on verification and performance
     */
    public function generateTrustBadges($user, array $factors): array {
        $badges = [];
        
        // Verification badges
        if ($factors['verification']['details']['cuit']['verified'] ?? false) {
            $badges[] = [
                'type' => 'verification',
                'level' => 'high',
                'key' => 'cuit_verified',
                'title' => 'CUIT Verificado',
                'description' => 'Identidad fiscal argentina verificada por AFIP',
                'icon' => 'shield-check',
                'color' => 'success',
                'priority' => 90
            ];
        }
        
        if ($factors['verification']['details']['mercadopago']['verified'] ?? false) {
            $badges[] = [
                'type' => 'payment',
                'level' => 'high',
                'key' => 'mercadopago_verified',
                'title' => 'Pagos Verificados',
                'description' => 'Cuenta MercadoPago verificada para transacciones seguras',
                'icon' => 'credit-card-check',
                'color' => 'primary',
                'priority' => 85
            ];
        }
        
        // Professional badges
        if ($factors['argentine_factors']['details']['university']['verified'] ?? false) {
            $university = $factors['argentine_factors']['details']['university'];
            $badges[] = [
                'type' => 'education',
                'level' => $university['is_public'] ? 'high' : 'medium',
                'key' => 'university_verified',
                'title' => 'Título Universitario',
                'description' => $university['degree'] . ' - ' . $university['university'],
                'icon' => 'academic-cap',
                'color' => $university['is_public'] ? 'success' : 'info',
                'priority' => 80
            ];
        }
        
        if ($factors['argentine_factors']['details']['professional_chamber']['verified'] ?? false) {
            $chamber = $factors['argentine_factors']['details']['professional_chamber'];
            $badges[] = [
                'type' => 'professional',
                'level' => 'high',
                'key' => 'chamber_verified',
                'title' => 'Profesional Matriculado',
                'description' => $chamber['chamber'],
                'icon' => 'briefcase-check',
                'color' => 'warning',
                'priority' => 75
            ];
        }
        
        // Performance badges
        $totalScore = $factors['verification']['score'] + $factors['performance']['score'] + $factors['argentine_factors']['score'];
        
        if ($totalScore >= 90) {
            $badges[] = [
                'type' => 'level',
                'level' => 'expert',
                'key' => 'freelancer_expert',
                'title' => 'Freelancer Expert',
                'description' => 'Máximo nivel de confianza y experiencia',
                'icon' => 'star-crown',
                'color' => 'gold',
                'priority' => 100
            ];
        } elseif ($totalScore >= 70) {
            $badges[] = [
                'type' => 'level',
                'level' => 'pro',
                'key' => 'freelancer_pro',
                'title' => 'Freelancer Pro',
                'description' => 'Alto nivel de confianza y experiencia comprobada',
                'icon' => 'star-pro',
                'color' => 'primary',
                'priority' => 95
            ];
        } elseif ($totalScore >= 50) {
            $badges[] = [
                'type' => 'level',
                'level' => 'verified',
                'key' => 'freelancer_verified',
                'title' => 'Freelancer Verificado',
                'description' => 'Perfil verificado y confiable',
                'icon' => 'shield-verified',
                'color' => 'success',
                'priority' => 90
            ];
        }
        
        // Service-specific badges
        if ($this->getUserAverageResponseTime($user['id']) <= 60) {
            $badges[] = [
                'type' => 'service',
                'level' => 'medium',
                'key' => 'quick_response',
                'title' => 'Respuesta Rápida',
                'description' => 'Responde en menos de 1 hora',
                'icon' => 'clock-fast',
                'color' => 'info',
                'priority' => 60
            ];
        }
        
        if ($this->isUserOnline($user['id'])) {
            $badges[] = [
                'type' => 'status',
                'level' => 'low',
                'key' => 'online_now',
                'title' => 'En Línea',
                'description' => 'Disponible ahora',
                'icon' => 'circle-online',
                'color' => 'success',
                'priority' => 50
            ];
        }
        
        // Sort by priority
        usort($badges, function($a, $b) {
            return $b['priority'] - $a['priority'];
        });
        
        return $badges;
    }
    
    /**
     * Get CUIT verification data - REAL DATA
     */
    private function getCUITVerification($user): array {
        $verificationStats = DatabaseHelper::getVerificationStats($user['id']);
        
        if (!$verificationStats['cuit_verified']) {
            return [
                'verified' => false,
                'cuit' => null,
                'type' => null,
                'verified_at' => null,
                'afip_status' => null
            ];
        }
        
        // Get detailed CUIT data from user_verifications table
        $connection = DatabaseHelper::getConnection();
        if ($connection) {
            try {
                $stmt = $connection->prepare(
                    "SELECT data FROM user_verifications WHERE user_id = ? AND type = 'cuit' AND status = 'verified'"
                );
                $stmt->execute([$user['id']]);
                $result = $stmt->fetch();
                
                if ($result) {
                    $data = json_decode($result['data'], true);
                    return [
                        'verified' => true,
                        'cuit' => $data['cuit'] ?? null,
                        'type' => $data['taxpayer_type'] ?? 'individual',
                        'verified_at' => $data['verified_at'] ?? null,
                        'afip_status' => $data['afip_status'] ?? 'active'
                    ];
                }
            } catch (Exception $e) {
                error_log("Error fetching CUIT verification: " . $e->getMessage());
            }
        }
        
        return [
            'verified' => false,
            'cuit' => null,
            'type' => null,
            'verified_at' => null,
            'afip_status' => null
        ];
    }
    
    /**
     * Get ID verification data - REAL DATA
     */
    private function getIDVerification($user): array {
        $verificationStats = DatabaseHelper::getVerificationStats($user['id']);
        
        return [
            'verified' => !empty($user['identity_verified_at']),
            'document_type' => $user['document_type'] ?? 'DNI'
        ];
    }
    
    /**
     * Get MercadoPago verification data - REAL DATA
     */
    private function getMercadoPagoVerification($user): array {
        $connection = DatabaseHelper::getConnection();
        if ($connection) {
            try {
                $stmt = $connection->prepare(
                    "SELECT data FROM user_verifications WHERE user_id = ? AND type = 'mercadopago' AND status = 'verified'"
                );
                $stmt->execute([$user['id']]);
                $result = $stmt->fetch();
                
                if ($result) {
                    $data = json_decode($result['data'], true);
                    return [
                        'verified' => true,
                        'account_level' => $data['verification_level'] ?? 'basic',
                        'account_type' => $data['account_type'] ?? 'personal'
                    ];
                }
            } catch (Exception $e) {
                error_log("Error fetching MercadoPago verification: " . $e->getMessage());
            }
        }
        
        return [
            'verified' => false,
            'account_level' => 'basic'
        ];
    }
    
    /**
     * Get university verification data - REAL DATA
     */
    private function getUniversityVerification($user): array {
        $connection = DatabaseHelper::getConnection();
        if ($connection) {
            try {
                $stmt = $connection->prepare(
                    "SELECT data FROM user_verifications WHERE user_id = ? AND type = 'university' AND status = 'verified'"
                );
                $stmt->execute([$user['id']]);
                $result = $stmt->fetch();
                
                if ($result) {
                    $data = json_decode($result['data'], true);
                    return [
                        'verified' => true,
                        'university_name' => $data['university_name'] ?? null,
                        'degree' => $data['degree'] ?? null,
                        'is_public' => $data['is_public'] ?? false
                    ];
                }
            } catch (Exception $e) {
                error_log("Error fetching university verification: " . $e->getMessage());
            }
        }
        
        return [
            'verified' => false,
            'university_name' => null,
            'degree' => null,
            'is_public' => false
        ];
    }
    
    /**
     * Get chamber verification data - REAL DATA
     */
    private function getChamberVerification($user): array {
        $connection = DatabaseHelper::getConnection();
        if ($connection) {
            try {
                $stmt = $connection->prepare(
                    "SELECT data FROM user_verifications WHERE user_id = ? AND type = 'chamber' AND status = 'verified'"
                );
                $stmt->execute([$user['id']]);
                $result = $stmt->fetch();
                
                if ($result) {
                    $data = json_decode($result['data'], true);
                    return [
                        'verified' => true,
                        'chamber_name' => $data['chamber_name'] ?? null,
                        'registration_number' => $data['registration_number'] ?? null,
                        'status' => $data['status'] ?? 'active'
                    ];
                }
            } catch (Exception $e) {
                error_log("Error fetching chamber verification: " . $e->getMessage());
            }
        }
        
        return [
            'verified' => false,
            'chamber_name' => null,
            'registration_number' => null,
            'status' => null
        ];
    }
    
    /**
     * Get business registration data - REAL DATA
     */
    private function getBusinessRegistration($user): array {
        $connection = DatabaseHelper::getConnection();
        if ($connection) {
            try {
                $stmt = $connection->prepare(
                    "SELECT business_name, business_type FROM users WHERE id = ? AND business_verified_at IS NOT NULL"
                );
                $stmt->execute([$user['id']]);
                $result = $stmt->fetch();
                
                if ($result) {
                    return [
                        'verified' => true,
                        'business_name' => $result['business_name'],
                        'type' => $result['business_type'] ?? 'individual'
                    ];
                }
            } catch (Exception $e) {
                error_log("Error fetching business registration: " . $e->getMessage());
            }
        }
        
        return [
            'verified' => false,
            'business_name' => null,
            'type' => null
        ];
    }
    
    /**
     * Initiate CUIT verification with AFIP
     */
    public function initiateCUITVerification(string $cuit, int $userId): array {
        // Validate CUIT format
        if (!$this->isValidCUITFormat($cuit)) {
            throw new InvalidArgumentException('Formato de CUIT inválido');
        }
        
        // Check if already verified
        $existing = $this->getExistingCUITVerification($userId);
        if ($existing) {
            throw new Exception('CUIT ya verificado');
        }
        
        // Create verification request
        $requestData = [
            'user_id' => $userId,
            'type' => 'cuit',
            'data' => [
                'cuit' => $cuit,
                'requested_at' => date('Y-m-d H:i:s'),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'localhost'
            ],
            'status' => 'pending',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+7 days'))
        ];
        
        // Queue AFIP verification job (mock implementation)
        $this->queueAfipVerification($requestData);
        
        // Log verification attempt
        error_log("CUIT verification initiated for user {$userId}: {$cuit}");
        
        return $requestData;
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
     * Determine trust level based on score
     */
    private function determineTrustLevel(int $score): string {
        if ($score >= 90) return 'expert';
        if ($score >= 70) return 'pro';
        if ($score >= 50) return 'verified';
        if ($score >= 30) return 'basic';
        return 'new';
    }
    
    /**
     * Get next milestone for user
     */
    private function getNextMilestone(int $currentScore): ?array {
        $milestones = [
            30 => ['level' => 'basic', 'description' => 'Completa tu perfil básico'],
            50 => ['level' => 'verified', 'description' => 'Verifica tu email y teléfono'],
            70 => ['level' => 'pro', 'description' => 'Agrega verificaciones profesionales'],
            90 => ['level' => 'expert', 'description' => 'Máximo nivel de confianza']
        ];
        
        foreach ($milestones as $score => $milestone) {
            if ($currentScore < $score) {
                return [
                    'target' => $score,
                    'current' => $currentScore,
                    'progress' => ($currentScore / $score) * 100,
                    'level' => $milestone['level'],
                    'description' => $milestone['description']
                ];
            }
        }
        
        return null; // Already at max level
    }
    
    // Helper methods for data retrieval - REAL DATA IMPLEMENTATION
    private function getUserCompletionRate(int $userId): float {
        return DatabaseHelper::getUserCompletionRate($userId);
    }
    
    private function getUserAverageRating(int $userId): float {
        $stats = DatabaseHelper::getUserStats($userId);
        return $stats['average_rating'] ?? 0.0;
    }
    
    private function getUserAverageResponseTime(int $userId): int {
        $stats = DatabaseHelper::getUserStats($userId);
        return $stats['response_time_minutes'] ?? 60;
    }
    
    private function getUserCompletedProjectsCount(int $userId): int {
        $stats = DatabaseHelper::getUserStats($userId);
        return $stats['projects_completed'] ?? 0;
    }
    
    private function isUserOnline(int $userId): bool {
        return DatabaseHelper::isUserOnline($userId);
    }
    
    private function calculatePortfolioScore($user): int {
        // Real portfolio score based on user data
        $userId = $user['id'];
        $stats = DatabaseHelper::getUserStats($userId);
        
        $score = 0;
        
        // Portfolio items count
        if ($stats['projects_completed'] >= 10) $score += 4;
        elseif ($stats['projects_completed'] >= 5) $score += 3;
        elseif ($stats['projects_completed'] >= 1) $score += 2;
        
        // Rating quality
        if ($stats['average_rating'] >= 4.8) $score += 3;
        elseif ($stats['average_rating'] >= 4.5) $score += 2;
        elseif ($stats['average_rating'] >= 4.0) $score += 1;
        
        // Review count
        if ($stats['review_count'] >= 20) $score += 3;
        elseif ($stats['review_count'] >= 10) $score += 2;
        elseif ($stats['review_count'] >= 5) $score += 1;
        
        return min($score, 10);
    }
    
    private function calculateSkillsScore($user): int {
        // Real skills score based on user performance
        $userId = $user['id'];
        $stats = DatabaseHelper::getUserStats($userId);
        
        $score = 0;
        
        // Performance indicators
        if ($stats['completion_rate'] >= 95) $score += 2;
        elseif ($stats['completion_rate'] >= 90) $score += 1;
        
        // Response time
        if ($stats['response_time_minutes'] <= 30) $score += 2;
        elseif ($stats['response_time_minutes'] <= 60) $score += 1;
        
        // Experience level
        if ($stats['projects_completed'] >= 50) $score += 1;
        
        return min($score, 5);
    }
    
    private function getCompletionPoints(float $completionRate): int {
        if ($completionRate >= 98) return 10;
        if ($completionRate >= 95) return 8;
        if ($completionRate >= 90) return 5;
        return 0;
    }
    
    private function getExistingCUITVerification(int $userId): ?array {
        // Mock implementation - replace with database query
        return null;
    }
    
    private function queueAfipVerification(array $requestData): void {
        // Mock implementation - replace with actual job queue
        error_log("Queued AFIP verification: " . json_encode($requestData));
    }
}
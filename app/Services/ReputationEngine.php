<?php
/**
 * Reputation Engine
 * LaburAR Complete Platform - Phase 5
 * 
 * Advanced reputation calculation engine with multiple algorithms,
 * badge system, achievements, and trust scoring
 */

require_once __DIR__ . '/Database.php';

class ReputationEngine {
    private $db;
    private $pdo;
    
    // Reputation weights and thresholds
    private const WEIGHTS = [
        'rating_base' => 20,          // Base score from average rating (max 100)
        'volume_bonus' => 10,         // Bonus for number of reviews
        'recommendation_bonus' => 15,  // Bonus for recommendations
        'consistency_bonus' => 5,     // Bonus for consistent ratings
        'recency_bonus' => 10,        // Bonus for recent activity
        'quality_bonus' => 15,        // Bonus for detailed reviews received
        'response_bonus' => 5,        // Bonus for responding to reviews
        'completion_bonus' => 20      // Bonus for project completion rates
    ];
    
    private const BADGE_THRESHOLDS = [
        'new_user' => ['reviews' => 0, 'rating' => 0],
        'rising_star' => ['reviews' => 5, 'rating' => 4.5],
        'trusted_professional' => ['reviews' => 25, 'rating' => 4.7],
        'elite_expert' => ['reviews' => 100, 'rating' => 4.8],
        'legendary_master' => ['reviews' => 500, 'rating' => 4.9]
    ];
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->pdo = $this->db->getConnection();
    }
    
    // ===== Core Reputation Calculation =====
    
    public function calculateComprehensiveReputation($userId) {
        try {
            $userType = $this->getUserType($userId);
            
            // Get all relevant metrics
            $metrics = $this->gatherUserMetrics($userId);
            
            // Calculate individual scores
            $scores = [
                'rating_score' => $this->calculateRatingScore($metrics),
                'volume_score' => $this->calculateVolumeScore($metrics),
                'recommendation_score' => $this->calculateRecommendationScore($metrics),
                'consistency_score' => $this->calculateConsistencyScore($metrics),
                'recency_score' => $this->calculateRecencyScore($metrics),
                'quality_score' => $this->calculateQualityScore($metrics),
                'response_score' => $this->calculateResponseScore($metrics),
                'completion_score' => $this->calculateCompletionScore($metrics, $userType)
            ];
            
            // Apply weights and calculate final score
            $finalScore = 0;
            foreach ($scores as $type => $score) {
                $weight = str_replace('_score', '_bonus', $type);
                if ($weight === 'rating_bonus') $weight = 'rating_base';
                $finalScore += $score * (self::WEIGHTS[$weight] / 100);
            }
            
            // Cap at 100
            $finalScore = min(100, $finalScore);
            
            // Calculate trust indicators
            $trustIndicators = $this->calculateTrustIndicators($userId, $metrics);
            
            // Determine badges and achievements
            $badges = $this->calculateBadges($metrics);
            $achievements = $this->calculateAchievements($userId, $metrics);
            
            // Update reputation record
            $this->updateReputationRecord($userId, [
                'reputation_score' => $finalScore,
                'trust_indicators' => $trustIndicators,
                'badges' => $badges,
                'achievements' => $achievements,
                'detailed_scores' => $scores
            ]);
            
            return [
                'reputation_score' => $finalScore,
                'detailed_scores' => $scores,
                'trust_indicators' => $trustIndicators,
                'badges' => $badges,
                'achievements' => $achievements
            ];
            
        } catch (Exception $e) {
            error_log('[ReputationEngine::calculateComprehensiveReputation] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Individual Score Calculations =====
    
    private function calculateRatingScore($metrics) {
        if ($metrics['total_reviews'] == 0) return 0;
        
        // Base score from average rating (1-5 scale to 0-100)
        $baseScore = ($metrics['average_rating'] - 1) * 25; // Scale 1-5 to 0-100
        
        // Penalty for very few reviews
        if ($metrics['total_reviews'] < 5) {
            $baseScore *= ($metrics['total_reviews'] / 5);
        }
        
        return min(100, $baseScore);
    }
    
    private function calculateVolumeScore($metrics) {
        if ($metrics['total_reviews'] == 0) return 0;
        
        // Logarithmic scaling for review volume
        $volumeScore = log10($metrics['total_reviews'] + 1) * 25;
        
        // Bonus thresholds
        if ($metrics['total_reviews'] >= 100) $volumeScore += 20;
        elseif ($metrics['total_reviews'] >= 50) $volumeScore += 15;
        elseif ($metrics['total_reviews'] >= 25) $volumeScore += 10;
        elseif ($metrics['total_reviews'] >= 10) $volumeScore += 5;
        
        return min(100, $volumeScore);
    }
    
    private function calculateRecommendationScore($metrics) {
        if ($metrics['total_recommendations'] == 0) return 50; // Neutral
        
        $recommendationRate = $metrics['positive_recommendations'] / $metrics['total_recommendations'];
        return $recommendationRate * 100;
    }
    
    private function calculateConsistencyScore($metrics) {
        if ($metrics['total_reviews'] < 3) return 50; // Not enough data
        
        // Calculate standard deviation of ratings received
        $ratings = $this->getUserRatings($metrics['user_id']);
        $variance = $this->calculateVariance($ratings);
        $stdDev = sqrt($variance);
        
        // Lower standard deviation = higher consistency = higher score
        // Scale: 0 std dev = 100 points, 2.0 std dev = 0 points
        $consistencyScore = max(0, 100 - ($stdDev * 50));
        
        return $consistencyScore;
    }
    
    private function calculateRecencyScore($metrics) {
        if (!$metrics['last_review_at']) return 0;
        
        $daysSinceLastReview = $this->daysSince($metrics['last_review_at']);
        
        // Scoring: Recent activity gets higher scores
        if ($daysSinceLastReview <= 30) return 100;
        elseif ($daysSinceLastReview <= 90) return 80;
        elseif ($daysSinceLastReview <= 180) return 60;
        elseif ($daysSinceLastReview <= 365) return 40;
        else return 20;
    }
    
    private function calculateQualityScore($metrics) {
        // Score based on quality of reviews received (detailed ratings)
        $detailedRatings = ['communication', 'quality', 'timeliness', 'professionalism'];
        $totalDetailScore = 0;
        $detailCount = 0;
        
        foreach ($detailedRatings as $aspect) {
            $avgKey = "avg_{$aspect}";
            if (isset($metrics[$avgKey]) && $metrics[$avgKey] > 0) {
                $totalDetailScore += $metrics[$avgKey];
                $detailCount++;
            }
        }
        
        if ($detailCount == 0) return 50; // No detailed ratings
        
        $avgDetailRating = $totalDetailScore / $detailCount;
        return ($avgDetailRating - 1) * 25; // Scale 1-5 to 0-100
    }
    
    private function calculateResponseScore($metrics) {
        // Score based on response rate to reviews
        if ($metrics['total_reviews'] == 0) return 50;
        
        $responseRate = $metrics['responses_given'] / $metrics['total_reviews'];
        return $responseRate * 100;
    }
    
    private function calculateCompletionScore($metrics, $userType) {
        if ($userType !== 'freelancer') return 100; // Not applicable to clients
        
        // For freelancers, score based on project completion and delivery rates
        $completionRate = $metrics['completion_rate'] ?? 0;
        $onTimeRate = $metrics['on_time_delivery_rate'] ?? 0;
        
        // Weighted average: 60% completion, 40% on-time delivery
        return ($completionRate * 0.6 + $onTimeRate * 0.4);
    }
    
    // ===== Trust Indicators =====
    
    private function calculateTrustIndicators($userId, $metrics) {
        $indicators = [];
        
        // Account verification
        $indicators['account_verified'] = $this->isAccountVerified($userId);
        
        // Email verified
        $indicators['email_verified'] = $this->isEmailVerified($userId);
        
        // Profile completeness
        $indicators['profile_completeness'] = $this->calculateProfileCompleteness($userId);
        
        // Identity verification
        $indicators['identity_verified'] = $this->isIdentityVerified($userId);
        
        // Payment method verified
        $indicators['payment_verified'] = $this->hasVerifiedPaymentMethod($userId);
        
        // Active period
        $indicators['account_age_days'] = $this->getAccountAge($userId);
        
        // Fraud risk score (lower is better)
        $indicators['fraud_risk'] = $this->calculateFraudRisk($userId);
        
        // Response rate
        $indicators['response_rate'] = $metrics['response_rate'] ?? 0;
        
        // Project success rate
        $indicators['success_rate'] = $metrics['completion_rate'] ?? 0;
        
        return $indicators;
    }
    
    // ===== Badge System =====
    
    private function calculateBadges($metrics) {
        $badges = [];
        
        // Rating-based badges
        foreach (self::BADGE_THRESHOLDS as $badge => $threshold) {
            if ($metrics['total_reviews'] >= $threshold['reviews'] && 
                $metrics['average_rating'] >= $threshold['rating']) {
                $badges[] = $badge;
            }
        }
        
        // Special achievement badges
        if ($metrics['total_reviews'] > 0 && $metrics['average_rating'] == 5.0) {
            $badges[] = 'perfect_rating';
        }
        
        if ($metrics['total_reviews'] >= 10 && $metrics['recommendation_rate'] >= 95) {
            $badges[] = 'highly_recommended';
        }
        
        if ($this->hasConsecutiveHighRatings($metrics['user_id'], 10)) {
            $badges[] = 'consistent_quality';
        }
        
        return array_unique($badges);
    }
    
    // ===== Achievement System =====
    
    private function calculateAchievements($userId, $metrics) {
        $achievements = [];
        
        // Review milestones
        $reviewMilestones = [10, 25, 50, 100, 250, 500, 1000];
        foreach ($reviewMilestones as $milestone) {
            if ($metrics['total_reviews'] >= $milestone) {
                $achievements[] = "reviews_{$milestone}";
            }
        }
        
        // Rating achievements
        if ($metrics['average_rating'] >= 4.9 && $metrics['total_reviews'] >= 50) {
            $achievements[] = 'excellence_sustained';
        }
        
        // Special achievements
        if ($this->hasWorkedWithManyClients($userId)) {
            $achievements[] = 'client_magnet';
        }
        
        if ($this->hasHighValueProjects($userId)) {
            $achievements[] = 'high_value_expert';
        }
        
        if ($this->hasQuickTurnaround($userId)) {
            $achievements[] = 'speed_demon';
        }
        
        return array_unique($achievements);
    }
    
    // ===== Helper Methods =====
    
    private function gatherUserMetrics($userId) {
        try {
            // Get basic reputation data
            $stmt = $this->pdo->prepare("
                SELECT ur.*, 
                       (SELECT COUNT(*) FROM review_responses rr 
                        JOIN reviews r ON rr.review_id = r.id 
                        WHERE r.reviewee_id = ?) as responses_given,
                       (SELECT AVG(CASE WHEN response_time_hours IS NOT NULL THEN response_time_hours END)
                        FROM projects WHERE freelancer_id = ?) as avg_response_time
                FROM user_reputation ur 
                WHERE ur.user_id = ?
            ");
            $stmt->execute([$userId, $userId, $userId]);
            $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$metrics) {
                // Initialize empty metrics
                $metrics = [
                    'user_id' => $userId,
                    'total_reviews' => 0,
                    'average_rating' => 0,
                    'positive_recommendations' => 0,
                    'total_recommendations' => 0,
                    'recommendation_rate' => 0,
                    'last_review_at' => null,
                    'responses_given' => 0,
                    'completion_rate' => 0,
                    'on_time_delivery_rate' => 0,
                    'response_rate' => 0
                ];
            }
            
            // Get additional project-based metrics for freelancers
            if ($this->getUserType($userId) === 'freelancer') {
                $projectMetrics = $this->getFreelancerProjectMetrics($userId);
                $metrics = array_merge($metrics, $projectMetrics);
            }
            
            return $metrics;
            
        } catch (Exception $e) {
            error_log('[ReputationEngine::gatherUserMetrics] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    private function getFreelancerProjectMetrics($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total_projects,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
                    COUNT(CASE WHEN status = 'completed' AND delivered_on_time = TRUE THEN 1 END) as on_time_projects,
                    AVG(CASE WHEN response_time_hours IS NOT NULL THEN response_time_hours END) as avg_response_time_hours
                FROM projects 
                WHERE freelancer_id = ?
            ");
            $stmt->execute([$userId]);
            $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Calculate rates
            if ($metrics['total_projects'] > 0) {
                $metrics['completion_rate'] = ($metrics['completed_projects'] / $metrics['total_projects']) * 100;
                $metrics['on_time_delivery_rate'] = ($metrics['on_time_projects'] / $metrics['total_projects']) * 100;
            } else {
                $metrics['completion_rate'] = 0;
                $metrics['on_time_delivery_rate'] = 0;
            }
            
            $metrics['response_rate'] = min(100, max(0, 100 - ($metrics['avg_response_time_hours'] ?? 24)));
            
            return $metrics;
            
        } catch (Exception $e) {
            error_log('[ReputationEngine::getFreelancerProjectMetrics] Error: ' . $e->getMessage());
            return ['completion_rate' => 0, 'on_time_delivery_rate' => 0, 'response_rate' => 0];
        }
    }
    
    private function getUserRatings($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT overall_rating 
                FROM reviews 
                WHERE reviewee_id = ? AND moderation_status = 'approved'
            ");
            $stmt->execute([$userId]);
            
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
            
        } catch (Exception $e) {
            return [];
        }
    }
    
    private function calculateVariance($ratings) {
        if (count($ratings) < 2) return 0;
        
        $mean = array_sum($ratings) / count($ratings);
        $squaredDiffs = array_map(function($rating) use ($mean) {
            return pow($rating - $mean, 2);
        }, $ratings);
        
        return array_sum($squaredDiffs) / count($ratings);
    }
    
    private function daysSince($dateString) {
        if (!$dateString) return 9999;
        
        $date = new DateTime($dateString);
        $now = new DateTime();
        return $now->diff($date)->days;
    }
    
    private function getUserType($userId) {
        try {
            $stmt = $this->pdo->prepare("SELECT user_type FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            return $stmt->fetchColumn() ?: 'client';
        } catch (Exception $e) {
            return 'client';
        }
    }
    
    private function updateReputationRecord($userId, $data) {
        try {
            $userType = $this->getUserType($userId);
            
            $stmt = $this->pdo->prepare("
                INSERT INTO user_reputation (user_id, user_type, reputation_score, badges, achievements)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    reputation_score = VALUES(reputation_score),
                    badges = VALUES(badges),
                    achievements = VALUES(achievements),
                    updated_at = NOW()
            ");
            
            $stmt->execute([
                $userId,
                $userType,
                $data['reputation_score'],
                json_encode($data['badges']),
                json_encode($data['achievements'])
            ]);
            
        } catch (Exception $e) {
            error_log('[ReputationEngine::updateReputationRecord] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Trust Verification Methods =====
    
    private function isAccountVerified($userId) {
        try {
            $stmt = $this->pdo->prepare("SELECT email_verified_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            return !empty($stmt->fetchColumn());
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function isEmailVerified($userId) {
        return $this->isAccountVerified($userId); // Same check for now
    }
    
    private function calculateProfileCompleteness($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 10 ELSE 0 END +
                    CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 10 ELSE 0 END +
                    CASE WHEN bio IS NOT NULL AND bio != '' THEN 20 ELSE 0 END +
                    CASE WHEN profile_picture IS NOT NULL THEN 15 ELSE 0 END +
                    CASE WHEN location IS NOT NULL AND location != '' THEN 10 ELSE 0 END +
                    CASE WHEN phone IS NOT NULL AND phone != '' THEN 15 ELSE 0 END +
                    CASE WHEN website IS NOT NULL AND website != '' THEN 10 ELSE 0 END +
                    CASE WHEN linkedin_url IS NOT NULL AND linkedin_url != '' THEN 10 ELSE 0 END
                    as completeness
                FROM users WHERE id = ?
            ");
            $stmt->execute([$userId]);
            
            return $stmt->fetchColumn() ?? 0;
            
        } catch (Exception $e) {
            return 0;
        }
    }
    
    private function isIdentityVerified($userId) {
        // Placeholder for future identity verification system
        return false;
    }
    
    private function hasVerifiedPaymentMethod($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM payment_methods 
                WHERE user_id = ? AND is_verified = TRUE
            ");
            $stmt->execute([$userId]);
            
            return $stmt->fetchColumn() > 0;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function getAccountAge($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DATEDIFF(NOW(), created_at) as age_days 
                FROM users WHERE id = ?
            ");
            $stmt->execute([$userId]);
            
            return $stmt->fetchColumn() ?? 0;
            
        } catch (Exception $e) {
            return 0;
        }
    }
    
    private function calculateFraudRisk($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT AVG(fraud_score) as avg_fraud_score
                FROM reviews 
                WHERE reviewer_id = ?
            ");
            $stmt->execute([$userId]);
            
            return $stmt->fetchColumn() ?? 0;
            
        } catch (Exception $e) {
            return 0;
        }
    }
    
    // ===== Achievement Helper Methods =====
    
    private function hasConsecutiveHighRatings($userId, $count) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT overall_rating 
                FROM reviews 
                WHERE reviewee_id = ? AND moderation_status = 'approved'
                ORDER BY created_at DESC 
                LIMIT ?
            ");
            $stmt->execute([$userId, $count]);
            $ratings = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (count($ratings) < $count) return false;
            
            foreach ($ratings as $rating) {
                if ($rating < 4.5) return false;
            }
            
            return true;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function hasWorkedWithManyClients($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(DISTINCT client_id) as unique_clients
                FROM projects 
                WHERE freelancer_id = ? AND status = 'completed'
            ");
            $stmt->execute([$userId]);
            
            return $stmt->fetchColumn() >= 25;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function hasHighValueProjects($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as high_value_count
                FROM projects 
                WHERE freelancer_id = ? AND budget >= 50000 AND status = 'completed'
            ");
            $stmt->execute([$userId]);
            
            return $stmt->fetchColumn() >= 5;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function hasQuickTurnaround($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT AVG(response_time_hours) as avg_response
                FROM projects 
                WHERE freelancer_id = ? AND response_time_hours IS NOT NULL
            ");
            $stmt->execute([$userId]);
            
            $avgResponse = $stmt->fetchColumn();
            return $avgResponse && $avgResponse <= 2; // 2 hours or less
            
        } catch (Exception $e) {
            return false;
        }
    }
}
?>
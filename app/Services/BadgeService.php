<?php
/**
 * Badge Service
 * 
 * Business logic for badge assignment and management
 * 
 * @package LaburAR\Services
 * @author LaburAR Team
 * @since 2025-01-25
 */

require_once __DIR__ . '/../Models/Badge.php';
require_once __DIR__ . '/../Core/Database.php';

use LaburAR\Core\Database;

class BadgeService
{
    /**
     * Check and assign all eligible badges for a user
     */
    public static function checkAllBadges($userId)
    {
        $db = Database::getInstance()->getPDO();
        
        // Get user info
        $userQuery = "SELECT role FROM users WHERE id = :user_id LIMIT 1";
        $stmt = $db->prepare($userQuery);
        $stmt->execute(['user_id' => $userId]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user) {
            return [];
        }
        
        // Skip badge assignment for admin, moderator, and system users
        if (in_array($user['role'], ['admin', 'moderator', 'system', 'support'])) {
            return [];
        }
        
        $assignedBadges = [];
        
        // Check pioneer badges (first 100 users)
        $pioneerBadges = self::checkPioneerBadges($userId);
        $assignedBadges = array_merge($assignedBadges, $pioneerBadges);
        
        // Check project completion badges
        $projectBadges = self::checkProjectBadges($userId);
        $assignedBadges = array_merge($assignedBadges, $projectBadges);
        
        // Check earnings badges
        $earningsBadges = self::checkEarningsBadges($userId);
        $assignedBadges = array_merge($assignedBadges, $earningsBadges);
        
        // Check reputation badges
        $reputationBadges = self::checkReputationBadges($userId);
        $assignedBadges = array_merge($assignedBadges, $reputationBadges);
        
        // Check verification badges
        $verificationBadges = self::checkVerificationBadges($userId);
        $assignedBadges = array_merge($assignedBadges, $verificationBadges);
        
        return $assignedBadges;
    }
    
    /**
     * Check and assign pioneer badges (first 100 users)
     */
    private static function checkPioneerBadges($userId)
    {
        $assigned = [];
        $db = Database::getInstance()->getPDO();
        
        // Get user's registration rank (excluding admin/mod/system users)
        $query = "
            SELECT COUNT(*) + 1 as rank
            FROM users
            WHERE id < :user_id
            AND role NOT IN ('admin', 'moderator', 'system', 'support')
        ";
        $stmt = $db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        $result = $stmt->fetch();
        $userRank = $result['rank'];
        
        // Determine which pioneer badge to assign
        $badgeSlug = null;
        if ($userRank == 1) {
            $badgeSlug = 'fundador-1';
        } elseif ($userRank <= 10) {
            $badgeSlug = 'top-10-pioneros';
        } elseif ($userRank <= 25) {
            $badgeSlug = 'pionero-oro';
        } elseif ($userRank <= 50) {
            $badgeSlug = 'pionero-plata';
        } elseif ($userRank <= 100) {
            $badgeSlug = 'pionero-bronce';
        }
        
        if ($badgeSlug) {
            $badge = Badge::findBy('slug', $badgeSlug);
            if ($badge) {
                $result = Badge::assignToUser($userId, $badge['id'], ['user_rank' => $userRank]);
                if ($result['success']) {
                    $assigned[] = $badge;
                }
            }
        }
        
        // Check early adopter badge (within 30 days of launch)
        $launchDate = '2025-01-25';
        $daysSinceLaunch = floor((time() - strtotime($launchDate)) / 86400);
        if ($daysSinceLaunch <= 30) {
            $badge = Badge::findBy('slug', 'early-adopter');
            if ($badge) {
                $result = Badge::assignToUser($userId, $badge['id'], ['days_since_launch' => $daysSinceLaunch]);
                if ($result['success']) {
                    $assigned[] = $badge;
                }
            }
        }
        
        return $assigned;
    }
    
    /**
     * Check and assign project completion badges
     */
    private static function checkProjectBadges($userId)
    {
        $assigned = [];
        $db = Database::getInstance()->getPDO();
        
        // Get completed projects count
        $query = "SELECT COUNT(*) as count FROM projects WHERE freelancer_id = :user_id AND status = 'completed'";
        $stmt = $db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        $result = $stmt->fetch();
        $projectCount = $result['count'];
        
        // Badge thresholds
        $thresholds = [
            1 => 'primer-proyecto',
            5 => 'veterano-5',
            10 => 'profesional-10',
            25 => 'experto-25',
            50 => 'maestro-50',
            100 => 'leyenda-100'
        ];
        
        foreach ($thresholds as $threshold => $badgeSlug) {
            if ($projectCount >= $threshold) {
                $badge = Badge::findBy('slug', $badgeSlug);
                if ($badge) {
                    $result = Badge::assignToUser($userId, $badge['id'], ['projects_completed' => $projectCount]);
                    if ($result['success']) {
                        $assigned[] = $badge;
                    }
                }
            }
        }
        
        return $assigned;
    }
    
    /**
     * Check and assign earnings badges
     */
    private static function checkEarningsBadges($userId)
    {
        $assigned = [];
        $db = Database::getInstance()->getPDO();
        
        // Get total earnings
        $query = "
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = :user_id AND status = 'completed' AND type = 'income'
        ";
        $stmt = $db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        $result = $stmt->fetch();
        $totalEarnings = $result['total'];
        
        // Badge thresholds
        $thresholds = [
            1 => 'primer-peso',
            10000 => 'emprendedor-10k',
            50000 => 'profesional-50k',
            100000 => 'top-earner-100k',
            1000000 => 'millonario'
        ];
        
        foreach ($thresholds as $threshold => $badgeSlug) {
            if ($totalEarnings >= $threshold) {
                $badge = Badge::findBy('slug', $badgeSlug);
                if ($badge) {
                    $result = Badge::assignToUser($userId, $badge['id'], ['total_earnings' => $totalEarnings]);
                    if ($result['success']) {
                        $assigned[] = $badge;
                    }
                }
            }
        }
        
        return $assigned;
    }
    
    /**
     * Check and assign reputation badges
     */
    private static function checkReputationBadges($userId)
    {
        $assigned = [];
        $db = Database::getInstance()->getPDO();
        
        // Get rating statistics
        $query = "
            SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
            FROM reviews
            WHERE freelancer_id = :user_id
        ";
        $stmt = $db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        $result = $stmt->fetch();
        $avgRating = $result['avg_rating'] ?: 0;
        $reviewCount = $result['review_count'] ?: 0;
        
        // Check badges
        $badges = [
            ['slug' => 'estrella-naciente', 'min_rating' => 4.5, 'min_reviews' => 10],
            ['slug' => 'top-rated', 'min_rating' => 4.8, 'min_reviews' => 25],
            ['slug' => 'perfeccionista', 'min_rating' => 5.0, 'min_reviews' => 50]
        ];
        
        foreach ($badges as $badgeConfig) {
            if ($avgRating >= $badgeConfig['min_rating'] && $reviewCount >= $badgeConfig['min_reviews']) {
                $badge = Badge::findBy('slug', $badgeConfig['slug']);
                if ($badge) {
                    $result = Badge::assignToUser($userId, $badge['id'], [
                        'average_rating' => $avgRating,
                        'review_count' => $reviewCount
                    ]);
                    if ($result['success']) {
                        $assigned[] = $badge;
                    }
                }
            }
        }
        
        return $assigned;
    }
    
    /**
     * Check and assign verification badges
     */
    private static function checkVerificationBadges($userId)
    {
        $assigned = [];
        $db = Database::getInstance()->getPDO();
        
        // Get user verification status
        $query = "
            SELECT 
                MAX(CASE WHEN type = 'dni' AND status = 'verified' THEN 1 ELSE 0 END) as verified_dni,
                MAX(CASE WHEN type = 'cuit' AND status = 'verified' THEN 1 ELSE 0 END) as verified_cuit,
                MAX(CASE WHEN type = 'degree' AND status = 'verified' THEN 1 ELSE 0 END) as verified_degree
            FROM user_verifications
            WHERE user_id = :user_id
        ";
        $stmt = $db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        $verifications = $stmt->fetch();
        
        // Check individual verification badges
        if ($verifications['verified_dni']) {
            $badge = Badge::findBy('slug', 'identidad-verificada');
            if ($badge) {
                $result = Badge::assignToUser($userId, $badge['id'], ['verified_dni' => true]);
                if ($result['success']) {
                    $assigned[] = $badge;
                }
            }
        }
        
        if ($verifications['verified_cuit']) {
            $badge = Badge::findBy('slug', 'cuit-verificado');
            if ($badge) {
                $result = Badge::assignToUser($userId, $badge['id'], ['verified_cuit' => true]);
                if ($result['success']) {
                    $assigned[] = $badge;
                }
            }
        }
        
        if ($verifications['verified_degree']) {
            $badge = Badge::findBy('slug', 'profesional-certificado');
            if ($badge) {
                $result = Badge::assignToUser($userId, $badge['id'], ['verified_degree' => true]);
                if ($result['success']) {
                    $assigned[] = $badge;
                }
            }
        }
        
        // Check triple verification badge
        if ($verifications['verified_dni'] && $verifications['verified_cuit'] && $verifications['verified_degree']) {
            $badge = Badge::findBy('slug', 'triple-verificado');
            if ($badge) {
                $result = Badge::assignToUser($userId, $badge['id'], [
                    'verified_dni' => true,
                    'verified_cuit' => true,
                    'verified_degree' => true
                ]);
                if ($result['success']) {
                    $assigned[] = $badge;
                }
            }
        }
        
        return $assigned;
    }
    
    /**
     * Grant special badge manually
     */
    public static function grantSpecialBadge($userId, $badgeSlug, $metadata = null)
    {
        $badge = Badge::findBy('slug', $badgeSlug);
        if (!$badge) {
            return ['success' => false, 'message' => 'Badge no encontrado'];
        }
        
        // Check if badge is special/manual
        if ($badge['is_automatic']) {
            return ['success' => false, 'message' => 'Este badge se asigna automáticamente'];
        }
        
        return Badge::assignToUser($userId, $badge['id'], $metadata);
    }
    
    /**
     * Get next achievable badges for user
     */
    public static function getNextAchievableBadges($userId, $limit = 5)
    {
        $db = Database::getInstance()->getPDO();
        
        // Get badges user doesn't have yet
        $query = "
            SELECT b.*, bc.name as category_name
            FROM badges b
            JOIN badge_categories bc ON b.category_id = bc.id
            WHERE b.is_active = 1 
            AND b.is_automatic = 1
            AND b.id NOT IN (
                SELECT badge_id FROM user_badges WHERE user_id = :user_id
            )
            ORDER BY b.points ASC
            LIMIT :limit
        ";
        $stmt = $db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        
        $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate progress for each badge
        foreach ($badges as &$badge) {
            $progress = Badge::getBadgeProgress($userId, $badge['slug']);
            if ($progress) {
                $badge['progress'] = $progress['progress'];
                $badge['current_value'] = $progress['current'];
                $badge['required_value'] = $progress['required'];
            }
        }
        
        // Sort by progress (closest to completion first)
        usort($badges, function($a, $b) {
            $progressA = $a['progress'] ?? 0;
            $progressB = $b['progress'] ?? 0;
            return $progressB <=> $progressA;
        });
        
        return array_slice($badges, 0, $limit);
    }
}
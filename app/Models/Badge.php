<?php
/**
 * Badge Model
 * 
 * Manages badges and achievements in LaburAR
 * 
 * @package LaburAR\Models
 * @author LaburAR Team
 * @since 2025-01-25
 */

require_once __DIR__ . '/../Core/Database.php';

use LaburAR\Core\Database;

class Badge
{
    // Enhanced badge rarities with micro-optimized colors
    const RARITY_COLORS = [
        'common' => '#64748b',      // Slate - optimized for 16px visibility
        'rare' => '#3b82f6',        // Blue - high contrast
        'epic' => '#8b5cf6',        // Purple - distinctive
        'legendary' => '#f59e0b',   // Amber - premium feel
        'exclusive' => '#ec4899'    // Pink - ultra-rare
    ];
    
    // Badge rarity names in Spanish
    const RARITY_NAMES = [
        'common' => 'Común',
        'rare' => 'Raro',
        'epic' => 'Épico',
        'legendary' => 'Legendario',
        'exclusive' => 'Exclusivo'
    ];
    
    // Badge points by rarity (for micro system)
    const RARITY_POINTS = [
        'common' => 10,
        'rare' => 50,
        'epic' => 150,
        'legendary' => 500,
        'exclusive' => 1000
    ];
    
    // Fillable fields for API updates
    const FILLABLE_FIELDS = [
        'name', 'description', 'icon', 'rarity', 'points', 
        'requirements', 'is_active', 'display_order'
    ];
    
    /**
     * Get database connection
     */
    private static function getDB()
    {
        return Database::getInstance()->getPDO();
    }
    
    /**
     * Get all badge categories
     */
    public static function getCategories()
    {
        $db = self::getDB();
        $query = "SELECT * FROM badge_categories ORDER BY display_order ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Get badges by category
     */
    public static function getByCategory($categorySlug)
    {
        $db = self::getDB();
        $query = "
            SELECT b.*, bc.name as category_name, bc.color as category_color
            FROM badges b
            JOIN badge_categories bc ON b.category_id = bc.id
            WHERE bc.slug = :slug AND b.is_active = 1
            ORDER BY b.display_order ASC
        ";
        $stmt = $db->prepare($query);
        $stmt->execute(['slug' => $categorySlug]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Find badge by ID
     */
    public static function find($id)
    {
        $db = self::getDB();
        $query = "SELECT * FROM badges WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Find badge by slug
     */
    public static function findBy($field, $value)
    {
        $db = self::getDB();
        $query = "SELECT * FROM badges WHERE {$field} = :value LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->execute(['value' => $value]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Get user badges
     */
    public static function getUserBadges($userId, $featured = false)
    {
        $db = self::getDB();
        $query = "
            SELECT 
                b.*,
                bc.name as category_name,
                bc.slug as category_slug,
                bc.color as category_color,
                ub.earned_at,
                ub.progress,
                ub.metadata,
                ub.is_featured,
                ub.display_order as user_display_order
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            JOIN badge_categories bc ON b.category_id = bc.id
            WHERE ub.user_id = :user_id
        ";
        
        if ($featured) {
            $query .= " AND ub.is_featured = 1";
        }
        
        $query .= " ORDER BY ub.is_featured DESC, bc.display_order ASC, b.rarity DESC, ub.earned_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    
    /**
     * Get user badge statistics
     */
    public static function getUserStats($userId)
    {
        $db = self::getDB();
        $query = "
            SELECT 
                COUNT(DISTINCT ub.badge_id) as total_badges,
                COUNT(DISTINCT bc.id) as categories_unlocked,
                COALESCE(SUM(b.points), 0) as total_points,
                MAX(CASE WHEN b.rarity = 'legendary' THEN 1 ELSE 0 END) as has_legendary,
                MAX(CASE WHEN b.rarity = 'epic' THEN 1 ELSE 0 END) as has_epic,
                MAX(CASE WHEN b.rarity = 'exclusive' THEN 1 ELSE 0 END) as has_exclusive
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            JOIN badge_categories bc ON b.category_id = bc.id
            WHERE ub.user_id = :user_id
        ";
        $stmt = $db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Get badge leaderboard
     */
    public static function getLeaderboard($limit = 10)
    {
        $db = self::getDB();
        $query = "
            SELECT 
                u.id,
                u.username,
                u.profile_photo,
                COUNT(DISTINCT ub.badge_id) as badge_count,
                COALESCE(SUM(b.points), 0) as total_points,
                MAX(CASE WHEN b.rarity = 'legendary' THEN 1 ELSE 0 END) as has_legendary
            FROM users u
            LEFT JOIN user_badges ub ON u.id = ub.user_id
            LEFT JOIN badges b ON ub.badge_id = b.id
            GROUP BY u.id
            ORDER BY total_points DESC, badge_count DESC
            LIMIT :limit
        ";
        $stmt = $db->prepare($query);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Get fillable fields for API updates
     */
    public static function getFillable()
    {
        return self::FILLABLE_FIELDS;
    }
    
    /**
     * Update badge information
     */
    public static function update($id, $data)
    {
        $db = self::getDB();
        
        // Filter only fillable fields
        $fillableData = array_intersect_key($data, array_flip(self::FILLABLE_FIELDS));
        
        if (empty($fillableData)) {
            return false;
        }
        
        // Build update query
        $setPairs = [];
        foreach ($fillableData as $field => $value) {
            $setPairs[] = "{$field} = :{$field}";
        }
        
        $query = "UPDATE badges SET " . implode(', ', $setPairs) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        
        // Bind values
        foreach ($fillableData as $field => $value) {
            $stmt->bindValue(":{$field}", $value);
        }
        $stmt->bindValue(':id', $id, \PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    /**
     * Delete badge
     */
    public static function delete($id)
    {
        $db = self::getDB();
        
        try {
            $db->beginTransaction();
            
            // Delete user badge assignments first
            $query1 = "DELETE FROM user_badges WHERE badge_id = :id";
            $stmt1 = $db->prepare($query1);
            $stmt1->execute(['id' => $id]);
            
            // Delete badge milestones
            $query2 = "DELETE FROM badge_milestones WHERE badge_id = :id";
            $stmt2 = $db->prepare($query2);
            $stmt2->execute(['id' => $id]);
            
            // Delete the badge
            $query3 = "DELETE FROM badges WHERE id = :id";
            $stmt3 = $db->prepare($query3);
            $result = $stmt3->execute(['id' => $id]);
            
            $db->commit();
            return $result;
            
        } catch (\Exception $e) {
            $db->rollBack();
            return false;
        }
    }
    
    /**
     * Assign badge to user
     */
    public static function assignToUser($userId, $badgeId, $metadata = null)
    {
        $db = self::getDB();
        
        try {
            // Check if user already has this badge
            $checkQuery = "SELECT id FROM user_badges WHERE user_id = :user_id AND badge_id = :badge_id";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->execute(['user_id' => $userId, 'badge_id' => $badgeId]);
            
            if ($checkStmt->fetch()) {
                return [
                    'success' => false,
                    'message' => 'Usuario ya tiene este badge'
                ];
            }
            
            // Insert new badge assignment
            $insertQuery = "INSERT INTO user_badges (user_id, badge_id, metadata) VALUES (:user_id, :badge_id, :metadata)";
            $insertStmt = $db->prepare($insertQuery);
            $result = $insertStmt->execute([
                'user_id' => $userId,
                'badge_id' => $badgeId,
                'metadata' => $metadata ? json_encode($metadata) : null
            ]);
            
            if ($result) {
                // Get the badge info for response
                $badge = self::find($badgeId);
                
                return [
                    'success' => true,
                    'message' => 'Badge asignado exitosamente',
                    'badge' => $badge
                ];
            }
            
            return [
                'success' => false,
                'message' => 'Error al asignar badge'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error de base de datos: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Toggle featured status of user badge
     */
    public static function toggleFeatured($userId, $badgeId)
    {
        $db = self::getDB();
        
        try {
            // Check current featured status
            $query = "SELECT is_featured FROM user_badges WHERE user_id = :user_id AND badge_id = :badge_id";
            $stmt = $db->prepare($query);
            $stmt->execute(['user_id' => $userId, 'badge_id' => $badgeId]);
            $current = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$current) {
                return [
                    'success' => false,
                    'message' => 'Badge no encontrado para el usuario'
                ];
            }
            
            $newStatus = !($current['is_featured'] ?? false);
            
            // Update featured status
            $updateQuery = "UPDATE user_badges SET is_featured = :featured WHERE user_id = :user_id AND badge_id = :badge_id";
            $updateStmt = $db->prepare($updateQuery);
            $result = $updateStmt->execute([
                'featured' => $newStatus ? 1 : 0,
                'user_id' => $userId,
                'badge_id' => $badgeId
            ]);
            
            return [
                'success' => $result,
                'featured' => $newStatus,
                'message' => $result ? 'Estado actualizado' : 'Error al actualizar'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update badge progress for milestone tracking
     */
    public static function updateBadgeProgress($userId, $badgeId, $currentValue)
    {
        $db = self::getDB();
        
        try {
            // Get badge requirements
            $badge = self::find($badgeId);
            if (!$badge) {
                return false;
            }
            
            $requirements = json_decode($badge['requirements'], true);
            $requiredValue = $requirements['required_value'] ?? 1;
            
            // Update or insert milestone
            $query = "
                INSERT INTO badge_milestones (user_id, badge_id, current_value, required_value)
                VALUES (:user_id, :badge_id, :current_value, :required_value)
                ON DUPLICATE KEY UPDATE 
                current_value = :current_value,
                updated_at = NOW()
            ";
            
            $stmt = $db->prepare($query);
            $result = $stmt->execute([
                'user_id' => $userId,
                'badge_id' => $badgeId,
                'current_value' => $currentValue,
                'required_value' => $requiredValue
            ]);
            
            // Check if badge should be awarded
            if ($result && $currentValue >= $requiredValue) {
                self::assignToUser($userId, $badgeId, [
                    'auto_awarded' => true,
                    'final_value' => $currentValue,
                    'awarded_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            return $result;
            
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Get user badge progress for multiple badges
     */
    public static function getUserBadgeProgress($userId)
    {
        $db = self::getDB();
        $query = "
            SELECT 
                bm.*,
                b.name,
                b.slug,
                b.description,
                b.icon,
                b.rarity,
                b.points,
                CASE 
                    WHEN bm.current_value >= bm.required_value THEN 100
                    ELSE ROUND((bm.current_value / bm.required_value) * 100, 1)
                END as progress_percent
            FROM badge_milestones bm
            JOIN badges b ON bm.badge_id = b.id
            WHERE bm.user_id = :user_id
            ORDER BY progress_percent DESC, b.points DESC
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Get available badges (not yet earned by user)
     */
    public static function getAvailableBadges($userId = null)
    {
        $db = self::getDB();
        
        if ($userId) {
            $query = "
                SELECT b.*, bc.name as category_name
                FROM badges b
                JOIN badge_categories bc ON b.category_id = bc.id
                WHERE b.is_active = 1
                AND b.id NOT IN (
                    SELECT badge_id FROM user_badges WHERE user_id = :user_id
                )
                ORDER BY b.rarity DESC, b.points DESC
            ";
            $stmt = $db->prepare($query);
            $stmt->execute(['user_id' => $userId]);
        } else {
            $query = "
                SELECT b.*, bc.name as category_name
                FROM badges b
                JOIN badge_categories bc ON b.category_id = bc.id
                WHERE b.is_active = 1
                ORDER BY b.rarity DESC, b.points DESC
            ";
            $stmt = $db->prepare($query);
            $stmt->execute();
        }
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Get badge progress for progressive badges
     */
    public static function getBadgeProgress($userId, $badgeSlug)
    {
        $db = self::getDB();
        
        // Get badge info
        $badge = self::findBy('slug', $badgeSlug);
        if (!$badge) {
            return null;
        }
        
        $criteria = json_decode($badge['criteria'], true);
        $progress = 0;
        $current = 0;
        $required = 0;
        
        // Calculate progress based on badge type
        if (isset($criteria['projects_completed'])) {
            $query = "SELECT COUNT(*) as count FROM projects WHERE freelancer_id = :user_id AND status = 'completed'";
            $stmt = $db->prepare($query);
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch();
            $current = $result['count'];
            $required = $criteria['projects_completed'];
            $progress = min(100, ($current / $required) * 100);
            
        } elseif (isset($criteria['earnings_min'])) {
            $query = "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = :user_id AND status = 'completed'";
            $stmt = $db->prepare($query);
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch();
            $current = $result['total'];
            $required = $criteria['earnings_min'];
            $progress = min(100, ($current / $required) * 100);
            
        } elseif (isset($criteria['min_rating']) && isset($criteria['min_reviews'])) {
            $query = "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE freelancer_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch();
            
            if ($result['review_count'] >= $criteria['min_reviews'] && $result['avg_rating'] >= $criteria['min_rating']) {
                $progress = 100;
            } else {
                $progress = min(100, ($result['review_count'] / $criteria['min_reviews']) * 100);
            }
            $current = $result['review_count'];
            $required = $criteria['min_reviews'];
        }
        
        return [
            'badge' => $badge,
            'progress' => round($progress, 2),
            'current' => $current,
            'required' => $required,
            'is_earned' => $progress >= 100
        ];
    }
}

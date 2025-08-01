<?php
/**
 * Service Model
 * LaburAR Complete Platform
 * 
 * Manages marketplace services with advanced filtering,
 * search capabilities, and analytics tracking
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/BaseModel.php';

class Service extends BaseModel {
    protected static $table = 'services';
    
    protected static $fillable = [
        'user_id', 'category_id', 'subcategory_id',
        'title', 'description', 'short_description',
        'pricing_type', 'base_price', 'currency',
        'packages', 'delivery_days', 'revisions_included',
        'express_delivery', 'express_delivery_days', 'express_delivery_fee',
        'featured_image', 'gallery_images', 'video_url',
        'features', 'requirements', 'tags', 'keywords',
        'status', 'featured', 'promoted_until'
    ];
    
    // ===== Service Management =====
    
    public static function createService($data) {
        try {
            $db = Database::getInstance();
            
            // Validate required fields
            $required = ['user_id', 'category_id', 'title', 'description', 'base_price', 'delivery_days'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Field {$field} is required");
                }
            }
            
            // Encode JSON fields
            $jsonFields = ['packages', 'gallery_images', 'features', 'tags'];
            foreach ($jsonFields as $field) {
                if (isset($data[$field]) && is_array($data[$field])) {
                    $data[$field] = json_encode($data[$field]);
                }
            }
            
            // Set defaults
            $data['status'] = $data['status'] ?? 'draft';
            $data['currency'] = $data['currency'] ?? 'ARS';
            $data['pricing_type'] = $data['pricing_type'] ?? 'fixed';
            $data['revisions_included'] = $data['revisions_included'] ?? 2;
            
            $service = static::create($data);
            
            // Handle tags if provided
            if (!empty($data['tag_names'])) {
                static::syncTags($service['id'], $data['tag_names']);
            }
            
            return $service;
            
        } catch (Exception $e) {
            error_log('[Service::createService] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function updateService($serviceId, $data) {
        try {
            $service = static::find($serviceId);
            if (!$service) {
                throw new Exception('Service not found');
            }
            
            // Encode JSON fields
            $jsonFields = ['packages', 'gallery_images', 'features', 'tags'];
            foreach ($jsonFields as $field) {
                if (isset($data[$field]) && is_array($data[$field])) {
                    $data[$field] = json_encode($data[$field]);
                }
            }
            
            static::update($serviceId, $data);
            
            // Handle tags if provided
            if (isset($data['tag_names'])) {
                static::syncTags($serviceId, $data['tag_names']);
            }
            
            return static::find($serviceId);
            
        } catch (Exception $e) {
            error_log('[Service::updateService] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Search & Filtering =====
    
    public static function searchServices($filters = [], $page = 1, $limit = 20) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $conditions = ['s.status = ?'];
            $params = ['active'];
            
            // Build query conditions
            $query = "
                SELECT s.*, 
                       u.first_name, u.last_name, u.avatar_url,
                       f.rating_average as freelancer_rating,
                       sc.name as category_name, sc.slug as category_slug,
                       ssc.name as subcategory_name, ssc.slug as subcategory_slug
                FROM services s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN freelancers f ON u.id = f.user_id
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                LEFT JOIN service_subcategories ssc ON s.subcategory_id = ssc.id
            ";
            
            // Search query
            if (!empty($filters['q'])) {
                $conditions[] = "MATCH(s.title, s.description, s.keywords) AGAINST(? IN NATURAL LANGUAGE MODE)";
                $params[] = $filters['q'];
            }
            
            // Category filter
            if (!empty($filters['category_id'])) {
                $conditions[] = "s.category_id = ?";
                $params[] = $filters['category_id'];
            }
            
            // Subcategory filter
            if (!empty($filters['subcategory_id'])) {
                $conditions[] = "s.subcategory_id = ?";
                $params[] = $filters['subcategory_id'];
            }
            
            // Price range
            if (!empty($filters['price_min'])) {
                $conditions[] = "s.base_price >= ?";
                $params[] = $filters['price_min'];
            }
            
            if (!empty($filters['price_max'])) {
                $conditions[] = "s.base_price <= ?";
                $params[] = $filters['price_max'];
            }
            
            // Delivery time
            if (!empty($filters['delivery_days'])) {
                $conditions[] = "s.delivery_days <= ?";
                $params[] = $filters['delivery_days'];
            }
            
            // Rating filter
            if (!empty($filters['min_rating'])) {
                $conditions[] = "s.rating_average >= ?";
                $params[] = $filters['min_rating'];
            }
            
            // Featured filter
            if (!empty($filters['featured'])) {
                $conditions[] = "s.featured = 1";
            }
            
            // Express delivery
            if (!empty($filters['express_delivery'])) {
                $conditions[] = "s.express_delivery = 1";
            }
            
            // Pricing type
            if (!empty($filters['pricing_type'])) {
                $conditions[] = "s.pricing_type = ?";
                $params[] = $filters['pricing_type'];
            }
            
            // Add WHERE clause
            if (!empty($conditions)) {
                $query .= " WHERE " . implode(' AND ', $conditions);
            }
            
            // Sorting
            $orderBy = static::buildOrderBy($filters['sort'] ?? 'relevance');
            $query .= " ORDER BY " . $orderBy;
            
            // Pagination
            $offset = ($page - 1) * $limit;
            $query .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON fields and add computed data
            foreach ($services as &$service) {
                $service = static::processServiceData($service);
            }
            
            // Get total count for pagination
            $countQuery = str_replace(
                "SELECT s.*, u.first_name, u.last_name, u.avatar_url, f.rating_average as freelancer_rating, sc.name as category_name, sc.slug as category_slug, ssc.name as subcategory_name, ssc.slug as subcategory_slug",
                "SELECT COUNT(*)",
                explode(" ORDER BY", $query)[0]
            );
            
            $countParams = array_slice($params, 0, -2); // Remove LIMIT and OFFSET params
            $countStmt = $pdo->prepare($countQuery);
            $countStmt->execute($countParams);
            $total = $countStmt->fetchColumn();
            
            return [
                'services' => $services,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $total,
                    'total_pages' => ceil($total / $limit)
                ]
            ];
            
        } catch (Exception $e) {
            error_log('[Service::searchServices] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    private static function buildOrderBy($sort) {
        $orderOptions = [
            'relevance' => 's.featured DESC, s.rating_average DESC, s.orders_count DESC',
            'price_low' => 's.base_price ASC',
            'price_high' => 's.base_price DESC',
            'rating' => 's.rating_average DESC, s.rating_count DESC',
            'newest' => 's.created_at DESC',
            'popular' => 's.orders_count DESC, s.favorites_count DESC',
            'delivery' => 's.delivery_days ASC'
        ];
        
        return $orderOptions[$sort] ?? $orderOptions['relevance'];
    }
    
    // ===== Service Data Processing =====
    
    private static function processServiceData($service) {
        // Decode JSON fields
        $jsonFields = ['packages', 'gallery_images', 'features', 'tags'];
        foreach ($jsonFields as $field) {
            if (isset($service[$field]) && is_string($service[$field])) {
                $service[$field] = json_decode($service[$field], true) ?? [];
            }
        }
        
        // Add computed fields
        $service['freelancer_name'] = trim($service['first_name'] . ' ' . $service['last_name']);
        $service['formatted_price'] = static::formatPrice($service['base_price'], $service['currency']);
        $service['delivery_text'] = static::formatDeliveryTime($service['delivery_days']);
        $service['rating_stars'] = static::generateStars($service['rating_average']);
        
        return $service;
    }
    
    // ===== Featured & Recommendations =====
    
    public static function getFeaturedServices($limit = 8) {
        try {
            return static::searchServices(['featured' => true], 1, $limit)['services'];
        } catch (Exception $e) {
            error_log('[Service::getFeaturedServices] Error: ' . $e->getMessage());
            return [];
        }
    }
    
    public static function getRecommendedServices($userId, $limit = 6) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Get user's favorite categories and recent views
            $stmt = $pdo->prepare("
                SELECT DISTINCT s.category_id, COUNT(*) as frequency
                FROM service_favorites sf
                JOIN services s ON sf.service_id = s.id
                WHERE sf.user_id = ?
                GROUP BY s.category_id
                ORDER BY frequency DESC
                LIMIT 3
            ");
            $stmt->execute([$userId]);
            $favoriteCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($favoriteCategories)) {
                // Fallback to popular services
                return static::searchServices(['sort' => 'popular'], 1, $limit)['services'];
            }
            
            // Get recommendations based on favorite categories
            $placeholders = str_repeat('?,', count($favoriteCategories) - 1) . '?';
            $stmt = $pdo->prepare("
                SELECT s.*, u.first_name, u.last_name, u.avatar_url,
                       sc.name as category_name
                FROM services s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                WHERE s.status = 'active' 
                AND s.category_id IN ($placeholders)
                AND s.user_id != ?
                ORDER BY s.rating_average DESC, s.orders_count DESC
                LIMIT ?
            ");
            
            $params = array_merge($favoriteCategories, [$userId, $limit]);
            $stmt->execute($params);
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($services as &$service) {
                $service = static::processServiceData($service);
            }
            
            return $services;
            
        } catch (Exception $e) {
            error_log('[Service::getRecommendedServices] Error: ' . $e->getMessage());
            return static::getFeaturedServices($limit);
        }
    }
    
    // ===== Categories & Tags =====
    
    public static function getCategories($includeSubcategories = false) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT * FROM service_categories 
                WHERE active = 1 
                ORDER BY sort_order, name
            ");
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($includeSubcategories) {
                foreach ($categories as &$category) {
                    $stmt = $pdo->prepare("
                        SELECT * FROM service_subcategories 
                        WHERE category_id = ? AND active = 1 
                        ORDER BY sort_order, name
                    ");
                    $stmt->execute([$category['id']]);
                    $category['subcategories'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }
            
            return $categories;
            
        } catch (Exception $e) {
            error_log('[Service::getCategories] Error: ' . $e->getMessage());
            return [];
        }
    }
    
    public static function syncTags($serviceId, $tagNames) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Remove existing tags
            $stmt = $pdo->prepare("DELETE FROM service_tag_relations WHERE service_id = ?");
            $stmt->execute([$serviceId]);
            
            if (empty($tagNames)) {
                return;
            }
            
            foreach ($tagNames as $tagName) {
                $tagName = trim($tagName);
                if (empty($tagName)) continue;
                
                // Find or create tag
                $slug = static::generateSlug($tagName);
                $stmt = $pdo->prepare("
                    INSERT INTO service_tags (name, slug) 
                    VALUES (?, ?) 
                    ON DUPLICATE KEY UPDATE usage_count = usage_count + 1
                ");
                $stmt->execute([$tagName, $slug]);
                
                $stmt = $pdo->prepare("SELECT id FROM service_tags WHERE slug = ?");
                $stmt->execute([$slug]);
                $tagId = $stmt->fetchColumn();
                
                // Create relation
                $stmt = $pdo->prepare("
                    INSERT INTO service_tag_relations (service_id, tag_id) 
                    VALUES (?, ?)
                ");
                $stmt->execute([$serviceId, $tagId]);
            }
            
        } catch (Exception $e) {
            error_log('[Service::syncTags] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Analytics & Stats =====
    
    public static function trackView($serviceId, $userId = null, $ipAddress = null, $userAgent = null) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Check if same IP viewed recently (prevent spam)
            if ($ipAddress) {
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) FROM service_views 
                    WHERE service_id = ? AND ip_address = ? 
                    AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                ");
                $stmt->execute([$serviceId, $ipAddress]);
                
                if ($stmt->fetchColumn() > 0) {
                    return; // Already viewed recently
                }
            }
            
            // Record view
            $stmt = $pdo->prepare("
                INSERT INTO service_views (service_id, user_id, ip_address, user_agent) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$serviceId, $userId, $ipAddress, $userAgent]);
            
            // Update view count
            $stmt = $pdo->prepare("
                UPDATE services 
                SET views_count = views_count + 1 
                WHERE id = ?
            ");
            $stmt->execute([$serviceId]);
            
        } catch (Exception $e) {
            error_log('[Service::trackView] Error: ' . $e->getMessage());
        }
    }
    
    public static function updateStats($serviceId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Update favorites count
            $stmt = $pdo->prepare("
                UPDATE services 
                SET favorites_count = (
                    SELECT COUNT(*) FROM service_favorites WHERE service_id = ?
                )
                WHERE id = ?
            ");
            $stmt->execute([$serviceId, $serviceId]);
            
            // TODO: Update orders_count and rating from orders/reviews tables
            // This will be implemented in Phase 3 (Projects) and Phase 5 (Reviews)
            
        } catch (Exception $e) {
            error_log('[Service::updateStats] Error: ' . $e->getMessage());
        }
    }
    
    // ===== Helpers =====
    
    private static function formatPrice($price, $currency = 'ARS') {
        return number_format($price, 0, ',', '.') . ' ' . $currency;
    }
    
    private static function formatDeliveryTime($days) {
        if ($days == 1) {
            return '1 día';
        } elseif ($days < 7) {
            return $days . ' días';
        } elseif ($days == 7) {
            return '1 semana';
        } elseif ($days < 30) {
            return ceil($days / 7) . ' semanas';
        } else {
            return ceil($days / 30) . ' mes' . ($days >= 60 ? 'es' : '');
        }
    }
    
    private static function generateStars($rating) {
        $fullStars = floor($rating);
        $halfStar = ($rating - $fullStars) >= 0.5;
        $emptyStars = 5 - $fullStars - ($halfStar ? 1 : 0);
        
        return [
            'full' => $fullStars,
            'half' => $halfStar,
            'empty' => $emptyStars,
            'rating' => round($rating, 1)
        ];
    }
    
    private static function generateSlug($string) {
        $string = strtolower($string);
        $string = preg_replace('/[^a-z0-9]+/', '-', $string);
        return trim($string, '-');
    }
}
?>
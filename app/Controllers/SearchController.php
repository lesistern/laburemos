<?php
/**
 * Search Controller
 * LaburAR Complete Platform
 * 
 * Advanced search with filters, autocomplete,
 * saved searches, and analytics
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../models/Service.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../includes/RateLimiter.php';

class SearchController {
    private $validator;
    private $rateLimiter;
    
    public function __construct() {
        $this->validator = new ValidationHelper();
        $this->rateLimiter = new RateLimiter();
    }
    
    public function handleRequest() {
        try {
            // Rate limiting
            if (!$this->rateLimiter->checkLimit('api_search')) {
                return $this->jsonError('Too many requests', 429);
            }
            
            $action = $_GET['action'] ?? '';
            $method = $_SERVER['REQUEST_METHOD'];
            
            switch ($action) {
                case 'search':
                    return $this->search();
                    
                case 'autocomplete':
                    return $this->autocomplete();
                    
                case 'categories':
                    return $this->getCategories();
                    
                case 'featured':
                    return $this->getFeatured();
                    
                case 'recommended':
                    return $this->getRecommended();
                    
                case 'save-filter':
                    return $this->saveFilter();
                    
                case 'get-filters':
                    return $this->getSavedFilters();
                    
                case 'popular-tags':
                    return $this->getPopularTags();
                    
                case 'trending':
                    return $this->getTrendingServices();
                    
                default:
                    return $this->jsonError('Invalid action', 400);
            }
            
        } catch (Exception $e) {
            error_log('[SearchController] Error: ' . $e->getMessage());
            return $this->jsonError('Internal server error', 500);
        }
    }
    
    // ===== Main Search =====
    
    private function search() {
        try {
            $filters = $this->getSearchFilters();
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
            
            // Track search query for analytics
            if (!empty($filters['q'])) {
                $this->trackSearchQuery($filters['q']);
            }
            
            $result = Service::searchServices($filters, $page, $limit);
            
            return $this->jsonSuccess([
                'services' => $result['services'],
                'pagination' => $result['pagination'],
                'filters_applied' => $this->getAppliedFilters($filters),
                'search_meta' => [
                    'query' => $filters['q'] ?? '',
                    'total_results' => $result['pagination']['total'],
                    'search_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('[SearchController::search] Error: ' . $e->getMessage());
            return $this->jsonError('Search failed', 500);
        }
    }
    
    private function getSearchFilters() {
        $filters = [];
        
        // Search query
        if (!empty($_GET['q'])) {
            $filters['q'] = trim($_GET['q']);
        }
        
        // Category filters
        if (!empty($_GET['category_id'])) {
            $filters['category_id'] = intval($_GET['category_id']);
        }
        
        if (!empty($_GET['subcategory_id'])) {
            $filters['subcategory_id'] = intval($_GET['subcategory_id']);
        }
        
        // Price range
        if (!empty($_GET['price_min'])) {
            $filters['price_min'] = floatval($_GET['price_min']);
        }
        
        if (!empty($_GET['price_max'])) {
            $filters['price_max'] = floatval($_GET['price_max']);
        }
        
        // Delivery time
        if (!empty($_GET['delivery_days'])) {
            $filters['delivery_days'] = intval($_GET['delivery_days']);
        }
        
        // Rating
        if (!empty($_GET['min_rating'])) {
            $filters['min_rating'] = floatval($_GET['min_rating']);
        }
        
        // Boolean filters
        if (!empty($_GET['featured'])) {
            $filters['featured'] = true;
        }
        
        if (!empty($_GET['express_delivery'])) {
            $filters['express_delivery'] = true;
        }
        
        // Pricing type
        if (!empty($_GET['pricing_type']) && in_array($_GET['pricing_type'], ['fixed', 'hourly', 'package'])) {
            $filters['pricing_type'] = $_GET['pricing_type'];
        }
        
        // Sorting
        $validSorts = ['relevance', 'price_low', 'price_high', 'rating', 'newest', 'popular', 'delivery'];
        if (!empty($_GET['sort']) && in_array($_GET['sort'], $validSorts)) {
            $filters['sort'] = $_GET['sort'];
        }
        
        return $filters;
    }
    
    // ===== Autocomplete =====
    
    private function autocomplete() {
        try {
            $query = trim($_GET['q'] ?? '');
            
            if (strlen($query) < 2) {
                return $this->jsonSuccess(['suggestions' => []]);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Search in service titles, categories, and tags
            $stmt = $pdo->prepare("
                (SELECT DISTINCT title as suggestion, 'service' as type, 'service' as category, NULL as url
                 FROM services 
                 WHERE status = 'active' AND title LIKE ? 
                 LIMIT 5)
                UNION
                (SELECT DISTINCT name as suggestion, 'category' as type, 'category' as category, CONCAT('/category/', slug) as url
                 FROM service_categories 
                 WHERE active = 1 AND name LIKE ? 
                 LIMIT 3)
                UNION
                (SELECT DISTINCT name as suggestion, 'tag' as type, 'tag' as category, CONCAT('/tag/', slug) as url
                 FROM service_tags 
                 WHERE name LIKE ? 
                 ORDER BY usage_count DESC
                 LIMIT 4)
                ORDER BY type, suggestion
                LIMIT 12
            ");
            
            $searchTerm = '%' . $query . '%';
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
            $suggestions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->jsonSuccess(['suggestions' => $suggestions]);
            
        } catch (Exception $e) {
            error_log('[SearchController::autocomplete] Error: ' . $e->getMessage());
            return $this->jsonSuccess(['suggestions' => []]);
        }
    }
    
    // ===== Categories =====
    
    private function getCategories() {
        try {
            $includeSubcategories = !empty($_GET['subcategories']);
            $categories = Service::getCategories($includeSubcategories);
            
            return $this->jsonSuccess(['categories' => $categories]);
            
        } catch (Exception $e) {
            error_log('[SearchController::getCategories] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load categories', 500);
        }
    }
    
    // ===== Featured & Recommendations =====
    
    private function getFeatured() {
        try {
            $limit = min(20, max(4, intval($_GET['limit'] ?? 8)));
            $services = Service::getFeaturedServices($limit);
            
            return $this->jsonSuccess(['services' => $services]);
            
        } catch (Exception $e) {
            error_log('[SearchController::getFeatured] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load featured services', 500);
        }
    }
    
    private function getRecommended() {
        try {
            $userId = $this->getCurrentUserId();
            if (!$userId) {
                return $this->jsonError('Authentication required', 401);
            }
            
            $limit = min(20, max(4, intval($_GET['limit'] ?? 6)));
            $services = Service::getRecommendedServices($userId, $limit);
            
            return $this->jsonSuccess(['services' => $services]);
            
        } catch (Exception $e) {
            error_log('[SearchController::getRecommended] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load recommendations', 500);
        }
    }
    
    // ===== Saved Filters =====
    
    private function saveFilter() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                return $this->jsonError('Method not allowed', 405);
            }
            
            $userId = $this->getCurrentUserId();
            if (!$userId) {
                return $this->jsonError('Authentication required', 401);
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['name']) || empty($input['filters'])) {
                return $this->jsonError('Name and filters are required', 400);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Check if user already has 10 saved filters (limit)
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM search_filters WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            if ($stmt->fetchColumn() >= 10) {
                return $this->jsonError('Maximum saved filters limit reached (10)', 400);
            }
            
            // Save filter
            $stmt = $pdo->prepare("
                INSERT INTO search_filters (user_id, name, filters, is_default) 
                VALUES (?, ?, ?, ?)
            ");
            
            $isDefault = !empty($input['is_default']);
            
            // If setting as default, remove default from others
            if ($isDefault) {
                $stmt2 = $pdo->prepare("UPDATE search_filters SET is_default = 0 WHERE user_id = ?");
                $stmt2->execute([$userId]);
            }
            
            $stmt->execute([
                $userId,
                trim($input['name']),
                json_encode($input['filters']),
                $isDefault
            ]);
            
            $filterId = $pdo->lastInsertId();
            
            return $this->jsonSuccess([
                'filter_id' => $filterId,
                'message' => 'Filter saved successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[SearchController::saveFilter] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to save filter', 500);
        }
    }
    
    private function getSavedFilters() {
        try {
            $userId = $this->getCurrentUserId();
            if (!$userId) {
                return $this->jsonError('Authentication required', 401);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT id, name, filters, is_default, created_at
                FROM search_filters 
                WHERE user_id = ? 
                ORDER BY is_default DESC, name
            ");
            $stmt->execute([$userId]);
            $filters = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON filters
            foreach ($filters as &$filter) {
                $filter['filters'] = json_decode($filter['filters'], true);
            }
            
            return $this->jsonSuccess(['filters' => $filters]);
            
        } catch (Exception $e) {
            error_log('[SearchController::getSavedFilters] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load saved filters', 500);
        }
    }
    
    // ===== Analytics & Trending =====
    
    private function getPopularTags() {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT name, slug, usage_count
                FROM service_tags 
                WHERE usage_count > 0
                ORDER BY usage_count DESC 
                LIMIT 20
            ");
            $stmt->execute();
            $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->jsonSuccess(['tags' => $tags]);
            
        } catch (Exception $e) {
            error_log('[SearchController::getPopularTags] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load popular tags', 500);
        }
    }
    
    private function getTrendingServices() {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Services with most views in last 7 days
            $stmt = $pdo->prepare("
                SELECT s.*, u.first_name, u.last_name, u.avatar_url,
                       sc.name as category_name,
                       COUNT(sv.id) as recent_views
                FROM services s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                LEFT JOIN service_views sv ON s.id = sv.service_id 
                    AND sv.viewed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                WHERE s.status = 'active'
                GROUP BY s.id
                HAVING recent_views > 0
                ORDER BY recent_views DESC, s.rating_average DESC
                LIMIT 12
            ");
            $stmt->execute();
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($services as &$service) {
                // Process service data
                $service['freelancer_name'] = trim($service['first_name'] . ' ' . $service['last_name']);
                $service['formatted_price'] = number_format($service['base_price'], 0, ',', '.') . ' ARS';
            }
            
            return $this->jsonSuccess(['services' => $services]);
            
        } catch (Exception $e) {
            error_log('[SearchController::getTrendingServices] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load trending services', 500);
        }
    }
    
    // ===== Analytics =====
    
    private function trackSearchQuery($query) {
        try {
            // Simple search analytics - can be expanded later
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                INSERT INTO search_analytics (query, search_date, ip_address) 
                VALUES (?, NOW(), ?)
                ON DUPLICATE KEY UPDATE search_count = search_count + 1
            ");
            
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
            $stmt->execute([$query, $ipAddress]);
            
        } catch (Exception $e) {
            // Don't fail search if analytics fails
            error_log('[SearchController::trackSearchQuery] Error: ' . $e->getMessage());
        }
    }
    
    // ===== Helpers =====
    
    private function getAppliedFilters($filters) {
        $applied = [];
        
        if (!empty($filters['q'])) {
            $applied[] = ['type' => 'search', 'label' => 'Search: ' . $filters['q']];
        }
        
        if (!empty($filters['category_id'])) {
            $applied[] = ['type' => 'category', 'label' => 'Category filter applied'];
        }
        
        if (!empty($filters['price_min']) || !empty($filters['price_max'])) {
            $min = $filters['price_min'] ?? 0;
            $max = $filters['price_max'] ?? '∞';
            $applied[] = ['type' => 'price', 'label' => "Price: $min - $max ARS"];
        }
        
        if (!empty($filters['delivery_days'])) {
            $applied[] = ['type' => 'delivery', 'label' => 'Delivery: ' . $filters['delivery_days'] . ' days max'];
        }
        
        if (!empty($filters['min_rating'])) {
            $applied[] = ['type' => 'rating', 'label' => 'Rating: ' . $filters['min_rating'] . '+ stars'];
        }
        
        if (!empty($filters['featured'])) {
            $applied[] = ['type' => 'featured', 'label' => 'Featured only'];
        }
        
        if (!empty($filters['express_delivery'])) {
            $applied[] = ['type' => 'express', 'label' => 'Express delivery'];
        }
        
        return $applied;
    }
    
    private function getCurrentUserId() {
        // Extract user ID from JWT token
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        
        try {
            $securityHelper = new SecurityHelper();
            $payload = $securityHelper->validateJWT($matches[1]);
            return $payload['user_id'] ?? null;
        } catch (Exception $e) {
            return null;
        }
    }
    
    private function jsonSuccess($data) {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }
    
    private function jsonError($message, $code = 400) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => $message]);
        exit;
    }
}

// Handle the request
if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller = new SearchController();
    $controller->handleRequest();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
?>
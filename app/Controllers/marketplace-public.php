<?php
/**
 * LaburAR Public Marketplace API
 * 
 * Provides public access to marketplace content for guest users
 * Services are viewable by everyone, interactions require authentication
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

// Allow CORS for public access
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests for public marketplace
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed', 'message' => 'Only GET requests are allowed for public marketplace']);
    exit;
}

require_once __DIR__ . '/../includes/DatabaseHelper.php';

class PublicMarketplaceAPI {
    
    private $db;
    
    public function __construct() {
        try {
            $this->db = DatabaseHelper::getConnection();
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    
    public function handleRequest() {
        $endpoint = $_GET['endpoint'] ?? 'services';
        
        try {
            switch ($endpoint) {
                case 'services':
                    $this->getServices();
                    break;
                case 'categories':
                    $this->getCategories();
                    break;
                case 'featured':
                    $this->getFeaturedServices();
                    break;
                case 'stats':
                    $this->getPlatformStats();
                    break;
                case 'search':
                    $this->searchServices();
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Endpoint not found']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
        }
    }
    
    private function getServices() {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;
        
        // Build filters
        $whereConditions = ['s.status = :status'];
        $params = ['status' => 'active'];
        
        // Category filter
        if (!empty($_GET['category'])) {
            $whereConditions[] = 'c.slug = :category';
            $params['category'] = $_GET['category'];
        }
        
        // Price range filter
        if (!empty($_GET['price_min'])) {
            $whereConditions[] = 's.starting_price >= :price_min';
            $params['price_min'] = (float)$_GET['price_min'];
        }
        
        if (!empty($_GET['price_max'])) {
            $whereConditions[] = 's.starting_price <= :price_max';
            $params['price_max'] = (float)$_GET['price_max'];
        }
        
        // Rating filter
        if (!empty($_GET['rating_min'])) {
            $whereConditions[] = 's.average_rating >= :rating_min';
            $params['rating_min'] = (float)$_GET['rating_min'];
        }
        
        // Delivery time filter
        if (!empty($_GET['delivery_max'])) {
            $whereConditions[] = 's.delivery_time <= :delivery_max';
            $params['delivery_max'] = (int)$_GET['delivery_max'];
        }
        
        // Featured filter
        if (!empty($_GET['featured'])) {
            $whereConditions[] = 's.featured = 1';
        }
        
        // Build ORDER BY
        $orderBy = $this->buildOrderBy($_GET['sort'] ?? 'relevance');
        
        // Main query
        $whereClause = implode(' AND ', $whereConditions);
        
        $sql = "
            SELECT 
                s.id,
                s.title,
                s.description,
                s.starting_price,
                s.delivery_time,
                s.revision_count,
                s.average_rating,
                s.total_reviews,
                s.total_orders,
                s.featured,
                s.image_url,
                s.created_at,
                c.name as category_name,
                c.slug as category_slug,
                u.id as freelancer_id,
                u.first_name,
                u.last_name,
                u.professional_title,
                u.location,
                u.avatar_url,
                u.total_rating as freelancer_rating,
                u.email_verified,
                u.identity_verified
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE $whereClause
            ORDER BY $orderBy
            LIMIT :limit OFFSET :offset
        ";
        
        $stmt = $this->db->prepare($sql);
        
        // Bind parameters
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count for pagination
        $countSql = "
            SELECT COUNT(*) as total
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE $whereClause
        ";
        
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue(":$key", $value);
        }
        $countStmt->execute();
        $totalCount = $countStmt->fetchColumn();
        
        // Format services for public consumption
        $formattedServices = array_map([$this, 'formatServiceForPublic'], $services);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'services' => $formattedServices,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => (int)$totalCount,
                    'total_pages' => ceil($totalCount / $limit),
                    'has_more' => ($page * $limit) < $totalCount
                ]
            ]
        ]);
    }
    
    private function getCategories() {
        $sql = "
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.description,
                c.icon,
                COUNT(s.id) as service_count
            FROM categories c
            LEFT JOIN services s ON c.id = s.category_id AND s.status = 'active'
            WHERE c.status = 'active'
            GROUP BY c.id, c.name, c.slug, c.description, c.icon
            ORDER BY service_count DESC, c.name ASC
        ";
        
        $stmt = $this->db->query($sql);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => array_map(function($category) {
                return [
                    'id' => (int)$category['id'],
                    'name' => $category['name'],
                    'slug' => $category['slug'],
                    'description' => $category['description'],
                    'icon' => $category['icon'],
                    'service_count' => (int)$category['service_count']
                ];
            }, $categories)
        ]);
    }
    
    private function getFeaturedServices() {
        $limit = min(20, max(1, (int)($_GET['limit'] ?? 8)));
        
        $sql = "
            SELECT 
                s.id,
                s.title,
                s.description,
                s.starting_price,
                s.delivery_time,
                s.average_rating,
                s.total_reviews,
                s.image_url,
                c.name as category_name,
                c.slug as category_slug,
                u.first_name,
                u.last_name,
                u.professional_title,
                u.location,
                u.avatar_url,
                u.email_verified,
                u.identity_verified
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status = 'active' AND s.featured = 1
            ORDER BY s.total_orders DESC, s.average_rating DESC
            LIMIT :limit
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $formattedServices = array_map([$this, 'formatServiceForPublic'], $services);
        
        echo json_encode([
            'success' => true,
            'data' => $formattedServices
        ]);
    }
    
    private function getPlatformStats() {
        $stats = DatabaseHelper::getPlatformStats();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'freelancers' => (int)$stats['freelancers_count'],
                'services' => (int)$stats['services_count'],
                'projects_completed' => (int)$stats['projects_completed'],
                'average_rating' => (float)$stats['average_rating'],
                'total_reviews' => (int)$stats['total_reviews']
            ]
        ]);
    }
    
    private function searchServices() {
        $query = trim($_GET['q'] ?? '');
        if (empty($query)) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(20, max(1, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        // Full-text search query
        $sql = "
            SELECT 
                s.id,
                s.title,
                s.description,
                s.starting_price,
                s.average_rating,
                s.total_reviews,
                s.image_url,
                c.name as category_name,
                u.first_name,
                u.last_name,
                u.professional_title,
                u.avatar_url,
                MATCH(s.title, s.description) AGAINST(:query IN NATURAL LANGUAGE MODE) as relevance
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status = 'active' AND (
                MATCH(s.title, s.description) AGAINST(:query IN NATURAL LANGUAGE MODE) > 0
                OR s.title LIKE :like_query
                OR s.description LIKE :like_query
                OR c.name LIKE :like_query
                OR u.professional_title LIKE :like_query
            )
            ORDER BY relevance DESC, s.average_rating DESC, s.total_orders DESC
            LIMIT :limit OFFSET :offset
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':query', $query);
        $stmt->bindValue(':like_query', "%$query%");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $formattedServices = array_map([$this, 'formatServiceForPublic'], $services);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'services' => $formattedServices,
                'query' => $query,
                'total' => count($formattedServices)
            ]
        ]);
    }
    
    private function formatServiceForPublic($service) {
        return [
            'id' => (int)$service['id'],
            'title' => $service['title'],
            'description' => $service['description'],
            'starting_price' => (float)$service['starting_price'],
            'delivery_time' => (int)$service['delivery_time'],
            'revision_count' => (int)($service['revision_count'] ?? 0),
            'average_rating' => (float)($service['average_rating'] ?? 0),
            'total_reviews' => (int)($service['total_reviews'] ?? 0),
            'total_orders' => (int)($service['total_orders'] ?? 0),
            'featured' => (bool)($service['featured'] ?? false),
            'image_url' => $service['image_url'],
            'created_at' => $service['created_at'],
            'category' => [
                'name' => $service['category_name'],
                'slug' => $service['category_slug']
            ],
            'freelancer' => [
                'id' => (int)$service['freelancer_id'],
                'name' => trim(($service['first_name'] ?? '') . ' ' . ($service['last_name'] ?? '')),
                'professional_title' => $service['professional_title'],
                'location' => $service['location'],
                'avatar' => $service['avatar_url'],
                'rating' => (float)($service['freelancer_rating'] ?? 0),
                'verified' => (bool)($service['email_verified'] && $service['identity_verified'])
            ],
            // Hide sensitive information for public access
            'contact_info_available' => true, // Indicates contact is possible with account
            'interaction_required_auth' => true // Indicates authentication needed for interaction
        ];
    }
    
    private function buildOrderBy($sort) {
        switch ($sort) {
            case 'price_low':
                return 's.starting_price ASC';
            case 'price_high':
                return 's.starting_price DESC';
            case 'rating':
                return 's.average_rating DESC, s.total_reviews DESC';
            case 'newest':
                return 's.created_at DESC';
            case 'popular':
                return 's.total_orders DESC, s.total_reviews DESC';
            case 'delivery':
                return 's.delivery_time ASC';
            case 'relevance':
            default:
                return 's.featured DESC, s.average_rating DESC, s.total_orders DESC, s.created_at DESC';
        }
    }
}

// Execute the API
$api = new PublicMarketplaceAPI();
$api->handleRequest();
?>
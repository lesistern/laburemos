<?php
/**
 * Favorite Controller
 * LaburAR Complete Platform
 * 
 * Manages user favorites for services,
 * comparison lists, and recommendations
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../models/Service.php';
require_once __DIR__ . '/../includes/SecurityHelper.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../includes/RateLimiter.php';

class FavoriteController {
    private $securityHelper;
    private $validator;
    private $rateLimiter;
    
    public function __construct() {
        $this->securityHelper = new SecurityHelper();
        $this->validator = new ValidationHelper();
        $this->rateLimiter = new RateLimiter();
    }
    
    public function handleRequest() {
        try {
            // Rate limiting
            if (!$this->rateLimiter->checkLimit('api_general')) {
                return $this->jsonError('Too many requests', 429);
            }
            
            // Get authenticated user
            $user = $this->getAuthenticatedUser();
            if (!$user) {
                return $this->jsonError('Authentication required', 401);
            }
            
            $method = $_SERVER['REQUEST_METHOD'];
            $action = $_GET['action'] ?? '';
            
            // Handle different request methods
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? $action;
                
                switch ($action) {
                    case 'toggle':
                        return $this->toggleFavorite($user['id'], $input);
                        
                    case 'add':
                        return $this->addFavorite($user['id'], $input);
                        
                    case 'remove':
                        return $this->removeFavorite($user['id'], $input);
                        
                    case 'create-comparison':
                        return $this->createComparison($user['id'], $input);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'GET') {
                switch ($action) {
                    case 'list':
                        return $this->getFavorites($user['id']);
                        
                    case 'check':
                        return $this->checkFavorite($user['id']);
                        
                    case 'comparison':
                        return $this->getComparison($user['id']);
                        
                    case 'recommendations':
                        return $this->getRecommendations($user['id']);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'DELETE') {
                switch ($action) {
                    case 'comparison':
                        return $this->deleteComparison($user['id']);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } else {
                return $this->jsonError('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            error_log('[FavoriteController] Error: ' . $e->getMessage());
            return $this->jsonError('Internal server error', 500);
        }
    }
    
    // ===== Favorites Management =====
    
    private function toggleFavorite($userId, $input) {
        try {
            if (empty($input['service_id'])) {
                return $this->jsonError('Service ID is required', 400);
            }
            
            $serviceId = intval($input['service_id']);
            
            // Validate service exists
            $service = Service::find($serviceId);
            if (!$service) {
                return $this->jsonError('Service not found', 404);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Check if already favorited
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM service_favorites 
                WHERE user_id = ? AND service_id = ?
            ");
            $stmt->execute([$userId, $serviceId]);
            $exists = $stmt->fetchColumn() > 0;
            
            if ($exists) {
                // Remove favorite
                $stmt = $pdo->prepare("
                    DELETE FROM service_favorites 
                    WHERE user_id = ? AND service_id = ?
                ");
                $stmt->execute([$userId, $serviceId]);
                $favorited = false;
            } else {
                // Add favorite
                $stmt = $pdo->prepare("
                    INSERT INTO service_favorites (user_id, service_id) 
                    VALUES (?, ?)
                ");
                $stmt->execute([$userId, $serviceId]);
                $favorited = true;
            }
            
            // Update service stats
            Service::updateStats($serviceId);
            
            return $this->jsonSuccess([
                'favorited' => $favorited,
                'service_id' => $serviceId,
                'message' => $favorited ? 'Added to favorites' : 'Removed from favorites'
            ]);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::toggleFavorite] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to toggle favorite', 500);
        }
    }
    
    private function addFavorite($userId, $input) {
        try {
            if (empty($input['service_id'])) {
                return $this->jsonError('Service ID is required', 400);
            }
            
            $serviceId = intval($input['service_id']);
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Check if already exists
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM service_favorites 
                WHERE user_id = ? AND service_id = ?
            ");
            $stmt->execute([$userId, $serviceId]);
            
            if ($stmt->fetchColumn() > 0) {
                return $this->jsonSuccess(['message' => 'Already in favorites']);
            }
            
            // Add favorite
            $stmt = $pdo->prepare("
                INSERT INTO service_favorites (user_id, service_id) 
                VALUES (?, ?)
            ");
            $stmt->execute([$userId, $serviceId]);
            
            Service::updateStats($serviceId);
            
            return $this->jsonSuccess(['message' => 'Added to favorites']);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::addFavorite] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to add favorite', 500);
        }
    }
    
    private function removeFavorite($userId, $input) {
        try {
            if (empty($input['service_id'])) {
                return $this->jsonError('Service ID is required', 400);
            }
            
            $serviceId = intval($input['service_id']);
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                DELETE FROM service_favorites 
                WHERE user_id = ? AND service_id = ?
            ");
            $stmt->execute([$userId, $serviceId]);
            
            Service::updateStats($serviceId);
            
            return $this->jsonSuccess(['message' => 'Removed from favorites']);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::removeFavorite] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to remove favorite', 500);
        }
    }
    
    // ===== Get Favorites =====
    
    private function getFavorites($userId) {
        try {
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Get favorites with service details
            $stmt = $pdo->prepare("
                SELECT s.*, sf.created_at as favorited_at,
                       u.first_name, u.last_name, u.avatar_url,
                       sc.name as category_name, sc.slug as category_slug
                FROM service_favorites sf
                JOIN services s ON sf.service_id = s.id
                JOIN users u ON s.user_id = u.id
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                WHERE sf.user_id = ? AND s.status = 'active'
                ORDER BY sf.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$userId, $limit, $offset]);
            $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process service data
            foreach ($favorites as &$favorite) {
                // Decode JSON fields
                $jsonFields = ['packages', 'gallery_images', 'features', 'tags'];
                foreach ($jsonFields as $field) {
                    if (isset($favorite[$field]) && is_string($favorite[$field])) {
                        $favorite[$field] = json_decode($favorite[$field], true) ?? [];
                    }
                }
                
                $favorite['freelancer_name'] = trim($favorite['first_name'] . ' ' . $favorite['last_name']);
                $favorite['formatted_price'] = number_format($favorite['base_price'], 0, ',', '.') . ' ARS';
            }
            
            // Get total count
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM service_favorites sf
                JOIN services s ON sf.service_id = s.id
                WHERE sf.user_id = ? AND s.status = 'active'
            ");
            $stmt->execute([$userId]);
            $total = $stmt->fetchColumn();
            
            return $this->jsonSuccess([
                'favorites' => $favorites,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $total,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::getFavorites] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load favorites', 500);
        }
    }
    
    private function checkFavorite($userId) {
        try {
            $serviceId = intval($_GET['service_id'] ?? 0);
            
            if (!$serviceId) {
                return $this->jsonError('Service ID is required', 400);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM service_favorites 
                WHERE user_id = ? AND service_id = ?
            ");
            $stmt->execute([$userId, $serviceId]);
            $favorited = $stmt->fetchColumn() > 0;
            
            return $this->jsonSuccess(['favorited' => $favorited]);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::checkFavorite] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to check favorite status', 500);
        }
    }
    
    // ===== Service Comparison =====
    
    private function createComparison($userId, $input) {
        try {
            if (empty($input['service_ids']) || !is_array($input['service_ids'])) {
                return $this->jsonError('Service IDs array is required', 400);
            }
            
            $serviceIds = array_map('intval', $input['service_ids']);
            
            // Limit to maximum 5 services for comparison
            if (count($serviceIds) > 5) {
                return $this->jsonError('Maximum 5 services can be compared', 400);
            }
            
            if (count($serviceIds) < 2) {
                return $this->jsonError('At least 2 services required for comparison', 400);
            }
            
            // Validate all services exist
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $placeholders = str_repeat('?,', count($serviceIds) - 1) . '?';
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM services 
                WHERE id IN ($placeholders) AND status = 'active'
            ");
            $stmt->execute($serviceIds);
            
            if ($stmt->fetchColumn() !== count($serviceIds)) {
                return $this->jsonError('One or more services not found', 404);
            }
            
            // Create comparison (expires in 24 hours)
            $stmt = $pdo->prepare("
                INSERT INTO service_comparisons (user_id, service_ids, expires_at) 
                VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
            ");
            $stmt->execute([$userId, json_encode($serviceIds)]);
            
            $comparisonId = $pdo->lastInsertId();
            
            return $this->jsonSuccess([
                'comparison_id' => $comparisonId,
                'service_ids' => $serviceIds,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours')),
                'message' => 'Comparison created successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::createComparison] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to create comparison', 500);
        }
    }
    
    private function getComparison($userId) {
        try {
            $comparisonId = intval($_GET['comparison_id'] ?? 0);
            
            if (!$comparisonId) {
                return $this->jsonError('Comparison ID is required', 400);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Get comparison
            $stmt = $pdo->prepare("
                SELECT * FROM service_comparisons 
                WHERE id = ? AND user_id = ? AND expires_at > NOW()
            ");
            $stmt->execute([$comparisonId, $userId]);
            $comparison = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$comparison) {
                return $this->jsonError('Comparison not found or expired', 404);
            }
            
            $serviceIds = json_decode($comparison['service_ids'], true);
            
            // Get services with details
            $placeholders = str_repeat('?,', count($serviceIds) - 1) . '?';
            $stmt = $pdo->prepare("
                SELECT s.*, u.first_name, u.last_name, u.avatar_url,
                       sc.name as category_name, sc.slug as category_slug,
                       f.rating_average as freelancer_rating
                FROM services s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                LEFT JOIN freelancers f ON u.id = f.user_id
                WHERE s.id IN ($placeholders) AND s.status = 'active'
                ORDER BY FIELD(s.id, " . implode(',', $serviceIds) . ")
            ");
            $stmt->execute($serviceIds);
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process service data
            foreach ($services as &$service) {
                $jsonFields = ['packages', 'gallery_images', 'features', 'tags'];
                foreach ($jsonFields as $field) {
                    if (isset($service[$field]) && is_string($service[$field])) {
                        $service[$field] = json_decode($service[$field], true) ?? [];
                    }
                }
                
                $service['freelancer_name'] = trim($service['first_name'] . ' ' . $service['last_name']);
                $service['formatted_price'] = number_format($service['base_price'], 0, ',', '.') . ' ARS';
            }
            
            return $this->jsonSuccess([
                'comparison' => $comparison,
                'services' => $services,
                'comparison_features' => $this->getComparisonFeatures($services)
            ]);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::getComparison] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load comparison', 500);
        }
    }
    
    private function deleteComparison($userId) {
        try {
            $comparisonId = intval($_GET['comparison_id'] ?? 0);
            
            if (!$comparisonId) {
                return $this->jsonError('Comparison ID is required', 400);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                DELETE FROM service_comparisons 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$comparisonId, $userId]);
            
            if ($stmt->rowCount() === 0) {
                return $this->jsonError('Comparison not found', 404);
            }
            
            return $this->jsonSuccess(['message' => 'Comparison deleted successfully']);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::deleteComparison] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to delete comparison', 500);
        }
    }
    
    // ===== Recommendations =====
    
    private function getRecommendations($userId) {
        try {
            $limit = min(20, max(4, intval($_GET['limit'] ?? 6)));
            $services = Service::getRecommendedServices($userId, $limit);
            
            return $this->jsonSuccess(['services' => $services]);
            
        } catch (Exception $e) {
            error_log('[FavoriteController::getRecommendations] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to load recommendations', 500);
        }
    }
    
    // ===== Helper Methods =====
    
    private function getComparisonFeatures($services) {
        $features = [
            'price' => [],
            'delivery_days' => [],
            'revisions_included' => [],
            'rating' => [],
            'orders_count' => [],
            'express_delivery' => [],
            'features' => []
        ];
        
        foreach ($services as $service) {
            $features['price'][] = $service['base_price'];
            $features['delivery_days'][] = $service['delivery_days'];
            $features['revisions_included'][] = $service['revisions_included'];
            $features['rating'][] = $service['rating_average'];
            $features['orders_count'][] = $service['orders_count'];
            $features['express_delivery'][] = $service['express_delivery'];
            
            // Collect unique features
            if (!empty($service['features'])) {
                foreach ($service['features'] as $feature) {
                    if (!in_array($feature, $features['features'])) {
                        $features['features'][] = $feature;
                    }
                }
            }
        }
        
        return [
            'price_range' => [
                'min' => min($features['price']),
                'max' => max($features['price'])
            ],
            'delivery_range' => [
                'min' => min($features['delivery_days']),
                'max' => max($features['delivery_days'])
            ],
            'revisions_range' => [
                'min' => min($features['revisions_included']),
                'max' => max($features['revisions_included'])
            ],
            'rating_range' => [
                'min' => min($features['rating']),
                'max' => max($features['rating'])
            ],
            'all_features' => $features['features']
        ];
    }
    
    private function getAuthenticatedUser() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        
        try {
            $payload = $this->securityHelper->validateJWT($matches[1]);
            return $payload;
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
$controller = new FavoriteController();
$controller->handleRequest();
?>
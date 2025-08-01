<?php
/**
 * LaburAR Dashboard Metrics API
 * Provides real-time metrics data for dashboard
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

session_start();

// Check authentication
if (!isset($_SESSION['user_id']) || !isset($_SESSION['authenticated'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

require_once '../../config/database.php';
require_once '../../app/Core/Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    $userId = $_SESSION['user_id'];
    
    // Get current metrics
    $metrics = [];
    
    // Total earnings
    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND status = 'completed'");
    $stmt->execute([$userId]);
    $metrics['total_earnings'] = floatval($stmt->fetch(PDO::FETCH_ASSOC)['total']);
    
    // This month earnings
    $stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND status = 'completed' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
    $stmt->execute([$userId]);
    $metrics['this_month_earnings'] = floatval($stmt->fetch(PDO::FETCH_ASSOC)['total']);
    
    // Active projects
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM projects WHERE freelancer_id = ? AND status = 'active'");
    $stmt->execute([$userId]);
    $metrics['active_projects'] = intval($stmt->fetch(PDO::FETCH_ASSOC)['count']);
    
    // Completed projects
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM projects WHERE freelancer_id = ? AND status = 'completed'");
    $stmt->execute([$userId]);
    $metrics['completed_projects'] = intval($stmt->fetch(PDO::FETCH_ASSOC)['count']);
    
    // Average rating
    $stmt = $conn->prepare("SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE freelancer_id = ?");
    $stmt->execute([$userId]);
    $metrics['rating_average'] = round(floatval($stmt->fetch(PDO::FETCH_ASSOC)['avg_rating']), 1);
    
    // Badge metrics
    $stmt = $conn->prepare("SELECT COUNT(*) as count, COALESCE(SUM(b.points), 0) as points FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = ?");
    $stmt->execute([$userId]);
    $badgeData = $stmt->fetch(PDO::FETCH_ASSOC);
    $metrics['total_badges'] = intval($badgeData['count']);
    $metrics['badge_points'] = intval($badgeData['points']);
    
    // Monthly earnings for chart (last 6 months)
    $stmt = $conn->prepare("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COALESCE(SUM(amount), 0) as total
        FROM transactions 
        WHERE user_id = ? 
        AND status = 'completed' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
    ");
    $stmt->execute([$userId]);
    $monthlyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $chartData = [];
    $chartLabels = [];
    
    // Fill in missing months with 0
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $monthName = date('M', strtotime("-$i months"));
        
        $found = false;
        foreach ($monthlyData as $data) {
            if ($data['month'] === $month) {
                $chartData[] = floatval($data['total']);
                $found = true;
                break;
            }
        }
        
        if (!found) {
            $chartData[] = 0;
        }
        
        $chartLabels[] = $monthName;
    }
    
    $metrics['chart_data'] = $chartData;
    $metrics['chart_labels'] = $chartLabels;
    
    // Recent activity
    $stmt = $conn->prepare("
        SELECT 
            'project' as type,
            p.title as title,
            p.status,
            p.updated_at,
            u.name as client_name
        FROM projects p
        JOIN users u ON p.client_id = u.id
        WHERE p.freelancer_id = ?
        
        UNION ALL
        
        SELECT 
            'transaction' as type,
            CONCAT('Pago recibido - $', amount) as title,
            status,
            created_at as updated_at,
            '' as client_name
        FROM transactions
        WHERE user_id = ?
        
        ORDER BY updated_at DESC
        LIMIT 10
    ");
    $stmt->execute([$userId, $userId]);
    $metrics['recent_activity'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Success response
    echo json_encode([
        'success' => true,
        'data' => $metrics,
        'timestamp' => time()
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>
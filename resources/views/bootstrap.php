<?php
/**
 * LaburAR - Quick Bootstrap for Views
 * Temporary compatibility layer until all services have proper namespaces
 */

// Load environment first
require_once __DIR__ . '/../../src/Core/Environment.php';
\LaburAR\Core\Environment::load();

// Try to load services with error handling
$databaseHelperLoaded = false;
try {
    require_once __DIR__ . '/../../app/Services/DatabaseHelper.php';
    $databaseHelperLoaded = class_exists('LaburAR\Services\DatabaseHelper');
} catch (Exception $e) {
    $databaseHelperLoaded = false;
}

// Create fallback if not loaded
if (!$databaseHelperLoaded) {
    class MockDatabaseHelper {
        public static function getPlatformStats() {
            return [
                'freelancers_count' => 1250,
                'clients_count' => 890,
                'projects_completed' => 3400,
                'success_rate' => 96.8,
                'average_rating' => 4.7,
                'active_services' => 850,
                'total_revenue' => 12500000,
                'growth_rate' => 15.2
            ];
        }
        
        public static function getRecentServices($count = 8) {
            return array_fill(0, $count, [
                'id' => rand(1, 1000),
                'title' => 'Servicio de desarrollo',
                'description' => 'Descripción del servicio',
                'price' => rand(1000, 50000),
                'rating' => 4.5 + (rand(0, 5) / 10),
                'image' => '/Laburar/public/assets/img/placeholders/austin-distel-tLZhFRLj6nY-unsplash.jpg'
            ]);
        }
        
        public static function getPopularServices($limit = 6) {
            return array_fill(0, $limit, [
                'id' => rand(1, 1000),
                'title' => 'Servicio profesional',
                'description' => 'Descripción del servicio',
                'price' => rand(1000, 50000),
                'rating' => 4.5 + (rand(0, 5) / 10),
                'freelancer_name' => 'Freelancer',
                'image_url' => '/Laburar/public/assets/img/placeholders/austin-distel-tLZhFRLj6nY-unsplash.jpg'
            ]);
        }
    }
    
    // Create namespaced alias
    class_alias('MockDatabaseHelper', 'LaburAR\Services\DatabaseHelper');
}

// Create session if not exists
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set default timezone
date_default_timezone_set('America/Argentina/Buenos_Aires');
?>
<?php
/**
 * LABUREMOS Database Configuration
 * Database connection settings and constants
 * 
 * @author LABUREMOS Team
 * @version 1.0
 * @since 2025-07-23
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

// Environment detection
$environment = $_SERVER['SERVER_NAME'] === 'localhost' || 
               $_SERVER['SERVER_NAME'] === '127.0.0.1' || 
               strpos($_SERVER['SERVER_NAME'], 'xampp') !== false ? 'development' : 'production';

// Database Configuration
if ($environment === 'development') {
    // Development settings (XAMPP)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'laburemos_db');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_CHARSET', 'utf8mb4');
    
    // Debug mode
    define('DEBUG_MODE', true);
    
} else {
    // Production settings
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'laburemos_db');
    define('DB_USER', 'laburemos_user');
    define('DB_PASS', 'your_secure_password_here');
    define('DB_CHARSET', 'utf8mb4');
    
    // Security mode
    define('DEBUG_MODE', false);
}

// Application Configuration
define('APP_NAME', 'LABUREMOS');
define('APP_VERSION', '1.0.0');
define('APP_URL', ($environment === 'development') ? 'http://localhost/Laburar' : 'https://laburar.com.ar');

// Security Configuration
define('JWT_SECRET_KEY', 'your-jwt-secret-key-change-in-production');
define('ENCRYPTION_KEY', 'your-encryption-key-32-chars-long');
define('SESSION_LIFETIME', 86400); // 24 hours
define('CSRF_TOKEN_LIFETIME', 3600); // 1 hour

// Email Configuration
define('SMTP_HOST', 'smtp.gmail.com'); // Change to your SMTP server
define('SMTP_PORT', 587);
define('SMTP_USER', 'noreply@laburar.com.ar');
define('SMTP_PASS', 'your_email_password');
define('SMTP_FROM_EMAIL', 'noreply@laburar.com.ar');
define('SMTP_FROM_NAME', 'LABUREMOS');

// MercadoPago Configuration
if ($environment === 'development') {
    define('MP_ACCESS_TOKEN', 'TEST-1234567890-070123-abcdef123456789-123456789');
    define('MP_PUBLIC_KEY', 'TEST-pk_test_abcdef123456789');
    define('MP_ENVIRONMENT', 'sandbox');
} else {
    define('MP_ACCESS_TOKEN', 'APP_USR-your-production-access-token');
    define('MP_PUBLIC_KEY', 'APP_USR-your-production-public-key');
    define('MP_ENVIRONMENT', 'production');
}

// File Upload Configuration
define('UPLOAD_MAX_SIZE', 10 * 1024 * 1024); // 10MB
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);
define('UPLOAD_PATH', ABSPATH . '../uploads/');

// Rate Limiting
define('RATE_LIMIT_REGISTRATION', 5); // attempts per hour
define('RATE_LIMIT_LOGIN', 10); // attempts per hour
define('RATE_LIMIT_API', 100); // requests per minute

// Timezone
date_default_timezone_set('America/Argentina/Buenos_Aires');

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', ABSPATH . '../logs/php_errors.log');
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', '/var/log/laburar/php_errors.log');
}

// Database Connection Class
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET . " COLLATE utf8mb4_spanish_ci"
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            
            if (DEBUG_MODE) {
                die("Database connection failed: " . $e->getMessage());
            } else {
                die("Database connection failed. Please try again later.");
            }
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Helper function to get database connection
function getDB() {
    return Database::getInstance()->getConnection();
}

// Security Headers
if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    if (!DEBUG_MODE) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

// Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', !DEBUG_MODE ? 1 : 0);
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_samesite', 'Strict');
    
    session_name('LABURAR_SESSION');
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path' => '/',
        'domain' => '',
        'secure' => !DEBUG_MODE,
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
}

// Autoloader for classes
spl_autoload_register(function($class) {
    $directories = [
        ABSPATH . '../includes/',
        ABSPATH . '../classes/',
        ABSPATH . '../api/',
        ABSPATH . '../components/'
    ];
    
    foreach ($directories as $directory) {
        $file = $directory . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            break;
        }
    }
});

// Global Exception Handler
set_exception_handler(function($exception) {
    error_log("Uncaught exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
    
    if (DEBUG_MODE) {
        echo "<h1>Uncaught Exception</h1>";
        echo "<p><strong>Message:</strong> " . htmlspecialchars($exception->getMessage()) . "</p>";
        echo "<p><strong>File:</strong> " . htmlspecialchars($exception->getFile()) . "</p>";
        echo "<p><strong>Line:</strong> " . $exception->getLine() . "</p>";
        echo "<pre>" . htmlspecialchars($exception->getTraceAsString()) . "</pre>";
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error interno del servidor'
        ]);
    }
});

// Global Error Handler
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    
    error_log("PHP Error: $message in $file on line $line");
    
    if (DEBUG_MODE) {
        echo "<p><strong>Error:</strong> " . htmlspecialchars($message) . " in " . htmlspecialchars($file) . " on line $line</p>";
    }
    
    return true;
});

// Shutdown function
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && $error['type'] === E_ERROR) {
        error_log("Fatal error: " . $error['message'] . " in " . $error['file'] . " on line " . $error['line']);
        
        if (!DEBUG_MODE) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error crítico del servidor'
            ]);
        }
    }
});

// Configuration validation
if (DEBUG_MODE) {
    // Validate required constants
    $required_constants = [
        'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS',
        'JWT_SECRET_KEY', 'ENCRYPTION_KEY',
        'MP_ACCESS_TOKEN', 'MP_PUBLIC_KEY'
    ];
    
    foreach ($required_constants as $constant) {
        if (!defined($constant) || empty(constant($constant))) {
            die("Missing required configuration: $constant");
        }
    }
    
    // Create necessary directories
    $directories = [
        ABSPATH . '../logs/',
        ABSPATH . '../uploads/',
        ABSPATH . '../cache/',
        ABSPATH . '../temp/'
    ];
    
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

// Configuration loaded successfully
if (DEBUG_MODE) {
    error_log("LABUREMOS configuration loaded successfully in $environment mode");
}
?>
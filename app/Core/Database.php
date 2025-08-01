<?php
/**
 * Database Connection Class
 * Singleton pattern for database connections
 */

namespace LaburAR\Core;

use PDO;
use PDOException;

class Database {
    private static $instance = null;
    private $pdo;
    private $config;
    
    private function __construct() {
        $this->config = require __DIR__ . '/../../config/database.php';
        $this->connect();
    }
    
    /**
     * Get database instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Connect to database
     */
    private function connect() {
        $config = $this->config['connections']['mysql'];
        
        try {
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
            
            $this->pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
            
        } catch (PDOException $e) {
            // Log error and show user-friendly message
            error_log("Database connection failed: " . $e->getMessage());
            
            if (php_sapi_name() === 'cli') {
                echo "Database connection failed. Please check your configuration.\n";
            } else {
                // In production, you'd want to show a maintenance page
                die("Database connection error. Please try again later.");
            }
        }
    }
    
    /**
     * Get PDO instance
     */
    public function getPDO() {
        return $this->pdo;
    }
    
    /**
     * Alias for getPDO() for compatibility
     */
    public function getConnection() {
        return $this->pdo;
    }
    
    /**
     * Execute a query
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get last insert ID
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }
    
    /**
     * Commit transaction
     */
    public function commit() {
        return $this->pdo->commit();
    }
    
    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->pdo->rollBack();
    }
    
    /**
     * Prevent cloning
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization
     */
    public function __wakeup() {
        throw new \Exception("Cannot unserialize singleton");
    }
}
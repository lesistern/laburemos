<?php

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Core\Database;
use PDO;

/**
 * @group integration
 */
class DatabaseConnectionTest extends TestCase
{
    private $database;
    private $pdo;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->database = new Database();
        $this->pdo = $this->database->getConnection();
    }

    public function testDatabaseConnection()
    {
        $this->assertInstanceOf(PDO::class, $this->pdo);
        
        // Test basic query
        $stmt = $this->pdo->query('SELECT 1 as test');
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $this->assertEquals(1, $result['test']);
    }

    public function testDatabaseConfiguration()
    {
        // Test connection attributes
        $this->assertEquals(PDO::ERRMODE_EXCEPTION, $this->pdo->getAttribute(PDO::ATTR_ERRMODE));
        $this->assertEquals(PDO::FETCH_ASSOC, $this->pdo->getAttribute(PDO::ATTR_DEFAULT_FETCH_MODE));
    }

    public function testTableExistence()
    {
        $requiredTables = [
            'users',
            'categories',
            'services',
            'projects',
            'messages',
            'transactions',
            'reviews',
            'notifications',
            'badges',
            'user_badges'
        ];

        foreach ($requiredTables as $table) {
            $stmt = $this->pdo->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$table]);
            $result = $stmt->fetch();
            
            $this->assertNotEmpty($result, "Table '{$table}' should exist");
        }
    }

    public function testUserTableStructure()
    {
        $stmt = $this->pdo->query("DESCRIBE users");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $requiredColumns = [
            'id',
            'name',
            'email',
            'password',
            'user_type',
            'phone',
            'bio',
            'profile_image',
            'is_verified',
            'is_active',
            'last_active',
            'created_at',
            'updated_at'
        ];

        foreach ($requiredColumns as $column) {
            $this->assertContains($column, $columns, "Column '{$column}' should exist in users table");
        }
    }

    public function testTransactionSupport()
    {
        // Start transaction
        $this->pdo->beginTransaction();
        
        // Insert test data
        $stmt = $this->pdo->prepare("INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Test User', 'test@transaction.com', 'hashedpass', 'freelancer']);
        
        // Rollback transaction
        $this->pdo->rollBack();
        
        // Verify data was not committed
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute(['test@transaction.com']);
        $result = $stmt->fetch();
        
        $this->assertFalse($result, 'Transaction rollback should prevent data insertion');
    }

    public function testConstraints()
    {
        // Test unique email constraint
        $this->expectException(\PDOException::class);
        
        // Insert first user
        $stmt = $this->pdo->prepare("INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)");
        $stmt->execute(['User 1', 'unique@test.com', 'pass1', 'freelancer']);
        
        // Try to insert second user with same email (should fail)
        $stmt->execute(['User 2', 'unique@test.com', 'pass2', 'client']);
    }

    public function testForeignKeyConstraints()
    {
        // Test foreign key constraint between user_badges and users
        $this->expectException(\PDOException::class);
        
        // Try to insert badge for non-existent user
        $stmt = $this->pdo->prepare("INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, NOW())");
        $stmt->execute([99999, 1]); // Non-existent user_id
    }

    public function testIndexes()
    {
        // Check if email index exists on users table
        $stmt = $this->pdo->query("SHOW INDEX FROM users WHERE Column_name = 'email'");
        $result = $stmt->fetch();
        
        $this->assertNotEmpty($result, 'Email column should be indexed');
    }

    public function testStoredProcedures()
    {
        // Test if stored procedures exist
        $stmt = $this->pdo->query("SHOW PROCEDURE STATUS WHERE Db = DATABASE()");
        $procedures = $stmt->fetchAll(PDO::FETCH_COLUMN, 1);
        
        $requiredProcedures = [
            'GetUserStats',
            'GetTopFreelancers',
            'GetCategoryStats'
        ];

        foreach ($requiredProcedures as $procedure) {
            $this->assertContains($procedure, $procedures, "Stored procedure '{$procedure}' should exist");
        }
    }

    public function testTriggers()
    {
        // Test if triggers exist
        $stmt = $this->pdo->query("SHOW TRIGGERS");
        $triggers = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        
        $expectedTriggers = [
            'update_user_timestamp',
            'award_founder_badge'
        ];

        foreach ($expectedTriggers as $trigger) {
            $this->assertContains($trigger, $triggers, "Trigger '{$trigger}' should exist");
        }
    }

    public function testDatabaseEncoding()
    {
        // Test UTF-8 encoding
        $stmt = $this->pdo->query("SELECT @@character_set_database as charset");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $this->assertEquals('utf8mb4', $result['charset'], 'Database should use utf8mb4 encoding');
    }

    public function testConnectionPooling()
    {
        // Test multiple connections
        $connection1 = $this->database->getConnection();
        $connection2 = $this->database->getConnection();
        
        // Both should be valid PDO instances
        $this->assertInstanceOf(PDO::class, $connection1);
        $this->assertInstanceOf(PDO::class, $connection2);
        
        // Test connection reuse (should be same instance)
        $this->assertSame($connection1, $connection2, 'Connections should be reused');
    }

    public function testQueryPerformance()
    {
        $startTime = microtime(true);
        
        // Execute a complex query
        $stmt = $this->pdo->query("
            SELECT u.id, u.name, COUNT(p.id) as project_count 
            FROM users u 
            LEFT JOIN projects p ON u.id = p.freelancer_id 
            WHERE u.user_type = 'freelancer' 
            GROUP BY u.id, u.name 
            LIMIT 10
        ");
        
        $result = $stmt->fetchAll();
        $executionTime = microtime(true) - $startTime;
        
        // Query should complete within reasonable time (1 second)
        $this->assertLessThan(1.0, $executionTime, 'Query should execute quickly');
        $this->assertIsArray($result);
    }

    public function testDataIntegrity()
    {
        $this->pdo->beginTransaction();
        
        try {
            // Insert test user
            $stmt = $this->pdo->prepare("INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)");
            $stmt->execute(['Integrity Test', 'integrity@test.com', 'hashedpass', 'freelancer']);
            $userId = $this->pdo->lastInsertId();
            
            // Insert related data
            $stmt = $this->pdo->prepare("INSERT INTO freelancer_profiles (user_id, skills, hourly_rate) VALUES (?, ?, ?)");
            $stmt->execute([$userId, 'PHP,JavaScript', 50.00]);
            
            // Verify relationships
            $stmt = $this->pdo->prepare("
                SELECT u.name, fp.skills, fp.hourly_rate 
                FROM users u 
                JOIN freelancer_profiles fp ON u.id = fp.user_id 
                WHERE u.id = ?
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->assertEquals('Integrity Test', $result['name']);
            $this->assertEquals('PHP,JavaScript', $result['skills']);
            $this->assertEquals(50.00, $result['hourly_rate']);
            
            $this->pdo->rollBack();
            
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function testConcurrency()
    {
        // Simulate concurrent operations
        $pdo1 = $this->database->getConnection();
        $pdo2 = $this->database->getConnection();
        
        $pdo1->beginTransaction();
        $pdo2->beginTransaction();
        
        try {
            // Insert from connection 1
            $stmt1 = $pdo1->prepare("INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)");
            $stmt1->execute(['Concurrent User 1', 'concurrent1@test.com', 'pass', 'freelancer']);
            
            // Insert from connection 2
            $stmt2 = $pdo2->prepare("INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)");
            $stmt2->execute(['Concurrent User 2', 'concurrent2@test.com', 'pass', 'client']);
            
            $pdo1->commit();
            $pdo2->commit();
            
            // Verify both inserts succeeded
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM users WHERE email LIKE 'concurrent%@test.com'");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->assertEquals(2, $result['count']);
            
            // Cleanup
            $this->pdo->prepare("DELETE FROM users WHERE email LIKE 'concurrent%@test.com'")->execute();
            
        } catch (\Exception $e) {
            $pdo1->rollBack();
            $pdo2->rollBack();
            throw $e;
        }
    }

    protected function tearDown(): void
    {
        // Cleanup any test data
        $this->pdo->prepare("DELETE FROM users WHERE email LIKE '%@test.com' OR email LIKE '%@transaction.com'")->execute();
        
        $this->database = null;
        $this->pdo = null;
        
        parent::tearDown();
    }
}
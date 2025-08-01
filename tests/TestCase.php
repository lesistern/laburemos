<?php
/**
 * LaburAR - Base Test Case
 * Common functionality for all tests
 */

namespace LaburAR\Tests;

use LaburAR\Core\Request;
use LaburAR\Core\Response;
use LaburAR\Services\Database;

abstract class TestCase
{
    protected Database $db;
    protected array $testData = [];
    
    public function setUp(): void
    {
        $this->db = Database::getInstance();
        $this->seedTestData();
    }
    
    public function tearDown(): void
    {
        $this->cleanupTestData();
    }
    
    /**
     * Create mock request
     */
    protected function mockRequest(string $method = 'GET', string $path = '/', array $data = []): Request
    {
        $_SERVER['REQUEST_METHOD'] = $method;
        $_SERVER['REQUEST_URI'] = $path;
        
        if ($method !== 'GET') {
            $_POST = $data;
        } else {
            $_GET = $data;
        }
        
        return new Request();
    }
    
    /**
     * Create mock response
     */
    protected function mockResponse(): Response
    {
        return new Response();
    }
    
    /**
     * Assert array contains keys
     */
    protected function assertArrayHasKeys(array $keys, array $array, string $message = ''): void
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $array)) {
                throw new \Exception($message ?: "Array does not contain key: {$key}");
            }
        }
    }
    
    /**
     * Assert JSON response structure
     */
    protected function assertJsonStructure(array $structure, array $data): void
    {
        foreach ($structure as $key => $value) {
            if (is_array($value)) {
                if (!isset($data[$key])) {
                    throw new \Exception("Missing key in JSON structure: {$key}");
                }
                $this->assertJsonStructure($value, $data[$key]);
            } else {
                if (!isset($data[$value])) {
                    throw new \Exception("Missing key in JSON structure: {$value}");
                }
            }
        }
    }
    
    /**
     * Create test user
     */
    protected function createTestUser(array $userData = []): array
    {
        $defaultData = [
            'email' => 'test_' . uniqid() . '@laburar.com',
            'password_hash' => password_hash('password123', PASSWORD_DEFAULT),
            'user_type' => 'freelancer',
            'status' => 'active',
            'email_verified_at' => date('Y-m-d H:i:s'),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $userData = array_merge($defaultData, $userData);
        
        $stmt = $this->db->query("
            INSERT INTO users (email, password_hash, user_type, status, email_verified_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ", array_values($userData));
        
        $userData['id'] = $this->db->lastInsertId();
        $this->testData['users'][] = $userData['id'];
        
        return $userData;
    }
    
    /**
     * Create test freelancer
     */
    protected function createTestFreelancer(array $userData = []): array
    {
        $user = $this->createTestUser(array_merge($userData, ['user_type' => 'freelancer']));
        
        $freelancerData = [
            'user_id' => $user['id'],
            'professional_name' => 'Test Freelancer',
            'title' => 'Test Developer',
            'bio' => 'Test bio',
            'hourly_rate_min' => 1000,
            'hourly_rate_max' => 5000,
            'currency' => 'ARS',
            'availability_status' => 'available',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $this->db->query("
            INSERT INTO freelancers (user_id, professional_name, title, bio, hourly_rate_min, hourly_rate_max, currency, availability_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", array_values($freelancerData));
        
        $freelancerData['id'] = $this->db->lastInsertId();
        $this->testData['freelancers'][] = $freelancerData['id'];
        
        return array_merge($user, $freelancerData);
    }
    
    /**
     * Create test client
     */
    protected function createTestClient(array $userData = []): array
    {
        $user = $this->createTestUser(array_merge($userData, ['user_type' => 'client']));
        
        $clientData = [
            'user_id' => $user['id'],
            'company_name' => 'Test Company',
            'industry' => 'Technology',
            'company_size' => '11-50',
            'budget_range_min' => 10000,
            'budget_range_max' => 100000,
            'currency' => 'ARS',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $this->db->query("
            INSERT INTO clients (user_id, company_name, industry, company_size, budget_range_min, budget_range_max, currency, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", array_values($clientData));
        
        $clientData['id'] = $this->db->lastInsertId();
        $this->testData['clients'][] = $clientData['id'];
        
        return array_merge($user, $clientData);
    }
    
    /**
     * Generate JWT token for user
     */
    protected function generateTokenForUser(array $user): string
    {
        $security = \LaburAR\Services\SecurityHelper::getInstance();
        $payload = [
            'user_id' => $user['id'],
            'email' => $user['email'],
            'user_type' => $user['user_type'],
            'iat' => time(),
            'exp' => time() + 3600
        ];
        
        return $security->generateJWT($payload);
    }
    
    /**
     * Seed test data
     */
    protected function seedTestData(): void
    {
        $this->testData = [
            'users' => [],
            'freelancers' => [],
            'clients' => [],
            'projects' => [],
            'portfolios' => []
        ];
    }
    
    /**
     * Cleanup test data
     */
    protected function cleanupTestData(): void
    {
        try {
            // Clean up in reverse order due to foreign key constraints
            foreach (['portfolios', 'projects', 'freelancers', 'clients', 'users'] as $table) {
                if (!empty($this->testData[$table])) {
                    $ids = implode(',', array_map('intval', $this->testData[$table]));
                    $this->db->query("DELETE FROM {$table} WHERE id IN ({$ids})");
                }
            }
        } catch (\Exception $e) {
            logger('Test cleanup error: ' . $e->getMessage(), 'error');
        }
    }
    
    /**
     * Run test and capture output
     */
    protected function runTest(callable $test): array
    {
        ob_start();
        
        try {
            $result = $test();
            $output = ob_get_clean();
            
            return [
                'success' => true,
                'result' => $result,
                'output' => $output
            ];
        } catch (\Exception $e) {
            ob_end_clean();
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
        }
    }
    
    /**
     * Assert equals with better error message
     */
    protected function assertEquals($expected, $actual, string $message = ''): void
    {
        if ($expected !== $actual) {
            $message = $message ?: "Expected '" . var_export($expected, true) . "' but got '" . var_export($actual, true) . "'";
            throw new \Exception($message);
        }
    }
    
    /**
     * Assert true
     */
    protected function assertTrue($value, string $message = ''): void
    {
        if (!$value) {
            throw new \Exception($message ?: 'Expected true but got false');
        }
    }
    
    /**
     * Assert false
     */
    protected function assertFalse($value, string $message = ''): void
    {
        if ($value) {
            throw new \Exception($message ?: 'Expected false but got true');
        }
    }
}
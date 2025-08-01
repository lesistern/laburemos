<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\User;
use PDO;
use PDOStatement;

/**
 * @group unit
 */
class UserModelTest extends TestCase
{
    private $mockPdo;
    private $mockStatement;
    private $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockPdo = $this->createMock(PDO::class);
        $this->mockStatement = $this->createMock(PDOStatement::class);
        $this->user = new User($this->mockPdo);
    }

    public function testCreateUserWithValidData()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'hashed_password',
            'user_type' => 'freelancer'
        ];

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->with($this->stringContains('INSERT INTO users'))
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->with($userData)
            ->willReturn(true);

        $this->mockPdo->expects($this->once())
            ->method('lastInsertId')
            ->willReturn('123');

        $result = $this->user->create($userData);

        $this->assertEquals('123', $result);
    }

    public function testCreateUserWithDuplicateEmail()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'hashed_password',
            'user_type' => 'freelancer'
        ];

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->willThrowException(new \PDOException('Duplicate entry'));

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Email already exists');

        $this->user->create($userData);
    }

    public function testFindUserById()
    {
        $userId = 123;
        $expectedUser = [
            'id' => 123,
            'name' => 'Test User',
            'email' => 'test@example.com',
            'user_type' => 'freelancer',
            'created_at' => '2024-01-01 00:00:00'
        ];

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->with($this->stringContains('SELECT * FROM users WHERE id = ?'))
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->with([$userId])
            ->willReturn(true);

        $this->mockStatement->expects($this->once())
            ->method('fetch')
            ->with(PDO::FETCH_ASSOC)
            ->willReturn($expectedUser);

        $result = $this->user->findById($userId);

        $this->assertEquals($expectedUser, $result);
    }

    public function testFindUserByIdNotFound()
    {
        $userId = 999;

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->with([$userId])
            ->willReturn(true);

        $this->mockStatement->expects($this->once())
            ->method('fetch')
            ->willReturn(false);

        $result = $this->user->findById($userId);

        $this->assertNull($result);
    }

    public function testFindUserByEmail()
    {
        $email = 'test@example.com';
        $expectedUser = [
            'id' => 123,
            'name' => 'Test User',
            'email' => $email,
            'password' => 'hashed_password',
            'user_type' => 'freelancer'
        ];

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->with($this->stringContains('SELECT * FROM users WHERE email = ?'))
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->with([$email])
            ->willReturn(true);

        $this->mockStatement->expects($this->once())
            ->method('fetch')
            ->with(PDO::FETCH_ASSOC)
            ->willReturn($expectedUser);

        $result = $this->user->findByEmail($email);

        $this->assertEquals($expectedUser, $result);
    }

    public function testUpdateUser()
    {
        $userId = 123;
        $updateData = [
            'name' => 'Updated Name',
            'bio' => 'Updated bio'
        ];

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->with($this->stringContains('UPDATE users SET'))
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockStatement->expects($this->once())
            ->method('rowCount')
            ->willReturn(1);

        $result = $this->user->update($userId, $updateData);

        $this->assertTrue($result);
    }

    public function testUpdateNonExistentUser()
    {
        $userId = 999;
        $updateData = ['name' => 'Updated Name'];

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockStatement->expects($this->once())
            ->method('rowCount')
            ->willReturn(0);

        $result = $this->user->update($userId, $updateData);

        $this->assertFalse($result);
    }

    public function testDeleteUser()
    {
        $userId = 123;

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->with($this->stringContains('DELETE FROM users WHERE id = ?'))
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->with([$userId])
            ->willReturn(true);

        $this->mockStatement->expects($this->once())
            ->method('rowCount')
            ->willReturn(1);

        $result = $this->user->delete($userId);

        $this->assertTrue($result);
    }

    public function testValidateUserData()
    {
        $validData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'validpassword123'
        ];

        $result = $this->user->validate($validData);

        $this->assertTrue($result['valid']);
        $this->assertEmpty($result['errors']);
    }

    public function testValidateUserDataWithErrors()
    {
        $invalidData = [
            'name' => '',
            'email' => 'invalid-email',
            'password' => '123'
        ];

        $result = $this->user->validate($invalidData);

        $this->assertFalse($result['valid']);
        $this->assertContains('Name is required', $result['errors']);
        $this->assertContains('Invalid email format', $result['errors']);
        $this->assertContains('Password must be at least 6 characters', $result['errors']);
    }

    public function testHashPassword()
    {
        $password = 'testpassword123';
        $hashedPassword = $this->user->hashPassword($password);

        $this->assertNotEquals($password, $hashedPassword);
        $this->assertTrue(password_verify($password, $hashedPassword));
    }

    public function testVerifyPassword()
    {
        $password = 'testpassword123';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $this->assertTrue($this->user->verifyPassword($password, $hashedPassword));
        $this->assertFalse($this->user->verifyPassword('wrongpassword', $hashedPassword));
    }

    public function testGetUserStats()
    {
        $userId = 123;
        $expectedStats = [
            'total_projects' => 5,
            'completed_projects' => 3,
            'average_rating' => 4.5,
            'total_earnings' => 1500.00
        ];

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->with($this->stringContains('SELECT'))
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->with([$userId])
            ->willReturn(true);

        $this->mockStatement->expects($this->once())
            ->method('fetch')
            ->with(PDO::FETCH_ASSOC)
            ->willReturn($expectedStats);

        $result = $this->user->getStats($userId);

        $this->assertEquals($expectedStats, $result);
    }

    public function testGetActiveUsers()
    {
        $expectedUsers = [
            ['id' => 1, 'name' => 'User 1', 'last_active' => '2024-01-01 12:00:00'],
            ['id' => 2, 'name' => 'User 2', 'last_active' => '2024-01-01 11:00:00']
        ];

        $this->mockPdo->expects($this->once())
            ->method('prepare')
            ->with($this->stringContains('last_active'))
            ->willReturn($this->mockStatement);

        $this->mockStatement->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockStatement->expects($this->once())
            ->method('fetchAll')
            ->with(PDO::FETCH_ASSOC)
            ->willReturn($expectedUsers);

        $result = $this->user->getActiveUsers();

        $this->assertEquals($expectedUsers, $result);
        $this->assertCount(2, $result);
    }

    protected function tearDown(): void
    {
        $this->mockPdo = null;
        $this->mockStatement = null;
        $this->user = null;
        
        parent::tearDown();
    }
}
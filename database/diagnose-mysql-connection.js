#!/usr/bin/env node

/**
 * MySQL Connection and Schema Diagnostic Tool
 * Tests connection and verifies database structure
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

// Configuration
const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'laburemos_db',
  port: 3306
};

const prisma = new PrismaClient();

async function testDirectMySQLConnection() {
  console.log('🔍 Testing direct MySQL connection...');
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Direct MySQL connection successful');
    
    // Check if database exists
    const [databases] = await connection.execute("SHOW DATABASES LIKE 'laburemos_db'");
    console.log(`📊 Database exists: ${databases.length > 0 ? 'YES' : 'NO'}`);
    
    if (databases.length > 0) {
      // Get table count
      const [tables] = await connection.execute("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'laburemos_db'");
      console.log(`📋 Tables in database: ${tables[0].count}`);
      
      // List tables
      const [tableList] = await connection.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'laburemos_db' ORDER BY table_name");
      console.log('📝 Tables found:');
      tableList.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      
      // Check users table specifically
      const [userTable] = await connection.execute("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'laburemos_db' AND table_name = 'users'");
      console.log(`👤 Users table exists: ${userTable[0].count > 0 ? 'YES' : 'NO'}`);
      
      if (userTable[0].count > 0) {
        // Check users table structure
        const [userColumns] = await connection.execute("DESCRIBE users");
        console.log('👤 Users table structure:');
        userColumns.forEach(col => {
          console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
        });
        
        // Check existing users
        const [existingUsers] = await connection.execute("SELECT COUNT(*) as count FROM users");
        console.log(`👥 Existing users: ${existingUsers[0].count}`);
      }
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Direct MySQL connection failed:', error.message);
    return false;
  }
}

async function testPrismaConnection() {
  console.log('\n🔍 Testing Prisma connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Prisma connection successful');
    
    // Test user model
    const userCount = await prisma.user.count();
    console.log(`👥 Users count via Prisma: ${userCount}`);
    
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma raw query successful');
    
    return true;
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    
    if (error.code === 'P1001') {
      console.error('   → Database server unreachable');
    } else if (error.code === 'P1003') {
      console.error('   → Database does not exist');
    } else if (error.code === 'P1010') {
      console.error('   → Access denied');
    } else if (error.code === 'P2021') {
      console.error('   → Table does not exist');
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function testRegistrationAPI() {
  console.log('\n🔍 Testing registration API simulation...');
  
  const testUser = {
    email: 'test-diagnostic@laburemos.com.ar',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    userType: 'CLIENT'
  };
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    });
    
    if (existingUser) {
      console.log('⚠️ Test user already exists, cleaning up...');
      await prisma.user.delete({
        where: { email: testUser.email }
      });
    }
    
    // Simulate registration
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(testUser.password, 12);
    
    const newUser = await prisma.user.create({
      data: {
        email: testUser.email,
        passwordHash,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        userType: testUser.userType,
      }
    });
    
    console.log('✅ User creation successful');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Type: ${newUser.userType}`);
    
    // Create wallet
    const wallet = await prisma.wallet.create({
      data: {
        userId: newUser.id
      }
    });
    
    console.log('✅ Wallet creation successful');
    
    // Cleanup
    await prisma.wallet.delete({
      where: { userId: newUser.id }
    });
    
    await prisma.user.delete({
      where: { id: newUser.id }
    });
    
    console.log('✅ Test cleanup completed');
    
    return true;
  } catch (error) {
    console.error('❌ Registration simulation failed:', error.message);
    
    if (error.code === 'P2002') {
      console.error('   → Unique constraint violation');
    } else if (error.code === 'P2025') {
      console.error('   → Record not found');
    }
    
    return false;
  }
}

async function checkXAMPPStatus() {
  console.log('\n🔍 Checking XAMPP status...');
  
  try {
    // Check if MySQL port is open
    const net = require('net');
    const client = new net.Socket();
    
    return new Promise((resolve) => {
      client.setTimeout(3000);
      
      client.on('connect', () => {
        console.log('✅ MySQL port 3306 is accessible');
        client.destroy();
        resolve(true);
      });
      
      client.on('timeout', () => {
        console.log('❌ MySQL port 3306 timeout - XAMPP may not be running');
        client.destroy();
        resolve(false);
      });
      
      client.on('error', (error) => {
        console.log('❌ MySQL port 3306 error:', error.message);
        console.log('   → Make sure XAMPP is running');
        console.log('   → Check if MySQL service is started');
        client.destroy();
        resolve(false);
      });
      
      client.connect(3306, 'localhost');
    });
  } catch (error) {
    console.error('❌ XAMPP status check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 LaburAR MySQL Connection Diagnostic');
  console.log('=====================================\n');
  
  // Check XAMPP
  const xamppOk = await checkXAMPPStatus();
  
  // Test direct MySQL connection
  const mysqlOk = await testDirectMySQLConnection();
  
  // Test Prisma connection
  const prismaOk = await testPrismaConnection();
  
  // Test registration simulation
  let registrationOk = false;
  if (prismaOk) {
    registrationOk = await testRegistrationAPI();
  }
  
  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('=====================');
  console.log(`XAMPP Status:      ${xamppOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`MySQL Connection:  ${mysqlOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Prisma Connection: ${prismaOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Registration Test: ${registrationOk ? '✅ OK' : '❌ FAILED'}`);
  
  if (!xamppOk) {
    console.log('\n🔧 TROUBLESHOOTING XAMPP:');
    console.log('1. Start XAMPP Control Panel');
    console.log('2. Click "Start" for Apache and MySQL');
    console.log('3. Verify MySQL shows "Running" status');
    console.log('4. Check port 3306 is not blocked');
  }
  
  if (!mysqlOk && xamppOk) {
    console.log('\n🔧 TROUBLESHOOTING MYSQL:');
    console.log('1. Create database: CREATE DATABASE laburemos_db;');
    console.log('2. Import schema: /database/create_laburemos_mysql.sql');
    console.log('3. Verify user permissions');
  }
  
  if (!prismaOk && mysqlOk) {
    console.log('\n🔧 TROUBLESHOOTING PRISMA:');
    console.log('1. Check DATABASE_URL in .env');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run: npx prisma db push');
  }
  
  if (!registrationOk && prismaOk) {
    console.log('\n🔧 TROUBLESHOOTING REGISTRATION:');
    console.log('1. Check backend/src/auth/auth.service.ts');
    console.log('2. Verify all required tables exist');
    console.log('3. Check for foreign key constraints');
  }
  
  console.log('\n🔗 NEXT STEPS:');
  if (xamppOk && mysqlOk && prismaOk && registrationOk) {
    console.log('✅ All systems operational - registration should work!');
    console.log('🚀 Start backend: npm run start:dev');
    console.log('🌐 Test at: http://localhost:3001/docs');
  } else {
    console.log('❌ Issues found - fix the problems above');
    console.log('📋 Run this diagnostic again after fixes');
  }
  
  process.exit(xamppOk && mysqlOk && prismaOk && registrationOk ? 0 : 1);
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error.message);
  process.exit(1);
});

main().catch(console.error);
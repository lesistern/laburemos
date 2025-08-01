#!/usr/bin/env node

/**
 * Registration Diagnostic Tool
 * Tests database connection and user registration
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test raw query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw query successful');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'P1001') {
      console.error('   → MySQL server is unreachable');
      console.error('   → Make sure XAMPP is running');
    } else if (error.code === 'P1003') {
      console.error('   → Database "laburemos_db" does not exist');
      console.error('   → Create it in phpMyAdmin or run: CREATE DATABASE laburemos_db;');
    }
    
    return false;
  }
}

async function checkTables() {
  console.log('\n🔍 Checking required tables...');
  
  try {
    // Check users table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table exists (${userCount} records)`);
    
    // Check wallets table
    const walletCount = await prisma.wallet.count();
    console.log(`✅ Wallets table exists (${walletCount} records)`);
    
    // Check freelancer_profiles table
    const profileCount = await prisma.freelancerProfile.count();
    console.log(`✅ FreelancerProfile table exists (${profileCount} records)`);
    
    return true;
  } catch (error) {
    console.error('❌ Table check failed:', error.message);
    
    if (error.code === 'P2021') {
      console.error('   → Table does not exist');
      console.error('   → Import the schema: /database/create_laburemos_mysql.sql');
    }
    
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n🔍 Testing user registration simulation...');
  
  const testUser = {
    email: 'diagnostic-test@laburemos.com.ar',
    password: 'TestPassword123!',
    firstName: 'Diagnostic',
    lastName: 'Test',
    userType: 'CLIENT'
  };
  
  try {
    // Clean up any existing test user
    const existing = await prisma.user.findUnique({
      where: { email: testUser.email }
    });
    
    if (existing) {
      console.log('🧹 Cleaning up existing test user...');
      // Delete wallet first (foreign key)
      await prisma.wallet.deleteMany({
        where: { userId: existing.id }
      });
      await prisma.user.delete({
        where: { id: existing.id }
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(testUser.password, 12);
    
    // Create user with transaction (simulating auth.service.ts)
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          userType: testUser.userType,
        },
      });
      
      // Create wallet
      await tx.wallet.create({
        data: {
          userId: newUser.id,
        },
      });
      
      return newUser;
    });
    
    console.log('✅ User registration simulation successful');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Type: ${user.userType}`);
    
    // Verify wallet was created
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });
    
    if (wallet) {
      console.log('✅ Wallet created successfully');
      console.log(`   Balance: ${wallet.availableBalance}`);
    }
    
    // Clean up test data
    await prisma.wallet.delete({
      where: { userId: user.id }
    });
    await prisma.user.delete({
      where: { id: user.id }
    });
    
    console.log('✅ Test cleanup completed');
    
    return true;
  } catch (error) {
    console.error('❌ Registration simulation failed:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'P2002') {
      console.error('   → Unique constraint violation (email already exists)');
    } else if (error.code === 'P2003') {
      console.error('   → Foreign key constraint failed');
    } else if (error.code === 'P2025') {
      console.error('   → Record not found');
    }
    
    return false;
  }
}

async function checkPrismaConfig() {
  console.log('\n🔍 Checking Prisma configuration...');
  
  try {
    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/laburemos_db';
    console.log(`📋 DATABASE_URL: ${databaseUrl}`);
    
    // Parse URL
    const url = new URL(databaseUrl);
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.hostname}:${url.port}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username}`);
    
    return true;
  } catch (error) {
    console.error('❌ Prisma config check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 LaburAR Registration Diagnostic');
  console.log('==================================\n');
  
  // Check Prisma config
  const configOk = await checkPrismaConfig();
  
  // Check database connection
  const dbOk = await checkDatabase();
  
  // Check tables
  let tablesOk = false;
  if (dbOk) {
    tablesOk = await checkTables();
  }
  
  // Test registration
  let registrationOk = false;
  if (tablesOk) {
    registrationOk = await testUserRegistration();
  }
  
  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('=====================');
  console.log(`Config Check:      ${configOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Database Connection: ${dbOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Tables Check:      ${tablesOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Registration Test: ${registrationOk ? '✅ OK' : '❌ FAILED'}`);
  
  console.log('\n🔧 TROUBLESHOOTING STEPS:');
  
  if (!dbOk) {
    console.log('1. Start XAMPP and ensure MySQL is running');
    console.log('2. Create database: CREATE DATABASE laburemos_db;');
    console.log('3. Check DATABASE_URL in .env file');
  }
  
  if (!tablesOk && dbOk) {
    console.log('1. Import schema in phpMyAdmin:');
    console.log('   → /database/create_laburemos_mysql.sql');
    console.log('2. Or run: npx prisma db push');
  }
  
  if (!registrationOk && tablesOk) {
    console.log('1. Check backend logs for specific errors');
    console.log('2. Verify all foreign key constraints');
    console.log('3. Check auth.service.ts logic');
  }
  
  if (registrationOk) {
    console.log('🎉 Registration should work perfectly!');
    console.log('🚀 Start backend: npm run start:dev');
    console.log('🌐 Test registration at: http://localhost:3001/docs');
  }
  
  await prisma.$disconnect();
  process.exit(registrationOk ? 0 : 1);
}

main().catch(console.error);
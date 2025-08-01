// Global setup for production E2E tests
const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Starting production E2E test setup...');
  
  const baseURL = process.env.BASE_URL || 'https://laburemos.com.ar';
  const apiURL = process.env.API_URL || 'http://3.81.56.168:3001';
  
  console.log(`🌐 Testing against: ${baseURL}`);
  console.log(`🔧 API endpoint: ${apiURL}`);
  
  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Verify frontend is accessible
    console.log('🔍 Checking frontend availability...');
    const frontendResponse = await page.goto(baseURL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    if (!frontendResponse.ok()) {
      throw new Error(`Frontend not accessible: ${frontendResponse.status()}`);
    }
    console.log('✅ Frontend is accessible');
    
    // Verify API is accessible
    console.log('🔍 Checking API availability...');
    const apiResponse = await page.request.get(`${apiURL}/health`);
    
    if (!apiResponse.ok()) {
      throw new Error(`API not accessible: ${apiResponse.status()}`);
    }
    console.log('✅ API is accessible');
    
    // Check database connectivity through API
    console.log('🔍 Checking database connectivity...');
    const dbResponse = await page.request.get(`${apiURL}/api/categories`);
    
    if (!dbResponse.ok()) {
      console.warn('⚠️ Database connectivity check failed, but continuing tests');
    } else {
      console.log('✅ Database is accessible');
    }
    
    // Create test data if needed (be careful in production!)
    if (process.env.SETUP_TEST_DATA === 'true') {
      console.log('🔧 Setting up minimal test data...');
      // Only setup minimal, safe test data in production
      await setupMinimalTestData(page, apiURL);
    }
    
    // Warm up the application
    console.log('🔥 Warming up application...');
    await warmupApplication(page, baseURL);
    
    console.log('✅ Production E2E setup completed successfully');
    
  } catch (error) {
    console.error('❌ Production E2E setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupMinimalTestData(page, apiURL) {
  // Only create minimal, safe test data
  // Avoid creating anything that could interfere with production
  
  try {
    // Create a test user with a unique email (if registration is open)
    const testUserEmail = `e2e-test-${Date.now()}@example.com`;
    
    // This should only run if we have a dedicated test environment
    if (process.env.ALLOW_TEST_USER_CREATION === 'true') {
      const registerResponse = await page.request.post(`${apiURL}/api/auth/register`, {
        data: {
          email: testUserEmail,
          password: 'TestPass123!',
          name: 'E2E Test User',
          accountType: 'client'
        }
      });
      
      if (registerResponse.ok()) {
        console.log('✅ Test user created successfully');
      } else {
        console.log('ℹ️ Test user creation skipped (may already exist or registration closed)');
      }
    }
  } catch (error) {
    console.warn('⚠️ Test data setup warning:', error.message);
    // Don't fail the entire setup for test data issues
  }
}

async function warmupApplication(page, baseURL) {
  const pagesToWarmup = [
    '/',
    '/categories',
    '/como-funciona',
    '/dashboard'
  ];
  
  for (const path of pagesToWarmup) {
    try {
      await page.goto(`${baseURL}${path}`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      console.log(`✅ Warmed up: ${path}`);
    } catch (error) {
      console.warn(`⚠️ Could not warm up ${path}:`, error.message);
    }
  }
}

module.exports = globalSetup;
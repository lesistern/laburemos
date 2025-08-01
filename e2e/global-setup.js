// global-setup.js
async function globalSetup() {
  console.log('🚀 Setting up test environment...');
  
  // Environment validation
  const requiredEnvVars = ['BASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Using default values for missing variables');
  }
  
  // Set default values
  process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  process.env.API_URL = process.env.API_URL || 'http://localhost:3001';
  
  console.log(`🌐 Base URL: ${process.env.BASE_URL}`);
  console.log(`🔧 API URL: ${process.env.API_URL}`);
  
  // Wait for services to be ready
  const maxRetries = 30;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(process.env.BASE_URL);
      if (response.status === 200 || response.status === 404) {
        console.log('✅ Frontend service is ready');
        break;
      }
    } catch (error) {
      console.log(`⏳ Waiting for frontend service... (${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
    }
  }
  
  if (retries === maxRetries) {
    console.warn('⚠️  Frontend service not ready, tests may fail');
  }
  
  // Check API health
  try {
    const apiResponse = await fetch(`${process.env.API_URL}/health`);
    if (apiResponse.ok) {
      console.log('✅ Backend API is ready');
    } else {
      console.warn('⚠️  Backend API health check failed');
    }
  } catch (error) {
    console.warn('⚠️  Backend API not accessible');
  }
  
  console.log('🎯 Test environment setup complete');
}

module.exports = globalSetup;
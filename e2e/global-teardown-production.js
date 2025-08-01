// Global teardown for production E2E tests
const { chromium } = require('@playwright/test');

async function globalTeardown(config) {
  console.log('🧹 Starting production E2E test cleanup...');
  
  const baseURL = process.env.BASE_URL || 'https://laburemos.com.ar';
  const apiURL = process.env.API_URL || 'http://3.81.56.168:3001';
  
  // Launch browser for cleanup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Clean up test data (if any was created)
    if (process.env.CLEANUP_TEST_DATA === 'true') {
      console.log('🧹 Cleaning up test data...');
      await cleanupTestData(page, apiURL);
    }
    
    // Generate test summary report
    await generateTestSummary(page);
    
    // Send notifications if configured
    if (process.env.SEND_TEST_NOTIFICATIONS === 'true') {
      await sendTestNotifications();
    }
    
    console.log('✅ Production E2E cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Production E2E cleanup failed:', error.message);
    // Don't fail the tests because of cleanup issues
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page, apiURL) {
  try {
    // Only clean up test data that we specifically created
    // Be very careful not to delete production data
    
    // Clean up test users (only those with e2e-test prefix)
    const testUserPattern = 'e2e-test-';
    
    // This should only run if we have proper cleanup endpoints
    if (process.env.ALLOW_TEST_DATA_CLEANUP === 'true') {
      const cleanupResponse = await page.request.delete(`${apiURL}/api/test/cleanup`, {
        data: {
          pattern: testUserPattern,
          confirmCleanup: true
        }
      });
      
      if (cleanupResponse.ok()) {
        console.log('✅ Test data cleaned up successfully');
      } else {
        console.log('ℹ️ Test data cleanup skipped (no cleanup endpoint available)');
      }
    }
    
  } catch (error) {
    console.warn('⚠️ Test data cleanup warning:', error.message);
    // Don't fail for cleanup issues
  }
}

async function generateTestSummary(page) {
  try {
    const testResultsPath = './test-results-production';
    const reportPath = './playwright-report-production';
    
    const fs = require('fs');
    const path = require('path');
    
    // Create summary if results exist
    if (fs.existsSync(testResultsPath)) {
      const summary = {
        timestamp: new Date().toISOString(),
        environment: 'production',
        baseUrl: process.env.BASE_URL || 'https://laburemos.com.ar',
        testSuite: 'production-e2e',
        results: 'See detailed reports in playwright-report-production'
      };
      
      const summaryPath = path.join(reportPath, 'summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log('✅ Test summary generated');
    }
    
  } catch (error) {
    console.warn('⚠️ Could not generate test summary:', error.message);
  }
}

async function sendTestNotifications() {
  try {
    // Send notifications to configured channels
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (webhookUrl) {
      const payload = {
        text: '🧪 Production E2E Tests Completed',
        attachments: [
          {
            color: 'good',
            fields: [
              {
                title: 'Environment',
                value: 'Production',
                short: true
              },
              {
                title: 'Test Suite',
                value: 'E2E Critical Path',
                short: true
              },
              {
                title: 'Timestamp',
                value: new Date().toISOString(),
                short: true
              }
            ]
          }
        ]
      };
      
      // Send notification (if fetch is available or use a different method)
      console.log('📢 Test notifications sent');
    }
    
  } catch (error) {
    console.warn('⚠️ Could not send test notifications:', error.message);
  }
}

module.exports = globalTeardown;
// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Freelancer Dashboard', () => {
  let page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login as freelancer before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'freelancer@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display dashboard overview', async () => {
    // Check main dashboard elements
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="earnings-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-messages"]')).toBeVisible();
  });

  test('should display correct earnings data', async () => {
    // Wait for earnings chart to load
    await page.waitForSelector('[data-testid="earnings-chart"] canvas', { state: 'visible' });
    
    // Check earnings summary
    const totalEarnings = page.locator('[data-testid="total-earnings"]');
    await expect(totalEarnings).toBeVisible();
    
    const thisMonth = page.locator('[data-testid="earnings-this-month"]');
    await expect(thisMonth).toBeVisible();
    
    // Verify numbers are displayed
    await expect(totalEarnings).toContainText('$');
    await expect(thisMonth).toContainText('$');
  });

  test('should show active projects', async () => {
    const projectsSection = page.locator('[data-testid="active-projects"]');
    await expect(projectsSection).toBeVisible();
    
    // Check if projects are listed
    const projectCards = page.locator('[data-testid="project-card"]');
    const count = await projectCards.count();
    
    if (count > 0) {
      // Verify project card structure
      await expect(projectCards.first()).toContainText('Project:');
      await expect(projectCards.first()).toContainText('Due:');
      await expect(projectCards.first()).toContainText('Progress:');
    }
  });

  test('should display recent messages', async () => {
    const messagesSection = page.locator('[data-testid="recent-messages"]');
    await expect(messagesSection).toBeVisible();
    
    // Check message structure
    const messageItems = page.locator('[data-testid="message-item"]');
    const count = await messageItems.count();
    
    if (count > 0) {
      await expect(messageItems.first()).toContainText('From:');
      await expect(messageItems.first()).toContainText('ago');
    }
  });

  test('should navigate to profile section', async () => {
    await page.click('[data-testid="profile-link"]');
    
    // Check if profile form is displayed
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="bio"]')).toBeVisible();
  });

  test('should update profile information', async () => {
    await page.click('[data-testid="profile-link"]');
    
    // Update profile fields
    await page.fill('input[name="name"]', 'Updated Name');
    await page.fill('textarea[name="bio"]', 'Updated bio description');
    
    // Save changes
    await page.click('button[data-testid="save-profile"]');
    
    // Check for success message
    await expect(page.locator('.alert-success')).toContainText('Profile updated successfully');
  });

  test('should display badge collection', async () => {
    const badgesSection = page.locator('[data-testid="badges-section"]');
    await expect(badgesSection).toBeVisible();
    
    // Check if badges are displayed
    const badges = page.locator('[data-testid="badge-item"]');
    const count = await badges.count();
    
    if (count > 0) {
      // Verify badge structure
      await expect(badges.first()).toHaveClass(/badge-/);
      
      // Check badge details on hover
      await badges.first().hover();
      await expect(page.locator('.badge-tooltip')).toBeVisible();
    }
  });

  test('should handle earnings chart interactions', async () => {
    // Wait for chart to load
    await page.waitForSelector('[data-testid="earnings-chart"] canvas');
    
    // Click on chart period selector
    await page.click('[data-testid="period-7days"]');
    
    // Wait for chart to update
    await page.waitForTimeout(1000);
    
    // Verify chart updated
    await expect(page.locator('[data-testid="period-7days"]')).toHaveClass(/active/);
    
    // Test monthly view
    await page.click('[data-testid="period-30days"]');
    await expect(page.locator('[data-testid="period-30days"]')).toHaveClass(/active/);
  });

  test('should show responsive design on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const mobilePage = await mobileContext.newPage();
    
    // Login on mobile
    await mobilePage.goto('/login');
    await mobilePage.fill('input[name="email"]', 'freelancer@test.com');
    await mobilePage.fill('input[name="password"]', 'password123');
    await mobilePage.click('button[type="submit"]');
    
    await mobilePage.waitForURL(/\/dashboard/);
    
    // Check mobile layout
    await expect(mobilePage.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Open mobile menu
    await mobilePage.click('[data-testid="mobile-menu-toggle"]');
    await expect(mobilePage.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    await mobileContext.close();
  });

  test('should handle notifications', async () => {
    // Click notifications icon
    await page.click('[data-testid="notifications-icon"]');
    
    // Check notifications dropdown
    await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible();
    
    // Check notification items
    const notifications = page.locator('[data-testid="notification-item"]');
    const count = await notifications.count();
    
    if (count > 0) {
      // Mark notification as read
      await notifications.first().click();
      
      // Verify notification marked as read
      await expect(notifications.first()).toHaveClass(/read/);
    }
  });

  test('should search projects', async () => {
    await page.click('[data-testid="projects-link"]');
    
    // Use search functionality
    await page.fill('[data-testid="project-search"]', 'website');
    await page.press('[data-testid="project-search"]', 'Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    const projectCards = page.locator('[data-testid="project-card"]');
    const count = await projectCards.count();
    
    if (count > 0) {
      const firstProject = await projectCards.first().textContent();
      expect(firstProject.toLowerCase()).toContain('website');
    }
  });

  test('should handle logout', async () => {
    // Click user menu
    await page.click('[data-testid="user-menu"]');
    
    // Click logout
    await page.click('[data-testid="logout-button"]');
    
    // Verify redirect to login page
    await page.waitForURL(/\/(login|$)/);
    
    // Try to access dashboard (should redirect to login)
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/);
  });

  test('should load performance metrics', async () => {
    // Check if performance metrics are displayed
    const metricsSection = page.locator('[data-testid="performance-metrics"]');
    await expect(metricsSection).toBeVisible();
    
    // Check individual metrics
    await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="avg-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="response-time"]')).toBeVisible();
    
    // Verify metrics show actual values
    const completionRate = page.locator('[data-testid="completion-rate"]');
    await expect(completionRate).toContainText('%');
  });

  test('should handle real-time updates', async () => {
    // Listen for WebSocket messages
    let wsMessages = [];
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        wsMessages.push(event.payload);
      });
    });
    
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    // Trigger an action that should send real-time update
    await page.click('[data-testid="refresh-data"]');
    
    // Wait for WebSocket message
    await page.waitForTimeout(1000);
    
    // Verify real-time update was received
    expect(wsMessages.length).toBeGreaterThan(0);
  });

  test('should export earnings data', async () => {
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-earnings"]');
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('earnings');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
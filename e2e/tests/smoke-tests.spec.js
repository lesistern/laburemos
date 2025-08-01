const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests - Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Set up common configurations
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('homepage loads successfully', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/LABUREMOS|Laburemos/);
    });

    await test.step('Check main navigation', async () => {
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('text=Como funciona')).toBeVisible();
      await expect(page.locator('text=Categorías')).toBeVisible();
    });

    await test.step('Check hero section', async () => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Conecta con freelancers')).toBeVisible();
    });
  });

  test('API health check', async ({ request }) => {
    const apiUrl = process.env.API_URL || 'http://3.81.56.168:3001';
    
    await test.step('Check backend health endpoint', async () => {
      const response = await request.get(`${apiUrl}/health`);
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.status).toBe('ok');
    });
  });

  test('user registration flow', async ({ page }) => {
    await test.step('Navigate to registration', async () => {
      await page.goto('/');
      await page.click('text=Registro');
      await expect(page.url()).toContain('/register');
    });

    await test.step('Fill registration form', async () => {
      const timestamp = Date.now();
      const testEmail = `test-${timestamp}@example.com`;
      
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="name"]', 'Test User');
      
      // Select user type
      await page.click('text=Freelancer');
      
      await page.click('button[type="submit"]');
    });

    await test.step('Verify registration success', async () => {
      // Should redirect to verification page or dashboard
      await expect(page.url()).not.toContain('/register');
      
      // Check for success message or redirect
      const isVerification = page.url().includes('/verify');
      const isDashboard = page.url().includes('/dashboard');
      
      expect(isVerification || isDashboard).toBeTruthy();
    });
  });

  test('user login flow', async ({ page }) => {
    await test.step('Navigate to login', async () => {
      await page.goto('/');
      await page.click('text=Ingresar');
      await expect(page.url()).toContain('/login');
    });

    await test.step('Fill login form with demo credentials', async () => {
      await page.fill('input[name="email"]', 'contacto.laburemos@gmail.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
    });

    await test.step('Verify login success', async () => {
      // Should redirect to dashboard
      await expect(page.url()).toContain('/dashboard');
      
      // Check for user menu or profile indicator
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({
        timeout: 10000
      });
    });
  });

  test('categories page loads', async ({ page }) => {
    await test.step('Navigate to categories', async () => {
      await page.goto('/categories');
      await expect(page).toHaveTitle(/Categorías/);
    });

    await test.step('Check categories grid', async () => {
      await expect(page.locator('[data-testid="categories-grid"]')).toBeVisible();
      
      // Should have at least 4 categories in grid
      const categories = page.locator('[data-testid="category-card"]');
      await expect(categories).toHaveCountGreaterThan(3);
    });

    await test.step('Test category navigation', async () => {
      await page.click('[data-testid="category-card"]:first-child');
      
      // Should navigate to subcategories or services
      await expect(page.url()).toContain('/categories/');
    });
  });

  test('search functionality', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Perform search', async () => {
      const searchBox = page.locator('input[placeholder*="Buscar"]');
      await searchBox.fill('desarrollo web');
      await searchBox.press('Enter');
    });

    await test.step('Verify search results', async () => {
      // Should show search results or redirect to search page
      const hasResults = await page.locator('[data-testid="search-results"]').isVisible();
      const isSearchPage = page.url().includes('/search') || page.url().includes('/services');
      
      expect(hasResults || isSearchPage).toBeTruthy();
    });
  });

  test('how it works page', async ({ page }) => {
    await test.step('Navigate to how it works', async () => {
      await page.goto('/como-funciona');
      await expect(page).toHaveTitle(/Cómo funciona/);
    });

    await test.step('Check content sections', async () => {
      await expect(page.locator('h1')).toBeVisible();
      
      // Should have step-by-step process
      const steps = page.locator('[data-testid="step"]');
      await expect(steps).toHaveCountGreaterThan(2);
    });
  });

  test('responsive design - mobile', async ({ page }) => {
    await test.step('Set mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
    });

    await test.step('Check mobile navigation', async () => {
      // Mobile menu button should be visible
      const menuButton = page.locator('[data-testid="mobile-menu-button"]');
      await expect(menuButton).toBeVisible();
    });

    await test.step('Test mobile menu functionality', async () => {
      await page.click('[data-testid="mobile-menu-button"]');
      
      // Mobile menu should open
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });
  });

  test('performance - page load times', async ({ page }) => {
    await test.step('Measure homepage load time', async () => {
      const startTime = Date.now();
      await page.goto('/');
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      console.log(`Homepage load time: ${loadTime}ms`);
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    await test.step('Check for performance metrics', async () => {
      // Check Core Web Vitals using Lighthouse if needed
      const performanceEntries = await page.evaluate(() => {
        return JSON.stringify(performance.getEntriesByType('navigation'));
      });
      
      expect(performanceEntries).toBeTruthy();
    });
  });

  test('error handling - 404 page', async ({ page }) => {
    await test.step('Navigate to non-existent page', async () => {
      const response = await page.goto('/non-existent-page-12345');
      expect(response.status()).toBe(404);
    });

    await test.step('Check 404 page content', async () => {
      // Should show custom 404 page
      await expect(page.locator('text=404')).toBeVisible();
      await expect(page.locator('text=Página no encontrada')).toBeVisible();
    });

    await test.step('Check navigation back to home', async () => {
      await page.click('text=Inicio');
      await expect(page.url()).toBe(page.url().replace('/non-existent-page-12345', '/'));
    });
  });

  test('security headers check', async ({ request }) => {
    await test.step('Check security headers', async () => {
      const response = await request.get('/');
      
      const headers = response.headers();
      
      // Check for important security headers
      expect(headers['x-frame-options']).toBeTruthy();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['strict-transport-security']).toBeTruthy();
    });
  });
});
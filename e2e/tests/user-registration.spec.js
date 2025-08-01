// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('User Registration Flow', () => {
  let page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display registration form', async () => {
    // Click register button
    await page.click('[data-testid="register-button"]');
    
    // Check if registration modal appears
    await expect(page.locator('[data-testid="register-modal"]')).toBeVisible();
    
    // Verify form fields are present
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirm_password"]')).toBeVisible();
  });

  test('should validate required fields', async () => {
    await page.click('[data-testid="register-button"]');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('.error-message')).toContainText('Name is required');
    await expect(page.locator('.error-message')).toContainText('Email is required');
    await expect(page.locator('.error-message')).toContainText('Password is required');
  });

  test('should validate email format', async () => {
    await page.click('[data-testid="register-button"]');
    
    // Fill form with invalid email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('Please enter a valid email');
  });

  test('should validate password confirmation', async () => {
    await page.click('[data-testid="register-button"]');
    
    // Fill form with mismatched passwords
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'different123');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('Passwords do not match');
  });

  test('should successfully register new user', async () => {
    const uniqueEmail = `test+${Date.now()}@example.com`;
    
    await page.click('[data-testid="register-button"]');
    
    // Fill form with valid data
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'SecurePass123');
    await page.fill('input[name="confirm_password"]', 'SecurePass123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await expect(page.locator('.alert-success')).toContainText('Registration successful');
    
    // Verify redirect to dashboard or login
    await page.waitForURL(/\/(dashboard|login)/);
  });

  test('should handle duplicate email registration', async () => {
    await page.click('[data-testid="register-button"]');
    
    // Try to register with existing email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.alert-error')).toContainText('Email already exists');
  });

  test('should close registration modal', async () => {
    await page.click('[data-testid="register-button"]');
    
    // Verify modal is open
    await expect(page.locator('[data-testid="register-modal"]')).toBeVisible();
    
    // Close modal
    await page.click('[data-testid="close-modal"]');
    
    // Verify modal is closed
    await expect(page.locator('[data-testid="register-modal"]')).toBeHidden();
  });

  test('should toggle password visibility', async () => {
    await page.click('[data-testid="register-button"]');
    
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('[data-testid="toggle-password"]');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should be responsive on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const mobilePage = await mobileContext.newPage();
    
    await mobilePage.goto('/');
    await mobilePage.click('[data-testid="register-button"]');
    
    // Verify modal is responsive
    const modal = mobilePage.locator('[data-testid="register-modal"]');
    await expect(modal).toBeVisible();
    
    // Check if form fields are properly sized
    const nameInput = mobilePage.locator('input[name="name"]');
    const boundingBox = await nameInput.boundingBox();
    
    expect(boundingBox.width).toBeLessThan(350); // Should fit in mobile viewport
    
    await mobileContext.close();
  });

  test('should handle network errors gracefully', async () => {
    // Simulate network failure
    await page.route('**/api/register', route => {
      route.abort('failed');
    });
    
    await page.click('[data-testid="register-button"]');
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should show network error message
    await expect(page.locator('.alert-error')).toContainText('Network error');
  });

  test('should track analytics events', async () => {
    let analyticsEvents = [];
    
    // Intercept analytics calls
    await page.route('**/analytics/track', route => {
      analyticsEvents.push(route.request().postData());
      route.fulfill({ status: 200 });
    });
    
    await page.click('[data-testid="register-button"]');
    
    // Fill and submit form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'analytics@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Verify analytics events were tracked
    expect(analyticsEvents.length).toBeGreaterThan(0);
    expect(analyticsEvents.some(event => 
      event.includes('registration_started')
    )).toBeTruthy();
  });
});
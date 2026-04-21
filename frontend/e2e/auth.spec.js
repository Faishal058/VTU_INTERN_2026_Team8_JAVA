import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flows
 *
 * Tests the auth UI flows:
 * - Landing page content
 * - Navigation to login/signup
 * - Form validation errors
 * - Invalid login attempt
 *
 * NOTE: Some tests require the backend running on localhost:8080.
 * Tests that need the backend are marked with .skip if backend is unavailable.
 */

test.describe('Landing Page', () => {
  test('loads and displays content', async ({ page }) => {
    await page.goto('/');

    // Page should load (not crash)
    await expect(page).not.toHaveURL(/login/);

    // Should have some visible content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('has a CTA button or navigation link visible', async ({ page }) => {
    await page.goto('/');

    // Wait for page to settle
    await page.waitForLoadState('networkidle');

    // Look for any actionable link/button
    const cta = page.locator(
      'a[href*="login"], a[href*="signup"], button:has-text("Get Started"), button:has-text("Start"), a:has-text("Get Started")'
    ).first();

    await expect(cta).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('displays the login form with email and password fields', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('submit button is visible', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
  });

  test('form fields accept text input', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'mypassword');

    const emailValue = await page.locator('input[type="email"], input[name="email"]').first().inputValue();
    expect(emailValue).toBe('test@example.com');
  });

  test('shows error when submitting wrong credentials (backend required)', async ({ page }) => {
    // Check if backend is available first
    let backendUp = false;
    try {
      const resp = await page.request.get('http://localhost:8080/api/auth/health', { timeout: 3000 });
      backendUp = resp.ok();
    } catch {
      backendUp = false;
    }

    test.skip(!backendUp, 'Backend not running — skipping credential validation test');

    await page.fill('input[type="email"], input[name="email"]', 'notreal@test.com');
    await page.fill('input[type="password"]', 'WrongPassword99!');
    await page.click('button[type="submit"]');

    // Look for error text anywhere on page
    await expect(
      page.locator('[class*="error"], [role="alert"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('has a link to the signup page', async ({ page }) => {
    const signupLink = page.locator('a[href*="signup"]').first();
    await expect(signupLink).toBeVisible();
  });

  test('has a forgot password link', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot"]').first();
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('displays the registration form', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('password field is present', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });

  test('submit button is present', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
  });

  test('form fields accept input', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'newuser@example.com');
    const emailValue = await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .inputValue();
    expect(emailValue).toBe('newuser@example.com');
  });

  test('has a link back to login page', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]').first();
    await expect(loginLink).toBeVisible();
  });

  test('shows validation error on short password (backend required)', async ({ page }) => {
    let backendUp = false;
    try {
      const resp = await page.request.get('http://localhost:8080/api/auth/health', { timeout: 3000 });
      backendUp = resp.ok();
    } catch {
      backendUp = false;
    }
    test.skip(!backendUp, 'Backend not running — skipping server validation test');

    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123'); // too short

    await page.click('button[type="submit"]');

    const errorEl = page.locator('[class*="error"], [role="alert"]').first();
    await expect(errorEl).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
  });

  test('displays the forgot password form', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('submit button is present', async ({ page }) => {
    // The ForgotPasswordPage uses an onClick button (no type="submit")
    const submitBtn = page.locator(
      'button[type="submit"], button:has-text("Send"), button:has-text("Reset")'
    ).first();
    await expect(submitBtn).toBeVisible({ timeout: 8_000 });
  });

  test('email field accepts input', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    const val = await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .inputValue();
    expect(val).toBe('test@example.com');
  });

  test('accepts email and shows result (backend required)', async ({ page }) => {
    let backendUp = false;
    try {
      const resp = await page.request.get('http://localhost:8080/api/auth/health', { timeout: 3000 });
      backendUp = resp.ok();
    } catch {
      backendUp = false;
    }
    test.skip(!backendUp, 'Backend not running — skipping forgot-password submission test');

    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');

    // ForgotPasswordPage uses onClick button (no type="submit") — match by text
    await page.click('button:has-text("Send"), button:has-text("Reset"), button[type="submit"]');

    // On success the page replaces itself with a confirmation ("Reset link sent")
    // On error it shows an error alert. Either way, the form disappears or feedback appears.
    await expect(
      page.locator('h2:has-text("Reset"), h2:has-text("sent"), [class*="error"], [class*="alert"], [role="alert"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

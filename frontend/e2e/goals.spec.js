import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Goals Feature
 *
 * Covers:
 * - Auth guard on goals route
 * - Goals page UI when authenticated (uses localStorage injection)
 * - New goal route protection
 */

// Helper — inject a fake auth session into localStorage to simulate logged-in state
// Note: This bypasses frontend auth state only; backend calls will still fail
//       unless a real backend is running with this user.
async function injectFakeAuth(page) {
  await page.addInitScript(() => {
    const fakeUser = { id: '00000000-0000-0000-0000-000000000001', email: 'test@example.com', fullName: 'Test User' };
    localStorage.setItem('ww_user', JSON.stringify(fakeUser));
    // Note: this token is NOT valid against the real backend,
    // but it satisfies the frontend auth check so we can test the UI
    localStorage.setItem('ww_token', 'fake.test.token');
  });
}

test.describe('Goals — Auth Guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('ww_token');
      localStorage.removeItem('ww_user');
    });
  });

  test('/dashboard/goals redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/goals');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test('/dashboard/goals/new redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/goals/new');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });
});

test.describe('Goals Page — UI (with injected auth)', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
    await page.goto('/dashboard/goals');
  });

  test('Goals page loads without crashing', async ({ page }) => {
    // With fake auth, the goals page should render (even if data fetch fails)
    // The URL should stay at /dashboard/goals (not redirect to login)
    await expect(page).toHaveURL(/goals/, { timeout: 8_000 });
  });

  test('Goals page shows a create goal button or empty state', async ({ page }) => {
    // Wait for page to settle after potential API failures
    await page.waitForTimeout(2_000);

    // Look for CTA or empty state
    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("New Goal"), button:has-text("Create"), a:has-text("New Goal")'
    ).first();

    const emptyState = page.locator(
      'text=/no goals|create your first|get started|add a goal/i'
    ).first();

    const hasAddButton   = await addButton.isVisible().catch(() => false);
    const hasEmptyState  = await emptyState.isVisible().catch(() => false);

    // At least one of these should be present
    expect(hasAddButton || hasEmptyState).toBeTruthy();
  });
});

test.describe('New Goal Flow', () => {
  test('Navigating to /dashboard/goals/new shows the goal wizard', async ({ page }) => {
    await injectFakeAuth(page);
    await page.goto('/dashboard/goals/new');

    // URL should stay on new goal page, not redirect
    await expect(page).toHaveURL(/goals\/new/, { timeout: 8_000 });
  });

  test('New goal page has form inputs', async ({ page }) => {
    await injectFakeAuth(page);
    await page.goto('/dashboard/goals/new');

    await page.waitForTimeout(1_000);

    // Check for typical form elements in a wizard
    const inputExists = await page.locator('input, select, button').first().isVisible().catch(() => false);
    expect(inputExists).toBeTruthy();
  });
});

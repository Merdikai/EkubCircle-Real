import { test, expect } from '@playwright/test';

test.describe('API Failure & Resilience (Playwright route interception)', () => {
  test('gracefully handles 500 server error on circles endpoint without app crash', async ({ page }) => {
    // Intercept and force a 500 ProblemDetails response on /api/circles
    await page.route(/\/api\/circles(\/.*)?$/, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://ekub.local/errors/server_error',
          title: 'Server error',
          status: 500,
          detail: 'An unexpected database error occurred on rotating ledger service.'
        })
      });
    });

    await page.goto('/circles');

    // Page header still renders and app doesn't crash
    await expect(page.getByRole('heading', { name: /my ekub circles/i })).toBeVisible();

    // Loading indicator finishes/dismisses rather than hanging indefinitely
    await expect(page.locator('.loading-state')).not.toBeVisible({ timeout: 5000 });

    // UI displays empty state or gracefully handles missing list
    await expect(page.locator('.circles-list-page')).toBeVisible();
  });
});

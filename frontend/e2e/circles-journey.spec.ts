import { test, expect } from '@playwright/test';

test.describe('EkubCircle Core User Journey', () => {
  test('authenticated user accesses dashboard and views active circles', async ({ page }) => {
    await page.goto('/dashboard');

    // Dashboard renders authenticated greeting & role pill
    await expect(page.locator('.welcome-title, .brand-title').first()).toBeVisible();
    await expect(page.locator('.role-badge-pill').first()).toBeVisible();

    // Verify presence of ledger summary cards or circles panel
    const hasHeroOrPanel = page.locator('.member-home-hero-card, .secondary-panel, .forming-circle-hero-card, .no-circle-hero-card').first();
    await expect(hasHeroOrPanel).toBeVisible();
  });

  test('user navigates to circles list and switches status filters', async ({ page }) => {
    await page.goto('/circles');

    // Verify page header
    await expect(page.getByRole('heading', { name: /my ekub circles/i })).toBeVisible();

    // Verify filter pills exist and interact
    const allPill = page.getByRole('button', { name: /all/i });
    const activePill = page.getByRole('button', { name: /active/i });
    const formingPill = page.getByRole('button', { name: /forming/i });

    await expect(allPill).toBeVisible();
    await expect(activePill).toBeVisible();
    await expect(formingPill).toBeVisible();

    // Click Active filter
    await activePill.click();
    await expect(activePill).toHaveClass(/active/);

    // Click Forming filter
    await formingPill.click();
    await expect(formingPill).toHaveClass(/active/);

    // Click All filter back
    await allPill.click();
    await expect(allPill).toHaveClass(/active/);
  });
});

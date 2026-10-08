import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global authentication setup:
 * Logs in once as the seeded EkubCircle organizer/admin and persists session cookies & localStorage
 * to playwright/.auth/user.json so subsequent tests don't have to repeatedly re-enter credentials.
 */
setup('authenticate as organizer', async ({ page }) => {
  // Ensure storage directory exists
  const authDir = path.resolve('playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await page.goto('/login');

  const email = process.env['EKUB_ADMIN_EMAIL'] || 'organizer@ekub.local';
  const password = process.env['EKUB_ADMIN_PASS'] || 'Ekub123!';

  // Use accessible label locators (matching login.component.html)
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In to EkubCircle' }).click();

  // Wait for post-login navigation to protected dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await expect(page.locator('.dashboard-page, .welcome-title, .brand-title').first()).toBeVisible({ timeout: 10000 });

  // Persist storage state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// e2e/mobile-safety.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Mobile Safety & Features', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();
    await page.waitForSelector('.media-card', { state: 'visible', timeout: 5000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test.beforeEach(async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForSelector('.media-card', { state: 'visible' });
  });

  test('should NOT show delete actions in context menu', async () => {
    const firstCard = page.locator('.media-card').first();

    await firstCard.click({ button: 'right' });

    await expect(page.getByText('Delete from Disk')).toBeHidden();

    await expect(page.getByText('Rename')).toBeHidden();

    await expect(page.getByText('Reveal in Explorer')).toBeHidden();

    await expect(page.locator('[role="menu"]')).toBeHidden();
  });

  test('should toggle column count', async () => {
    const toggleButton = page.locator('button[title*="Current:"]');
    await expect(toggleButton).toBeVisible();

    const initialTitle = await toggleButton.getAttribute('title');

    await toggleButton.click();
    await page.waitForTimeout(300);

    const newTitle = await toggleButton.getAttribute('title');
    expect(newTitle).not.toBe(initialTitle);

    await toggleButton.click();
    await page.waitForTimeout(300);
    const revertedTitle = await toggleButton.getAttribute('title');
    expect(revertedTitle).toBe(initialTitle);
  });
});

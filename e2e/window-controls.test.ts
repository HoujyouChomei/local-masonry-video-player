// e2e/window-controls.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Custom Window Controls (SSOT)', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();
    await page.waitForSelector('header', { state: 'visible' });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test('should render custom window controls', async () => {
    const minimizeBtn = page.getByTitle('Minimize');
    const maximizeBtn = page.getByTitle('Maximize');
    const closeBtn = page.getByTitle('Close');

    await expect(minimizeBtn).toBeVisible();
    await expect(maximizeBtn).toBeVisible();
    await expect(closeBtn).toBeVisible();

    await expect(minimizeBtn.locator('..')).toHaveClass(/app-region-no-drag/);
  });

  test('should sync maximize state between Main and Renderer (SSOT)', async () => {
    const maximizeBtn = page.getByTitle('Maximize');
    await expect(maximizeBtn).toBeVisible();
    await expect(page.getByTitle('Restore')).toBeHidden();

    await maximizeBtn.click();

    await page.waitForTimeout(1000);

    const restoreBtn = page.getByTitle('Restore');
    await expect(restoreBtn).toBeVisible();
    await expect(page.getByTitle('Maximize')).toBeHidden();

    await restoreBtn.click();
    await page.waitForTimeout(1000);

    await expect(page.getByTitle('Maximize')).toBeVisible();
    await expect(page.getByTitle('Restore')).toBeHidden();
  });
});

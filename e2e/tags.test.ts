// e2e/tags.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Tag Management', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();
    await page.waitForSelector('.media-card', { state: 'visible', timeout: 5000 });
  });

  test.afterAll(async () => {
    test.info().setTimeout(20000);
    await cleanupTestContext(ctx);
  });

  test('should create tag, assign to media, filter by tag, and remove tag', async () => {
    test.setTimeout(20000);
    const tagName = 'TestTag';

    const firstCard = page.locator('.media-card').first();
    await firstCard.click();

    const mediaPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(mediaPlayer).toBeVisible();

    const addTagBtn = page.getByRole('button', { name: 'Add Tag' });
    await expect(addTagBtn).toBeVisible();
    await addTagBtn.click();

    const tagInput = page.getByPlaceholder('Search or create...');
    await expect(tagInput).toBeVisible();
    await tagInput.fill(tagName);
    await page.waitForTimeout(300);
    await tagInput.press('Enter');

    const tagChip = page.locator('.fixed.z-50').getByText(tagName, { exact: false });
    await expect(tagChip).toBeVisible();

    const closeButton = page.locator('.fixed.z-50').getByTitle('Close (Esc)');
    await closeButton.click();
    await expect(mediaPlayer).toBeHidden();

    const sidebar = page.locator('aside');
    const sidebarTag = sidebar.getByText(tagName, { exact: false });
    await expect(sidebarTag).toBeVisible();

    const initialCount = await page.locator('.media-card').count();
    expect(initialCount).toBeGreaterThan(1);

    await sidebarTag.click();
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('.media-card').count();
    expect(filteredCount).toBe(1);

    await sidebarTag.click();
    await page.waitForTimeout(500);

    const clearedCount = await page.locator('.media-card').count();
    expect(clearedCount).toBe(initialCount);

    await firstCard.click();
    if (!(await mediaPlayer.isVisible())) {
      await firstCard.click();
    }
    await expect(mediaPlayer).toBeVisible();

    const removeTagBtn = page.locator('.fixed.z-50 button[title="Remove Tag"]').first();
    await expect(removeTagBtn).toBeVisible();
    await removeTagBtn.click();

    await expect(page.locator('.fixed.z-50').getByText(`#${tagName}`)).toBeHidden();

    await page.locator('.fixed.z-50').getByTitle('Close (Esc)').click();

    await expect(sidebarTag).toBeHidden({ timeout: 5000 });
  });
});

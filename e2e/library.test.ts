// e2e/library.test.ts
import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Library & Data Management', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();
    await page.waitForSelector('header', { state: 'visible', timeout: 15000 });
    await page.waitForSelector('.video-card', { state: 'visible', timeout: 10000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test('should display dummy videos', async () => {
    const cards = page.locator('.video-card');
    const count = await cards.count();

    const expectedCount = ctx.hasFFmpeg ? 5 : 3;

    expect(count).toBe(expectedCount);
  });

  test('should display thumbnails for video cards', async () => {
    await page.waitForTimeout(2000);

    const firstCard = page.locator('.video-card').first();
    const thumbnail = firstCard.locator('img, video');

    await expect(thumbnail.first()).toBeVisible();
  });

  test('should filter videos by search query', async () => {
    const searchInput = page.getByPlaceholder('Filter current folder...');
    await searchInput.fill('test-video-1');

    await page.waitForTimeout(500);

    const cards = page.locator('.video-card');
    const count = await cards.count();

    expect(count).toBe(1);

    const clearButton = page.getByRole('button', { name: 'Clear search' });
    await clearButton.click();

    await page.waitForTimeout(500);
    const countAfter = await cards.count();

    const expectedCount = ctx.hasFFmpeg ? 5 : 3;
    expect(countAfter).toBe(expectedCount);
  });

  test('should toggle favorite status', async () => {
    const firstCard = page.locator('.video-card').first();
    const favButton = firstCard.getByTitle('Add to Favorites');

    await expect(favButton).toBeVisible();
    await favButton.click();

    const activeFavButton = firstCard.getByTitle('Remove from Favorites');
    await expect(activeFavButton).toBeVisible();
    await expect(activeFavButton).toHaveClass(/text-red-500/);

    await activeFavButton.click();
    await expect(firstCard.getByTitle('Add to Favorites')).toBeVisible();
  });

  test('Desktop: should show context menu actions', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const firstCard = page.locator('.video-card').first();
    await firstCard.click({ button: 'right' });

    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible();

    await expect(page.getByText('Reveal in Explorer')).toBeVisible();
    await expect(page.getByText('Rename')).toBeVisible();
    await expect(page.getByText('Delete from Disk')).toBeVisible();

    if (ctx.hasFFmpeg) {
      // Normalize option check skipped for simplicity
    }

    await page.keyboard.press('Escape');
  });

  test('Desktop: should switch to List View and verify drag handle visibility', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const layoutButton = page.locator('button[title*="Current: Masonry"]');

    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }

    await page.waitForTimeout(500);

    const listItems = page.locator('[data-selected]');
    await expect(listItems.first()).toBeVisible();

    await page.getByTitle('Sort Videos').click();
    const customOption = page.getByRole('menuitem', { name: /Custom/ });
    await expect(customOption).toBeVisible();
    await customOption.click();

    const dragHandle = page.locator('[title="Drag to Reorder"]').first();
    await expect(dragHandle).toBeVisible();

    await page.waitForTimeout(500);

    await page.getByTitle('Sort Videos').click();

    await expect(page.locator('[role="menu"]')).toBeVisible();

    const newestItem = page.getByRole('menuitem', { name: 'Newest First' });
    await expect(newestItem).toBeVisible();
    await newestItem.click();

    const listButton = page.locator('button[title*="Current: List"]');
    if (await listButton.isVisible()) {
      await listButton.click();
    }
  });

  test('Desktop: should change column count (Grid Config check)', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const counterDisplay = page.locator('span.font-mono', { hasText: /^\d+$/ });
    const plusBtn = page.getByTitle('More Columns');
    const minusBtn = page.getByTitle('Less Columns');

    const initialText = await counterDisplay.innerText();
    const initialCount = parseInt(initialText, 10);

    await plusBtn.click();
    await expect(counterDisplay).toHaveText(String(initialCount + 1));

    await minusBtn.click();
    await expect(counterDisplay).toHaveText(String(initialCount));
  });
});

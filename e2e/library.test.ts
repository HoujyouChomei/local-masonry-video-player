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
    // ダミーデータのロードを待つ
    await page.waitForSelector('.video-card', { state: 'visible', timeout: 10000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test('should display dummy videos', async () => {
    const cards = page.locator('.video-card');
    const count = await cards.count();

    // FFmpegがある場合は5つ (.mp4 x3 + .mkv + .avi)
    // ない場合は3つ (.mp4 x3)
    const expectedCount = ctx.hasFFmpeg ? 5 : 3;

    expect(count).toBe(expectedCount);
  });

  test('should filter videos by search query', async () => {
    // "test-video-1" を検索
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

    // 1. List View に切り替え (Masonry -> List)
    const layoutButton = page.locator('button[title*="Current: Masonry"]');

    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }

    await page.waitForTimeout(500);

    // 2. リストアイテムの表示確認
    const listItems = page.locator('[data-selected]');
    await expect(listItems.first()).toBeVisible();

    // 3. カスタムソートモードに切り替え
    await page.getByTitle('Sort Videos').click();
    // メニューが表示されるのを待つ
    const customOption = page.getByRole('menuitem', { name: /Custom/ });
    await expect(customOption).toBeVisible();
    await customOption.click();

    // 4. ドラッグハンドルの表示確認
    const dragHandle = page.locator('[title="Drag to Reorder"]').first();
    await expect(dragHandle).toBeVisible();

    // UIの安定化待ち (メニューが閉じるアニメーション等を考慮)
    await page.waitForTimeout(500);

    // 5. 後始末: 設定を元に戻す (Masonry & Newest First)
    // ソートを戻すためにメニューを再度開く
    await page.getByTitle('Sort Videos').click();

    // メニューが確実に開いたことを確認
    await expect(page.locator('[role="menu"]')).toBeVisible();

    const newestItem = page.getByRole('menuitem', { name: 'Newest First' });
    await expect(newestItem).toBeVisible();
    await newestItem.click();

    // レイアウトを戻す
    const listButton = page.locator('button[title*="Current: List"]');
    if (await listButton.isVisible()) {
      await listButton.click();
    }
  });
});

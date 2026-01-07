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
    await page.waitForSelector('.video-card', { state: 'visible', timeout: 15000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test.beforeEach(async () => {
    // 各テスト前にモバイルサイズを強制 & UIリセット
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForSelector('.video-card', { state: 'visible' });
  });

  test('should NOT show delete actions in context menu', async () => {
    const firstCard = page.locator('.video-card').first();

    // コンテキストメニューを開く（モバイルエミュレーションでも右クリックイベントでトリガー可能）
    await firstCard.click({ button: 'right' });

    // メニュー項目確認
    // "Delete from Disk" がないこと
    await expect(page.getByText('Delete from Disk')).toBeHidden();

    // "Rename" もないこと
    await expect(page.getByText('Rename')).toBeHidden();

    // "Reveal in Explorer" もないこと
    await expect(page.getByText('Reveal in Explorer')).toBeHidden();

    // 修正: モバイルではコンテキストメニュー自体が表示されない仕様（VideoCard.tsxの実装）のため、
    // メニュー内の項目チェックではなく、メニュー自体が出ていないことを確認する、
    // またはメニュー項目が「一切見えない」ことで安全性を確認する。
    await expect(page.locator('[role="menu"]')).toBeHidden();
  });

  test('should toggle column count', async () => {
    // デフォルトは1列のはず（設定によるが、ボタンの状態を確認する）

    // 切り替えボタンを取得 (RectangleVertical または Grid2x2)
    const toggleButton = page.locator('button[title*="Current:"]');
    await expect(toggleButton).toBeVisible();

    // 初期状態の確認 (1 Column)
    const initialTitle = await toggleButton.getAttribute('title');

    // クリックして切り替え
    await toggleButton.click();
    await page.waitForTimeout(300); // 状態反映待ち

    // タイトルが変化したか確認
    const newTitle = await toggleButton.getAttribute('title');
    expect(newTitle).not.toBe(initialTitle);

    // もう一度クリックして元に戻るか
    await toggleButton.click();
    await page.waitForTimeout(300);
    const revertedTitle = await toggleButton.getAttribute('title');
    expect(revertedTitle).toBe(initialTitle);
  });
});

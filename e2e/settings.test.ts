// e2e/settings.test.ts
import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Settings & External Tools', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();
    await page.waitForSelector('header', { state: 'visible', timeout: 15000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test('should show settings panel', async () => {
    await page.getByTitle('Settings').click();
    await expect(page.getByText('Preferences')).toBeVisible();
  });

  test('should validate FFmpeg/FFprobe paths if available', async () => {
    // FFmpegがない環境ではスキップ
    test.skip(!ctx.hasFFmpeg, 'FFmpeg binary not found in bin/ folder');

    // 設定パネルが開いている前提
    const settingsPanel = page.locator('.bg-popover');
    await expect(settingsPanel).toBeVisible();

    // External Tools セクション
    await expect(page.getByText('EXTERNAL TOOLS')).toBeVisible();

    // FFmpeg Binary のステータス確認
    // "Valid" テキストが含まれ、かつ緑色(text-green-500)であることを確認したいが、
    // まずは "Valid" テキストが表示されていることを確認
    await expect(page.getByText('Valid').first()).toBeVisible();

    // FFprobe Binary のステータス確認
    await expect(page.getByText('Valid').nth(1)).toBeVisible();
  });

  test('should show experimental normalize option if FFmpeg is valid', async () => {
    test.skip(!ctx.hasFFmpeg, 'FFmpeg binary not found in bin/ folder');

    // Experimental セクションを開く
    const expButton = page.getByText('EXPERIMENTAL');
    await expButton.click();

    // アニメーション待ち
    await page.waitForTimeout(300);

    // "Enable "Normalize Video"" が表示されているか
    await expect(page.getByText('Enable "Normalize Video"')).toBeVisible();
  });
});

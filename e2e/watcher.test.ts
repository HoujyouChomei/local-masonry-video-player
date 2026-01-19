// e2e/watcher.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';
import fs from 'fs';
import path from 'path';

test.describe('File Watcher & Auto-Update', () => {
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

  test('should detect externally added file and show it in library', async () => {
    const newFileName = 'external-added.mp4';
    const srcPath = path.join(ctx.videoDir, 'test-video-1.mp4');
    const destPath = path.join(ctx.videoDir, newFileName);

    fs.copyFileSync(srcPath, destPath);

    const newCard = page.locator('.video-card', { hasText: newFileName });
    await expect(newCard).toBeVisible({ timeout: 10000 });

    if (ctx.hasFFmpeg) {
      const durationBadge = newCard.getByText(/\d+:\d+/);
      await expect(durationBadge).toBeVisible({ timeout: 15000 });
    }
  });

  test('should detect externally deleted file and remove it from library', async () => {
    const targetFile = 'test-video-2.mp4';
    const targetPath = path.join(ctx.videoDir, targetFile);

    const card = page.locator('.video-card', { hasText: targetFile });
    await expect(card).toBeVisible();

    fs.unlinkSync(targetPath);

    await expect(card).toBeHidden({ timeout: 10000 });
  });
});

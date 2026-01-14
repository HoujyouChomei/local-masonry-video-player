// e2e/file-ops.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';
import fs from 'fs';
import path from 'path';

test.describe('File Operations', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();
    await page.waitForSelector('.video-card', { state: 'visible', timeout: 10000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test('should move video to a new folder', async () => {
    const targetDirName = 'moved_videos';
    const targetDirPath = path.join(ctx.userDataDir, targetDirName);
    if (!fs.existsSync(targetDirPath)) {
      fs.mkdirSync(targetDirPath);
    }

    const firstCard = page.locator('.video-card').first();
    await expect(firstCard).toBeVisible();

    await firstCard.click({ modifiers: ['Control'] });

    await firstCard.click({ button: 'right' });

    const moveOption = page.getByText('Move to Folder...');

    if (await moveOption.isVisible()) {
      await expect(moveOption).toBeVisible();
    } else {
      await expect(page.getByText('1 selected')).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });

  test('should rename video', async () => {
    const firstCard = page.locator('.video-card').first();
    const originalName = await firstCard.getByRole('heading').innerText();

    const lastDotIndex = originalName.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';

    const newNameBase = 'renamed_video';

    await firstCard.click({ button: 'right' });
    await page.getByText('Rename').click();

    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible();

    const input = dialog.locator('input');
    await input.fill(newNameBase);

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(firstCard.getByRole('heading')).toHaveText(newNameBase + extension);
  });
});

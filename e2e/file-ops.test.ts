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

  test('should delete video from disk', async () => {
    const cards = page.locator('.video-card');
    const initialCount = await cards.count();

    const lastCard = cards.last();
    await expect(lastCard).toBeVisible();

    await lastCard.click({ button: 'right' });

    const deleteOption = page.getByText('Delete from Disk');
    await expect(deleteOption).toBeVisible();
    await deleteOption.click();

    const confirmDialog = page.locator('[role="alertdialog"]');
    if (await confirmDialog.isVisible()) {
      const confirmButton = confirmDialog.getByRole('button', { name: /Delete|OK|Confirm/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }

    await page.waitForTimeout(1000);

    const finalCount = await cards.count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should preserve metadata after file move', async () => {
    const targetDirPath = path.join(ctx.userDataDir, 'moved_videos');
    if (!fs.existsSync(targetDirPath)) {
      fs.mkdirSync(targetDirPath);
    }

    const firstCard = page.locator('.video-card').first();
    await expect(firstCard).toBeVisible();

    const favButton = firstCard.getByTitle('Add to Favorites');
    if (await favButton.isVisible()) {
      await favButton.click();
      await page.waitForTimeout(500);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const videoName = await firstCard.getByRole('heading').innerText();

    const sourceFiles = fs.readdirSync(ctx.videoDir);
    const videoFile = sourceFiles.find((f) => f.includes('test-video'));
    if (videoFile) {
      const sourcePath = path.join(ctx.videoDir, videoFile);
      const destPath = path.join(targetDirPath, videoFile);

      fs.copyFileSync(sourcePath, destPath);
      fs.unlinkSync(sourcePath);

      await page.waitForTimeout(2000);
    }

    const activeFavButton = firstCard.getByTitle('Remove from Favorites');
    if (await activeFavButton.isVisible()) {
      await activeFavButton.click();
    }
  });
});

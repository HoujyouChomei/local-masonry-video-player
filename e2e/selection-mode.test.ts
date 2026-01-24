// e2e/selection-mode.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';
import fs from 'fs';
import path from 'path';

test.describe('Selection Mode & Header Interaction', () => {
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

  test('should enter selection mode and interact with header buttons', async () => {
    const firstCard = page.locator('.media-card').first();

    await firstCard.click({ modifiers: ['Control'] });

    const selectAllBtn = page.getByRole('button', { name: 'Select All' });
    await expect(selectAllBtn).toBeVisible();

    await expect(selectAllBtn).toHaveClass(/app-region-no-drag/);

    const clearBtn = page.getByRole('button', { name: 'Clear' });
    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toHaveClass(/app-region-no-drag/);

    const cancelBtn = page.getByTitle('Cancel Selection Mode (Esc)');
    await expect(cancelBtn).toBeVisible();
    await expect(cancelBtn).toHaveClass(/app-region-no-drag/);

    await selectAllBtn.click();

    const countBadge = page.locator('span', { hasText: 'selected' });
    const cardCount = await page.locator('.media-card').count();
    await expect(countBadge).toHaveText(`${cardCount} selected`);

    await clearBtn.click();

    await expect(page.getByText('0 selected')).toBeVisible();

    await cancelBtn.click();

    await expect(selectAllBtn).toBeHidden();
    await expect(page.getByPlaceholder('Filter current folder...')).toBeVisible();
  });

  test('should show batch context menu in selection mode', async () => {
    const cards = page.locator('.media-card');
    await expect(cards.first()).toBeVisible();

    await cards.nth(0).click({ modifiers: ['Control'] });
    await cards.nth(1).click({ modifiers: ['Control'] });

    await expect(page.getByText('2 selected')).toBeVisible();

    await cards.nth(0).click({ button: 'right' });

    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible();

    await expect(page.getByText('2 items selected')).toBeVisible();
    await expect(page.getByText('Add to Playlist')).toBeVisible();
    await expect(page.getByText('Add Tags...')).toBeVisible();

    await expect(page.getByText('Delete from Disk')).toBeHidden();
    await expect(page.getByText('Delete Selected')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });

  test('should move media via Header Move button', async () => {
    const targetDirName = 'header_move_test';
    const targetDirPath = path.join(ctx.userDataDir, targetDirName);
    if (!fs.existsSync(targetDirPath)) {
      fs.mkdirSync(targetDirPath);
    }

    const firstCard = page.locator('.media-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click({ modifiers: ['Control'] });

    await ctx.app.evaluate(async ({ dialog }, folderPath) => {
      dialog.showOpenDialog = () => {
        return Promise.resolve({
          canceled: false,
          filePaths: [folderPath],
        });
      };
    }, targetDirPath);

    const moveBtn = page.getByTitle('Move to Folder');
    await expect(moveBtn).toBeVisible();
    await moveBtn.click();

    await expect(page.getByText(/Moved .* items/)).toBeVisible({ timeout: 5000 });

    const files = fs.readdirSync(targetDirPath);
    expect(files.length).toBeGreaterThan(0);
  });
});

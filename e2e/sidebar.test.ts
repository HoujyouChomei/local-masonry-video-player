// e2e/sidebar.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';
import path from 'path';

test.describe('Sidebar Functionality', () => {
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

  test('should add a new library folder and automatically scan for new media', async () => {
    const newMediaCardInitially = page.locator('.media-card', {
      hasText: 'new-folder-media.mp4',
    });
    await expect(newMediaCardInitially).toBeHidden();

    await ctx.app.evaluate(async ({ dialog }, folderPath) => {
      dialog.showOpenDialog = () => {
        return Promise.resolve({
          canceled: false,
          filePaths: [folderPath],
        });
      };
    }, ctx.mediaDir2);

    const addFolderButton = page.locator('aside').getByTitle('Add Folder to Library');
    await expect(addFolderButton).toBeVisible();
    await addFolderButton.click();

    const newSidebarFolder = page.locator('aside').getByText(path.basename(ctx.mediaDir2));
    await expect(newSidebarFolder).toBeVisible({ timeout: 5000 });

    const newMediaCardAfterAdd = page.locator('.media-card', {
      hasText: 'new-folder-media.mp4',
    });
    await expect(newMediaCardAfterAdd).toBeVisible({ timeout: 10000 });

    const totalCards = await page.locator('.media-card').count();
    expect(totalCards).toBe(1);
  });
});

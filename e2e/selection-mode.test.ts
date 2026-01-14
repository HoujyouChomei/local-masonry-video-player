// e2e/selection-mode.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Selection Mode & Header Interaction', () => {
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

  test('should enter selection mode and interact with header buttons', async () => {
    const firstCard = page.locator('.video-card').first();

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
    const cardCount = await page.locator('.video-card').count();
    await expect(countBadge).toHaveText(`${cardCount} selected`);

    await clearBtn.click();

    await expect(page.getByText('0 selected')).toBeVisible();

    await cancelBtn.click();

    await expect(selectAllBtn).toBeHidden();
    await expect(page.getByPlaceholder('Filter current folder...')).toBeVisible();
  });
});

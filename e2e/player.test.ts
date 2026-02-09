// e2e/player.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Media Player', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();

    await page.setViewportSize({ width: 1600, height: 1200 });

    await page.waitForSelector('.media-card', { state: 'visible', timeout: 5000 });
  });

  test.afterAll(async () => {
    test.info().setTimeout(30000);
    await cleanupTestContext(ctx);
  });

  test.beforeEach(async () => {
    const modalPlayer = page.locator('.fixed.z-50 video:not(.hidden)');

    if ((await modalPlayer.count()) > 0 && (await modalPlayer.isVisible())) {
      await page.keyboard.press('Escape');
      await expect(modalPlayer).toBeHidden();
    }
  });

  test('should open and close player modal', async () => {
    const firstCard = page.locator('.media-card').first();
    await firstCard.click();

    const mediaPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(mediaPlayer).toBeVisible();

    const modalTitle = page.locator('h2');
    await expect(modalTitle).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(mediaPlayer).toBeHidden();
  });

  test('should show context menu inside player modal', async () => {
    const firstCard = page.locator('.media-card').first();
    await firstCard.click();

    const mediaPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(mediaPlayer).toBeVisible();

    await mediaPlayer.click({ button: 'right' });

    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible();

    await expect(page.getByText('Playback Mode')).toBeVisible();
    await expect(page.getByText('Auto-Play Next')).toBeVisible();
    await expect(page.getByText('Add to Playlist')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });

  test('should navigate to next media', async () => {
    const cards = page.locator('.media-card');
    await cards.nth(0).click();

    const mediaPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(mediaPlayer).toBeVisible();

    const titleEl = page.locator('h2');
    const firstTitle = await titleEl.innerText();

    const modal = page.locator('.fixed.z-50');
    const nextButton = modal.getByTitle('Next Media');

    await modal.hover();
    await expect(nextButton).toBeVisible();

    await nextButton.click({ force: true });
    await expect(titleEl).not.toHaveText(firstTitle);

    await page.keyboard.press('Escape');
  });

  test('should survive continuous media switching (stress test)', async () => {
    test.setTimeout(30000);
    if (!ctx.hasFFmpeg) {
      test.skip();
      return;
    }
    const cards = page.locator('.media-card');
    const count = await cards.count();

    if (count < 2) {
      console.log('Skipping stress test: not enough media');
      return;
    }

    await cards.first().click();

    const mediaPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(mediaPlayer).toBeVisible();

    await page.waitForTimeout(1000);
    await page.mouse.move(200, 200);

    const nextButton = page.locator('.fixed.z-50').getByTitle('Next Media');
    await expect(nextButton).toBeVisible();

    for (let i = 0; i < 6; i++) {
      await nextButton.click();

      await expect(mediaPlayer).toBeVisible();

      await page.waitForTimeout(800);
    }

    try {
      await page.waitForFunction(
        () => {
          const v = document.querySelector('.fixed.z-50 video:not(.hidden)') as HTMLVideoElement;
          return v && !v.error && v.readyState >= 2;
        },
        undefined,
        { timeout: 5000 }
      );
    } catch (e) {
      const errorState = await mediaPlayer.evaluate((v: HTMLVideoElement) => ({
        error: v.error ? { code: v.error.code, message: v.error.message } : null,
        readyState: v.readyState,
        networkState: v.networkState,
        src: v.src,
      }));
      console.error('Media Player stuck in invalid state:', errorState);
      throw new Error(
        `Media player failed to recover after stress test. State: ${JSON.stringify(errorState)}. Cause: ${e}`
      );
    }

    await page.keyboard.press('Escape');
  });

  test('should toggle fullscreen mode via button', async () => {
    const firstCard = page.locator('.media-card').first();
    await firstCard.click();

    await page.waitForTimeout(1000);

    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);

    const modalContainer = page.locator('.fixed.z-50');
    const enterBtn = modalContainer.getByTitle(/Enter Fullscreen/);

    await expect(enterBtn).toBeVisible();

    await enterBtn.click({ force: true });

    const exitBtn = modalContainer.getByTitle(/Exit Fullscreen/);
    await expect(exitBtn).toBeVisible();

    await exitBtn.click({ force: true });
    await expect(enterBtn).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('should close modal on browser back (History API)', async () => {
    const firstCard = page.locator('.media-card').first();
    await firstCard.click();

    const mediaPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(mediaPlayer).toBeVisible();

    await page.evaluate(() => window.history.back());

    await expect(mediaPlayer).toBeHidden();
  });

  test('should play native media with file:// protocol', async () => {
    const card = page.locator('.media-card').filter({ hasText: 'test-media-1.mp4' }).first();
    await expect(card).toBeVisible();
    await card.click();

    const mediaPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(mediaPlayer).toBeVisible();

    const src = await mediaPlayer.getAttribute('src');
    expect(src).toMatch(/^file:\/\//);

    await page.keyboard.press('Escape');
  });

  test('should play non-native media with http:// protocol (transcoding)', async () => {
    if (!ctx.hasFFmpeg) {
      test.skip();
      return;
    }

    const card = page.locator('.media-card').filter({ hasText: 'test-media-4.mkv' }).first();

    await expect(card).toBeVisible({ timeout: 5000 });
    await card.click();

    const mediaPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(mediaPlayer).toBeVisible();

    const src = await mediaPlayer.getAttribute('src');
    expect(src).toMatch(/^http:\/\//);
    expect(src).toContain('/video?path=');

    await page.keyboard.press('Escape');
  });
});

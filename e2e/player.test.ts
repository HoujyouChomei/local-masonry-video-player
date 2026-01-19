// e2e/player.test.ts
import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Video Player', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();

    await page.setViewportSize({ width: 1600, height: 1200 });

    await page.waitForSelector('.video-card', { state: 'visible', timeout: 15000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test.beforeEach(async () => {
    const modalVideo = page.locator('.fixed.z-50 video:not(.hidden)');

    if ((await modalVideo.count()) > 0 && (await modalVideo.isVisible())) {
      await page.keyboard.press('Escape');
      await expect(modalVideo).toBeHidden();
    }
  });

  test('should open and close player modal', async () => {
    const firstCard = page.locator('.video-card').first();
    await firstCard.click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    const modalTitle = page.locator('h2');
    await expect(modalTitle).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(videoPlayer).toBeHidden();
  });

  test('should show context menu inside player modal', async () => {
    const firstCard = page.locator('.video-card').first();
    await firstCard.click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    await videoPlayer.click({ button: 'right' });

    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible();

    await expect(page.getByText('Playback Mode')).toBeVisible();
    await expect(page.getByText('Auto-Play Next')).toBeVisible();
    await expect(page.getByText('Add to Playlist')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });

  test('should navigate to next video', async () => {
    const cards = page.locator('.video-card');
    await cards.nth(0).click();
    await page.waitForTimeout(500);

    const titleEl = page.locator('h2');
    const firstTitle = await titleEl.innerText();

    const nextButton = page.locator('.fixed.z-50').getByTitle('Next Video');

    await page.waitForTimeout(1500);
    await page.mouse.move(200, 200);

    await nextButton.click();
    await page.waitForTimeout(500);

    const secondTitle = await titleEl.innerText();
    expect(firstTitle).not.toBe(secondTitle);

    await page.keyboard.press('Escape');
  });

  test('should survive continuous video switching (stress test)', async () => {
    const cards = page.locator('.video-card');
    const count = await cards.count();

    if (count < 2) {
      console.log('Skipping stress test: not enough videos');
      return;
    }

    await cards.first().click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    await page.waitForTimeout(1500);
    await page.mouse.move(200, 200);

    const nextButton = page.locator('.fixed.z-50').getByTitle('Next Video');
    await expect(nextButton).toBeVisible();

    for (let i = 0; i < 6; i++) {
      await nextButton.click();

      await expect(videoPlayer).toBeVisible();

      await page.waitForTimeout(800);
    }

    try {
      await page.waitForFunction(
        () => {
          const v = document.querySelector('.fixed.z-50 video:not(.hidden)') as HTMLVideoElement;
          return v && !v.error && v.readyState >= 2; // HAVE_CURRENT_DATA
        },
        undefined,
        { timeout: 10000 }
      );
    } catch (e) {
      const errorState = await videoPlayer.evaluate((v: HTMLVideoElement) => ({
        error: v.error ? { code: v.error.code, message: v.error.message } : null,
        readyState: v.readyState,
        networkState: v.networkState,
        src: v.src,
      }));
      console.error('Video Player stuck in invalid state:', errorState);
      throw new Error(
        `Video player failed to recover after stress test. State: ${JSON.stringify(errorState)}. Cause: ${e}`
      );
    }

    await page.keyboard.press('Escape');
  });

  test('should toggle fullscreen mode via button', async () => {
    const firstCard = page.locator('.video-card').first();
    await firstCard.click();

    await page.waitForTimeout(1500);

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
    const firstCard = page.locator('.video-card').first();
    await firstCard.click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    await page.evaluate(() => window.history.back());

    await expect(videoPlayer).toBeHidden();
  });

  test('should play native video with file:// protocol', async () => {
    const card = page.locator('.video-card').filter({ hasText: 'test-video-1.mp4' }).first();
    await expect(card).toBeVisible();
    await card.click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    const src = await videoPlayer.getAttribute('src');
    expect(src).toMatch(/^file:\/\//);

    await page.keyboard.press('Escape');
  });

  test('should play non-native video with http:// protocol (transcoding)', async () => {
    if (!ctx.hasFFmpeg) {
      test.skip();
      return;
    }

    const card = page.locator('.video-card').filter({ hasText: 'test-video-4.mkv' }).first();

    await expect(card).toBeVisible({ timeout: 5000 });
    await card.click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    const src = await videoPlayer.getAttribute('src');
    expect(src).toMatch(/^http:\/\//);
    expect(src).toContain('/video?path=');

    await page.keyboard.press('Escape');
  });
});

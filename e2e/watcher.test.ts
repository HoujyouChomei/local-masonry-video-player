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
    await page.waitForSelector('.media-card', { state: 'visible', timeout: 5000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test('should detect externally added file and show it in library', async () => {
    const newFileName = 'external-added.mp4';
    const srcPath = path.join(ctx.mediaDir, 'test-media-1.mp4');
    const destPath = path.join(ctx.mediaDir, newFileName);

    fs.copyFileSync(srcPath, destPath);

    await page.evaluate((fileName) => {
      return new Promise<void>((resolve, reject) => {
        const electronWindow = window as Window & {
          electron?: {
            ipcRenderer: {
              on: (channel: string, listener: (...args: unknown[]) => void) => void;
              off: (channel: string, listener: (...args: unknown[]) => void) => void;
            };
            trpc: {
              subscribe: (payload: { id: string; path: string; input: unknown }) => void;
              unsubscribe: (payload: { id: string }) => void;
            };
          };
        };

        if (!electronWindow.electron) {
          resolve();
          return;
        }

        const id = `media-update-${Date.now()}`;
        const timeout = setTimeout(() => {
          electronWindow.electron!.trpc.unsubscribe({ id });
          electronWindow.electron!.ipcRenderer.off(`trpc:data:${id}`, handleData);
          reject(new Error(`Timeout waiting for media update: ${fileName}`));
        }, 8000);

        const handleData = (_event: unknown, messageRaw: unknown) => {
          const message = messageRaw as { type: string; data?: { type: string; path: string }[] };
          if (message.type === 'data' && Array.isArray(message.data)) {
            const hit = message.data.some(
              (event) => event.type === 'add' && event.path.endsWith(fileName)
            );
            if (hit) {
              clearTimeout(timeout);
              electronWindow.electron!.trpc.unsubscribe({ id });
              electronWindow.electron!.ipcRenderer.off(`trpc:data:${id}`, handleData);
              resolve();
            }
          }
        };

        electronWindow.electron.ipcRenderer.on(`trpc:data:${id}`, handleData);
        electronWindow.electron.trpc.subscribe({
          id,
          path: 'subscription.onMediaUpdate',
          input: undefined,
        });
      });
    }, newFileName);

    const newCard = page.locator('.media-card', { hasText: newFileName });
    await expect(newCard).toBeVisible({ timeout: 5000 });

    if (ctx.hasFFmpeg) {
      const durationBadge = newCard.getByText(/\d+:\d+/);
      await expect(durationBadge).toBeVisible({ timeout: 5000 });
    }
  });

  test('should detect externally deleted file and remove it from library', async () => {
    const targetFile = 'test-media-2.mp4';
    const targetPath = path.join(ctx.mediaDir, targetFile);

    const card = page.locator('.media-card', { hasText: targetFile });
    await expect(card).toBeVisible();

    fs.unlinkSync(targetPath);

    await expect(card).toBeHidden({ timeout: 5000 });
  });
});

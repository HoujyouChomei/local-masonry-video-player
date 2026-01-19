// e2e/playlist.test.ts

import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Playlist Management', () => {
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

  test('should create, populate, and delete a playlist', async () => {
    const playlistName = 'E2E Playlist';

    const firstCard = page.locator('.video-card').first();
    await firstCard.click({ button: 'right' });

    const addToPlaylistMenu = page.getByRole('menuitem', { name: 'Add to Playlist' }).last();
    await expect(addToPlaylistMenu).toBeVisible();
    await addToPlaylistMenu.hover();

    const newPlaylistOption = page.getByRole('menuitem', { name: 'Create New Playlist' });
    await expect(newPlaylistOption).toBeVisible();
    await newPlaylistOption.click();

    const sidebar = page.locator('aside');
    const renameInput = sidebar.locator('input');
    await expect(renameInput).toBeVisible({ timeout: 10000 });

    await renameInput.fill(playlistName);
    await renameInput.press('Enter');

    await expect(renameInput).toBeHidden();

    const playlistSidebarItem = sidebar
      .locator('div[class*="cursor-pointer"]')
      .filter({ hasText: playlistName })
      .first();

    await expect(playlistSidebarItem).toBeVisible();

    const secondCard = page.locator('.video-card').nth(1);
    await secondCard.click({ button: 'right' });

    await expect(addToPlaylistMenu).toBeVisible();
    await addToPlaylistMenu.hover();

    const existingPlaylistOption = page.getByRole('menuitem', { name: playlistName });
    await expect(existingPlaylistOption).toBeVisible();
    await existingPlaylistOption.click();

    await playlistSidebarItem.click();

    await expect(playlistSidebarItem).toHaveClass(/bg-white\/20/);

    const playlistCards = page.locator('.video-card');
    await expect(playlistCards).toHaveCount(2);

    const cardInPlaylist = playlistCards.first();
    await cardInPlaylist.click({ button: 'right' });

    const removeOption = page.getByRole('menuitem', { name: 'Remove from Playlist' });
    await expect(removeOption).toBeVisible();
    await removeOption.click();

    await expect(playlistCards).toHaveCount(1);

    await playlistSidebarItem.hover();

    const deleteButton = playlistSidebarItem.locator('button[title="Delete"]');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    const confirmButton = page.getByRole('button', { name: 'Delete' }).last();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    await expect(playlistSidebarItem).toBeHidden();
  });
});

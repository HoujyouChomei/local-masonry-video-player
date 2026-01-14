// e2e/navigation.test.ts
import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { launchAppWithFakeData, cleanupTestContext, TestContext } from './test-utils';

test.describe('Navigation & Layout', () => {
  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async () => {
    ctx = await launchAppWithFakeData();
    page = await ctx.app.firstWindow();
    await page.waitForSelector('header', { state: 'visible', timeout: 15000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test('Desktop: initial layout and title', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const title = await page.title();
    expect(title).toBe('Local Masonry Video Player');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    const menuButton = page.getByTitle('Menu');
    await expect(menuButton).toBeHidden();
  });

  test('Desktop: navigate between views', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.getByRole('button', { name: 'All Favorites' }).click();

    const emptyState = page.locator('.text-muted-foreground').getByText('No favorite videos yet');
    await expect(emptyState).toBeVisible();

    await page.getByRole('button', { name: 'All Favorites' }).click();
    await expect(emptyState).toBeHidden();
  });

  test('Mobile: responsive layout switch', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();

    const menuButton = page.getByTitle('Menu');
    await expect(menuButton).toBeVisible();
  });

  test('Mobile: drawer menu operation', async () => {
    await page.setViewportSize({ width: 375, height: 812 });

    const menuButton = page.getByTitle('Menu');
    await menuButton.click();

    const drawerContent = page.getByRole('dialog');
    await expect(drawerContent).toBeVisible();

    const viewsHeader = page.getByText('VIEWS', { exact: true });
    await expect(viewsHeader).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawerContent).toBeHidden();
  });
});

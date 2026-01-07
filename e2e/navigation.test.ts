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

    // タイトルの確認
    const title = await page.title();
    expect(title).toBe('Local Masonry Video Player');

    // サイドバーの表示確認
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // モバイルメニューボタンの非表示確認
    const menuButton = page.getByTitle('Menu');
    await expect(menuButton).toBeHidden();
  });

  test('Desktop: navigate between views', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // "All Favorites" をクリック
    await page.getByRole('button', { name: 'All Favorites' }).click();

    // ビューが切り替わったことを確認（URLがないので、UIの変化で確認）
    // Favoritesモードではソートメニューの横のFavoritesToggleが非表示になる、またはEmptyStateの内容が変わる
    // ここではEmptyStateの変化を確認
    const emptyState = page.locator('.text-muted-foreground').getByText('No favorite videos yet');
    await expect(emptyState).toBeVisible();

    // 戻る (サイドバーのライブラリフォルダをクリック等、あるいはトグル再クリック)
    await page.getByRole('button', { name: 'All Favorites' }).click();
    await expect(emptyState).toBeHidden();
  });

  test('Mobile: responsive layout switch', async () => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000); // レイアウト変更待ち

    // サイドバーが消える
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();

    // メニューボタンが出る
    const menuButton = page.getByTitle('Menu');
    await expect(menuButton).toBeVisible();
  });

  test('Mobile: drawer menu operation', async () => {
    await page.setViewportSize({ width: 375, height: 812 });

    // ドロワーを開く
    const menuButton = page.getByTitle('Menu');
    await menuButton.click();

    // ドロワー内の要素確認
    const drawerContent = page.getByRole('dialog'); // SheetContentはdialog role
    await expect(drawerContent).toBeVisible();

    // ドロワー内の "VIEWS" ヘッダー確認
    const viewsHeader = page.getByText('VIEWS', { exact: true });
    await expect(viewsHeader).toBeVisible();

    // 閉じる（背景クリックのエミュレーションは難しいので、EscキーまたはCloseボタンがあれば）
    // Playwrightの keyboard.press('Escape') で閉じる
    await page.keyboard.press('Escape');
    await expect(drawerContent).toBeHidden();
  });
});

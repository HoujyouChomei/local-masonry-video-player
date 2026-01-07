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

    // ▼▼▼ 修正: モーダルが画面からはみ出さないようにウィンドウサイズを十分に大きく設定する ▼▼▼
    // デフォルトの800px程度だと、16:9動画 + フッター + マージンでボタンが画面外に見切れる場合がある
    await page.setViewportSize({ width: 1600, height: 1200 });

    await page.waitForSelector('.video-card', { state: 'visible', timeout: 15000 });
  });

  test.afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  test.beforeEach(async () => {
    // 確実にモーダルを閉じた状態にする
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

  test('should navigate to next video', async () => {
    const cards = page.locator('.video-card');
    await cards.nth(0).click();
    await page.waitForTimeout(500);

    const titleEl = page.locator('h2');
    const firstTitle = await titleEl.innerText();

    // モーダル内のNextボタンをクリック
    const nextButton = page.locator('.fixed.z-50').getByTitle('Next Video');

    // コントロールが表示されるまで待つ（ロック対策）
    await page.waitForTimeout(1500);
    await page.mouse.move(200, 200);

    await nextButton.click();
    await page.waitForTimeout(500);

    const secondTitle = await titleEl.innerText();
    expect(firstTitle).not.toBe(secondTitle);

    await page.keyboard.press('Escape');
  });

  // ▼▼▼ 追加: 連続再生ストレステスト ▼▼▼
  test('should survive continuous video switching (stress test)', async () => {
    const cards = page.locator('.video-card');
    const count = await cards.count();

    // テストに必要な枚数がない場合はスキップ
    if (count < 2) {
      console.log('Skipping stress test: not enough videos');
      return;
    }

    // 1つ目を開く
    await cards.first().click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    // 操作ロック解除待ち & コントロール表示
    await page.waitForTimeout(1500);
    await page.mouse.move(200, 200);

    const nextButton = page.locator('.fixed.z-50').getByTitle('Next Video');
    await expect(nextButton).toBeVisible();

    // 6回連続切り替え (3,4回目で落ちる現象の回帰テスト)
    for (let i = 0; i < 6; i++) {
      await nextButton.click();

      // レンダラーがクラッシュしていないか確認（要素が消えていないか）
      await expect(videoPlayer).toBeVisible();

      // デコーダーのリセットと次のロードのための適度な待機
      // 高速連打すぎるとクリックイベント自体が間引かれる可能性があるため
      await page.waitForTimeout(800);
    }

    // 最終的に再生可能な状態になっているか確認
    // readyState: 0=HAVE_NOTHING, 4=HAVE_ENOUGH_DATA
    try {
      await page.waitForFunction(
        () => {
          const v = document.querySelector('.fixed.z-50 video:not(.hidden)') as HTMLVideoElement;
          // エラーがなく、データ読み込みが開始されていること
          return v && !v.error && v.readyState >= 2; // HAVE_CURRENT_DATA
        },
        undefined,
        { timeout: 10000 }
      );
    } catch (e) {
      // 失敗時のデバッグ情報
      const errorState = await videoPlayer.evaluate((v: HTMLVideoElement) => ({
        error: v.error ? { code: v.error.code, message: v.error.message } : null,
        readyState: v.readyState,
        networkState: v.networkState,
        src: v.src,
      }));
      console.error('Video Player stuck in invalid state:', errorState);
      // ▼▼▼ 修正: 元のエラー (e) をメッセージに含めて未使用変数を回避 ▼▼▼
      throw new Error(
        `Video player failed to recover after stress test. State: ${JSON.stringify(errorState)}. Cause: ${e}`
      );
    }

    await page.keyboard.press('Escape');
  });

  test('should toggle fullscreen mode via button', async () => {
    const firstCard = page.locator('.video-card').first();
    await firstCard.click();

    // 動画オープン直後の操作ロック(1秒)が解除されるのを待つ
    await page.waitForTimeout(1500);

    // コントロール表示のためにマウス移動
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);

    const modalContainer = page.locator('.fixed.z-50');
    // ヘッダーのボタンと区別するため、モーダル内のボタンを指定
    const enterBtn = modalContainer.getByTitle(/Enter Fullscreen/);

    await expect(enterBtn).toBeVisible();

    // オーバーレイ対策で force: true
    await enterBtn.click({ force: true });

    // クリック後は Exit Fullscreen に変わるはず
    const exitBtn = modalContainer.getByTitle(/Exit Fullscreen/);
    await expect(exitBtn).toBeVisible();

    // 戻す
    await exitBtn.click({ force: true });
    await expect(enterBtn).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('should close modal on browser back (History API)', async () => {
    const firstCard = page.locator('.video-card').first();
    await firstCard.click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    // History APIを使って戻る動作をシミュレート
    await page.evaluate(() => window.history.back());

    await expect(videoPlayer).toBeHidden();
  });

  // ▼▼▼ 追加: プロトコル検証テスト ▼▼▼

  test('should play native video with file:// protocol', async () => {
    // MP4ファイル (test-video-1.mp4) を特定してクリック
    // 注: test-utils.ts で生成されるファイル名に依存
    const card = page.locator('.video-card').filter({ hasText: 'test-video-1.mp4' }).first();
    await expect(card).toBeVisible();
    await card.click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    // src属性が file:// で始まっていることを確認
    // これにより、直接読み込みによる高速化と6個制限回避が機能していることを保証
    const src = await videoPlayer.getAttribute('src');
    expect(src).toMatch(/^file:\/\//);

    await page.keyboard.press('Escape');
  });

  test('should play non-native video with http:// protocol (transcoding)', async () => {
    // FFmpegがない環境ではMKVが生成されないためスキップ
    if (!ctx.hasFFmpeg) {
      test.skip();
      return;
    }

    // MKVファイル (test-video-4.mkv) を特定してクリック
    const card = page.locator('.video-card').filter({ hasText: 'test-video-4.mkv' }).first();

    // 生成タイミングによってはDOMに反映されるまで少しラグがある可能性があるため待つ
    await expect(card).toBeVisible({ timeout: 5000 });
    await card.click();

    const videoPlayer = page.locator('.fixed.z-50 video:not(.hidden)');
    await expect(videoPlayer).toBeVisible();

    // src属性が http:// で始まっていることを確認
    // これにより、非ネイティブ形式が正しくローカルサーバー経由で配信されていることを保証
    const src = await videoPlayer.getAttribute('src');
    expect(src).toMatch(/^http:\/\//);
    expect(src).toContain('/video?path=');

    await page.keyboard.press('Escape');
  });
});

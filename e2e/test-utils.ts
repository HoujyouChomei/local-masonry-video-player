// e2e/test-utils.ts
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { _electron as electron, ElectronApplication } from 'playwright';

export interface TestContext {
  app: ElectronApplication;
  userDataDir: string;
  videoDir: string;
  hasFFmpeg: boolean;
}

/**
 * テスト用の環境をセットアップしてアプリを起動する
 */
export async function launchAppWithFakeData(): Promise<TestContext> {
  // 1. 一時ディレクトリの作成 (OSのTemp領域)
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvm-e2e-'));
  const userDataDir = path.join(tempDir, 'userData');
  const videoDir = path.join(tempDir, 'videos');

  fs.mkdirSync(userDataDir);
  fs.mkdirSync(videoDir);

  // 2. FFmpegバイナリの検出 (プロジェクトルート/bin)
  const projectRoot = path.resolve(__dirname, '..');
  const binDir = path.join(projectRoot, 'bin');
  const isWin = process.platform === 'win32';

  const ffmpegName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
  const ffprobeName = isWin ? 'ffprobe.exe' : 'ffprobe';

  const ffmpegPath = path.join(binDir, ffmpegName);
  const ffprobePath = path.join(binDir, ffprobeName);

  const hasFFmpeg = fs.existsSync(ffmpegPath);
  const hasFFprobe = fs.existsSync(ffprobePath);

  if (hasFFmpeg) {
    console.log(`[Test] FFmpeg detected at: ${ffmpegPath}`);
  } else {
    console.log('[Test] FFmpeg not found. Running in native-only mode.');
  }

  // 3. ダミー動画ファイルの作成
  // FFmpegがない場合のフォールバック用バイナリ (不完全なMP4)
  const minimalMp4 = Buffer.from('00000018667479706d703432000000006d70343269736f6d', 'hex');

  if (hasFFmpeg) {
    // FFmpegがある場合は、正規の動画ファイルを生成する
    // これによりブラウザでのデコードエラーを防ぎ、httpへのフォールバックを回避する
    const generateVideo = (fileName: string) => {
      const outputPath = path.join(videoDir, fileName);
      try {
        // 1秒間の黒画面動画を生成 (解像度小さめ、高速生成)
        execSync(
          `"${ffmpegPath}" -y -f lavfi -i color=c=black:s=320x180:d=1 -c:v libx264 -tune zerolatency -preset ultrafast -t 1 "${outputPath}"`,
          { stdio: 'ignore' }
        );
      } catch (e) {
        console.warn(
          `[Test] Failed to generate video with ffmpeg: ${fileName}, using fallback.`,
          e
        );
        fs.writeFileSync(outputPath, minimalMp4);
      }
    };

    // ネイティブ形式
    generateVideo('test-video-1.mp4');
    generateVideo('test-video-2.mp4');
    generateVideo('test-video-3.mp4');

    // 非ネイティブ形式
    generateVideo('test-video-4.mkv');
    generateVideo('test-video-5.avi');
  } else {
    // FFmpegがない場合 (CI等) はバイナリ書き込みで凌ぐ
    // 注: この場合 play native video テストは失敗する可能性があるが、
    // hasFFmpegチェック済み環境であればここは通らない
    ['test-video-1.mp4', 'test-video-2.mp4', 'test-video-3.mp4'].forEach((fileName) => {
      fs.writeFileSync(path.join(videoDir, fileName), minimalMp4);
    });
  }

  // 4. 設定ファイル (config.json) の注入
  const config = {
    libraryFolders: [videoDir],
    folderPath: videoDir,
    isSidebarOpen: true,
    layoutMode: 'masonry',
    gridStyle: 'modern',
    enableMobileConnection: false,
    // FFmpegパスの注入
    ffmpegPath: hasFFmpeg ? ffmpegPath : '',
    ffprobePath: hasFFprobe ? ffprobePath : '',
    // テストのためにNormalize機能を有効化 (FFmpegがある場合のみ)
    enableExperimentalNormalize: hasFFmpeg,
  };

  fs.writeFileSync(path.join(userDataDir, 'config.json'), JSON.stringify(config));

  // 5. アプリの起動
  const app = await electron.launch({
    args: ['.', `--user-data-dir=${userDataDir}`],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  return { app, userDataDir, videoDir, hasFFmpeg };
}

/**
 * テスト終了後のクリーンアップ
 */
export async function cleanupTestContext(ctx: TestContext) {
  if (ctx.app) {
    await ctx.app.close();
  }

  // 一時ディレクトリの削除
  try {
    const parentDir = path.dirname(ctx.userDataDir);
    fs.rmSync(parentDir, { recursive: true, force: true });
  } catch (e) {
    console.warn('Failed to cleanup temp dir:', e);
  }
}

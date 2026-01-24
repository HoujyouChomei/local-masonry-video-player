// e2e/test-utils.ts

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { _electron as electron, ElectronApplication } from 'playwright';

export interface TestContext {
  app: ElectronApplication;
  userDataDir: string;
  mediaDir: string;
  mediaDir2: string;
  hasFFmpeg: boolean;
}

export async function launchAppWithFakeData(): Promise<TestContext> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvm-e2e-'));
  const userDataDir = path.join(tempDir, 'userData');
  const mediaDir = path.join(tempDir, 'media');
  const mediaDir2 = path.join(tempDir, 'media2');

  fs.mkdirSync(userDataDir);
  fs.mkdirSync(mediaDir);
  fs.mkdirSync(mediaDir2);

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

  const minimalMp4 = Buffer.from('00000018667479706d703432000000006d70343269736f6d', 'hex');

  const generateOrCopyMedia = (fileName: string, targetDir: string) => {
    const outputPath = path.join(targetDir, fileName);
    if (hasFFmpeg) {
      try {
        execSync(
          `"${ffmpegPath}" -y -f lavfi -i color=c=black:s=320x180:d=1 -c:v libx264 -tune zerolatency -preset ultrafast -t 1 "${outputPath}"`,
          { stdio: 'ignore' }
        );
      } catch (e) {
        console.warn(
          `[Test] Failed to generate media with ffmpeg: ${fileName}, using fallback. Error:`,
          e
        );
        fs.writeFileSync(outputPath, minimalMp4);
      }
    } else {
      fs.writeFileSync(outputPath, minimalMp4);
    }
  };

  if (hasFFmpeg) {
    generateOrCopyMedia('test-media-1.mp4', mediaDir);
    generateOrCopyMedia('test-media-2.mp4', mediaDir);
    generateOrCopyMedia('test-media-3.mp4', mediaDir);
    generateOrCopyMedia('test-media-4.mkv', mediaDir);
    generateOrCopyMedia('test-media-5.avi', mediaDir);
  } else {
    ['test-media-1.mp4', 'test-media-2.mp4', 'test-media-3.mp4'].forEach((fileName) => {
      generateOrCopyMedia(fileName, mediaDir);
    });
  }

  // Create a unique file in the second directory
  generateOrCopyMedia('new-folder-media.mp4', mediaDir2);

  const config = {
    libraryFolders: [mediaDir],
    folderPath: mediaDir,
    isSidebarOpen: true,
    layoutMode: 'masonry',
    gridStyle: 'standard',
    enableMobileConnection: false,
    ffmpegPath: hasFFmpeg ? ffmpegPath : '',
    ffprobePath: hasFFprobe ? ffprobePath : '',
    enableExperimentalNormalize: hasFFmpeg,
  };

  fs.writeFileSync(path.join(userDataDir, 'config.json'), JSON.stringify(config));

  const app = await electron.launch({
    args: ['.', `--user-data-dir=${userDataDir}`],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  const monitorLog = (stream: NodeJS.ReadableStream) => {
    stream.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.includes('[error]') || text.includes('CRITICAL')) {
        console.error(`\n🚨 [MAIN PROCESS ERROR DETECTED]:\n${text}\n`);
      }
    });
  };

  if (app.process().stdout) monitorLog(app.process().stdout!);
  if (app.process().stderr) monitorLog(app.process().stderr!);

  return { app, userDataDir, mediaDir, mediaDir2, hasFFmpeg };
}

export async function cleanupTestContext(ctx: TestContext) {
  if (ctx.app) {
    await ctx.app.close();
  }

  try {
    const parentDir = path.dirname(ctx.userDataDir);
    fs.rmSync(parentDir, { recursive: true, force: true });
  } catch (e) {
    console.warn('Failed to cleanup temp dir:', e);
  }
}

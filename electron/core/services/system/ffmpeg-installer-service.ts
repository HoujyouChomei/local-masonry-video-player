// electron/core/services/system/ffmpeg-installer-service.ts

import fs from 'fs';
import path from 'path';
import os from 'os';
import { app } from 'electron';
import { pipeline } from 'stream/promises';
import { Readable, PassThrough } from 'stream';
import AdmZip from 'adm-zip';
import { logger } from '../../../lib/logger';
import { SettingsService } from './settings-service';
import { FFmpegService } from '../video/ffmpeg-service';
import { eventBus } from '../../events';

export class FFmpegInstallerService {
  private static instance: FFmpegInstallerService;
  private settingsService = SettingsService.getInstance();
  private ffmpegService = new FFmpegService();

  private isInstalling = false;

  private constructor() {}

  public static getInstance(): FFmpegInstallerService {
    if (!FFmpegInstallerService.instance) {
      FFmpegInstallerService.instance = new FFmpegInstallerService();
    }
    return FFmpegInstallerService.instance;
  }

  private getDownloadUrl(): string | null {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === 'win32' && arch === 'x64') {
      return 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
    }

    if (platform === 'darwin') {
      return 'https://evermeet.cx/ffmpeg/getrelease/zip';
    }

    return null;
  }

  public async install(): Promise<{ success: boolean; error?: string }> {
    if (this.isInstalling) {
      return { success: false, error: 'Installation already in progress.' };
    }

    this.isInstalling = true;
    eventBus.emit('system:install-progress', { progress: 0, status: 'Starting...' });
    logger.info('[FFmpegInstaller] Starting installation...');

    const url = this.getDownloadUrl();
    if (!url) {
      this.isInstalling = false;
      return {
        success: false,
        error: 'Auto-install is not supported on this OS. Please install FFmpeg manually.',
      };
    }

    const userDataPath = app.getPath('userData');
    const binDir = path.join(userDataPath, 'bin');
    const tempDir = path.join(userDataPath, 'temp_dl');
    const zipPath = path.join(tempDir, 'ffmpeg_download.zip');

    try {
      if (fs.existsSync(tempDir)) {
        logger.debug('[FFmpegInstaller] Cleaning up old temp directory.');
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
      fs.mkdirSync(tempDir, { recursive: true });

      logger.info(`[FFmpegInstaller] Downloading from: ${url}`);
      eventBus.emit('system:install-progress', { progress: 1, status: 'Downloading...' });

      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
      let receivedBytes = 0;
      let lastEmittedProgress = 0;

      const monitorStream = new PassThrough();
      monitorStream.on('data', (chunk: Buffer) => {
        receivedBytes += chunk.length;
        if (totalBytes > 0) {
          const progress = Math.round((receivedBytes / totalBytes) * 100);
          if (progress > lastEmittedProgress) {
            lastEmittedProgress = progress;
            eventBus.emit('system:install-progress', {
              progress,
              status: `Downloading (${progress}%)`,
            });
          }
        }
      });

      const fileStream = fs.createWriteStream(zipPath);
      
      // @ts-expect-error: Readable.fromWeb matches stream types in Node 20
      await pipeline(Readable.fromWeb(response.body), monitorStream, fileStream);

      logger.info('[FFmpegInstaller] Download complete. Extracting...');
      eventBus.emit('system:install-progress', { progress: 100, status: 'Extracting...' });

      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      let ffmpegEntryName: string | null = null;
      let ffprobeEntryName: string | null = null;

      const isWin = os.platform() === 'win32';
      const ffmpegName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
      const ffprobeName = isWin ? 'ffprobe.exe' : 'ffprobe';

      zipEntries.forEach((entry) => {
        const baseName = path.basename(entry.entryName);
        if (baseName === ffmpegName) ffmpegEntryName = entry.entryName;
        if (baseName === ffprobeName) ffprobeEntryName = entry.entryName;
      });

      if (!ffmpegEntryName) {
        throw new Error('ffmpeg binary not found in the downloaded archive.');
      }

      zip.extractEntryTo(ffmpegEntryName, binDir, false, true);
      if (ffprobeEntryName) {
        zip.extractEntryTo(ffprobeEntryName, binDir, false, true);
      }

      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        logger.warn('[FFmpegInstaller] Failed to clean temp dir:', e);
      }

      const installedFFmpegPath = path.join(binDir, ffmpegName);
      const installedFFprobePath = path.join(binDir, ffprobeName);

      if (os.platform() !== 'win32') {
        fs.chmodSync(installedFFmpegPath, 0o755);
        if (fs.existsSync(installedFFprobePath)) fs.chmodSync(installedFFprobePath, 0o755);
      }

      eventBus.emit('system:install-progress', { progress: 100, status: 'Validating...' });
      
      const isValid = await this.ffmpegService.validatePath(installedFFmpegPath, 'ffmpeg');
      if (isValid) {
        await this.settingsService.updateSetting('ffmpegPath', installedFFmpegPath);
        if (fs.existsSync(installedFFprobePath)) {
          await this.settingsService.updateSetting('ffprobePath', installedFFprobePath);
        }
        logger.info('[FFmpegInstaller] Installation successful.');
        return { success: true };
      } else {
        throw new Error('Downloaded binary failed validation.');
      }
    } catch (error) {
      logger.error('[FFmpegInstaller] Installation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      this.isInstalling = false;
    }
  }
}
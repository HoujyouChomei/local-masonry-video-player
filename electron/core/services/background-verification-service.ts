// electron/core/services/background-verification-service.ts

import { BrowserWindow } from 'electron';
import { VideoIntegrityRepository } from '../repositories/video-integrity-repository'; // 変更
import { FileIntegrityService } from './file-integrity-service';

export class BackgroundVerificationService {
  private integrityRepo = new VideoIntegrityRepository(); // 変更
  private integrityService = new FileIntegrityService();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private readonly CHECK_INTERVAL = 2 * 60 * 1000;

  public start() {
    if (this.intervalId) return;

    setTimeout(() => this.runVerification(), 5000);

    this.intervalId = setInterval(() => {
      this.runVerification();
    }, this.CHECK_INTERVAL);

    console.log('[BackgroundVerification] Service started.');
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async runVerification() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const importantPaths = this.integrityRepo.getImportantPaths(); // 変更

      if (importantPaths.length === 0) {
        this.isRunning = false;
        return;
      }

      const hasChanges = await this.integrityService.verifyAndRecover(importantPaths);

      if (hasChanges) {
        console.log('[BackgroundVerification] Changes detected. Notifying UI.');
        const mainWindow = BrowserWindow.getAllWindows()[0];
        mainWindow?.webContents.send('on-video-update', { type: 'update', path: '' });
      }
    } catch (error) {
      console.error('[BackgroundVerification] Error during verification:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

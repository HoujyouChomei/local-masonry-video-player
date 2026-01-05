// electron/core/services/background-verification-service.ts

import { VideoIntegrityRepository } from '../repositories/video-integrity-repository';
import { FileIntegrityService } from './file-integrity-service';
import { NotificationService } from './notification-service';

export class BackgroundVerificationService {
  private integrityRepo = new VideoIntegrityRepository();
  private integrityService = new FileIntegrityService();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private notifier = NotificationService.getInstance();

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
      const importantPaths = this.integrityRepo.getImportantPaths();

      if (importantPaths.length === 0) {
        this.isRunning = false;
        return;
      }

      const hasChanges = await this.integrityService.verifyAndRecover(importantPaths);

      if (hasChanges) {
        console.log('[BackgroundVerification] Changes detected. Notifying UI.');
        const event = { type: 'update' as const, path: '' };
        this.notifier.notify(event);
      }
    } catch (error) {
      console.error('[BackgroundVerification] Error during verification:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

// electron/lib/db-migrator.ts

import Database from 'better-sqlite3';
import { logger } from './logger';

export class DBMigrator {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public migrate() {
    const currentVersion = this.db.pragma('user_version', { simple: true }) as number;

    const targetVersion = 1;

    logger.debug(`[DBMigrator] Current version: ${currentVersion}, Target: ${targetVersion}`);

    if (currentVersion >= targetVersion) {
      return;
    }

    try {
      this.runMigrations(currentVersion, targetVersion);
    } catch (error) {
      logger.error('[DBMigrator] Migration failed:', error);
      throw error;
    }
  }

  private runMigrations(from: number, to: number) {
    logger.info(`[DBMigrator] Running migrations from v${from} to v${to}...`);
  }
}

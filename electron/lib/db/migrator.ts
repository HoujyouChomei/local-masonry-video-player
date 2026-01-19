// electron/lib/db/migrator.ts

import Database from 'better-sqlite3';
import { logger } from '../logger';
import { setupFTS } from './schema';

export class DBMigrator {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public migrate() {
    const currentVersion = this.db.pragma('user_version', { simple: true }) as number;
    const LATEST_VERSION = 2;

    logger.debug(`[DBMigrator] Current version: ${currentVersion}, Target: ${LATEST_VERSION}`);

    if (currentVersion >= LATEST_VERSION) {
      return;
    }

    const runMigration = this.db.transaction(() => {
      try {
        if (currentVersion < 2) {
          this.migrateToV2();
        }

        this.db.pragma(`user_version = ${LATEST_VERSION}`);
        logger.info(`[DBMigrator] Successfully migrated to version ${LATEST_VERSION}`);
      } catch (error) {
        logger.error('[DBMigrator] Migration failed:', error);
        throw error;
      }
    });

    runMigration();
  }

  private migrateToV2() {
    logger.info('[DBMigrator] Running migration v2: Transforming videos to media...');

    try {
      this.db.exec(`ALTER TABLE media RENAME TO media_old;`);
    } catch {
      // ignore
    }

    try {
      this.db.exec(`ALTER TABLE videos RENAME TO media;`);
    } catch {
      logger.warn('[DBMigrator] Table rename failed, possibly already renamed.');
    }

    const addColumn = (sql: string) => {
      try {
        this.db.exec(sql);
      } catch {
        logger.warn(`[DBMigrator] Column addition skipped (may exist): ${sql}`);
      }
    };

    const renameColumn = (table: string, oldName: string, newName: string) => {
      try {
        const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
        const hasOld = columns.some((c) => c.name === oldName);
        const hasNew = columns.some((c) => c.name === newName);

        if (hasOld && !hasNew) {
          this.db.exec(`ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName};`);
        }
      } catch (e) {
        logger.warn(`[DBMigrator] Column rename failed: ${oldName} -> ${newName}`, e);
      }
    };

    renameColumn('media', 'play_count', 'view_count');
    renameColumn('media', 'last_played_at', 'last_viewed_at');

    addColumn(`ALTER TABLE media ADD COLUMN type TEXT DEFAULT 'video';`);
    addColumn(`ALTER TABLE media ADD COLUMN orientation INTEGER;`);
    addColumn(`ALTER TABLE media ADD COLUMN is_animated INTEGER DEFAULT 0;`);
    addColumn(`ALTER TABLE media ADD COLUMN created_at_original INTEGER;`);
    addColumn(`ALTER TABLE media ADD COLUMN lat REAL;`);
    addColumn(`ALTER TABLE media ADD COLUMN lng REAL;`);
    addColumn(`ALTER TABLE media ADD COLUMN camera_model TEXT;`);

    const dropIndex = (name: string) => this.db.exec(`DROP INDEX IF EXISTS ${name};`);

    dropIndex('idx_videos_path');
    dropIndex('idx_videos_status');
    dropIndex('idx_videos_ino');
    dropIndex('idx_videos_hash');
    dropIndex('idx_videos_name');
    dropIndex('idx_videos_metadata_status');

    this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_media_path ON media(path);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_media_ino ON media(ino);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_media_hash ON media(file_hash);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_media_name ON media(name);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_media_metadata_status ON media(metadata_status);`);

    this.db.exec(`DROP TABLE IF EXISTS videos_fts;`);
    this.db.exec(`DROP TRIGGER IF EXISTS videos_ai;`);
    this.db.exec(`DROP TRIGGER IF EXISTS videos_ad;`);
    this.db.exec(`DROP TRIGGER IF EXISTS videos_au;`);

    this.db.exec(`DROP TABLE IF EXISTS media_fts;`);
    this.db.exec(`DROP TRIGGER IF EXISTS media_ai;`);
    this.db.exec(`DROP TRIGGER IF EXISTS media_ad;`);
    this.db.exec(`DROP TRIGGER IF EXISTS media_au;`);

    setupFTS(this.db);

    this.db.exec(`INSERT INTO media_fts(media_fts) VALUES('rebuild');`);
  }
}

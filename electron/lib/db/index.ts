// electron/lib/db/index.ts

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { DBMigrator } from './migrator';
import { createSchema } from './schema';
import { logger } from '../logger';

let db: Database.Database | null = null;
const instanceId = Math.floor(Math.random() * 10000);

export const getDB = () => {
  if (!db) {
    logger.error(`[DB Error] getDB called but DB is null. InstanceID: ${instanceId}`);
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
};

export const initDB = () => {
  if (db) {
    return db;
  }

  const dbPath = path.join(app.getPath('userData'), 'library.db');
  logger.debug(`[DB] Initializing... Path: ${dbPath}`);

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    const currentVersion = db.pragma('user_version', { simple: true }) as number;

    if (currentVersion === 0) {
      logger.info('[DB] Creating fresh schema (v2)...');
      createSchema(db);
      db.pragma('user_version = 2');
    } else {
      const migrator = new DBMigrator(db);
      migrator.migrate();
    }

    return db;
  } catch (error) {
    logger.error('[DB] Initialization FAILED:', error);
    throw error;
  }
};

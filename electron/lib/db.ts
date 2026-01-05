// electron/lib/db.ts

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { DBMigrator } from './db-migrator';

let db: Database.Database | null = null;

// デバッグ用: インスタンスID (初期化されるたびに変わる)
const instanceId = Math.floor(Math.random() * 10000);

export const getDB = () => {
  // console.log(`[DB] getDB called. InstanceID: ${instanceId}, DB State: ${db ? 'Initialized' : 'NULL'}`);
  if (!db) {
    console.error(`[DB Error] getDB called but DB is null. InstanceID: ${instanceId}`);
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
};

export const initDB = () => {
  if (db) {
    console.log(`[DB] Already initialized. InstanceID: ${instanceId}`);
    return db;
  }

  const dbPath = path.join(app.getPath('userData'), 'library.db');
  console.log(`[DB] Initializing... InstanceID: ${instanceId}`);
  console.log(`[DB] Path: ${dbPath}`);

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
      console.log('[DB] Creating fresh schema (v1)...');
      createSchema(db);
      db.pragma('user_version = 1');
    }

    const migrator = new DBMigrator(db);
    migrator.migrate();

    console.log(`[DB] Initialization successful. InstanceID: ${instanceId}`);
    return db;
  } catch (error) {
    console.error('[DB] Initialization FAILED:', error);
    throw error;
  }
};

const createSchema = (db: Database.Database) => {
  const runTransaction = db.transaction(() => {
    // 1. Videos Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,                 -- UUID
        path TEXT NOT NULL UNIQUE,           -- 絶対パス
        name TEXT,                           -- ファイル名
        
        file_hash TEXT,                      -- Partial Hash
        size INTEGER,                        -- Bytes
        mtime INTEGER,                       -- 更新日時 (Unix MS)
        
        duration REAL,                       -- 秒
        width INTEGER,
        height INTEGER,
        aspect_ratio REAL,
        fps REAL,                            -- フレームレート
        codec TEXT,                          -- ビデオコーデック
        
        thumbnail_path TEXT,
        blurhash TEXT,
        
        is_favorite INTEGER DEFAULT 0,       -- 0 or 1
        play_count INTEGER DEFAULT 0,
        last_played_at INTEGER,
        
        status TEXT DEFAULT 'available',     -- 'available' | 'missing'
        ino INTEGER,                         -- File System Inode
        last_seen_at INTEGER,                -- Unix Timestamp ms
        last_scan_attempt_at INTEGER,        -- On-Demand Scan Timestamp ms
        
        generation_params TEXT,              -- AI Metadata JSON
        metadata_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
        
        created_at INTEGER NOT NULL
      );
    `);

    // Videos Indices
    db.exec(`CREATE INDEX IF NOT EXISTS idx_videos_path ON videos(path);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_videos_ino ON videos(ino);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_videos_hash ON videos(file_hash);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_videos_name ON videos(name);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_videos_metadata_status ON videos(metadata_status);`);

    // 2. Playlists Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    // 3. Playlist Items Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS playlist_items (
        playlist_id TEXT NOT NULL,
        video_id TEXT NOT NULL,
        rank INTEGER NOT NULL,
        added_at INTEGER,
        
        PRIMARY KEY (playlist_id, video_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
      );
    `);
    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_playlist_items_lookup ON playlist_items(playlist_id, rank);`
    );

    // 4. Folder Sort Orders Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS folder_sort_orders (
        folder_path TEXT NOT NULL,
        video_path TEXT NOT NULL,
        rank INTEGER NOT NULL,
        
        PRIMARY KEY (folder_path, video_path)
      );
    `);
    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_folder_sort_lookup ON folder_sort_orders(folder_path, rank);`
    );

    // 5. Tags Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL COLLATE NOCASE, -- 大文字小文字を区別しない
        created_at INTEGER NOT NULL
      );
    `);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);`);

    // 6. Video Tags Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS video_tags (
        video_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        assigned_at INTEGER NOT NULL,
        
        PRIMARY KEY (video_id, tag_id),
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags(tag_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags(video_id);`);

    // 7. FTS5 Table & Triggers (For Hybrid Search)
    try {
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS videos_fts USING fts5(
          name, 
          path, 
          generation_params, 
          codec,
          content='videos', 
          content_rowid='rowid'
        );
      `);

      const fpsExpression = `
        COALESCE(new.codec, '') || ' ' || 
        CASE 
          WHEN new.fps IS NOT NULL THEN CAST(CAST(ROUND(new.fps) AS INT) AS TEXT) || 'fps fps' 
          ELSE '' 
        END
      `;
      const fpsExpressionOld = `
        COALESCE(old.codec, '') || ' ' || 
        CASE 
          WHEN old.fps IS NOT NULL THEN CAST(CAST(ROUND(old.fps) AS INT) AS TEXT) || 'fps fps' 
          ELSE '' 
        END
      `;

      db.exec(`
        CREATE TRIGGER IF NOT EXISTS videos_ai AFTER INSERT ON videos BEGIN
          INSERT INTO videos_fts(rowid, name, path, generation_params, codec) 
          VALUES (
            new.rowid, 
            new.name, 
            new.path, 
            new.generation_params, 
            ${fpsExpression}
          );
        END;
      `);

      db.exec(`
        CREATE TRIGGER IF NOT EXISTS videos_ad AFTER DELETE ON videos BEGIN
          INSERT INTO videos_fts(videos_fts, rowid, name, path, generation_params, codec) 
          VALUES (
            'delete', 
            old.rowid, 
            old.name, 
            old.path, 
            old.generation_params, 
            ${fpsExpressionOld}
          );
        END;
      `);

      // ▼▼▼ 修正: WHEN句を追加して、無関係なカラム更新時のインデックス再構築を防ぐ ▼▼▼
      // IS NOT を使用することで NULL 比較も正しく処理する
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS videos_au AFTER UPDATE ON videos
        WHEN old.name IS NOT new.name 
          OR old.path IS NOT new.path 
          OR old.generation_params IS NOT new.generation_params 
          OR old.codec IS NOT new.codec
          OR old.fps IS NOT new.fps
        BEGIN
          INSERT INTO videos_fts(videos_fts, rowid, name, path, generation_params, codec) 
          VALUES (
            'delete', 
            old.rowid, 
            old.name, 
            old.path, 
            old.generation_params, 
            ${fpsExpressionOld}
          );
          INSERT INTO videos_fts(rowid, name, path, generation_params, codec) 
          VALUES (
            new.rowid, 
            new.name, 
            new.path, 
            new.generation_params, 
            ${fpsExpression}
          );
        END;
      `);
    } catch (e) {
      console.warn('FTS5 creation failed. Search capability might be limited.', e);
    }
  });

  runTransaction();
};

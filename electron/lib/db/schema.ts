// electron/lib/db/schema.ts

import Database from 'better-sqlite3';
import { logger } from '../logger';

export const createSchema = (db: Database.Database) => {
  const runTransaction = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        name TEXT,
        
        -- Common Metadata
        type TEXT DEFAULT 'video',           -- 'video' | 'image'
        size INTEGER,
        mtime INTEGER,
        created_at INTEGER NOT NULL,
        created_at_original INTEGER,         -- EXIF/Creation Date
        
        -- Integrity & Status
        file_hash TEXT,
        status TEXT DEFAULT 'available',     -- 'available' | 'missing'
        ino INTEGER,
        last_seen_at INTEGER,
        last_scan_attempt_at INTEGER,
        
        -- Common Features
        is_favorite INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        last_viewed_at INTEGER,
        thumbnail_path TEXT,
        blurhash TEXT,
        
        -- Video Specific
        duration REAL,
        width INTEGER,
        height INTEGER,
        aspect_ratio REAL,
        fps REAL,
        codec TEXT,
        generation_params TEXT,
        metadata_status TEXT DEFAULT 'pending', 

        -- Image Specific
        orientation INTEGER,
        is_animated INTEGER DEFAULT 0,
        
        -- Geo & Device
        lat REAL,
        lng REAL,
        camera_model TEXT
      );
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_media_path ON media(path);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_media_ino ON media(ino);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_media_hash ON media(file_hash);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_media_name ON media(name);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_media_metadata_status ON media(metadata_status);`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS playlist_items (
        playlist_id TEXT NOT NULL,
        video_id TEXT NOT NULL, -- references media(id)
        rank INTEGER NOT NULL,
        added_at INTEGER,
        
        PRIMARY KEY (playlist_id, video_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (video_id) REFERENCES media(id) ON DELETE CASCADE
      );
    `);
    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_playlist_items_lookup ON playlist_items(playlist_id, rank);`
    );

    db.exec(`
      CREATE TABLE IF NOT EXISTS folder_sort_orders (
        folder_path TEXT NOT NULL,
        video_path TEXT NOT NULL,
        rank INTEGER NOT NULL,
        PRIMARY KEY (folder_path, video_path)
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL COLLATE NOCASE,
        created_at INTEGER NOT NULL
      );
    `);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS video_tags (
        video_id TEXT NOT NULL, -- references media(id)
        tag_id TEXT NOT NULL,
        assigned_at INTEGER NOT NULL,
        
        PRIMARY KEY (video_id, tag_id),
        FOREIGN KEY (video_id) REFERENCES media(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags(tag_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags(video_id);`);

    setupFTS(db);
  });

  runTransaction();
};

export const setupFTS = (db: Database.Database) => {
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS media_fts USING fts5(
        name, 
        path, 
        generation_params, 
        codec,
        camera_model,
        content='media', 
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
      CREATE TRIGGER IF NOT EXISTS media_ai AFTER INSERT ON media BEGIN
        INSERT INTO media_fts(rowid, name, path, generation_params, codec, camera_model) 
        VALUES (new.rowid, new.name, new.path, new.generation_params, ${fpsExpression}, new.camera_model);
      END;
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS media_ad AFTER DELETE ON media BEGIN
        INSERT INTO media_fts(media_fts, rowid, name, path, generation_params, codec, camera_model) 
        VALUES ('delete', old.rowid, old.name, old.path, old.generation_params, ${fpsExpressionOld}, old.camera_model);
      END;
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS media_au AFTER UPDATE ON media
      WHEN old.name IS NOT new.name 
        OR old.path IS NOT new.path 
        OR old.generation_params IS NOT new.generation_params 
        OR old.codec IS NOT new.codec
        OR old.fps IS NOT new.fps
        OR old.camera_model IS NOT new.camera_model
      BEGIN
        INSERT INTO media_fts(media_fts, rowid, name, path, generation_params, codec, camera_model) 
        VALUES ('delete', old.rowid, old.name, old.path, old.generation_params, ${fpsExpressionOld}, old.camera_model);
        INSERT INTO media_fts(rowid, name, path, generation_params, codec, camera_model) 
        VALUES (new.rowid, new.name, new.path, new.generation_params, ${fpsExpression}, new.camera_model);
      END;
    `);
  } catch (e) {
    logger.warn('FTS5 creation/setup failed.', e);
  }
};

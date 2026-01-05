// electron/main.ts

import { app, BrowserWindow, ipcMain } from 'electron';
if (app.isPackaged) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

import path from 'path';
if (!process.env.NODE_ENV && app.isPackaged) {
  const portableUserDataPath = path.join(path.dirname(app.getPath('exe')), 'userData');
  app.setPath('userData', portableUserDataPath);
}

import windowStateKeeper from 'electron-window-state';
import { getVideos } from './handlers/getVideos';
import { handleSettings } from './handlers/settings';
import { handleDialog } from './handlers/dialog';
import { handleFavorites } from './handlers/favorites';
import { handleDirectories } from './handlers/directories';
import { handleFileOps } from './handlers/file-ops';
import { handlePlaylists } from './handlers/playlists';
import { handleSorting } from './handlers/sorting';
import { handleWindowControls } from './handlers/window';
import { handleDragDrop } from './handlers/drag-drop';
import { handleFFmpeg } from './handlers/ffmpeg';
import { handleTags } from './handlers/tags';
import { handleSearch } from './handlers/search';
import { handleMetadata } from './handlers/metadata';
import { startLocalServer } from './lib/local-server';
import { store } from './lib/store';
import { initDB, getDB } from './lib/db';
import { BackgroundVerificationService } from './core/services/background-verification-service';
import { VideoService } from './core/services/video-service';
import { MetadataHarvester } from './core/services/metadata-harvester';
import { VideoLibraryService } from './core/services/video-library-service';

const settings = store.store;

if (!settings.enableHardwareDecoding) {
  app.commandLine.appendSwitch('disable-accelerated-video-decode');
  app.commandLine.appendSwitch('disable-accelerated-video-encode');
}

let mainWindow: BrowserWindow | null;
const backgroundVerifier = new BackgroundVerificationService();
const libraryService = new VideoLibraryService();

const createWindow = () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    backgroundColor: '#030712',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindowState.manage(mainWindow);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist/index.html');
    console.log('Loading index from:', indexPath);
    mainWindow.loadFile(indexPath).catch((e) => {
      console.error('Failed to load index.html:', e);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('focus', () => {
    backgroundVerifier.runVerification();
  });
};

app.whenReady().then(async () => {
  console.log('[Main] App Ready. Initializing DB...');

  // ▼▼▼ 追加: 起動時に必ずモバイル接続をOFF(ローカルホストのみ)にする ▼▼▼
  store.set('enableMobileConnection', false);

  try {
    initDB();
    const db = getDB();
    const tableCount = db
      .prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'")
      .get() as { count: number };
    console.log(`[Main] DB Initialized. Table count: ${tableCount.count}`);
  } catch (e) {
    console.error('[Main] CRITICAL: Database initialization failed:', e);
    app.quit();
    return;
  }

  try {
    // ▼▼▼ 修正: 引数なし(デフォルト: 127.0.0.1)で起動 ▼▼▼
    await startLocalServer();
  } catch (e) {
    console.error('Failed to start local video server:', e);
  }

  backgroundVerifier.start();
  MetadataHarvester.getInstance();

  // ▼▼▼ 変更: GCを起動直後ではなく、1分後に遅延実行する ▼▼▼
  setTimeout(() => {
    console.log('[Main] Running delayed Garbage Collection...');
    try {
      const videoService = new VideoService();
      videoService.runGarbageCollection();
    } catch (e) {
      console.error('Failed to run garbage collection:', e);
    }
  }, 1000 * 60);

  // 起動時の静的スキャン（遅延実行）
  // ▼▼▼ 変更: GCとタイミングを分散させるため 5秒 -> 10秒に変更 ▼▼▼
  setTimeout(async () => {
    const folders = store.get('libraryFolders') as string[];
    if (folders && folders.length > 0) {
      console.log(`[Main] Starting background quiet scan for ${folders.length} folders...`);
      for (const folder of folders) {
        await libraryService.scanQuietly(folder);
      }
      console.log('[Main] Background quiet scan completed.');
    }
  }, 10000);

  ipcMain.handle('get-videos', async (_event, folderPath: string) => {
    return await getVideos(folderPath);
  });
  handleSettings();
  handleDialog();
  handleFavorites();
  handleDirectories();
  handleFileOps();
  handlePlaylists();
  handleSorting();
  handleWindowControls();
  handleDragDrop();
  handleFFmpeg();
  handleTags();
  handleSearch();
  handleMetadata();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  backgroundVerifier.stop();
  MetadataHarvester.getInstance().stop();
  if (process.platform !== 'darwin') app.quit();
});

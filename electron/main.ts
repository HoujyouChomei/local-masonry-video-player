// electron/main.ts

/* eslint-disable @typescript-eslint/no-require-imports */
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

if (!process.env.NODE_ENV && app.isPackaged) {
  const portableUserDataPath = path.join(path.dirname(app.getPath('exe')), 'userData');
  app.setPath('userData', portableUserDataPath);
}

import { initializeLogger, logger } from './lib/logger';
const { store } = require('./lib/store');

import type { BackgroundVerificationService } from './core/services/system/background-verification-service';

if (app.isPackaged) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

initializeLogger();

const settings = store.store;
if (!settings.enableHardwareDecoding) {
  app.commandLine.appendSwitch('disable-accelerated-video-decode');
  app.commandLine.appendSwitch('disable-accelerated-video-encode');
}

let mainWindow: BrowserWindow | null = null;
let backgroundVerifier: BackgroundVerificationService | null = null;
let isBackendReady = false;

const { handleWindowControls, registerWindowEvents } = require('./handlers/system/window');

const createWindow = () => {
  const windowStateKeeper = require('electron-window-state');

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
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  mainWindowState.manage(mainWindow);
  registerWindowEvents(mainWindow);

  const isDev =
    process.env.NODE_ENV === 'development' || (!app.isPackaged && process.env.NODE_ENV !== 'test');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist/index.html');
    logger.debug('[Main] Loading index from:', indexPath);
    mainWindow.loadFile(indexPath).catch((e) => {
      logger.error('[Main] Failed to load index.html:', e);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('focus', () => {
    if (backgroundVerifier) {
      backgroundVerifier.runVerification();
    }
  });
};

app.whenReady().then(async () => {
  logger.info('[Main] App Ready. Starting initialization...');

  createWindow();

  ipcMain.on('check-backend-ready', (event) => {
    if (isBackendReady) {
      event.sender.send('app-ready');
    }
  });

  try {
    const { initDB, getDB } = require('./lib/db');
    initDB();
    const db = getDB();
    const tableCount = db
      .prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'")
      .get() as { count: number };
    logger.debug(`[Main] DB Initialized. Table count: ${tableCount.count}`);
  } catch (e) {
    logger.error('[Main] CRITICAL: Database initialization failed:', e);
    app.quit();
    return;
  }

  store.set('enableMobileConnection', false);

  // Lazy load handlers
  require('./handlers/system/settings').handleSettings();
  require('./handlers/system/dialog').handleDialog();
  require('./handlers/collection/favorite-handler').handleFavorites();
  require('./handlers/system/io-handler').handleDirectories();
  require('./handlers/media/ops-handler').handleFileOps();
  require('./handlers/collection/playlist-handler').handlePlaylists();
  require('./handlers/media/sorting').handleSorting();
  handleWindowControls();
  require('./handlers/system/drag-drop').handleDragDrop();
  require('./handlers/media/transcode-handler').handleFFmpeg();
  require('./handlers/collection/tag-handler').handleTags();
  require('./handlers/media/search').handleSearch();
  require('./handlers/media/metadata-handler').handleMetadata();
  require('./handlers/media/getVideos').handleGetVideos();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const { SettingsService } = require('./core/services/system/settings-service');
  SettingsService.getInstance();

  const { startLocalServer } = require('./lib/local-server');
  const { eventBus } = require('./core/events');

  eventBus.on('settings:mobile-connection-changed', (data: { host: string }) => {
    setTimeout(() => {
      startLocalServer(data.host).catch((e: unknown) => {
        logger.error('[Main] Failed to restart server via settings change:', e);
      });
    }, 100);
  });

  const { ThumbnailService } = require('./core/services/media/thumbnail-service');
  ThumbnailService.getInstance();

  const { NotificationService } = require('./core/services/system/notification-service');
  NotificationService.getInstance();

  try {
    await startLocalServer();
  } catch (e) {
    logger.error('[Main] Failed to start local video server:', e);
  }

  const {
    BackgroundVerificationService: BVS,
  } = require('./core/services/system/background-verification-service');
  backgroundVerifier = new BVS();
  backgroundVerifier?.start();

  const { MetadataHarvester: MH } = require('./core/services/video/metadata-harvester');
  MH.getInstance();

  // 3. 全ての準備完了を通知 (Notify Renderer)
  isBackendReady = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    logger.info('[Main] Initialization complete. Sending app-ready signal...');
    mainWindow.webContents.send('app-ready');
  }

  setTimeout(() => {
    logger.debug('[Main] Running delayed Garbage Collection...');
    try {
      const { VideoService } = require('./core/services/media/media-service');
      const videoService = new VideoService();
      videoService.runGarbageCollection();
    } catch (e) {
      logger.error('[Main] Failed to run garbage collection:', e);
    }
  }, 1000 * 60);

  setTimeout(async () => {
    const folders = store.get('libraryFolders') as string[];
    if (folders && folders.length > 0) {
      const { VideoLibraryService } = require('./core/services/media/library-service');
      const libraryService = new VideoLibraryService();

      logger.debug(`[Main] Starting background quiet scan for ${folders.length} folders...`);
      for (const folder of folders) {
        await libraryService.scanQuietly(folder);
      }
      logger.debug('[Main] Background quiet scan completed.');
    }
  }, 10000);
});

app.on('window-all-closed', () => {
  if (backgroundVerifier) {
    backgroundVerifier.stop();
  }

  try {
    const { MetadataHarvester: MH } = require('./core/services/video/metadata-harvester');
    MH.getInstance().stop();
  } catch {
    // ignore
  }

  try {
    const { NotificationService } = require('./core/services/system/notification-service');
    NotificationService.getInstance().stop();
  } catch {
    // ignore
  }

  if (process.platform !== 'darwin') app.quit();
});

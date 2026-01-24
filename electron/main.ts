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

  const { createCustomIPCHandler } = require('./trpc/adapter');
  createCustomIPCHandler();
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const { SettingsService } = require('./core/services/system/settings-service');
  SettingsService.getInstance();

  const { startLocalServer } = require('./lib/local-server');
  const { eventBus } = require('./core/events');
  const { LibraryService } = require('./core/services/media/library-service');
  const libraryService = new LibraryService();

  eventBus.on('settings:mobile-connection-changed', (data: { host: string }) => {
    setTimeout(() => {
      startLocalServer(data.host).catch((e: unknown) => {
        logger.error('[Main] Failed to restart server via settings change:', e);
      });
    }, 100);
  });

  eventBus.on('settings:library-folders-added', (data: { folders: string[] }) => {
    logger.info('[Main] Received library-folders-added event. Triggering quiet scan...');
    Promise.all(data.folders.map((folder) => libraryService.scanQuietly(folder)))
      .then(() => logger.info('[Main] Quiet scan for new folders completed.'))
      .catch((err) => logger.error('[Main] Quiet scan failed:', err));
  });

  const { ThumbnailService } = require('./core/services/media/thumbnail-service');
  ThumbnailService.getInstance();

  const { NotificationService } = require('./core/services/system/notification-service');
  NotificationService.getInstance();

  try {
    await startLocalServer();
  } catch (e) {
    logger.error('[Main] Failed to start local media server:', e);
  }

  const {
    BackgroundVerificationService: BVS,
  } = require('./core/services/system/background-verification-service');
  backgroundVerifier = new BVS();
  backgroundVerifier?.start();

  const { MetadataHarvester: MH } = require('./core/services/video/metadata-harvester');
  MH.getInstance();

  isBackendReady = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    logger.info('[Main] Initialization complete. Sending app-ready signal...');
    mainWindow.webContents.send('app-ready');
  }

  setTimeout(() => {
    logger.debug('[Main] Running delayed Garbage Collection...');
    try {
      const { MediaService } = require('./core/services/media/media-service');
      const mediaService = new MediaService();
      mediaService.runGarbageCollection();
    } catch (e) {
      logger.error('[Main] Failed to run garbage collection:', e);
    }
  }, 1000 * 60);

  setTimeout(async () => {
    const folders = store.get('libraryFolders') as string[];
    if (folders && folders.length > 0) {
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

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

import type { BackgroundVerificationService } from './core/services/background-verification-service';

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

const { handleWindowControls, registerWindowEvents } = require('./handlers/window');

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

  require('./handlers/settings').handleSettings();
  require('./handlers/dialog').handleDialog();
  require('./handlers/favorites').handleFavorites();
  require('./handlers/directories').handleDirectories();
  require('./handlers/file-ops').handleFileOps();
  require('./handlers/playlists').handlePlaylists();
  require('./handlers/sorting').handleSorting();
  handleWindowControls();
  require('./handlers/drag-drop').handleDragDrop();
  require('./handlers/ffmpeg').handleFFmpeg();
  require('./handlers/tags').handleTags();
  require('./handlers/search').handleSearch();
  require('./handlers/metadata').handleMetadata();

  ipcMain.handle('get-videos', async (_event, folderPath: string) => {
    const { getVideos } = require('./handlers/getVideos');
    return await getVideos(folderPath);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  try {
    const { startLocalServer } = require('./lib/local-server');
    await startLocalServer();
  } catch (e) {
    logger.error('[Main] Failed to start local video server:', e);
  }

  const {
    BackgroundVerificationService: BVS,
  } = require('./core/services/background-verification-service');
  backgroundVerifier = new BVS();
  backgroundVerifier?.start();

  const { MetadataHarvester: MH } = require('./core/services/metadata-harvester');
  MH.getInstance();

  setTimeout(() => {
    logger.debug('[Main] Running delayed Garbage Collection...');
    try {
      const { VideoService } = require('./core/services/video-service');
      const videoService = new VideoService();
      videoService.runGarbageCollection();
    } catch (e) {
      logger.error('[Main] Failed to run garbage collection:', e);
    }
  }, 1000 * 60);

  setTimeout(async () => {
    const folders = store.get('libraryFolders') as string[];
    if (folders && folders.length > 0) {
      const { VideoLibraryService } = require('./core/services/video-library-service');
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
    const { MetadataHarvester: MH } = require('./core/services/metadata-harvester');
    MH.getInstance().stop();
  } catch {
    // ignore
  }

  if (process.platform !== 'darwin') app.quit();
});

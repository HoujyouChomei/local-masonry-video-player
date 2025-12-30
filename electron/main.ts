// electron/main.ts

import { app, BrowserWindow, ipcMain } from 'electron';
// ▼▼▼ 追加: 本番環境(パッケージ化済み)ならログ出力を無効化 ▼▼▼
if (app.isPackaged) {
  // ログ関数を空の関数で上書き
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // console.warn = () => {}; // 必要ならコメントアウト解除
  // console.error は残しておくことを推奨（クラッシュログ等のため）
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
import { handleMetadata } from './handlers/metadata'; // ▼▼▼ 追加 ▼▼▼
import { startLocalServer } from './lib/local-server';
import { store } from './lib/store';
import { initDB } from './lib/db';
import { BackgroundVerificationService } from './core/services/background-verification-service';
import { VideoService } from './core/services/video-service';
import { MetadataHarvester } from './core/services/metadata-harvester'; // ▼▼▼ 追加 ▼▼▼

const settings = store.store;

if (!settings.enableHardwareDecoding) {
  app.commandLine.appendSwitch('disable-accelerated-video-decode');
  app.commandLine.appendSwitch('disable-accelerated-video-encode');
}

let mainWindow: BrowserWindow | null;
const backgroundVerifier = new BackgroundVerificationService();

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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindowState.manage(mainWindow);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const indexPath = path.join(app.getAppPath(), 'out/index.html');
    console.log('Loading index from:', indexPath);
    mainWindow.loadFile(indexPath).catch((e) => {
      console.error('Failed to load index.html:', e);
    });
  }

  mainWindow.on('focus', () => {
    backgroundVerifier.runVerification();
  });
};

app.whenReady().then(async () => {
  try {
    initDB();
  } catch (e) {
    console.error('Database initialization failed:', e);
  }

  try {
    await startLocalServer();
  } catch (e) {
    console.error('Failed to start local video server:', e);
  }

  backgroundVerifier.start();
  MetadataHarvester.getInstance(); // ▼▼▼ 追加: サービス開始 ▼▼▼

  try {
    const videoService = new VideoService();
    videoService.runGarbageCollection();
  } catch (e) {
    console.error('Failed to run garbage collection:', e);
  }

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
  handleMetadata(); // ▼▼▼ 追加 ▼▼▼

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  backgroundVerifier.stop();
  MetadataHarvester.getInstance().stop(); // ▼▼▼ 追加 ▼▼▼
  if (process.platform !== 'darwin') app.quit();
});

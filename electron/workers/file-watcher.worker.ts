// electron/workers/file-watcher.worker.ts

import { parentPort } from 'worker_threads';
import chokidar, { FSWatcher } from 'chokidar';
import { isVideoFile } from '../lib/extensions'; // Import (注意: workerからは相対パス解決が必要)

// メッセージ型定義の更新
type WorkerCommand =
  | { type: 'START_WATCH'; folderPath: string; enableExtendedExtensions: boolean }
  | { type: 'STOP_WATCH' };

let watcher: FSWatcher | null = null;
let enableExtended = false; // State to hold extension mode

if (!parentPort) {
  throw new Error('Must be run as a worker thread');
}

parentPort.on('message', async (command: WorkerCommand) => {
  switch (command.type) {
    case 'START_WATCH':
      enableExtended = command.enableExtendedExtensions;
      await startWatch(command.folderPath);
      break;
    case 'STOP_WATCH':
      await stopWatch();
      break;
  }
});

async function startWatch(folderPath: string) {
  await stopWatch();

  console.log(`[Worker] Starting watch on: ${folderPath} (Extended: ${enableExtended})`);

  watcher = chokidar.watch(folderPath, {
    persistent: true,
    ignoreInitial: true,
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
    // eslint-disable-next-line no-useless-escape
    ignored: [/(^|[\/\\])\../, '**/node_modules/**', '**/*.tmp'],
  });

  watcher
    .on('add', (path: string) => {
      if (isVideoFile(path, enableExtended)) {
        parentPort?.postMessage({ type: 'file-added', path });
      }
    })
    .on('unlink', (path: string) => {
      // 削除時は拡張子判定を緩める（既にDBにあるかもしれないため）
      // ただし、余計なファイルイベントを拾わないように最低限のチェックは必要
      if (isVideoFile(path, true)) {
        parentPort?.postMessage({ type: 'file-deleted', path });
      }
    })
    .on('change', (path: string) => {
      if (isVideoFile(path, enableExtended)) {
        parentPort?.postMessage({ type: 'file-changed', path });
      }
    })
    .on('error', (error: unknown) => {
      console.error('[Worker] Chokidar Error:', error);
    });
}

async function stopWatch() {
  if (watcher) {
    console.log('[Worker] Stopping watcher');
    await watcher.close();
    watcher = null;
  }
}

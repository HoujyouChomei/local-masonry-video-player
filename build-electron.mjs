import * as esbuild from 'esbuild';
import fs from 'fs';

const isDev = process.argv.includes('--dev');

if (fs.existsSync('dist-electron')) {
  fs.rmSync('dist-electron', { recursive: true, force: true });
}

const buildOptions = {
  entryPoints: [
    { in: 'electron/main.ts', out: 'main' },
    { in: 'electron/preload.ts', out: 'preload' },
    { in: 'electron/workers/file-watcher.worker.ts', out: 'worker' },
  ],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir: 'dist-electron',
  external: [
    'electron',
    'better-sqlite3',
    'electron-store',
    'fsevents',
  ],
  sourcemap: isDev,
  minify: !isDev,
};

if (isDev) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[Esbuild] Watching electron changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('[Esbuild] Build complete.');
}
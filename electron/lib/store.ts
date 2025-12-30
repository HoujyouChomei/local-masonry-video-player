// electron/lib/store.ts

import Store from 'electron-store';
import { AppSettings } from '../../src/shared/types/electron';

export const store = new Store<AppSettings>({
  defaults: {
    folderPath: '',
    columnCount: 4,
    sortOption: 'date-desc',
    libraryFolders: [],
    isSidebarOpen: true,

    rootMargin: 500, // Modified: 1000 -> 500 (Balanced)
    debounceTime: 100, // Modified: 800 -> 100
    chunkSize: 100,

    autoPlayNext: false,
    enableHardwareDecoding: true, // Modified: false -> true
    expandedPaths: [],
    playOnHoverOnly: false,

    volume: 1.0,
    isMuted: false,

    layoutMode: 'masonry',

    gridStyle: 'modern',

    // ▼▼▼ Phase 15 Defaults ▼▼▼
    ffmpegPath: '',
    ffprobePath: '',

    // ▼▼▼ Phase 20 Experimental ▼▼▼
    enableExperimentalNormalize: false,

    // ▼▼▼ 追加: 初期値 (ON, 1024MB) ▼▼▼
    enableLargeVideoRestriction: true,
    largeVideoThreshold: 1024,
  },
});

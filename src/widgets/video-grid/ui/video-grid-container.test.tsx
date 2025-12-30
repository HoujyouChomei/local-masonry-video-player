// src/widgets/video-grid/ui/video-grid-container.test.tsx

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoGridContainer } from './video-grid-container';
import { VideoFile } from '@/shared/types/video';

// --- Mocks Setup ---

// 1. Mock Child Component (VideoGridLayout)
vi.mock('./video-grid-layout', () => ({
  VideoGridLayout: vi.fn(({ videos, onFetchMore, onVideoClick, onReorder, onRenameOpen }) => (
    <div data-testid="layout-mock">
      <div data-testid="video-count">{videos.length}</div>
      <button data-testid="fetch-more-btn" onClick={onFetchMore}>
        Fetch More
      </button>
      {videos.map((v: VideoFile) => (
        <div
          key={v.id}
          data-testid="video-item"
          // ▼▼▼ 修正: イベントオブジェクト e を受け取り、第2引数として渡す ▼▼▼
          onClick={(e) => onVideoClick(v, e)}
        >
          {v.name}
          <button data-testid={`rename-${v.id}`} onClick={() => onRenameOpen(v)}>
            Rename
          </button>
        </div>
      ))}
      <button data-testid="reorder-btn" onClick={() => onReorder(videos)}>
        Reorder
      </button>
    </div>
  )),
}));

// 2. Mock Global Stores
const mockOpenVideo = vi.fn();
const mockReorderPlaylist = vi.fn();
const mockSaveFolderOrder = vi.fn();

// ▼▼▼ 修正: パスを新しい場所に更新 (entities -> shared) ▼▼▼
vi.mock('@/shared/stores/settings-store', () => ({
  useSettingsStore: (selector: (state: unknown) => unknown) =>
    selector({
      sortOption: 'date-desc',
      layoutMode: 'masonry',
      chunkSize: 10, // テスト用に小さく設定
      gridStyle: 'modern',
      folderPath: '/test/videos', // folderPathを追加
    }),
}));

vi.mock('@/shared/stores/ui-store', () => ({
  useUIStore: (selector: (state: unknown) => unknown) =>
    selector({
      showFavoritesOnly: false,
      selectedPlaylistId: null,
      viewMode: 'folder',
      // Selection Mode Mock
      isSelectionMode: false,
      selectedVideoIds: [],
      enterSelectionMode: vi.fn(),
      exitSelectionMode: vi.fn(),
      toggleSelection: vi.fn(),
      selectRange: vi.fn(),
    }),
}));

vi.mock('@/features/video-player/model/store', () => ({
  useVideoPlayerStore: (selector: (state: unknown) => unknown) =>
    selector({
      openVideo: mockOpenVideo,
      isOpen: false,
    }),
}));

vi.mock('@/features/search-videos/model/store', () => ({
  useSearchStore: (selector: (state: unknown) => unknown) =>
    selector({
      query: '',
      searchScope: 'folder', // 追加
      debouncedQuery: '', // 追加
    }),
}));

// ▼▼▼ 追加: useSelectionStore Mock ▼▼▼
vi.mock('@/shared/stores/selection-store', () => ({
  useSelectionStore: (selector: (state: unknown) => unknown) =>
    selector({
      isSelectionMode: false,
      selectedVideoIds: [],
      enterSelectionMode: vi.fn(),
      exitSelectionMode: vi.fn(),
      toggleSelection: vi.fn(),
      selectRange: vi.fn(),
    }),
}));

// 3. Mock Custom Hooks
vi.mock('../lib/use-filtered-videos', () => ({
  useFilteredVideos: ({ videos }: { videos: VideoFile[] }) => videos || [],
}));

vi.mock('../model/use-video-source', () => ({
  useVideoSource: () => ({
    data: Array.from({ length: 50 }, (_, i) => ({
      id: `v-${i}`,
      name: `Video ${i}`,
      path: `/path/v-${i}.mp4`,
    })),
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/toggle-favorite/model/use-favorite', () => ({
  useFavorites: () => ({ favorites: [] }),
}));

vi.mock('../model/use-video-updates', () => ({
  useVideoUpdates: vi.fn(),
}));

// ▼▼▼ 追加: useExternalDrop Mock ▼▼▼
// 外部ドロップロジック（useBatchMoveを含む）をモック化して依存を切り離す
vi.mock('../model/use-external-drop', () => ({
  useExternalDrop: () => ({
    isDraggingOver: false,
    dropHandlers: {},
  }),
}));

// 4. Mock API Mutations
vi.mock('@/entities/playlist/model/use-playlists', () => ({
  useReorderPlaylist: () => ({ mutate: mockReorderPlaylist }),
}));

vi.mock('@/features/sort-videos/model/use-folder-order', () => ({
  useSaveFolderOrder: () => ({ mutate: mockSaveFolderOrder }),
}));

// ▼▼▼ 修正: useMutation を追加 ▼▼▼
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
  useQueryClient: () => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/shared/api/electron', () => ({
  fetchFolderOrderApi: vi.fn(),
}));

describe('VideoGridContainer Integration', () => {
  const defaultProps = {
    folderPath: '/test/videos',
    columnCount: 4,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // タイマーモック有効化

    // window.scrollTo mock
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.useRealTimers(); // タイマーモック解除
  });

  it('renders correctly with initial data', () => {
    render(<VideoGridContainer {...defaultProps} />);

    // 初期表示は chunkSize (10) に制限されているはず
    // toHaveTextContent の代わりに textContent を直接比較
    expect(screen.getByTestId('video-count').textContent).toBe('10');
  });

  it('handles infinite scroll (fetch more)', () => {
    render(<VideoGridContainer {...defaultProps} />);

    // Fetch More ボタンをクリック
    const btn = screen.getByTestId('fetch-more-btn');
    fireEvent.click(btn);

    // setTimeout (300ms) を待機
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // 表示数が chunkSize 分増えているはず (10 -> 20)
    expect(screen.getByTestId('video-count').textContent).toBe('20');
  });

  it('handles video click to open player', () => {
    render(<VideoGridContainer {...defaultProps} />);

    const items = screen.getAllByTestId('video-item');
    fireEvent.click(items[0]); // 最初のビデオをクリック

    expect(mockOpenVideo).toHaveBeenCalledTimes(1);
    expect(mockOpenVideo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'v-0' }),
      expect.any(Array)
    );
  });

  it('handles reorder logic (Folder Mode)', () => {
    render(<VideoGridContainer {...defaultProps} />);

    const btn = screen.getByTestId('reorder-btn');
    fireEvent.click(btn);

    // PlaylistModeでないため、FolderOrder保存が呼ばれるはず
    expect(mockSaveFolderOrder).toHaveBeenCalled();
    expect(mockReorderPlaylist).not.toHaveBeenCalled();
  });
});

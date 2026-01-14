// src/widgets/video-grid/ui/video-grid-container.test.tsx

import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoGridContainer } from './video-grid-container';
import { VideoFile } from '@/shared/types/video';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const {
  mockOpenVideo,
  mockReorderPlaylist,
  mockSaveFolderOrder,
  mockEnterSelectionMode,
  mockExitSelectionMode,
  mockToggleSelection,
  mockSelectRange,
} = vi.hoisted(() => ({
  mockOpenVideo: vi.fn(),
  mockReorderPlaylist: vi.fn(),
  mockSaveFolderOrder: vi.fn(),
  mockEnterSelectionMode: vi.fn(),
  mockExitSelectionMode: vi.fn(),
  mockToggleSelection: vi.fn(),
  mockSelectRange: vi.fn(),
}));

vi.mock('./video-grid-layout', () => ({
  VideoGridLayout: vi.fn(({ videos, onFetchMore, onReorder, interactions }) => (
    <div data-testid="layout-mock">
      <div data-testid="video-count">{videos.length}</div>
      <button data-testid="fetch-more-btn" onClick={onFetchMore}>
        Fetch More
      </button>
      {videos.map((v: VideoFile) => (
        <div key={v.id} data-testid="video-item" onClick={(e) => interactions.onVideoClick(v, e)}>
          {v.name}
          <button data-testid={`rename-${v.id}`} onClick={() => interactions.onRenameOpen(v)}>
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

vi.mock('@/shared/stores/settings-store', () => ({
  useSettingsStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      sortOption: 'date-desc',
      layoutMode: 'masonry',
      chunkSize: 10,
      gridStyle: 'modern',
      folderPath: '/test/videos',
      mobileColumnCount: 1,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/shared/stores/ui-store', () => ({
  useUIStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      showFavoritesOnly: false,
      selectedPlaylistId: null,
      viewMode: 'folder',
      isSelectionMode: false,
      selectedVideoIds: [],
      enterSelectionMode: mockEnterSelectionMode,
      exitSelectionMode: mockExitSelectionMode,
      toggleSelection: mockToggleSelection,
      selectRange: mockSelectRange,
      selectedTagIds: [],
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/features/video-player/model/store', () => ({
  useVideoPlayerStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      openVideo: mockOpenVideo,
      isOpen: false,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/features/search-videos/model/store', () => ({
  useSearchStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      query: '',
      searchScope: 'folder',
      debouncedQuery: '',
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/shared/stores/selection-store', () => ({
  useSelectionStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      isSelectionMode: false,
      selectedVideoIds: [],
      enterSelectionMode: mockEnterSelectionMode,
      exitSelectionMode: mockExitSelectionMode,
      toggleSelection: mockToggleSelection,
      selectRange: mockSelectRange,
    };
    return selector ? selector(state) : state;
  },
}));

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

vi.mock('../model/use-external-drop', () => ({
  useExternalDrop: () => ({
    isDraggingOver: false,
    dropHandlers: {},
  }),
}));

vi.mock('@/shared/lib/use-is-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/entities/playlist/model/use-playlists', () => ({
  useReorderPlaylist: () => ({ mutate: mockReorderPlaylist }),
}));

vi.mock('@/features/sort-videos/model/use-folder-order', () => ({
  useSaveFolderOrder: () => ({ mutate: mockSaveFolderOrder }),
}));

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
    vi.useFakeTimers();
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with initial data', () => {
    render(<VideoGridContainer {...defaultProps} />);
    expect(screen.getByTestId('video-count').textContent).toBe('10');
  });

  it('handles infinite scroll (fetch more)', () => {
    render(<VideoGridContainer {...defaultProps} />);
    const btn = screen.getByTestId('fetch-more-btn');
    fireEvent.click(btn);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId('video-count').textContent).toBe('20');
  });

  it('handles video click to open player', () => {
    render(<VideoGridContainer {...defaultProps} />);
    const items = screen.getAllByTestId('video-item');
    fireEvent.click(items[0]);
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
    expect(mockSaveFolderOrder).toHaveBeenCalled();
    expect(mockReorderPlaylist).not.toHaveBeenCalled();
  });
});

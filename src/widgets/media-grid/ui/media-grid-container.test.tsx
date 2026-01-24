// src/widgets/media-grid/ui/media-grid-container.test.tsx

import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediaGridContainer } from './media-grid-container';
import { Media } from '@/shared/schemas/media';

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
  mockOpenMedia,
  mockReorderPlaylist,
  mockSaveFolderOrder,
  mockEnterSelectionMode,
  mockExitSelectionMode,
  mockToggleSelection,
  mockSelectRange,
} = vi.hoisted(() => ({
  mockOpenMedia: vi.fn(),
  mockReorderPlaylist: vi.fn(),
  mockSaveFolderOrder: vi.fn(),
  mockEnterSelectionMode: vi.fn(),
  mockExitSelectionMode: vi.fn(),
  mockToggleSelection: vi.fn(),
  mockSelectRange: vi.fn(),
}));

vi.mock('./media-grid-layout', () => ({
  MediaGridLayout: vi.fn(({ mediaItems, onFetchMore, onReorder, interactions }) => (
    <div data-testid="layout-mock">
      <div data-testid="video-count">{mediaItems.length}</div>
      <button data-testid="fetch-more-btn" onClick={onFetchMore}>
        Fetch More
      </button>
      {mediaItems.map((v: Media) => (
        <div key={v.id} data-testid="video-item" onClick={(e) => interactions.onMediaClick(v, e)}>
          {v.name}
          <button data-testid={`rename-${v.id}`} onClick={() => interactions.onRenameOpen(v)}>
            Rename
          </button>
        </div>
      ))}
      <button data-testid="reorder-btn" onClick={() => onReorder(mediaItems)}>
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
      gridStyle: 'standard',
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
      selectedMediaIds: [],
      enterSelectionMode: mockEnterSelectionMode,
      exitSelectionMode: mockExitSelectionMode,
      toggleSelection: mockToggleSelection,
      selectRange: mockSelectRange,
      selectedTagIds: [],
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/entities/player/model/store', () => ({
  useMediaPlayerStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      openMedia: mockOpenMedia,
      isOpen: false,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/features/search-media/model/store', () => ({
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
      selectedMediaIds: [],
      enterSelectionMode: mockEnterSelectionMode,
      exitSelectionMode: mockExitSelectionMode,
      toggleSelection: mockToggleSelection,
      selectRange: mockSelectRange,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../lib/use-filtered-media', () => ({
  useFilteredMedia: ({ mediaItems }: { mediaItems: Media[] }) => mediaItems || [],
}));

vi.mock('../model/use-media-source', () => ({
  useMediaSource: () => ({
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

vi.mock('../model/use-media-updates', () => ({
  useMediaUpdates: vi.fn(),
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

vi.mock('@/features/sort-media/model/use-folder-order', () => ({
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

describe('MediaGridContainer Integration', () => {
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
    render(<MediaGridContainer {...defaultProps} />);
    expect(screen.getByTestId('video-count').textContent).toBe('10');
  });

  it('handles infinite scroll (fetch more)', () => {
    render(<MediaGridContainer {...defaultProps} />);
    const btn = screen.getByTestId('fetch-more-btn');
    fireEvent.click(btn);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId('video-count').textContent).toBe('20');
  });

  it('handles video click to open player', () => {
    render(<MediaGridContainer {...defaultProps} />);
    const items = screen.getAllByTestId('video-item');
    fireEvent.click(items[0]);
    expect(mockOpenMedia).toHaveBeenCalledTimes(1);
    expect(mockOpenMedia).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'v-0' }),
      expect.any(Array)
    );
  });

  it('handles reorder logic (Folder Mode)', () => {
    render(<MediaGridContainer {...defaultProps} />);
    const btn = screen.getByTestId('reorder-btn');
    fireEvent.click(btn);
    expect(mockSaveFolderOrder).toHaveBeenCalled();
    expect(mockReorderPlaylist).not.toHaveBeenCalled();
  });
});

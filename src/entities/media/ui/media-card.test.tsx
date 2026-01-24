// src/entities/media/ui/media-card.test.tsx

import { ReactNode } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediaCard } from './media-card';
import { Media } from '@/shared/schemas/media';
import { useMediaDrag } from '@/features/drag-and-drop/model/use-media-drag';

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

const mocks = vi.hoisted(() => ({
  setDraggedFilePath: vi.fn(),
  setDraggedMediaId: vi.fn(),
  startDrag: vi.fn(),
  selectionState: {
    selectedMediaIds: [] as string[],
    isSelectionMode: false,
    enterSelectionMode: vi.fn(),
    exitSelectionMode: vi.fn(),
    toggleSelection: vi.fn(),
    selectRange: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
    lastSelectedMediaId: null as string | null,
    reset: vi.fn(),
  },
  settingsState: {
    rootMargin: 500,
    playOnHoverOnly: false,
    gridStyle: 'standard' as const,
    debounceTime: 800,
    enableLargeVideoRestriction: true,
    largeVideoThreshold: 1024,
  },
  uiState: {
    scrollDirection: 'none' as const,
  },
  dragStoreState: {
    setDraggedFilePath: vi.fn(),
    setDraggedMediaId: vi.fn(),
    draggedFilePath: null as string | string[] | null,
    draggedMediaId: null as string | string[] | null,
    clearDrag: vi.fn(),
  },
}));

mocks.dragStoreState.setDraggedFilePath = mocks.setDraggedFilePath;
mocks.dragStoreState.setDraggedMediaId = mocks.setDraggedMediaId;

Object.defineProperty(window, 'electron', {
  value: {
    startDrag: mocks.startDrag,
  },
  writable: true,
});

type StoreSelector<T, U> = (state: T) => U;

vi.mock('@/shared/stores/drag-store', () => {
  const useDragStore = <U,>(selector?: StoreSelector<typeof mocks.dragStoreState, U>) =>
    selector ? selector(mocks.dragStoreState) : mocks.dragStoreState;
  useDragStore.getState = () => mocks.dragStoreState;
  return { useDragStore };
});

vi.mock('@/shared/stores/selection-store', () => {
  const useSelectionStore = <U,>(selector?: StoreSelector<typeof mocks.selectionState, U>) =>
    selector ? selector(mocks.selectionState) : mocks.selectionState;
  useSelectionStore.getState = () => mocks.selectionState;
  return { useSelectionStore };
});

vi.mock('@/shared/stores/settings-store', () => {
  const useSettingsStore = <U,>(selector?: StoreSelector<typeof mocks.settingsState, U>) =>
    selector ? selector(mocks.settingsState) : mocks.settingsState;
  useSettingsStore.getState = () => mocks.settingsState;
  return { useSettingsStore };
});

vi.mock('@/shared/stores/ui-store', () => {
  const useUIStore = <U,>(selector?: StoreSelector<typeof mocks.uiState, U>) =>
    selector ? selector(mocks.uiState) : mocks.uiState;
  useUIStore.getState = () => mocks.uiState;
  return { useUIStore };
});

const mockQueryCache = {
  findAll: vi.fn().mockReturnValue([]),
};

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    getQueryCache: () => mockQueryCache,
  }),
}));

vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}));

vi.mock('../model/use-media-preview', () => ({
  useMediaPreview: () => ({
    videoRef: { current: null },
    shouldLoadVideo: false,
    isPlaying: false,
    isVideoReady: false,
    duration: 120,
    srcUrl: 'file:///mock.mp4',
    handleLoadedMetadata: vi.fn(),
    handleSeeked: vi.fn(),
    handleLoadedData: vi.fn(),
    handleError: vi.fn(),
    handlePlay: vi.fn(),
    handlePause: vi.fn(),
    handleEnded: vi.fn(),
    handleTogglePlay: vi.fn(),
  }),
}));

vi.mock('./media-card-overlay', () => ({
  MediaCardOverlay: () => <div data-testid="overlay">Overlay</div>,
}));

vi.mock('@/components/ui/context-menu', () => ({
  ContextMenu: ({
    children,
    onOpenChange,
  }: {
    children: ReactNode;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div
      data-testid="context-menu-wrapper"
      onContextMenu={() => onOpenChange && onOpenChange(true)}
    >
      {children}
    </div>
  ),
  ContextMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/shared/lib/use-is-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/shared/api', () => ({
  api: {
    system: {
      startDrag: mocks.startDrag,
    },
  },
}));

const mockMedia: Media = {
  id: 'v1',
  name: 'Test Video.mp4',
  path: '/path/to/v1.mp4',
  src: 'file:///path/to/v1.mp4',
  thumbnailSrc: 'http://localhost/thumb1.jpg',
  size: 1024,
  createdAt: 1000,
  updatedAt: 1000,
  width: 1920,
  height: 1080,
};

const TestMediaCardWrapper = (props: React.ComponentProps<typeof MediaCard>) => {
  const { handleDragStart, handleDragEnd } = useMediaDrag({
    mediaPath: props.media.path,
    mediaId: props.media.id,
  });

  return <MediaCard {...props} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />;
};

describe('MediaCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectionState.selectedMediaIds = [];
    mocks.selectionState.isSelectionMode = false;
    mockQueryCache.findAll.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  const getVideoThumbnail = (container: HTMLElement) => {
    const img = container.querySelector('img');
    if (!img) throw new Error('Video thumbnail not found');
    return img;
  };

  describe('1. Rendering & Basic Interaction', () => {
    it('renders video thumbnail and overlay', () => {
      const { container } = render(<MediaCard media={mockMedia} isModalOpen={false} />);

      const img = getVideoThumbnail(container);
      expect(img.getAttribute('src')).toBe(mockMedia.thumbnailSrc);
      expect(screen.getByTestId('overlay')).toBeDefined();
    });

    it('handles click event', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <MediaCard media={mockMedia} isModalOpen={false} onClick={handleClick} />
      );

      const img = getVideoThumbnail(container);
      fireEvent.click(img.parentElement!);
      expect(handleClick).toHaveBeenCalledWith(mockMedia, expect.anything());
    });
  });

  describe('2. Selection Mode', () => {
    it('shows selection visuals when in selection mode', () => {
      mocks.selectionState.isSelectionMode = true;
      mocks.selectionState.selectedMediaIds = ['v1'];

      const { container } = render(
        <MediaCard media={mockMedia} isModalOpen={false} isSelectionMode={true} isSelected={true} />
      );

      const img = getVideoThumbnail(container);
      const card = img.closest('.media-card');
      expect(card?.getAttribute('data-selected')).toBe('true');
    });
  });

  describe('3. Drag and Drop Logic (Critical)', () => {
    it('initiates single file drag when not in selection mode', () => {
      const { container } = render(<TestMediaCardWrapper media={mockMedia} isModalOpen={false} />);

      const img = getVideoThumbnail(container);
      const card = img.closest('div[draggable="true"]');
      if (!card) throw new Error('Draggable element not found');

      fireEvent.dragStart(card);

      expect(mocks.setDraggedFilePath).toHaveBeenCalledWith(mockMedia.path);
      expect(mocks.setDraggedMediaId).toHaveBeenCalledWith(mockMedia.id);
      expect(mocks.startDrag).toHaveBeenCalledWith(mockMedia.path);
    });

    it('initiates multi-file drag when selected and in selection mode', () => {
      mocks.selectionState.isSelectionMode = true;
      mocks.selectionState.selectedMediaIds = ['v1', 'v2', 'v3'];

      const mockCachedVideos = [
        { id: 'v1', path: '/path/to/v1.mp4' },
        { id: 'v2', path: '/path/to/v2.mp4' },
        { id: 'v3', path: '/path/to/v3.mp4' },
        { id: 'v_other', path: '/path/to/other.mp4' },
      ];

      mockQueryCache.findAll.mockReturnValue([{ state: { data: mockCachedVideos } }]);

      const { container } = render(
        <TestMediaCardWrapper
          media={mockMedia} // v1
          isModalOpen={false}
          isSelectionMode={true}
          isSelected={true}
        />
      );

      const img = getVideoThumbnail(container);
      const card = img.closest('div[draggable="true"]');
      fireEvent.dragStart(card!);

      const expectedPaths = ['/path/to/v1.mp4', '/path/to/v2.mp4', '/path/to/v3.mp4'];
      const expectedIds = ['v1', 'v2', 'v3'];

      expect(mocks.setDraggedFilePath).toHaveBeenCalledWith(expectedPaths);
      expect(mocks.setDraggedMediaId).toHaveBeenCalledWith(expectedIds);
      expect(mocks.startDrag).toHaveBeenCalledWith(expectedPaths);
    });

    it('initiates single drag if dragged item is NOT selected (even in selection mode)', () => {
      mocks.selectionState.isSelectionMode = true;
      mocks.selectionState.selectedMediaIds = ['v2', 'v3'];

      const { container } = render(
        <TestMediaCardWrapper
          media={mockMedia}
          isModalOpen={false}
          isSelectionMode={true}
          isSelected={false}
        />
      );

      const img = getVideoThumbnail(container);
      const card = img.closest('div[draggable="true"]');
      fireEvent.dragStart(card!);

      expect(mocks.startDrag).toHaveBeenCalledWith(mockMedia.path);
      expect(mocks.setDraggedMediaId).toHaveBeenCalledWith(mockMedia.id);
    });
  });
});

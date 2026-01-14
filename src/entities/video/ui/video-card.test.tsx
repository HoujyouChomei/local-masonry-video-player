// src/entities/video/ui/video-card.test.tsx

import { ReactNode } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoCard } from './video-card';
import { VideoFile } from '@/shared/types/video';
import { useVideoDrag } from '@/features/drag-and-drop/model/use-video-drag';

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
  setDraggedVideoId: vi.fn(),
  startDrag: vi.fn(),
  selectionState: {
    selectedVideoIds: [] as string[],
    isSelectionMode: false,
    enterSelectionMode: vi.fn(),
    exitSelectionMode: vi.fn(),
    toggleSelection: vi.fn(),
    selectRange: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
    lastSelectedVideoId: null as string | null,
    reset: vi.fn(),
  },
  settingsState: {
    rootMargin: 500,
    playOnHoverOnly: false,
    gridStyle: 'modern' as const,
    debounceTime: 800,
    enableLargeVideoRestriction: true,
    largeVideoThreshold: 1024,
  },
  uiState: {
    scrollDirection: 'none' as const,
  },
  dragStoreState: {
    setDraggedFilePath: vi.fn(),
    setDraggedVideoId: vi.fn(),
    draggedFilePath: null as string | string[] | null,
    draggedVideoId: null as string | string[] | null,
    clearDrag: vi.fn(),
  },
}));

mocks.dragStoreState.setDraggedFilePath = mocks.setDraggedFilePath;
mocks.dragStoreState.setDraggedVideoId = mocks.setDraggedVideoId;

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

vi.mock('../model/use-video-playback', () => ({
  useVideoPlayback: () => ({
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

vi.mock('./video-card-overlay', () => ({
  VideoCardOverlay: () => <div data-testid="overlay">Overlay</div>,
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

vi.mock('@/shared/api/electron', () => ({
  startDragApi: mocks.startDrag,
}));

const mockVideo: VideoFile = {
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

const TestVideoCardWrapper = (props: React.ComponentProps<typeof VideoCard>) => {
  const { handleDragStart, handleDragEnd } = useVideoDrag({
    videoPath: props.video.path,
    videoId: props.video.id,
  });

  return <VideoCard {...props} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />;
};

describe('VideoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectionState.selectedVideoIds = [];
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
      const { container } = render(<VideoCard video={mockVideo} isModalOpen={false} />);

      const img = getVideoThumbnail(container);
      expect(img.getAttribute('src')).toBe(mockVideo.thumbnailSrc);
      expect(screen.getByTestId('overlay')).toBeDefined();
    });

    it('handles click event', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <VideoCard video={mockVideo} isModalOpen={false} onClick={handleClick} />
      );

      const img = getVideoThumbnail(container);
      fireEvent.click(img.parentElement!);
      expect(handleClick).toHaveBeenCalledWith(mockVideo, expect.anything());
    });
  });

  describe('2. Selection Mode', () => {
    it('shows selection visuals when in selection mode', () => {
      mocks.selectionState.isSelectionMode = true;
      mocks.selectionState.selectedVideoIds = ['v1'];

      const { container } = render(
        <VideoCard video={mockVideo} isModalOpen={false} isSelectionMode={true} isSelected={true} />
      );

      const img = getVideoThumbnail(container);
      const card = img.closest('.video-card');
      expect(card?.getAttribute('data-selected')).toBe('true');
    });
  });

  describe('3. Drag and Drop Logic (Critical)', () => {
    it('initiates single file drag when not in selection mode', () => {
      const { container } = render(<TestVideoCardWrapper video={mockVideo} isModalOpen={false} />);

      const img = getVideoThumbnail(container);
      const card = img.closest('div[draggable="true"]');
      if (!card) throw new Error('Draggable element not found');

      fireEvent.dragStart(card);

      expect(mocks.setDraggedFilePath).toHaveBeenCalledWith(mockVideo.path);
      expect(mocks.setDraggedVideoId).toHaveBeenCalledWith(mockVideo.id);
      expect(mocks.startDrag).toHaveBeenCalledWith(mockVideo.path);
    });

    it('initiates multi-file drag when selected and in selection mode', () => {
      mocks.selectionState.isSelectionMode = true;
      mocks.selectionState.selectedVideoIds = ['v1', 'v2', 'v3'];

      const mockCachedVideos = [
        { id: 'v1', path: '/path/to/v1.mp4' },
        { id: 'v2', path: '/path/to/v2.mp4' },
        { id: 'v3', path: '/path/to/v3.mp4' },
        { id: 'v_other', path: '/path/to/other.mp4' },
      ];

      mockQueryCache.findAll.mockReturnValue([{ state: { data: mockCachedVideos } }]);

      const { container } = render(
        <TestVideoCardWrapper
          video={mockVideo} // v1
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
      expect(mocks.setDraggedVideoId).toHaveBeenCalledWith(expectedIds);
      expect(mocks.startDrag).toHaveBeenCalledWith(expectedPaths);
    });

    it('initiates single drag if dragged item is NOT selected (even in selection mode)', () => {
      mocks.selectionState.isSelectionMode = true;
      mocks.selectionState.selectedVideoIds = ['v2', 'v3'];

      const { container } = render(
        <TestVideoCardWrapper
          video={mockVideo}
          isModalOpen={false}
          isSelectionMode={true}
          isSelected={false}
        />
      );

      const img = getVideoThumbnail(container);
      const card = img.closest('div[draggable="true"]');
      fireEvent.dragStart(card!);

      expect(mocks.startDrag).toHaveBeenCalledWith(mockVideo.path);
      expect(mocks.setDraggedVideoId).toHaveBeenCalledWith(mockVideo.id);
    });
  });
});

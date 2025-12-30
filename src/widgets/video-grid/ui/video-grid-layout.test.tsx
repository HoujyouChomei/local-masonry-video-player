// src/widgets/video-grid/ui/video-grid-layout.test.tsx

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { VideoGridLayout } from './video-grid-layout';
import { VideoFile } from '@/shared/types/video';

// --- Mocks ---

// 1. SelectFolderButton Mock
vi.mock('@/features/select-folder/ui/select-folder-button', () => ({
  SelectFolderButton: () => <button data-testid="select-folder-btn">Select Folder</button>,
}));

interface MockVideoProps {
  video: VideoFile;
  onClick: (video: VideoFile) => void;
  actionsSlot?: React.ReactNode;
}

// 2. VideoCard & ListItem Mocks
vi.mock('@/entities/video/ui/video-card', () => ({
  VideoCard: ({ video, onClick, actionsSlot }: MockVideoProps) => (
    <div data-testid="video-card" onClick={() => onClick(video)}>
      {video.name}
      <div data-testid="actions-slot">{actionsSlot}</div>
    </div>
  ),
}));

vi.mock('@/entities/video/ui/video-list-item', () => ({
  VideoListItem: ({ video, onClick }: MockVideoProps) => (
    <div data-testid="video-list-item" onClick={() => onClick(video)}>
      {video.name}
    </div>
  ),
}));

vi.mock('./sortable-video-list-item', () => ({
  SortableVideoListItem: ({ video, onClick }: MockVideoProps) => (
    <div data-testid="sortable-video-list-item" onClick={() => onClick(video)}>
      {video.name}
    </div>
  ),
}));

// 3. Feature Components Mocks
vi.mock('@/features/delete-video/ui/delete-video-button', () => ({
  DeleteVideoButton: () => <button data-testid="delete-btn">Delete</button>,
}));

vi.mock('@/features/toggle-favorite/ui/favorite-button', () => ({
  FavoriteButton: () => <button data-testid="fav-btn">Favorite</button>,
}));

vi.mock('@/entities/video/ui/video-card-context-menu', () => ({
  VideoCardContextMenu: () => <div data-testid="context-menu">Context Menu</div>,
}));

// 4. Rename Dialog Mock
vi.mock('@/features/rename-video/ui/rename-video-dialog', () => ({
  RenameVideoDialog: ({ videoName }: { videoName: string }) => (
    <div data-testid="rename-dialog">Renaming: {videoName}</div>
  ),
}));

// 5. External Library Mocks
vi.mock('react-masonry-css', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="masonry-grid">{children}</div>
  ),
}));

vi.mock('react-infinite-scroll-component', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="infinite-scroll">{children}</div>
  ),
}));

// --- Test Data ---

const mockVideos: VideoFile[] = [
  {
    id: '1',
    name: 'video1.mp4',
    path: '/path/to/video1.mp4',
    src: 'file:///path/to/video1.mp4',
    thumbnailSrc: 'http://localhost/thumb1.jpg',
    size: 1000,
    createdAt: 100,
    updatedAt: 100,
  },
  {
    id: '2',
    name: 'video2.mp4',
    path: '/path/to/video2.mp4',
    src: 'file:///path/to/video2.mp4',
    thumbnailSrc: 'http://localhost/thumb2.jpg',
    size: 2000,
    createdAt: 200,
    updatedAt: 200,
  },
];

// --- Default Props Helper ---
// ▼▼▼ 修正: 不足していたPropsを追加 ▼▼▼
const defaultProps = {
  videos: mockVideos,
  totalVideosCount: 2,
  isLoading: false,
  isError: false,
  error: null,
  searchQuery: '',
  columnCount: 4,
  isGlobalMode: false,
  isPlaylistMode: false,
  isTagMode: false, // Added
  isModalOpen: false,
  folderPath: '/test/folder',
  showFavoritesOnly: false,
  layoutMode: 'masonry' as const,
  sortOption: 'date-desc' as const,
  onReorder: vi.fn(),
  videoToRename: null,
  onRenameClose: vi.fn(),
  onRenameOpen: vi.fn(),
  hasMore: false,
  onFetchMore: vi.fn(),
  onVideoClick: vi.fn(),

  // Added Interactions
  onPointerDown: vi.fn(),
  onPointerMove: vi.fn(),
  onPointerUp: vi.fn(),
  onPointerLeave: vi.fn(),
  onDragStart: vi.fn(),
};

describe('VideoGridLayout Integration Test', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Empty State Handling', () => {
    it('should show "Select a folder" when no folder path is set in normal mode', () => {
      render(<VideoGridLayout {...defaultProps} videos={[]} totalVideosCount={0} folderPath="" />);
      expect(screen.getByText(/Select a folder/i)).toBeTruthy();
    });

    it('should NOT show Loader when isLoading is true (Silent Loading)', () => {
      const { container } = render(
        <VideoGridLayout {...defaultProps} videos={[]} totalVideosCount={0} isLoading={true} />
      );
      // ローディング中はnullを返すので、コンテナの中身は空になるはず
      expect(container.firstChild).toBeNull();
    });

    it('should show Error message when isError is true', () => {
      const errorMessage = 'Network Error';
      render(
        <VideoGridLayout
          {...defaultProps}
          videos={[]}
          totalVideosCount={0}
          isError={true}
          error={errorMessage}
        />
      );
      expect(screen.getByText(/Failed to load videos/i)).toBeTruthy();
      expect(screen.getByText(errorMessage)).toBeTruthy();
    });

    it('should show "No videos match" when searchQuery has no results', () => {
      render(
        <VideoGridLayout {...defaultProps} videos={[]} totalVideosCount={0} searchQuery="nothing" />
      );
      expect(screen.getByText(/No videos match "nothing"/i)).toBeTruthy();
    });

    it('should show empty folder message when totalVideosCount is 0', () => {
      render(<VideoGridLayout {...defaultProps} videos={[]} totalVideosCount={0} />);
      expect(screen.getByText(/No supported videos found/i)).toBeTruthy();
    });
  });

  describe('Masonry View Mode', () => {
    it('should render MasonryView when layoutMode is "masonry"', () => {
      render(<VideoGridLayout {...defaultProps} layoutMode="masonry" />);
      expect(screen.getByTestId('masonry-grid')).toBeTruthy();
      const cards = screen.getAllByTestId('video-card');
      expect(cards).toHaveLength(2);
      expect(screen.getByText('video1.mp4')).toBeTruthy();
    });

    it('should call onVideoClick when a card is clicked', () => {
      const onVideoClick = vi.fn();
      render(
        <VideoGridLayout {...defaultProps} layoutMode="masonry" onVideoClick={onVideoClick} />
      );

      const card = screen.getByText('video1.mp4');
      fireEvent.click(card);

      expect(onVideoClick).toHaveBeenCalledWith(mockVideos[0]);
    });
  });

  describe('List View Mode', () => {
    it('should render ListView when layoutMode is "list"', () => {
      render(<VideoGridLayout {...defaultProps} layoutMode="list" />);
      expect(screen.getByText('Title')).toBeTruthy();
      expect(screen.getByText('Date')).toBeTruthy();

      const items = screen.getAllByTestId('video-list-item');
      expect(items).toHaveLength(2);
      expect(screen.getByText('video1.mp4')).toBeTruthy();
    });

    it('should render SortableList when sortOption is "custom" and no search query', () => {
      render(
        <VideoGridLayout {...defaultProps} layoutMode="list" sortOption="custom" searchQuery="" />
      );
      const items = screen.getAllByTestId('sortable-video-list-item');
      expect(items).toHaveLength(2);
    });

    it('should NOT render SortableList if searchQuery exists (even if custom sort)', () => {
      render(
        <VideoGridLayout
          {...defaultProps}
          layoutMode="list"
          sortOption="custom"
          searchQuery="video"
        />
      );
      const items = screen.getAllByTestId('video-list-item');
      expect(items).toHaveLength(2);
    });
  });

  describe('Rename Dialog Integration', () => {
    it('should render RenameVideoDialog when videoToRename is provided', () => {
      render(<VideoGridLayout {...defaultProps} videoToRename={mockVideos[0]} />);
      expect(screen.getByTestId('rename-dialog')).toBeTruthy();
      expect(screen.getByText('Renaming: video1.mp4')).toBeTruthy();
    });

    it('should not render RenameVideoDialog when videoToRename is null', () => {
      render(<VideoGridLayout {...defaultProps} videoToRename={null} />);
      expect(screen.queryByTestId('rename-dialog')).toBeNull();
    });
  });
});

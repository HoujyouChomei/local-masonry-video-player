// src/widgets/media-grid/ui/media-grid-layout.test.tsx

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MediaGridLayout } from './media-grid-layout';
import { Media } from '@/shared/schemas/media';
import type { MediaGridItemInteractions } from './media-grid-item';
import type { MediaGridConfig } from '../model/types';

vi.mock('@/features/select-folder/ui/select-folder-button', () => ({
  SelectFolderButton: () => <button data-testid="select-folder-btn">Select Folder</button>,
}));

vi.mock('@/entities/media/ui/media-card', () => ({
  MediaCard: ({
    media,
    onClick,
    actionsSlot,
  }: {
    media: Media;
    onClick: (media: Media) => void;
    actionsSlot?: React.ReactNode;
  }) => (
    <div data-testid="media-card" onClick={() => onClick(media)}>
      {media.name}
      <div data-testid="actions-slot">{actionsSlot}</div>
    </div>
  ),
}));

vi.mock('@/entities/media/ui/media-list-item', () => ({
  MediaListItem: ({ media, onClick }: { media: Media; onClick: (media: Media) => void }) => (
    <div data-testid="media-list-item" onClick={() => onClick(media)}>
      {media.name}
    </div>
  ),
}));

vi.mock('./sortable-media-list-item', () => ({
  SortableMediaListItem: ({
    media,
    onClick,
  }: {
    media: Media;
    onClick: (media: Media) => void;
  }) => (
    <div data-testid="sortable-media-list-item" onClick={() => onClick(media)}>
      {media.name}
    </div>
  ),
}));

vi.mock('@/features/delete-media/ui/delete-media-button', () => ({
  DeleteMediaButton: () => <button data-testid="delete-btn">Delete</button>,
}));

vi.mock('@/features/toggle-favorite/ui/favorite-button', () => ({
  FavoriteButton: () => <button data-testid="fav-btn">Favorite</button>,
}));

vi.mock('@/entities/media/ui/media-card-context-menu', () => ({
  MediaCardContextMenu: () => <div data-testid="context-menu">Context Menu</div>,
}));

vi.mock('@/features/rename-media/ui/rename-media-dialog', () => ({
  RenameMediaDialog: ({ mediaName }: { mediaName: string }) => (
    <div data-testid="rename-dialog">Renaming: {mediaName}</div>
  ),
}));

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

vi.mock('./views/masonry-view', () => ({
  MasonryView: ({
    mediaItems,
    interactions,
  }: {
    mediaItems: Media[];
    interactions: MediaGridItemInteractions;
  }) => (
    <div data-testid="masonry-grid">
      {mediaItems.map((v: Media) => (
        <div key={v.id} data-testid="media-card" onClick={(e) => interactions.onMediaClick(v, e)}>
          {v.name}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./views/list-view', () => ({
  ListView: ({
    mediaItems,
    interactions,
    isSortable,
  }: {
    mediaItems: Media[];
    interactions: MediaGridItemInteractions;
    isSortable: boolean;
  }) => (
    <div data-testid="list-view">
      {mediaItems.map((v: Media) => (
        <div
          key={v.id}
          data-testid={isSortable ? 'sortable-media-list-item' : 'media-list-item'}
          onClick={(e) => interactions.onMediaClick(v, e)}
        >
          {v.name}
        </div>
      ))}
    </div>
  ),
}));

const mockVideos: Media[] = [
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

const defaultInteractions = {
  onMediaClick: vi.fn(),
  onRenameOpen: vi.fn(),
  onDragStart: vi.fn(),
  onPointerDown: vi.fn(),
  onPointerMove: vi.fn(),
  onPointerUp: vi.fn(),
  onPointerLeave: vi.fn(),
};

const defaultConfig: MediaGridConfig = {
  gridStyle: 'standard',
  columnCount: 4,
  layoutMode: 'masonry',
  sortOption: 'date-desc',
  searchQuery: '',
  isModalOpen: false,
  isSelectionMode: false,
  isGlobalMode: false,
  isPlaylistMode: false,
  isTagMode: false,
  folderPath: '/test/folder',
  showFavoritesOnly: false,
};

const defaultProps = {
  mediaItems: mockVideos,
  totalMediaCount: 2,
  isLoading: false,
  isError: false,
  error: null,
  config: defaultConfig,
  onReorder: vi.fn(),
  hasMore: false,
  onFetchMore: vi.fn(),
  interactions: defaultInteractions,
};

describe('MediaGridLayout Integration Test', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Empty State Handling', () => {
    it('should show "Select a folder" when no folder path is set in normal mode', () => {
      render(
        <MediaGridLayout
          {...defaultProps}
          mediaItems={[]}
          totalMediaCount={0}
          config={{ ...defaultConfig, folderPath: '' }}
        />
      );
      expect(screen.getByText(/Select a folder/i)).toBeTruthy();
    });

    it('should show Loader when isLoading is true (Initial Loading)', () => {
      const { container } = render(
        <MediaGridLayout {...defaultProps} mediaItems={[]} totalMediaCount={0} isLoading={true} />
      );
      expect(container.firstChild).not.toBeNull();
      expect(container.getElementsByClassName('animate-ping').length).toBe(1);
    });

    it('should show Error message when isError is true', () => {
      const errorMessage = 'Network Error';
      render(
        <MediaGridLayout
          {...defaultProps}
          mediaItems={[]}
          totalMediaCount={0}
          isError={true}
          error={errorMessage}
        />
      );
      expect(screen.getByText(/Failed to load media/i)).toBeTruthy();
      expect(screen.getByText(errorMessage)).toBeTruthy();
    });

    it('should show "No videos match" when searchQuery has no results', () => {
      render(
        <MediaGridLayout
          {...defaultProps}
          mediaItems={[]}
          totalMediaCount={0}
          config={{ ...defaultConfig, searchQuery: 'nothing' }}
        />
      );
      expect(screen.getByText(/No media match "nothing"/i)).toBeTruthy();
    });

    it('should show empty folder message when totalMediaCount is 0', () => {
      render(<MediaGridLayout {...defaultProps} mediaItems={[]} totalMediaCount={0} />);
      expect(screen.getByText(/No supported media found/i)).toBeTruthy();
    });
  });

  describe('Masonry View Mode', () => {
    it('should render MasonryView when layoutMode is "masonry"', () => {
      render(
        <MediaGridLayout {...defaultProps} config={{ ...defaultConfig, layoutMode: 'masonry' }} />
      );
      expect(screen.getByTestId('masonry-grid')).toBeTruthy();
      const cards = screen.getAllByTestId('media-card');
      expect(cards).toHaveLength(2);
      expect(screen.getByText('video1.mp4')).toBeTruthy();
    });

    it('should call onMediaClick when a card is clicked', () => {
      const onMediaClick = vi.fn();
      render(
        <MediaGridLayout
          {...defaultProps}
          config={{ ...defaultConfig, layoutMode: 'masonry' }}
          interactions={{ ...defaultInteractions, onMediaClick }}
        />
      );

      const card = screen.getByText('video1.mp4');
      fireEvent.click(card);

      expect(onMediaClick).toHaveBeenCalledWith(mockVideos[0], expect.anything());
    });
  });

  describe('List View Mode', () => {
    it('should render ListView when layoutMode is "list"', () => {
      render(
        <MediaGridLayout {...defaultProps} config={{ ...defaultConfig, layoutMode: 'list' }} />
      );
      expect(screen.getByTestId('list-view')).toBeTruthy();

      const items = screen.getAllByTestId('media-list-item');
      expect(items).toHaveLength(2);
      expect(screen.getByText('video1.mp4')).toBeTruthy();
    });

    it('should render SortableList when sortOption is "custom" and no search query', () => {
      render(
        <MediaGridLayout
          {...defaultProps}
          config={{
            ...defaultConfig,
            layoutMode: 'list',
            sortOption: 'custom',
            searchQuery: '',
          }}
        />
      );
      const items = screen.getAllByTestId('sortable-media-list-item');
      expect(items).toHaveLength(2);
    });

    it('should NOT render SortableList if searchQuery exists (even if custom sort)', () => {
      render(
        <MediaGridLayout
          {...defaultProps}
          config={{
            ...defaultConfig,
            layoutMode: 'list',
            sortOption: 'custom',
            searchQuery: 'video',
          }}
        />
      );
      const items = screen.getAllByTestId('media-list-item');
      expect(items).toHaveLength(2);
    });
  });
});

// src/widgets/media-player/ui/media-modal.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MediaModal } from './media-modal';
import * as useMediaModalPlayerModule from '../model/use-media-modal-player';
import * as mediaPlayerStoreModule from '@/entities/player/model/store';
import { Media } from '@/shared/schemas/media';

vi.mock('electron-trpc/renderer', () => ({
  ipcLink: () => () => ({}),
}));

const mockCloseMedia = vi.fn();
const mockToggleFullscreen = vi.fn();
const mockToggleInfoPanel = vi.fn();
const mockPlayNext = vi.fn();
const mockPlayPrev = vi.fn();
const mockToggleAutoPlayNext = vi.fn();

const defaultHookValues = {
  selectedMedia: {
    id: 'v1',
    name: 'Test Video.mp4',
    path: '/path/to/Test Video.mp4',
    src: 'file:///path/to/Test Video.mp4',
    thumbnailSrc: 'http://localhost/thumb.jpg',
    size: 1024 * 1024 * 10,
    updatedAt: Date.now(),
    duration: 120,
    width: 1920,
    height: 1080,
    metadataStatus: 'completed',
  } as Media,
  videoRef: { current: null },
  isOpen: true,
  currentSrc: 'file:///path/to/Test Video.mp4',
  autoPlayNext: false,
  toggleAutoPlayNext: mockToggleAutoPlayNext,
  playNext: mockPlayNext,
  playPrev: mockPlayPrev,
  closeMedia: mockCloseMedia,
  handleVolumeChange: vi.fn(),
  handleMediaEnded: vi.fn(),
  handleError: vi.fn(),
  isFullscreen: false,
  showControls: true,
  isInfoPanelOpen: false,
  isContentHidden: false,
  toggleFullscreen: mockToggleFullscreen,
  toggleInfoPanel: mockToggleInfoPanel,
  handleMouseMove: vi.fn(),
  handleMouseLeave: vi.fn(),
  handleContextMenu: vi.fn(),
  handleMediaClick: vi.fn(),
  handleDoubleClick: vi.fn(),
  handleTouchStart: vi.fn(),
  handleTouchEnd: vi.fn(),
};

vi.mock('../model/use-media-modal-player', () => ({
  useMediaModalPlayer: vi.fn(() => defaultHookValues),
}));

vi.mock('@/entities/player/model/store', () => ({
  useMediaPlayerStore: vi.fn(() => ({
    playlist: [],
  })),
}));

const settingsState = {
  openInFullscreen: false,
  enableExperimentalNormalize: false,
};

vi.mock('@/shared/stores/settings-store', () => ({
  useSettingsStore: () => settingsState,
}));

vi.mock('@/shared/lib/use-is-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('./media-metadata-panel', () => ({
  MediaMetadataPanel: () => <div data-testid="metadata-panel">Metadata Panel</div>,
}));

vi.mock('@/features/media-tagging/ui/media-tag-manager', () => ({
  MediaTagManager: () => <div data-testid="tag-manager">Tag Manager</div>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('MediaModal Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsState.openInFullscreen = false;
    (useMediaModalPlayerModule.useMediaModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue(
      defaultHookValues
    );
    (
      mediaPlayerStoreModule.useMediaPlayerStore as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({ playlist: [] });
  });

  it('does not render when isOpen is false', () => {
    (useMediaModalPlayerModule.useMediaModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultHookValues,
      isOpen: false,
      selectedMedia: null,
    });

    const { container } = render(<MediaModal />, { wrapper: createWrapper() });
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when open with a video', () => {
    render(<MediaModal />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Video.mp4')).toBeTruthy();
    expect(screen.getByText('1920x1080')).toBeTruthy();
    const videoEl = document.querySelector('video');
    expect(videoEl).toBeTruthy();
    expect(videoEl?.getAttribute('src')).toBe('file:///path/to/Test Video.mp4');
  });

  it('calls closeMedia when clicking the close button', () => {
    render(<MediaModal />, { wrapper: createWrapper() });

    const container = screen.getByTestId('media-modal-container') as HTMLDivElement;
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      width: 1000,
      height: 600,
      bottom: 600,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.mouseMove(container, { clientY: 10 });
    const closeButton = screen.getByTitle('Close (Esc)');

    fireEvent.click(closeButton);
    expect(mockCloseMedia).toHaveBeenCalled();
  });

  it('calls toggleFullscreen when clicking the maximize button', () => {
    render(<MediaModal />, { wrapper: createWrapper() });

    const fullscreenButton = screen.getByTitle('Enter Fullscreen (F)');
    fireEvent.click(fullscreenButton);
    expect(mockToggleFullscreen).toHaveBeenCalled();
  });

  it('renders footer controls and handles interaction', () => {
    render(<MediaModal />, { wrapper: createWrapper() });

    const prevBtn = screen.getByTitle('Previous Media');
    const nextBtn = screen.getByTitle('Next Media');
    const autoPlayBtn = screen.getByTitle('Auto-Play: OFF');

    fireEvent.click(prevBtn);
    expect(mockPlayPrev).toHaveBeenCalled();

    fireEvent.click(nextBtn);
    expect(mockPlayNext).toHaveBeenCalled();

    fireEvent.click(autoPlayBtn);
    expect(mockToggleAutoPlayNext).toHaveBeenCalled();
  });

  it('toggles info panel visibility', () => {
    const { rerender } = render(<MediaModal />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('metadata-panel')).toBeNull();

    (useMediaModalPlayerModule.useMediaModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultHookValues,
      isInfoPanelOpen: true,
    });

    rerender(<MediaModal />);
    expect(screen.getByTestId('metadata-panel')).toBeTruthy();
  });

  it('hides footer and side panel in fullscreen mode', () => {
    (useMediaModalPlayerModule.useMediaModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultHookValues,
      isFullscreen: true,
      isInfoPanelOpen: true,
    });

    render(<MediaModal />, { wrapper: createWrapper() });

    expect(screen.queryByText('Test Video.mp4')).toBeNull();

    expect(screen.queryByTestId('metadata-panel')).toBeNull();
  });

  it('shows close button only when hovering near the top edge', () => {
    render(<MediaModal />, { wrapper: createWrapper() });

    const container = screen.getByTestId('media-modal-container') as HTMLDivElement;
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      width: 1000,
      height: 600,
      bottom: 600,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    expect(screen.queryByTitle('Close (Esc)')).toBeNull();

    fireEvent.mouseMove(container, { clientY: 10 });
    expect(screen.getByTitle('Close (Esc)')).toBeTruthy();

    fireEvent.mouseMove(container, { clientY: 200 });
    expect(screen.queryByTitle('Close (Esc)')).toBeNull();
  });

  it('hides fullscreen toggle when openInFullscreen is enabled', () => {
    settingsState.openInFullscreen = true;
    (useMediaModalPlayerModule.useMediaModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultHookValues,
      isFullscreen: true,
    });

    render(<MediaModal />, { wrapper: createWrapper() });

    const container = screen.getByTestId('media-modal-container') as HTMLDivElement;
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      width: 1000,
      height: 600,
      bottom: 600,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    fireEvent.mouseMove(container, { clientY: 10 });

    expect(screen.queryByTitle('Exit Fullscreen (F)')).toBeNull();
    expect(screen.getByTitle('Close (Esc)')).toBeTruthy();
  });

  it('preloads next video if playlist has next item', () => {
    (
      mediaPlayerStoreModule.useMediaPlayerStore as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      playlist: [
        { id: 'v1', path: '/v1.mp4' },
        { id: 'v2', path: '/v2.mp4', src: 'file:///v2.mp4', thumbnailSrc: '' },
      ],
    });

    const { container } = render(<MediaModal />, { wrapper: createWrapper() });

    const videos = container.querySelectorAll('video');
    expect(videos.length).toBe(2);

    const hiddenVideo = videos[1];
    expect(hiddenVideo.classList.contains('hidden')).toBe(true);
    expect(hiddenVideo.getAttribute('src')).toBe('file:///v2.mp4');
  });
});

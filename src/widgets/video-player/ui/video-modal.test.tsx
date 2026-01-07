// src/widgets/video-player/ui/video-modal.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VideoModal } from './video-modal';
import * as useVideoModalPlayerModule from '../model/use-video-modal-player';
import * as videoPlayerStoreModule from '@/features/video-player/model/store';
import { VideoFile } from '@/shared/types/video';

// --- Mocks ---

// 1. Mock Hooks & Stores
const mockCloseVideo = vi.fn();
const mockToggleFullscreen = vi.fn();
const mockToggleInfoPanel = vi.fn();
const mockPlayNext = vi.fn();
const mockPlayPrev = vi.fn();
const mockToggleAutoPlayNext = vi.fn();

// useVideoModalPlayer のデフォルト戻り値
const defaultHookValues = {
  selectedVideo: {
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
  } as VideoFile,
  videoRef: { current: null },
  isOpen: true,
  currentSrc: 'file:///path/to/Test Video.mp4',
  autoPlayNext: false,
  toggleAutoPlayNext: mockToggleAutoPlayNext,
  playNext: mockPlayNext,
  playPrev: mockPlayPrev,
  closeVideo: mockCloseVideo,
  handleVolumeChange: vi.fn(),
  handleVideoEnded: vi.fn(),
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
  handleVideoClick: vi.fn(),
  handleDoubleClick: vi.fn(),
  handleTouchStart: vi.fn(),
  handleTouchEnd: vi.fn(),
};

// モジュール全体のモック
vi.mock('../model/use-video-modal-player', () => ({
  useVideoModalPlayer: vi.fn(() => defaultHookValues),
}));

vi.mock('@/features/video-player/model/store', () => ({
  useVideoPlayerStore: vi.fn(() => ({
    playlist: [], // デフォルトは空
  })),
}));

vi.mock('@/shared/stores/settings-store', () => ({
  useSettingsStore: () => ({
    openInFullscreen: false,
    enableExperimentalNormalize: false,
  }),
}));

vi.mock('@/shared/lib/use-is-mobile', () => ({
  useIsMobile: () => false,
}));

// Components Mocks (複雑な子コンポーネントを軽量化)
vi.mock('./video-metadata-panel', () => ({
  VideoMetadataPanel: () => <div data-testid="metadata-panel">Metadata Panel</div>,
}));

vi.mock('@/features/video-tagging/ui/video-tag-manager', () => ({
  VideoTagManager: () => <div data-testid="tag-manager">Tag Manager</div>,
}));

// --- Test Utilities ---
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

// --- Test Suite ---

describe('VideoModal Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // フックのモックをリセット
    (useVideoModalPlayerModule.useVideoModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue(
      defaultHookValues
    );
    (
      videoPlayerStoreModule.useVideoPlayerStore as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({ playlist: [] });
  });

  it('does not render when isOpen is false', () => {
    (useVideoModalPlayerModule.useVideoModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultHookValues,
      isOpen: false,
      selectedVideo: null,
    });

    const { container } = render(<VideoModal />, { wrapper: createWrapper() });
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when open with a video', () => {
    render(<VideoModal />, { wrapper: createWrapper() });

    // Video Title
    expect(screen.getByText('Test Video.mp4')).toBeTruthy();
    // Resolution Badge
    expect(screen.getByText('1920x1080')).toBeTruthy();
    // Video Element
    const videoEl = document.querySelector('video');
    expect(videoEl).toBeTruthy();
    // ▼▼▼ 修正: toHaveAttribute -> getAttribute + toBe ▼▼▼
    expect(videoEl?.getAttribute('src')).toBe('file:///path/to/Test Video.mp4');
  });

  it('calls closeVideo when clicking the close button', () => {
    render(<VideoModal />, { wrapper: createWrapper() });

    // Assuming implementation:
    // Top right: [Fullscreen Toggle] [Close]
    const closeButtons = document.querySelectorAll('button');
    // Top right area has 2 buttons. The X (Close) is logically the last interaction element there
    const closeButton = closeButtons[1];

    fireEvent.click(closeButton);
    expect(mockCloseVideo).toHaveBeenCalled();
  });

  it('calls toggleFullscreen when clicking the maximize button', () => {
    render(<VideoModal />, { wrapper: createWrapper() });

    const fullscreenButton = document.querySelectorAll('button')[0]; // Top right first button
    fireEvent.click(fullscreenButton);
    expect(mockToggleFullscreen).toHaveBeenCalled();
  });

  it('renders footer controls and handles interaction', () => {
    render(<VideoModal />, { wrapper: createWrapper() });

    const prevBtn = screen.getByTitle('Previous Video');
    const nextBtn = screen.getByTitle('Next Video');
    const autoPlayBtn = screen.getByTitle('Auto-Play: OFF');

    fireEvent.click(prevBtn);
    expect(mockPlayPrev).toHaveBeenCalled();

    fireEvent.click(nextBtn);
    expect(mockPlayNext).toHaveBeenCalled();

    fireEvent.click(autoPlayBtn);
    expect(mockToggleAutoPlayNext).toHaveBeenCalled();
  });

  it('toggles info panel visibility', () => {
    // 1. Initially closed
    const { rerender } = render(<VideoModal />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('metadata-panel')).toBeNull();

    // 2. Mock state change to Open
    (useVideoModalPlayerModule.useVideoModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultHookValues,
      isInfoPanelOpen: true,
    });

    rerender(<VideoModal />);
    expect(screen.getByTestId('metadata-panel')).toBeTruthy();
  });

  it('hides footer and side panel in fullscreen mode', () => {
    (useVideoModalPlayerModule.useVideoModalPlayer as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultHookValues,
      isFullscreen: true,
      isInfoPanelOpen: true, // Should be ignored in UI
    });

    render(<VideoModal />, { wrapper: createWrapper() });

    // Footer Title should NOT be visible
    expect(screen.queryByText('Test Video.mp4')).toBeNull();

    // Metadata panel should also be hidden in fullscreen
    expect(screen.queryByTestId('metadata-panel')).toBeNull();
  });

  it('preloads next video if playlist has next item', () => {
    // Setup Playlist
    (
      videoPlayerStoreModule.useVideoPlayerStore as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      playlist: [
        { id: 'v1', path: '/v1.mp4' },
        { id: 'v2', path: '/v2.mp4', src: 'file:///v2.mp4', thumbnailSrc: '' },
      ],
    });

    const { container } = render(<VideoModal />, { wrapper: createWrapper() });

    // Should contain 2 video tags: Main player + Hidden preloader
    const videos = container.querySelectorAll('video');
    expect(videos.length).toBe(2);

    const hiddenVideo = videos[1];
    // ▼▼▼ 修正: toHaveClass -> classList.contains ▼▼▼
    expect(hiddenVideo.classList.contains('hidden')).toBe(true);
    // ▼▼▼ 修正: toHaveAttribute -> getAttribute + toBe ▼▼▼
    expect(hiddenVideo.getAttribute('src')).toBe('file:///v2.mp4');
  });
});

// src/widgets/video-player/model/use-video-modal-player.test.ts

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVideoModalPlayer } from './use-video-modal-player';
import { VideoUpdateEvent } from '@/shared/types/electron';

// --- Types for Mocks ---
interface MockStoreState {
  selectedVideo: {
    id: string;
    src: string;
    path: string;
    name: string;
    metadataStatus?: string;
  } | null;
  playlist: unknown[];
  isOpen: boolean;
  closeVideo: ReturnType<typeof vi.fn>;
  playNext: ReturnType<typeof vi.fn>;
  playPrev: ReturnType<typeof vi.fn>;
  updateVideoData: ReturnType<typeof vi.fn>;
}

interface MockSettingsState {
  autoPlayNext: boolean;
  toggleAutoPlayNext: ReturnType<typeof vi.fn>;
  volume: number;
  isMuted: boolean;
  setVolumeState: ReturnType<typeof vi.fn>;
  openInFullscreen: boolean;
}

// --- Mocks ---

// Electron API
const mockSetFullScreen = vi.fn();
const mockHarvestMetadata = vi.fn();
const mockFetchVideoDetails = vi.fn();
// コールバックを捕捉するためのモック
let videoUpdateCallback: ((events: VideoUpdateEvent[]) => void) | null = null;

vi.mock('@/shared/api/electron', () => ({
  setFullScreenApi: (enable: boolean) => mockSetFullScreen(enable),
  harvestMetadataApi: (id: string) => mockHarvestMetadata(id),
  fetchVideoDetailsApi: (path: string) => mockFetchVideoDetails(path),
  onVideoUpdateApi: (cb: (events: VideoUpdateEvent[]) => void) => {
    videoUpdateCallback = cb;
    return () => {
      videoUpdateCallback = null;
    }; // unsubscribe function
  },
}));

// Stores
const { storeState, settingsState } = vi.hoisted(() => ({
  storeState: {
    selectedVideo: null,
    playlist: [],
    isOpen: false,
    closeVideo: vi.fn(),
    playNext: vi.fn(),
    playPrev: vi.fn(),
    updateVideoData: vi.fn(),
  } as MockStoreState,
  settingsState: {
    autoPlayNext: false,
    toggleAutoPlayNext: vi.fn(),
    volume: 0.5,
    isMuted: false,
    setVolumeState: vi.fn(),
    openInFullscreen: false,
  } as MockSettingsState,
}));

vi.mock('@/features/video-player/model/store', () => {
  const useStore = () => storeState;
  useStore.getState = () => storeState;
  return { useVideoPlayerStore: useStore };
});

vi.mock('@/shared/stores/settings-store', () => ({
  useSettingsStore: () => settingsState,
}));

vi.mock('@/shared/lib/video-extensions', () => ({
  isNativeVideo: vi.fn().mockReturnValue(true),
  getStreamUrl: vi.fn().mockReturnValue('http://mock-stream-url'),
}));

// --- Test Suite ---

describe('useVideoModalPlayer Integration Test', () => {
  let videoElement: HTMLVideoElement;

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const TestWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    return TestWrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset API Mocks
    mockFetchVideoDetails.mockResolvedValue(null);
    mockHarvestMetadata.mockResolvedValue(undefined);
    mockSetFullScreen.mockResolvedValue(undefined);
    videoUpdateCallback = null;

    // Reset Store State
    storeState.selectedVideo = null;
    storeState.playlist = [];
    storeState.isOpen = false;
    storeState.closeVideo.mockClear();
    storeState.playNext.mockClear();
    storeState.playPrev.mockClear();
    storeState.updateVideoData.mockClear();

    // Reset Settings State
    settingsState.autoPlayNext = false;
    settingsState.toggleAutoPlayNext.mockClear();
    settingsState.volume = 0.5;
    settingsState.isMuted = false; // 修正: コロン(:)をイコール(=)に変更
    settingsState.setVolumeState.mockClear();
    settingsState.openInFullscreen = false;

    // Mock Video Element
    videoElement = document.createElement('video');
    videoElement.play = vi.fn().mockResolvedValue(undefined);
    videoElement.pause = vi.fn();
    videoElement.load = vi.fn();

    vi.spyOn(videoElement, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      width: 1920,
      height: 1080,
      bottom: 1080,
      right: 1920,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const renderAndInit = () => {
    const hook = renderHook(() => useVideoModalPlayer(), { wrapper: createWrapper() });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hook.result.current.videoRef as any).current = videoElement;

    storeState.isOpen = true;
    storeState.selectedVideo = {
      id: 'v1',
      src: 'file://v1.mp4',
      path: '/v1.mp4',
      name: 'v1',
      metadataStatus: 'completed',
    };
    // プリフェッチロジックがエラーにならないようプレイリストも設定
    storeState.playlist = [storeState.selectedVideo];

    hook.rerender();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    return hook;
  };

  describe('1. Initialization & Lifecycle', () => {
    it('should set volume/muted from settings on mount', () => {
      renderAndInit();

      expect(videoElement.volume).toBe(0.5);
      expect(videoElement.muted).toBe(false);
    });

    it('should disable body scroll when open', () => {
      renderAndInit();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = renderAndInit();
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('2. Keyboard Interactions', () => {
    it('should toggle play/pause on Space', () => {
      renderAndInit();

      Object.defineProperty(videoElement, 'paused', { value: false, configurable: true });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      });
      expect(videoElement.pause).toHaveBeenCalled();

      Object.defineProperty(videoElement, 'paused', { value: true, configurable: true });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      });
      expect(videoElement.play).toHaveBeenCalledTimes(1);
    });

    it('should navigate on Arrow keys', () => {
      renderAndInit();

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      });
      expect(storeState.playNext).toHaveBeenCalled();

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      });
      expect(storeState.playPrev).toHaveBeenCalled();
    });

    it('should handle Escape key (Close vs Exit Fullscreen)', () => {
      const { result } = renderAndInit();

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(storeState.closeVideo).toHaveBeenCalled();

      storeState.closeVideo.mockClear();

      act(() => {
        result.current.toggleFullscreen();
      });
      expect(result.current.isFullscreen).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(result.current.isFullscreen).toBe(false);
      expect(storeState.closeVideo).not.toHaveBeenCalled();
    });

    it('should toggle fullscreen on "f" key', () => {
      const { result } = renderAndInit();

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
      });
      expect(result.current.isFullscreen).toBe(true);
      expect(mockSetFullScreen).toHaveBeenCalledWith(true);
    });

    it('should toggle info panel on "i" key', () => {
      const { result } = renderAndInit();
      expect(result.current.isInfoPanelOpen).toBe(false);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
      });
      expect(result.current.isInfoPanelOpen).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
      });
      expect(result.current.isInfoPanelOpen).toBe(false);
    });
  });

  describe('3. Mouse Interactions', () => {
    it('should show controls on mouse move', () => {
      const { result } = renderAndInit();
      expect(result.current.showControls).toBe(false);

      act(() => {
        result.current.handleMouseMove();
      });

      expect(result.current.showControls).toBe(true);
    });

    it('should navigate on Wheel', () => {
      renderAndInit();

      act(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      });
      expect(storeState.playNext).toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
      });
      expect(storeState.playPrev).toHaveBeenCalled();
    });

    it('should play/pause on click (Upper Area)', () => {
      const { result } = renderAndInit();
      Object.defineProperty(videoElement, 'paused', { value: true, configurable: true });

      const event = {
        clientY: 500,
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent<HTMLVideoElement>;

      act(() => {
        result.current.handleMouseMove();
      });

      act(() => {
        result.current.handleVideoClick(event);
      });

      expect(videoElement.play).toHaveBeenCalledTimes(1);
    });

    it('should NOT play/pause on click (Controls Area)', () => {
      const { result } = renderAndInit();
      Object.defineProperty(videoElement, 'paused', { value: true, configurable: true });

      const event = {
        clientY: 1050,
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent<HTMLVideoElement>;

      act(() => {
        result.current.handleMouseMove();
      });
      expect(result.current.showControls).toBe(true);

      act(() => {
        result.current.handleVideoClick(event);
      });

      expect(videoElement.play).toHaveBeenCalledTimes(0);
    });

    it('should toggle fullscreen on double click', () => {
      const { result } = renderAndInit();

      act(() => {
        result.current.handleDoubleClick();
      });

      expect(result.current.isFullscreen).toBe(true);
    });
  });

  describe('4. Playback Logic', () => {
    it('should sync volume changes to settings store', () => {
      const { result } = renderAndInit();

      const event = {
        currentTarget: { volume: 0.8, muted: true },
      } as React.SyntheticEvent<HTMLVideoElement>;

      act(() => {
        result.current.handleVolumeChange(event);
      });

      expect(settingsState.setVolumeState).toHaveBeenCalledWith(0.8, true);
    });

    it('should auto-play next if enabled', () => {
      settingsState.autoPlayNext = true;
      const { result } = renderAndInit();

      act(() => {
        result.current.handleVideoEnded();
      });

      expect(storeState.playNext).toHaveBeenCalled();
    });

    it('should NOT auto-play next if disabled', () => {
      settingsState.autoPlayNext = false;
      const { result } = renderAndInit();

      act(() => {
        result.current.handleVideoEnded();
      });

      expect(storeState.playNext).not.toHaveBeenCalled();
    });
  });

  describe('5. Touch Interactions', () => {
    it('should navigate on swipe left (Next)', () => {
      const { result } = renderAndInit();

      const startEvent = {
        touches: [{ clientX: 200, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const endEvent = {
        changedTouches: [{ clientX: 100, clientY: 100 }], // Move left by 100px
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handleTouchStart(startEvent);
        result.current.handleTouchEnd(endEvent);
      });

      expect(storeState.playNext).toHaveBeenCalled();
    });

    it('should navigate on swipe right (Prev)', () => {
      const { result } = renderAndInit();

      const startEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const endEvent = {
        changedTouches: [{ clientX: 200, clientY: 100 }], // Move right by 100px
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handleTouchStart(startEvent);
        result.current.handleTouchEnd(endEvent);
      });

      expect(storeState.playPrev).toHaveBeenCalled();
    });

    it('should ignore vertical swipes', () => {
      const { result } = renderAndInit();

      const startEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const endEvent = {
        changedTouches: [{ clientX: 100, clientY: 200 }], // Move down by 100px (Vertical)
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handleTouchStart(startEvent);
        result.current.handleTouchEnd(endEvent);
      });

      expect(storeState.playNext).not.toHaveBeenCalled();
      expect(storeState.playPrev).not.toHaveBeenCalled();
    });
  });

  describe('6. History API', () => {
    it('should close video on browser back (popstate)', () => {
      renderAndInit();

      // Trigger popstate event
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      });

      expect(storeState.closeVideo).toHaveBeenCalled();
    });
  });

  describe('7. Realtime Updates', () => {
    it('should update video data when update event is received', async () => {
      renderAndInit();

      // ▼▼▼ 修正: waitForがタイムアウトしないように実時間タイマーに戻す ▼▼▼
      vi.useRealTimers();

      const updatedVideoData = {
        id: 'v1',
        name: 'v1-updated',
        path: '/v1.mp4',
        duration: 120,
      };

      // Mock the details fetch that happens after update event
      mockFetchVideoDetails.mockResolvedValueOnce(updatedVideoData);

      // Simulate update event
      act(() => {
        if (videoUpdateCallback) {
          videoUpdateCallback([{ type: 'update', path: '/v1.mp4' }]);
        }
      });

      // Wait for async fetch and update
      await waitFor(() => {
        expect(mockFetchVideoDetails).toHaveBeenCalledWith('/v1.mp4');
        expect(storeState.updateVideoData).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'v1-updated' })
        );
      });
    });
  });
});

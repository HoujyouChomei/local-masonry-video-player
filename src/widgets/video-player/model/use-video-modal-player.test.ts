// src/widgets/video-player/model/use-video-modal-player.test.ts

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVideoModalPlayer } from './use-video-modal-player';

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
}

interface MockSettingsState {
  autoPlayNext: boolean;
  toggleAutoPlayNext: ReturnType<typeof vi.fn>;
  volume: number;
  isMuted: boolean;
  setVolumeState: ReturnType<typeof vi.fn>;
}

// --- Mocks ---

// Electron API
const mockSetFullScreen = vi.fn();
const mockHarvestMetadata = vi.fn();
const mockFetchVideoDetails = vi.fn();

vi.mock('@/shared/api/electron', () => ({
  setFullScreenApi: (enable: boolean) => mockSetFullScreen(enable),
  harvestMetadataApi: (id: string) => mockHarvestMetadata(id),
  fetchVideoDetailsApi: (path: string) => mockFetchVideoDetails(path),
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
  } as MockStoreState,
  settingsState: {
    autoPlayNext: false,
    toggleAutoPlayNext: vi.fn(),
    volume: 0.5,
    isMuted: false,
    setVolumeState: vi.fn(),
  } as MockSettingsState,
}));

vi.mock('@/features/video-player/model/store', () => ({
  useVideoPlayerStore: () => storeState,
}));

// ▼▼▼ 修正: パスを新しい場所に更新 (entities -> shared) ▼▼▼
vi.mock('@/shared/stores/settings-store', () => ({
  useSettingsStore: () => settingsState,
}));

// use-player-playback.ts で使用されるヘルパーのモック
vi.mock('@/shared/lib/video-extensions', () => ({
  isNativeVideo: vi.fn().mockReturnValue(true),
  getStreamUrl: vi.fn().mockReturnValue('http://mock-stream-url'),
}));

// --- Test Suite ---

describe('useVideoModalPlayer Integration Test', () => {
  let videoElement: HTMLVideoElement;

  // QueryClient Wrapperの作成
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    // 名前付き関数コンポーネントとして定義して返す (ESLintエラー回避)
    const TestWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    return TestWrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // ▼▼▼ 追加: window.electron のモック ▼▼▼
    Object.defineProperty(window, 'electron', {
      value: {
        onVideoUpdate: vi.fn().mockReturnValue(() => {}), // unsubscribe 関数を返す
      },
      writable: true,
    });
    // ▲▲▲ 追加ここまで ▲▲▲

    storeState.selectedVideo = null;
    storeState.playlist = [];
    storeState.isOpen = false;
    storeState.closeVideo.mockClear();
    storeState.playNext.mockClear();
    storeState.playPrev.mockClear();

    settingsState.autoPlayNext = false;
    settingsState.toggleAutoPlayNext.mockClear();
    settingsState.volume = 0.5;
    settingsState.isMuted = false;
    settingsState.setVolumeState.mockClear();

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
});

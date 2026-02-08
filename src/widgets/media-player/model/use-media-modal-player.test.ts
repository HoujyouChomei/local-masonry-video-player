// src/widgets/media-player/model/use-media-modal-player.test.ts

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMediaModalPlayer } from './use-media-modal-player';
import { MediaUpdateEvent } from '@/shared/types/electron';

interface MockStoreState {
  selectedMedia: {
    id: string;
    src: string;
    path: string;
    name: string;
    metadataStatus?: string;
  } | null;
  playlist: unknown[];
  isOpen: boolean;
  closeMedia: ReturnType<typeof vi.fn>;
  playNext: ReturnType<typeof vi.fn>;
  playPrev: ReturnType<typeof vi.fn>;
  updateMediaData: ReturnType<typeof vi.fn>;
}

interface MockSettingsState {
  autoPlayNext: boolean;
  toggleAutoPlayNext: ReturnType<typeof vi.fn>;
  volume: number;
  isMuted: boolean;
  setVolumeState: ReturnType<typeof vi.fn>;
  openInFullscreen: boolean;
}

const mockSetFullScreen = vi.fn();
const mockHarvestMetadata = vi.fn();
const mockFetchMediaDetails = vi.fn();
let mediaUpdateCallback: ((events: MediaUpdateEvent[]) => void) | null = null;

vi.mock('@/shared/api', () => ({
  api: {
    system: {
      setFullScreen: (enable: boolean) => mockSetFullScreen(enable),
    },
    media: {
      harvestMetadata: (id: string) => mockHarvestMetadata(id),
      getDetails: (path: string) => mockFetchMediaDetails(path),
    },
    events: {
      onMediaUpdate: (cb: (events: MediaUpdateEvent[]) => void) => {
        mediaUpdateCallback = cb;
        return () => {
          mediaUpdateCallback = null;
        };
      },
    },
  },
}));

const { storeState, settingsState } = vi.hoisted(() => ({
  storeState: {
    selectedMedia: null,
    playlist: [],
    isOpen: false,
    closeMedia: vi.fn(),
    playNext: vi.fn(),
    playPrev: vi.fn(),
    updateMediaData: vi.fn(),
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

vi.mock('@/entities/player/model/store', () => {
  const useStore = () => storeState;
  useStore.getState = () => storeState;
  return { useMediaPlayerStore: useStore };
});

vi.mock('@/shared/stores/settings-store', () => ({
  useSettingsStore: () => settingsState,
}));

vi.mock('@/shared/lib/media-extensions', () => ({
  isNativeVideo: vi.fn().mockReturnValue(true),
  getStreamUrl: vi.fn().mockReturnValue('http://mock-stream-url'),
}));

describe('useMediaModalPlayer Integration Test', () => {
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
    (window as { electron?: unknown }).electron = {};

    mockFetchMediaDetails.mockResolvedValue(null);
    mockHarvestMetadata.mockResolvedValue(undefined);
    mockSetFullScreen.mockResolvedValue(undefined);
    mediaUpdateCallback = null;

    storeState.selectedMedia = null;
    storeState.playlist = [];
    storeState.isOpen = false;
    storeState.closeMedia.mockClear();
    storeState.playNext.mockClear();
    storeState.playPrev.mockClear();
    storeState.updateMediaData.mockClear();

    settingsState.autoPlayNext = false;
    settingsState.toggleAutoPlayNext.mockClear();
    settingsState.volume = 0.5;
    settingsState.isMuted = false;
    settingsState.setVolumeState.mockClear();
    settingsState.openInFullscreen = false;

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
    delete (window as { electron?: unknown }).electron;
  });

  const renderAndInit = () => {
    const hook = renderHook(() => useMediaModalPlayer(), { wrapper: createWrapper() });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hook.result.current.videoRef as any).current = videoElement;

    storeState.isOpen = true;
    storeState.selectedMedia = {
      id: 'v1',
      src: 'file://v1.mp4',
      path: '/v1.mp4',
      name: 'v1',
      metadataStatus: 'completed',
    };
    storeState.playlist = [storeState.selectedMedia];

    hook.rerender();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    (videoElement.play as Mock).mockClear();

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
      expect(storeState.closeMedia).toHaveBeenCalled();

      storeState.closeMedia.mockClear();

      act(() => {
        result.current.toggleFullscreen();
      });
      expect(result.current.isFullscreen).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(result.current.isFullscreen).toBe(false);
      expect(storeState.closeMedia).not.toHaveBeenCalled();
    });

    it('should toggle fullscreen on "f" key', () => {
      const { result } = renderAndInit();

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
      });
      expect(result.current.isFullscreen).toBe(true);
      expect(mockSetFullScreen).toHaveBeenCalledWith(true);
    });

    it('should toggle fullscreen without calling system API when electron is not available', () => {
      delete (window as { electron?: unknown }).electron;
      const { result } = renderAndInit();

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(mockSetFullScreen).not.toHaveBeenCalled();
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
        result.current.handleMediaClick(event);
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
        result.current.handleMediaClick(event);
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
        result.current.handleMediaEnded();
      });

      expect(storeState.playNext).toHaveBeenCalled();
    });

    it('should NOT auto-play next if disabled', () => {
      settingsState.autoPlayNext = false;
      const { result } = renderAndInit();

      act(() => {
        result.current.handleMediaEnded();
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
        changedTouches: [{ clientX: 100, clientY: 100 }],
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
        changedTouches: [{ clientX: 200, clientY: 100 }],
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
        changedTouches: [{ clientX: 100, clientY: 200 }],
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

      expect(storeState.closeMedia).toHaveBeenCalled();
    });
  });

  describe('7. Realtime Updates', () => {
    it('should update media data when update event is received', async () => {
      renderAndInit();

      vi.useRealTimers();

      const updatedMediaData = {
        id: 'v1',
        name: 'v1-updated',
        path: '/v1.mp4',
        duration: 120,
      };

      mockFetchMediaDetails.mockResolvedValueOnce(updatedMediaData);

      act(() => {
        if (mediaUpdateCallback) {
          mediaUpdateCallback([{ type: 'update', path: '/v1.mp4' }]);
        }
      });

      await waitFor(() => {
        expect(mockFetchMediaDetails).toHaveBeenCalledWith('/v1.mp4');
        expect(storeState.updateMediaData).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'v1-updated' })
        );
      });
    });
  });
});

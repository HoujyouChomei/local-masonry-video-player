// src/widgets/video-grid/model/interactions/use-mobile-interactions.ts

import { useCallback } from 'react';
import { VideoFile } from '@/shared/types/video';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';

interface UseMobileInteractionsProps {
  videosRef: React.RefObject<VideoFile[]>;
}

export const useMobileInteractions = ({ videosRef }: UseMobileInteractionsProps) => {
  const { openVideo } = useVideoPlayerStore();
  const { isSelectionMode, toggleSelection } = useSelectionStore();

  // モバイルではPointerイベントによるロングプレス判定を行わない
  // (OSネイティブやContextMenuトリガーに任せるため)
  const noop = useCallback(() => {}, []);

  const handleVideoClick = useCallback(
    (video: VideoFile, e: React.MouseEvent) => {
      e.stopPropagation();

      const currentVideos = videosRef.current || [];

      if (isSelectionMode) {
        // 選択モード中はタップで選択トグル
        toggleSelection(video.id);
      } else {
        // 通常時は再生
        openVideo(video, currentVideos);
      }
    },
    [isSelectionMode, toggleSelection, openVideo, videosRef]
  );

  return {
    handleVideoClick,
    handlePointerDown: noop,
    handlePointerMove: noop,
    handlePointerUp: noop,
    handlePointerLeave: noop,
  };
};

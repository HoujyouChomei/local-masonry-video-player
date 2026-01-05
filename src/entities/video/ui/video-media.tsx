// src/entities/video/ui/video-media.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { VideoFile } from '@/shared/types/video';
import { GridStyle } from '@/shared/types/electron';
import { useVideoPlayback } from '../model/use-video-playback';
import { VideoCardOverlay } from './video-card-overlay';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useIsMobile } from '@/shared/lib/use-is-mobile'; // Added

interface VideoMediaProps {
  video: VideoFile;
  inView: boolean;
  elementRef: React.RefObject<HTMLDivElement | null>;
  isHovered: boolean;
  isModalOpen: boolean;
  setAspectRatio: (ratio: number) => void;
  gridStyle: GridStyle;
  isSelectionMode: boolean;
  actionsSlot?: React.ReactNode;
}

export const VideoMedia = React.memo(
  ({
    video,
    inView,
    elementRef,
    isHovered,
    isModalOpen,
    setAspectRatio,
    gridStyle,
    isSelectionMode,
    actionsSlot,
  }: VideoMediaProps) => {
    const {
      videoRef,
      shouldLoadVideo,
      isPlaying,
      isVideoReady,
      duration,
      srcUrl,
      handleLoadedMetadata,
      handleSeeked,
      handleLoadedData,
      handleError,
      handlePlay,
      handlePause,
      handleEnded,
      handleTogglePlay,
    } = useVideoPlayback({
      video,
      inView,
      elementRef,
      isHovered,
      isModalOpen,
      setAspectRatio,
    });

    const isMobile = useIsMobile(); // Added

    const thumbnailUrl = video.thumbnailSrc;
    const shouldRenderImage = true;

    // ▼▼▼ 追加: WebM判定 (拡張子チェック) ▼▼▼
    const isWebM = video.path.toLowerCase().endsWith('.webm');

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;

      // ▼▼▼ 追加: WebMロード成功時の表示制御 ▼▼▼
      // WebMは初期状態で style={{ opacity: 0 }} となっているため、
      // ロードに成功したこのタイミングでインラインスタイルを削除し、
      // CSSクラス (opacity-100) を有効にする。
      if (isWebM) {
        img.style.opacity = '';
      }

      if (img.naturalWidth && img.naturalHeight) {
        const newRatio = img.naturalWidth / img.naturalHeight;
        setAspectRatio(newRatio);
      }
    };

    return (
      <div
        className={cn(
          'relative h-full w-full overflow-hidden bg-black',
          gridStyle === 'modern' && 'rounded-lg'
        )}
      >
        {shouldLoadVideo && (
          <video
            ref={videoRef}
            src={srcUrl}
            className={cn(
              'vertical-align-middle h-full w-full object-cover transition-opacity duration-500',
              shouldLoadVideo && isVideoReady ? 'opacity-100' : 'opacity-0'
            )}
            loop={false}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onLoadedData={handleLoadedData}
            onSeeked={handleSeeked}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
          />
        )}

        {shouldRenderImage ? (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
            // ▼▼▼ 追加: WebMの場合のみ初期値を透明にする（ロード失敗時はそのまま透明＝黒背景） ▼▼▼
            // MP4等は undefined なのでブラウザ標準挙動（ロード失敗時に壊れたアイコンが出る）
            style={isWebM ? { opacity: 0 } : undefined}
            className={cn(
              'pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity',
              shouldLoadVideo && isVideoReady
                ? 'opacity-0 delay-200 duration-500'
                : 'opacity-100 delay-0 duration-0'
            )}
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-white/5 transition-opacity" />
        )}

        {/* ▼▼▼ 修正: モバイル時(!isMobile)はオーバーレイを表示しない ▼▼▼ */}
        {!isSelectionMode && !isMobile && (
          <VideoCardOverlay
            video={video}
            duration={duration}
            actionsSlot={
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleTogglePlay}
                  className="h-7 w-7 rounded-full text-white transition-all hover:scale-110 hover:bg-white/20"
                  title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                >
                  {isPlaying ? (
                    <Pause className="fill-current" size={14} />
                  ) : (
                    <Play className="fill-current" size={14} />
                  )}
                </Button>
                {actionsSlot}
              </>
            }
          />
        )}
      </div>
    );
  }
);

VideoMedia.displayName = 'VideoMedia';

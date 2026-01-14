// src/entities/video/ui/video-media.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { VideoFile } from '@/shared/types/video';
import { GridStyle } from '@/shared/types/electron';
import { useVideoPlayback } from '../model/use-video-playback';
import { VideoCardOverlay } from './video-card-overlay';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

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

    const isMobile = useIsMobile();

    const thumbnailUrl = video.thumbnailSrc;
    const shouldRenderImage = true;

    const isWebM = video.path.toLowerCase().endsWith('.webm');

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;

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

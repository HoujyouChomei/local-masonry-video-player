// src/entities/media/ui/media-element.tsx

import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Media } from '@/shared/schemas/media';
import { GridStyle } from '@/shared/types/electron';
import { useMediaPreview } from '../model/use-media-preview';
import { MediaCardOverlay } from './media-card-overlay';
import { Button } from '@/shared/ui/shadcn/button';
import { Play, Pause } from 'lucide-react';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface MediaElementProps {
  media: Media;
  inView: boolean;
  elementRef: React.RefObject<HTMLDivElement | null>;
  isHovered: boolean;
  isModalOpen: boolean;
  setAspectRatio: (ratio: number) => void;
  gridStyle: GridStyle;
  isSelectionMode: boolean;
  actionsSlot?: React.ReactNode;
}

export const MediaElement = React.memo(
  ({
    media,
    inView,
    elementRef,
    isHovered,
    isModalOpen,
    setAspectRatio,
    gridStyle,
    isSelectionMode,
    actionsSlot,
  }: MediaElementProps) => {
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
    } = useMediaPreview({
      media,
      inView,
      elementRef,
      isHovered,
      isModalOpen,
      setAspectRatio,
    });

    const isMobile = useIsMobile();

    const thumbnailUrl = media.thumbnailSrc;
    const shouldRenderImage = true;

    const isWebM = media.path.toLowerCase().endsWith('.webm');

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
          gridStyle === 'standard' && 'rounded-lg'
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
          <MediaCardOverlay
            media={media}
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

MediaElement.displayName = 'MediaElement';

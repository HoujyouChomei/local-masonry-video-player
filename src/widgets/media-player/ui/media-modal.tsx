// src/widgets/media-player/ui/media-modal.tsx

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { useMediaModalPlayer } from '@/widgets/media-player/model/use-media-modal-player';
import { ContextMenu, ContextMenuTrigger } from '@/shared/ui/shadcn/context-menu';
import { RenameMediaDialog } from '@/features/rename-media/ui/rename-media-dialog';
import { MediaModalFooter } from './media-modal-footer';
import { MediaMetadataPanel } from './media-metadata-panel';
import { useMediaPlayerStore } from '@/entities/player/model/store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { Media } from '@/shared/schemas/media';
import { ContextMenuRenderer } from '@/shared/types/ui';

interface PlayerHeaderButtonsProps {
  isFullscreen: boolean;
  isMobile: boolean;
  showCloseButton: boolean;
  showFullscreenToggle: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

const PlayerHeaderButtons = React.memo(
  ({
    isFullscreen,
    isMobile,
    showCloseButton,
    showFullscreenToggle,
    onToggleFullscreen,
    onClose,
  }: PlayerHeaderButtonsProps) => (
    <div className="pointer-events-none absolute inset-0 z-10">
      {showFullscreenToggle && (
        <div className="pointer-events-auto absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      )}

      {showCloseButton && (
        <div
          className={cn(
            'pointer-events-auto absolute top-4',
            isMobile ? 'right-4' : 'left-1/2 -translate-x-1/2'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
);
PlayerHeaderButtons.displayName = 'PlayerHeaderButtons';

interface MainPlayerScreenProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src: string;
  showControls: boolean;
  autoPlayNext: boolean;
  isFullscreen: boolean;
  onMouseMove: () => void;
  onMouseLeave: () => void;
  onContextMenu: () => void;
  onDoubleClick: () => void;
  onVolumeChange: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded: () => void;
  onClick: (e: React.MouseEvent<HTMLVideoElement>) => void;
  onError: () => void;
}

const MainPlayerScreen = React.memo(
  ({
    videoRef,
    src,
    showControls,
    autoPlayNext,
    isFullscreen,
    onMouseMove,
    onMouseLeave,
    onContextMenu,
    onDoubleClick,
    onVolumeChange,
    onEnded,
    onClick,
    onError,
  }: MainPlayerScreenProps) => (
    <div
      className={cn('relative w-full bg-black', isFullscreen ? 'h-full' : 'aspect-video')}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <video
        key="main-player"
        ref={videoRef}
        src={src}
        className={cn('h-full w-full object-contain', !showControls && 'hide-native-controls')}
        controls={showControls}
        controlsList="nodownload nofullscreen"
        autoPlay
        loop={!autoPlayNext}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onVolumeChange={onVolumeChange}
        onEnded={onEnded}
        onClick={onClick}
        onError={onError}
      />
    </div>
  )
);
MainPlayerScreen.displayName = 'MainPlayerScreen';

interface InfoSidePanelProps {
  media: Media;
  onClick: (e: React.MouseEvent) => void;
}

const InfoSidePanel = React.memo(({ media, onClick }: InfoSidePanelProps) => (
  <div
    className="animate-in fade-in slide-in-from-left-2 absolute top-0 left-full z-50 ml-4 h-full duration-200"
    onClick={onClick}
  >
    <MediaMetadataPanel media={media} />
  </div>
));
InfoSidePanel.displayName = 'InfoSidePanel';

interface PreloadPlayerProps {
  url?: string;
}

const PreloadPlayer = React.memo(({ url }: PreloadPlayerProps) => {
  if (!url) return null;
  return <video key={url} src={url} className="hidden" preload="auto" muted width="0" height="0" />;
});
PreloadPlayer.displayName = 'PreloadPlayer';

interface MediaModalProps {
  renderContextMenu?: ContextMenuRenderer;
}

export const MediaModal = ({ renderContextMenu }: MediaModalProps) => {
  const {
    selectedMedia,
    isOpen,
    showControls,
    autoPlayNext,
    videoRef,
    currentSrc,
    isFullscreen,
    toggleFullscreen,
    handleDoubleClick,
    closeMedia,
    playNext,
    playPrev,
    toggleAutoPlayNext,
    handleMouseMove,
    handleMouseLeave,
    handleContextMenu,
    handleVolumeChange,
    handleMediaClick,
    handleMediaEnded,
    handleError,
    isInfoPanelOpen,
    toggleInfoPanel,
    isContentHidden,
    handleTouchStart,
    handleTouchEnd,
  } = useMediaModalPlayer();

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const { playlist } = useMediaPlayerStore();
  const { openInFullscreen } = useSettingsStore();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleContainerMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      handleMouseMove();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const isNearTop = event.clientY - rect.top <= 48;
      setShowCloseButton(isNearTop);
    },
    [handleMouseMove]
  );

  const handleContainerMouseLeave = useCallback(() => {
    handleMouseLeave();
    setShowCloseButton(false);
  }, [handleMouseLeave]);

  const nextVideoUrl = useMemo(() => {
    if (!selectedMedia || playlist.length === 0) return undefined;

    const currentIndex = playlist.findIndex((v) => v.id === selectedMedia.id);
    if (currentIndex === -1) return undefined;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextVideo = playlist[nextIndex];

    return nextVideo.src;
  }, [selectedMedia, playlist]);

  if (!isOpen || !selectedMedia) return null;

  const contextMenu = renderContextMenu
    ? renderContextMenu({
        media: selectedMedia,
        onRename: () => setIsRenameOpen(true),
        enablePlaybackControls: true,
      })
    : null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200',
        isContentHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
    >
      <div onClick={closeMedia} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      <div className={cn('relative', isFullscreen ? 'h-full w-full' : 'mx-4 w-full max-w-6xl')}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                'relative z-50 overflow-hidden bg-gray-950 shadow-2xl ring-1 ring-white/10',
                isFullscreen
                  ? 'fixed inset-0 h-full w-full max-w-none rounded-none'
                  : 'h-auto w-full rounded-xl'
              )}
              data-testid="media-modal-container"
              ref={containerRef}
              onMouseMove={handleContainerMouseMove}
              onMouseLeave={handleContainerMouseLeave}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <PlayerHeaderButtons
                isFullscreen={isFullscreen}
                isMobile={isMobile}
                showCloseButton={isMobile ? true : showCloseButton}
                showFullscreenToggle={!(openInFullscreen && isFullscreen)}
                onToggleFullscreen={toggleFullscreen}
                onClose={closeMedia}
              />

              <MainPlayerScreen
                videoRef={videoRef}
                src={currentSrc}
                showControls={showControls}
                autoPlayNext={autoPlayNext}
                isFullscreen={isFullscreen}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleDoubleClick}
                onVolumeChange={handleVolumeChange}
                onEnded={handleMediaEnded}
                onClick={handleMediaClick}
                onError={handleError}
              />

              {!isFullscreen && (
                <MediaModalFooter
                  media={selectedMedia}
                  autoPlayNext={autoPlayNext}
                  isInfoPanelOpen={isInfoPanelOpen}
                  onPlayPrev={playPrev}
                  onPlayNext={playNext}
                  onToggleAutoPlayNext={toggleAutoPlayNext}
                  onToggleInfoPanel={toggleInfoPanel}
                />
              )}
            </div>
          </ContextMenuTrigger>

          {contextMenu}
        </ContextMenu>

        {!isFullscreen && isInfoPanelOpen && (
          <InfoSidePanel media={selectedMedia} onClick={(e) => e.stopPropagation()} />
        )}
      </div>

      <PreloadPlayer url={nextVideoUrl} />

      {isRenameOpen && (
        <RenameMediaDialog
          isOpen={isRenameOpen}
          onOpenChange={setIsRenameOpen}
          mediaId={selectedMedia.id}
          mediaName={selectedMedia.name}
        />
      )}
    </div>
  );
};

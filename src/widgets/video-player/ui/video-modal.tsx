// src/widgets/video-player/ui/video-modal.tsx

import React, { useState, useMemo } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVideoModalPlayer } from '@/widgets/video-player/model/use-video-modal-player';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { VideoContextMenu } from '@/widgets/video-menu/ui/video-context-menu';
import { RenameVideoDialog } from '@/features/rename-video/ui/rename-video-dialog';
import { VideoModalFooter } from './video-modal-footer';
import { VideoMetadataPanel } from './video-metadata-panel';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { VideoFile } from '@/shared/types/video';

interface PlayerHeaderButtonsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

const PlayerHeaderButtons = React.memo(
  ({ isFullscreen, onToggleFullscreen, onClose }: PlayerHeaderButtonsProps) => (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleFullscreen}
        className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
        title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </Button>

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
  video: VideoFile;
  onClick: (e: React.MouseEvent) => void;
}

const InfoSidePanel = React.memo(({ video, onClick }: InfoSidePanelProps) => (
  <div
    className="animate-in fade-in slide-in-from-left-2 absolute top-0 left-full z-50 ml-4 h-full duration-200"
    onClick={onClick}
  >
    <VideoMetadataPanel video={video} />
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

export const VideoModal = () => {
  const {
    selectedVideo,
    isOpen,
    showControls,
    autoPlayNext,
    videoRef,
    currentSrc,
    isFullscreen,
    toggleFullscreen,
    handleDoubleClick,
    closeVideo,
    playNext,
    playPrev,
    toggleAutoPlayNext,
    handleMouseMove,
    handleMouseLeave,
    handleContextMenu,
    handleVolumeChange,
    handleVideoClick,
    handleVideoEnded,
    handleError,
    isInfoPanelOpen,
    toggleInfoPanel,
    isContentHidden,
    handleTouchStart,
    handleTouchEnd,
  } = useVideoModalPlayer();

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const { playlist } = useVideoPlayerStore();

  const nextVideoUrl = useMemo(() => {
    if (!selectedVideo || playlist.length === 0) return undefined;

    const currentIndex = playlist.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex === -1) return undefined;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextVideo = playlist[nextIndex];

    return nextVideo.src;
  }, [selectedVideo, playlist]);

  if (!isOpen || !selectedVideo) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200',
        isContentHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
    >
      <div onClick={closeVideo} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

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
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <PlayerHeaderButtons
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                onClose={closeVideo}
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
                onEnded={handleVideoEnded}
                onClick={handleVideoClick}
                onError={handleError}
              />

              {!isFullscreen && (
                <VideoModalFooter
                  video={selectedVideo}
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

          <VideoContextMenu
            video={selectedVideo}
            onRename={() => setIsRenameOpen(true)}
            enablePlaybackControls={true}
          />
        </ContextMenu>

        {!isFullscreen && isInfoPanelOpen && (
          <InfoSidePanel video={selectedVideo} onClick={(e) => e.stopPropagation()} />
        )}
      </div>

      <PreloadPlayer url={nextVideoUrl} />

      {isRenameOpen && (
        <RenameVideoDialog
          isOpen={isRenameOpen}
          onOpenChange={setIsRenameOpen}
          videoId={selectedVideo.id}
          videoName={selectedVideo.name}
        />
      )}
    </div>
  );
};

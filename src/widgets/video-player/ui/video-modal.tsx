// src/widgets/video-player/ui/video-modal.tsx

import { useState, useMemo } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVideoModalPlayer } from '@/widgets/video-player/model/use-video-modal-player';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { VideoContextMenu } from '@/widgets/video-menu/ui/video-context-menu';
import { RenameVideoDialog } from '@/features/rename-video/ui/rename-video-dialog';
import { VideoModalFooter } from './video-modal-footer';
import { VideoMetadataPanel } from './video-metadata-panel';
// ▼▼▼ 追加インポート ▼▼▼
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { isNativeVideo, getStreamUrl } from '@/shared/lib/video-extensions';

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
    // Touch Handlers
    handleTouchStart,
    handleTouchEnd,
  } = useVideoModalPlayer();

  const [isRenameOpen, setIsRenameOpen] = useState(false);

  // ▼▼▼ 追加: 次の動画のURLを特定するロジック ▼▼▼
  const { playlist } = useVideoPlayerStore();

  const nextVideoUrl = useMemo(() => {
    if (!selectedVideo || playlist.length === 0) return undefined;

    const currentIndex = playlist.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex === -1) return undefined;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextVideo = playlist[nextIndex];

    // URL決定ロジック:
    // 1. ネイティブ対応、またはWeb版(http...)なら src をそのまま使用
    //    (Web版のHttpClientは src に適切なURLとトークンをセット済み)
    if (isNativeVideo(nextVideo.path) || nextVideo.src.startsWith('http')) {
      return nextVideo.src;
    }

    // 2. Electron版で非ネイティブならストリーム用URLを生成 (トランスコード用)
    return getStreamUrl(nextVideo.thumbnailSrc, nextVideo.path);
  }, [selectedVideo, playlist]);
  // ▲▲▲ 追加ここまで ▲▲▲

  if (!isOpen || !selectedVideo) return null;

  const shouldBeFullscreen = isFullscreen;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200',
        isContentHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
    >
      {/* Backdrop */}
      <div onClick={closeVideo} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Wrapper */}
      <div
        className={cn('relative', shouldBeFullscreen ? 'h-full w-full' : 'mx-4 w-full max-w-6xl')}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {/* Modal Content (Main) */}
            <div
              className={cn(
                'relative z-50 overflow-hidden bg-gray-950 shadow-2xl ring-1 ring-white/10',
                shouldBeFullscreen
                  ? 'fixed inset-0 h-full w-full max-w-none rounded-none'
                  : 'h-auto w-full rounded-xl'
              )}
              onClick={(e) => e.stopPropagation()}
              // ▼▼▼ Attach Touch Handlers Here ▼▼▼
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Close Button / Fullscreen Toggle */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeVideo}
                  className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Video Player */}
              <div
                className={cn(
                  'relative w-full bg-black',
                  shouldBeFullscreen ? 'h-full' : 'aspect-video'
                )}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleDoubleClick}
              >
                <video
                  // ▼▼▼ 変更: keyを固定文字列にしてDOM再利用を強制 ▼▼▼
                  key="main-player"
                  ref={videoRef}
                  src={currentSrc}
                  className={cn(
                    'h-full w-full object-contain',
                    !showControls && 'hide-native-controls'
                  )}
                  controls={showControls}
                  controlsList="nodownload nofullscreen"
                  autoPlay
                  loop={!autoPlayNext}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onVolumeChange={handleVolumeChange}
                  onEnded={handleVideoEnded}
                  onClick={handleVideoClick}
                  onError={handleError}
                />
              </div>

              {/* Metadata Footer: モバイル以外、かつ非フルスクリーン時のみ表示 */}
              {!shouldBeFullscreen && (
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

        {/* Side Panel (Separate) */}
        {!shouldBeFullscreen && isInfoPanelOpen && (
          <div
            className="animate-in fade-in slide-in-from-left-2 absolute top-0 left-full z-50 ml-4 h-full duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <VideoMetadataPanel video={selectedVideo} />
          </div>
        )}
      </div>

      {/* ▼▼▼ 追加: 次の動画を裏で読み込むための隠しプレイヤー ▼▼▼ */}
      {nextVideoUrl && (
        <video
          key={nextVideoUrl} // URLが変わるたびにリセット
          src={nextVideoUrl}
          className="hidden"
          preload="auto"
          muted
          width="0"
          height="0"
        />
      )}

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

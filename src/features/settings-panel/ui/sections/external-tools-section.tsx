// src/features/settings-panel/ui/sections/external-tools-section.tsx

import { useState, useEffect } from 'react';
import { FileCog, FolderOpen, CheckCircle, XCircle, Trash2, Download, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { api } from '@/shared/api';
import { useMediaCache } from '@/shared/lib/use-media-cache';
import { toast } from 'sonner';

interface ExternalToolsSectionProps {
  isFFmpegValid: boolean | null;
  isFFprobeValid: boolean | null;
  setIsFFmpegValid: (valid: boolean | null) => void;
  setIsFFprobeValid: (valid: boolean | null) => void;
}

export const ExternalToolsSection = ({
  isFFmpegValid,
  isFFprobeValid,
  setIsFFmpegValid,
  setIsFFprobeValid,
}: ExternalToolsSectionProps) => {
  const { ffmpegPath, setFFmpegPath, ffprobePath, setFFprobePath } = useSettingsStore();
  const { invalidateAllMediaLists } = useMediaCache();
  
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStatus, setInstallStatus] = useState('');

  useEffect(() => {
    if (!isInstalling) return;

    const unsubscribe = api.system.onInstallProgress((data) => {
      setInstallProgress(data.progress);
      setInstallStatus(data.status);
    });

    return () => {
      unsubscribe();
    };
  }, [isInstalling]);

  const refreshMediaList = () => {
    invalidateAllMediaLists();
  };

  const handleSelectFFmpeg = async () => {
    const path = await api.system.selectFile();
    if (path) {
      const valid = await setFFmpegPath(path);
      setIsFFmpegValid(valid);
      if (valid) refreshMediaList();
    }
  };

  const handleClearFFmpeg = async () => {
    await setFFmpegPath('');
    setIsFFmpegValid(null);
    refreshMediaList();
  };

  const handleSelectFFprobe = async () => {
    const path = await api.system.selectFile();
    if (path) {
      const valid = await setFFprobePath(path);
      setIsFFprobeValid(valid);
      if (valid) refreshMediaList();
    }
  };

  const handleClearFFprobe = async () => {
    await setFFprobePath('');
    setIsFFprobeValid(null);
    refreshMediaList();
  };

  const handleAutoInstall = async () => {
    if (
      !confirm(
        'Download FFmpeg from official GitHub releases (BtbN/FFmpeg-Builds)?\n\nThis will download (~40MB) and configure FFmpeg for this app automatically.'
      )
    ) {
      return;
    }

    setIsInstalling(true);
    setInstallProgress(0);
    setInstallStatus('Starting...');
    
    const toastId = toast.loading('Installing FFmpeg...', {
      description: 'Starting download...',
    });

    const updateInterval = setInterval(() => {
      if (installStatus) {
        toast.loading(`Installing FFmpeg: ${installProgress}%`, {
          id: toastId,
          description: installStatus
        });
      }
    }, 500);

    try {
      const result = await api.system.installFFmpeg();
      clearInterval(updateInterval);

      if (result.success) {
        toast.success('FFmpeg installed successfully!', { id: toastId });
        
        const settings = await api.settings.get();
        if (settings.ffmpegPath) {
          await setFFmpegPath(settings.ffmpegPath);
          setIsFFmpegValid(true);
        }
        if (settings.ffprobePath) {
          await setFFprobePath(settings.ffprobePath);
          setIsFFprobeValid(true);
        }
        refreshMediaList();
      } else {
        toast.error('Installation failed', {
          id: toastId,
          description: result.error,
        });
      }
    } catch (error) {
      clearInterval(updateInterval);
      toast.error('Installation failed', { id: toastId });
      console.error(error);
    } finally {
      setIsInstalling(false);
      setInstallProgress(0);
      setInstallStatus('');
    }
  };

  return (
    <div className="border-border/40 space-y-4 border-t pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
          <FileCog size={12} /> EXTERNAL TOOLS
        </h3>
        {!isFFmpegValid && !isInstalling && (
          <Button
            variant="secondary"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={handleAutoInstall}
          >
            <Download size={10} />
            Auto Install
          </Button>
        )}
      </div>

      {isInstalling && (
        <div className="bg-muted/30 rounded-md border p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Loader2 size={10} className="animate-spin" />
              {installStatus}
            </span>
            <span className="font-mono">{installProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>FFmpeg Binary</span>
          {ffmpegPath ? (
            isFFmpegValid ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle size={10} /> Valid
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle size={10} /> Invalid
              </span>
            )
          ) : (
            <span className="text-muted-foreground italic">Not set</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={ffmpegPath}
            readOnly
            placeholder="Path to ffmpeg"
            className="bg-muted/50 h-8 font-mono text-xs"
          />
          {ffmpegPath ? (
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 shrink-0"
              onClick={handleClearFFmpeg}
              disabled={isInstalling}
              title="Clear Path"
            >
              <Trash2 size={14} />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSelectFFmpeg}
              disabled={isInstalling}
            >
              <FolderOpen size={14} />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>FFprobe Binary</span>
          {ffprobePath ? (
            isFFprobeValid ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle size={10} /> Valid
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle size={10} /> Invalid
              </span>
            )
          ) : (
            <span className="text-muted-foreground italic">Not set</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={ffprobePath}
            readOnly
            placeholder="Path to ffprobe"
            className="bg-muted/50 h-8 font-mono text-xs"
          />
          {ffprobePath ? (
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 shrink-0"
              onClick={handleClearFFprobe}
              disabled={isInstalling}
              title="Clear Path"
            >
              <Trash2 size={14} />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSelectFFprobe}
              disabled={isInstalling}
            >
              <FolderOpen size={14} />
            </Button>
          )}
        </div>
      </div>

      <div className="text-muted-foreground text-[10px]">
        Required for playback of formats other than MP4/WebM.
      </div>
    </div>
  );
};
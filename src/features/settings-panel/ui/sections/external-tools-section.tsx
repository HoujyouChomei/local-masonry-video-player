import React from 'react';
import { FileCog, FolderOpen, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { selectFileApi } from '@/shared/api/electron';

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
  const queryClient = useQueryClient();

  const refreshVideoList = () => {
    queryClient.invalidateQueries({ queryKey: ['videos'] });
  };

  const handleSelectFFmpeg = async () => {
    const path = await selectFileApi();
    if (path) {
      const valid = await setFFmpegPath(path);
      setIsFFmpegValid(valid);
      if (valid) refreshVideoList();
    }
  };

  const handleClearFFmpeg = async () => {
    await setFFmpegPath('');
    setIsFFmpegValid(null);
    refreshVideoList();
  };

  const handleSelectFFprobe = async () => {
    const path = await selectFileApi();
    if (path) {
      const valid = await setFFprobePath(path);
      setIsFFprobeValid(valid);
      if (valid) refreshVideoList();
    }
  };

  const handleClearFFprobe = async () => {
    await setFFprobePath('');
    setIsFFprobeValid(null);
    refreshVideoList();
  };

  return (
    <div className="border-border/40 space-y-4 border-t pt-2">
      <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
        <FileCog size={12} /> EXTERNAL TOOLS
      </h3>

      {/* FFmpeg Path */}
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
            >
              <FolderOpen size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* FFprobe Path */}
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

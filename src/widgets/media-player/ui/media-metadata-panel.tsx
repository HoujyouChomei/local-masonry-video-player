// src/widgets/media-player/ui/media-metadata-panel.tsx

import { useMemo } from 'react';
import { ScrollArea } from '@/shared/ui/shadcn/scroll-area';
import { cn } from '@/shared/lib/utils';
import { Media } from '@/shared/schemas/media';

interface MediaMetadataPanelProps {
  media: Media;
  className?: string;
}

const deepParse = (data: unknown): unknown => {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        return deepParse(parsed);
      }
      return parsed;
    } catch {
      return data;
    }
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => deepParse(item));
    }

    const objectData = data as Record<string, unknown>;
    const nextData: Record<string, unknown> = {};

    for (const key in objectData) {
      if (Object.prototype.hasOwnProperty.call(objectData, key)) {
        nextData[key] = deepParse(objectData[key]);
      }
    }
    return nextData;
  }

  return data;
};

export const MediaMetadataPanel = ({ media, className }: MediaMetadataPanelProps) => {
  const formattedParams = useMemo(() => {
    if (!media.generationParams) return null;

    try {
      const parsed = JSON.parse(media.generationParams);

      const cleaned = deepParse(parsed);

      if (typeof cleaned === 'object' && cleaned !== null && Object.keys(cleaned).length === 0) {
        return null;
      }

      return JSON.stringify(cleaned, null, 2);
    } catch {
      return media.generationParams;
    }
  }, [media.generationParams]);

  return (
    <div
      data-no-wheel-nav="true"
      className={cn(
        'flex h-full w-80 flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-950/95 shadow-2xl backdrop-blur-md',
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-200">Metadata</h3>
      </div>

      <ScrollArea className="min-h-0 w-full flex-1">
        <div className="p-4">
          {formattedParams ? (
            <pre className="font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-blue-100 select-text">
              {formattedParams}
            </pre>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500 italic">
              {media.metadataStatus === 'processing'
                ? 'Harvesting metadata...'
                : 'No metadata found.'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

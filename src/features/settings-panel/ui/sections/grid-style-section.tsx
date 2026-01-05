import { LayoutTemplate } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { cn } from '@/lib/utils';
import { GridStyle } from '@/shared/types/electron';

export const GridStyleSection = () => {
  const { gridStyle, setGridStyle } = useSettingsStore();

  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
        <LayoutTemplate size={12} /> GRID STYLE
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {(['modern', 'mosaic'] as GridStyle[]).map((style) => (
          <button
            key={style}
            onClick={() => setGridStyle(style)}
            className={cn(
              'hover:bg-accent flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-xs transition-all',
              gridStyle === style
                ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                : 'border-border text-muted-foreground bg-transparent'
            )}
          >
            <span className="capitalize">{style}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

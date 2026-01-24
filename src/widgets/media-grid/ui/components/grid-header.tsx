// src/widgets/media-grid/ui/components/grid-header.tsx

import { Hash, Calendar, Clock, HardDrive } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useUIStore } from '@/shared/stores/ui-store';

export const GridHeader = () => {
  const isHeaderVisible = useUIStore((state) => state.isHeaderVisible);

  return (
    <div
      className={cn(
        'bg-background text-muted-foreground sticky z-20 mb-2 grid grid-cols-[50px_80px_1fr_1fr_1fr_1fr] gap-4 border-b border-white/10 py-2 text-xs font-semibold tracking-wider uppercase',
        'transition-[top] duration-300 ease-in-out',
        isHeaderVisible ? 'top-16' : 'top-0'
      )}
    >
      <div className="flex justify-center">
        <Hash size={14} />
      </div>
      <div></div>
      <div>Title</div>
      <div>
        <Calendar size={14} className="mr-1 inline" />
        Date
      </div>
      <div className="text-right">
        <Clock size={14} className="mr-1 inline" />
        Time
      </div>
      <div className="text-right">
        <HardDrive size={14} className="mr-1 inline" />
        Size
      </div>
    </div>
  );
};

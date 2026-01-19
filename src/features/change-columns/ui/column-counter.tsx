// src/features/change-columns/ui/column-counter.tsx

import { Minus, Plus, Grid2x2, RectangleVertical } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface ColumnCounterProps {
  className?: string;
}

export const ColumnCounter = ({ className }: ColumnCounterProps) => {
  const { columnCount, setColumnCount, mobileColumnCount, setMobileColumnCount } =
    useSettingsStore();

  const isMobile = useIsMobile();

  const MIN_COLUMNS = 1;
  const MAX_COLUMNS = 10;

  const handleDecrease = () => {
    if (columnCount > MIN_COLUMNS) {
      setColumnCount(columnCount - 1);
    }
  };

  const handleIncrease = () => {
    if (columnCount < MAX_COLUMNS) {
      setColumnCount(columnCount + 1);
    }
  };

  const toggleMobileColumns = () => {
    const next = mobileColumnCount === 1 ? 2 : 1;
    setMobileColumnCount(next);
  };

  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileColumns}
        className={cn('text-muted-foreground hover:text-foreground', className)}
        title={mobileColumnCount === 1 ? 'Current: 1 Column' : 'Current: 2 Columns'}
      >
        {mobileColumnCount === 1 ? <RectangleVertical size={20} /> : <Grid2x2 size={20} />}
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrease}
        disabled={columnCount <= MIN_COLUMNS}
        className="text-muted-foreground hover:text-foreground h-8 w-8"
        title="Less Columns"
      >
        <Minus size={14} />
      </Button>

      <span className="min-w-6 text-center font-mono text-sm font-medium">{columnCount}</span>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrease}
        disabled={columnCount >= MAX_COLUMNS}
        className="text-muted-foreground hover:text-foreground h-8 w-8"
        title="More Columns"
      >
        <Plus size={14} />
      </Button>
    </div>
  );
};

// src/features/filter-favorites/ui/favorites-toggle.tsx

import { Heart } from 'lucide-react';
import { useUIStore } from '@/shared/stores/ui-store'; // 変更
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FavoritesToggle = () => {
  const { showFavoritesOnly, toggleShowFavoritesOnly } = useUIStore(); // 変更

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleShowFavoritesOnly}
      className={cn(
        'transition-all duration-300',
        showFavoritesOnly
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600'
          : 'text-muted-foreground hover:text-white'
      )}
      title={showFavoritesOnly ? 'Show All Videos' : 'Show Favorites Only'}
    >
      <Heart
        className={cn('h-5 w-5 transition-all', showFavoritesOnly && 'scale-110 fill-current')}
      />
    </Button>
  );
};

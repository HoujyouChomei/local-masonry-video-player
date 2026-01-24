// src/features/filter-favorites/ui/global-favorites-button.tsx

import { Star } from 'lucide-react';
import { useUIStore } from '@/shared/stores/ui-store';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';

export const GlobalFavoritesButton = () => {
  const { viewMode, setViewMode } = useUIStore();
  const isGlobalMode = viewMode === 'all-favorites';

  const handleClick = () => {
    setViewMode(isGlobalMode ? 'folder' : 'all-favorites');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        'transition-all duration-300',
        isGlobalMode
          ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 hover:text-yellow-600'
          : 'text-muted-foreground hover:text-white'
      )}
      title={isGlobalMode ? 'Back to Folder' : 'Show All Favorites (Global)'}
    >
      <Star className={cn('h-5 w-5 transition-all', isGlobalMode && 'scale-110 fill-current')} />
    </Button>
  );
};

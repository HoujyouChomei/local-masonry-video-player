// src/features/toggle-favorite/ui/favorite-button.tsx

import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../model/use-favorite';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/shadcn/button';

interface FavoriteButtonProps {
  mediaId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const FavoriteButton = ({ mediaId, className, size = 'default' }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(mediaId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(mediaId);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        'rounded-full transition-transform hover:bg-black/20 focus:scale-110 active:scale-90',
        active ? 'text-red-500 hover:text-red-600' : 'text-white/70 hover:text-white',
        className
      )}
      title={active ? 'Remove from Favorites' : 'Add to Favorites'}
    >
      <Heart
        className={cn(
          size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5',
          active && 'fill-current'
        )}
      />
    </Button>
  );
};

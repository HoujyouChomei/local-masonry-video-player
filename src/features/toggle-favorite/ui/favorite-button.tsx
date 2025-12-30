// src/features/toggle-favorite/ui/favorite-button.tsx

'use client';

import React from 'react';
import { Heart } from 'lucide-react';
// ★ 削除: framer-motion imports
import { useFavorites } from '../model/use-favorite';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FavoriteButtonProps {
  filePath: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const FavoriteButton = ({ filePath, className, size = 'default' }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(filePath);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(filePath);
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
      {/* ★ 修正: motion.div を削除し、直接アイコンを描画 */}
      <Heart
        className={cn(
          size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5',
          active && 'fill-current'
        )}
      />
    </Button>
  );
};

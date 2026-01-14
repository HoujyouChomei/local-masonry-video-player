// src/widgets/video-player/model/use-player-gestures.ts

import { useRef, useCallback } from 'react';

interface UsePlayerGesturesProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export const usePlayerGestures = ({ onSwipeLeft, onSwipeRight }: UsePlayerGesturesProps) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const diffY = e.changedTouches[0].clientY - touchStartRef.current.y;

      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }

      touchStartRef.current = null;
    },
    [onSwipeLeft, onSwipeRight]
  );

  return {
    handleTouchStart,
    handleTouchEnd,
  };
};

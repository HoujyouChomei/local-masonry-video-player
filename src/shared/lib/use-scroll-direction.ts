import { useEffect, useRef } from 'react';
import { useUIStore } from '@/shared/stores/ui-store';

export const useScrollDirection = () => {
  const setScrollDirection = useUIStore((state) => state.setScrollDirection);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDir = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY.current;

      if (Math.abs(diff) > 5) {
        const direction = diff > 0 ? 'down' : 'up';
        const currentDir = useUIStore.getState().scrollDirection;

        if (currentDir !== direction) {
          setScrollDirection(direction);
        }
        lastScrollY.current = scrollY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollDirection]);
};

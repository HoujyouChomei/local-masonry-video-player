// src/shared/lib/use-scroll-direction.ts

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/shared/stores/ui-store';

export const useScrollDirection = () => {
  const setScrollDirection = useUIStore((state) => state.setScrollDirection);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

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
      if (!document.body.classList.contains('is-scrolling')) {
        document.body.classList.add('is-scrolling');
      }

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150);

      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      document.body.classList.remove('is-scrolling');
    };
  }, [setScrollDirection]);
};

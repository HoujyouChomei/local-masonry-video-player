// src/features/scrollbar-manager/ui/scrollbar-manager.tsx

'use client';

import { useEffect, useRef } from 'react';

export const ScrollbarManager = () => {
  // 現在の状態を保持するRef
  const isShownRef = useRef(false);

  useEffect(() => {
    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const threshold = 50;
          const isRightEdge = e.clientX >= window.innerWidth - threshold;

          // ★ 修正: 状態が変化した時だけDOMを操作する
          if (isRightEdge !== isShownRef.current) {
            if (isRightEdge) {
              document.body.classList.add('show-scrollbar');
            } else {
              document.body.classList.remove('show-scrollbar');
            }
            isShownRef.current = isRightEdge;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.classList.remove('show-scrollbar');
    };
  }, []);

  return null;
};

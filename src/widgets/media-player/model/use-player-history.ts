// src/widgets/media-player/model/use-player-history.ts

import { useEffect, useRef } from 'react';

export const usePlayerHistory = (isOpen: boolean, closeMedia: () => void) => {
  const isHistoryPushedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!isHistoryPushedRef.current) {
        window.history.pushState({ modalOpen: true }, '');
        isHistoryPushedRef.current = true;
      }

      const handlePopState = (_event: PopStateEvent) => {
        isHistoryPushedRef.current = false;
        closeMedia();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (isHistoryPushedRef.current) {
          isHistoryPushedRef.current = false;
          window.history.back();
        }
      };
    } else {
      isHistoryPushedRef.current = false;
    }
  }, [isOpen, closeMedia]);
};

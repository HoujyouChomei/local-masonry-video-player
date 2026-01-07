// src/widgets/video-player/model/use-player-history.ts

import { useEffect, useRef } from 'react';

export const usePlayerHistory = (isOpen: boolean, closeVideo: () => void) => {
  const isHistoryPushedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!isHistoryPushedRef.current) {
        window.history.pushState({ modalOpen: true }, '');
        isHistoryPushedRef.current = true;
      }

      const handlePopState = (_event: PopStateEvent) => {
        // ブラウザの戻るボタンが押されたらフラグを下ろして閉じる
        isHistoryPushedRef.current = false;
        closeVideo();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        // コンポーネントがアンマウントされる（閉じる）際、
        // まだ履歴が残っていれば戻る（＝履歴をクリーンにする）
        if (isHistoryPushedRef.current) {
          isHistoryPushedRef.current = false;
          window.history.back();
        }
      };
    } else {
      isHistoryPushedRef.current = false;
    }
  }, [isOpen, closeVideo]);
};

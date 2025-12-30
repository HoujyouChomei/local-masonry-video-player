import { useMemo } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';

export const useDynamicRootMargin = () => {
  const settingsRootMargin = useSettingsStore((state) => state.rootMargin);
  const scrollDirection = useUIStore((state) => state.scrollDirection);

  // 逆方向のバッファ（狭くする距離）
  const BACKWARD_BUFFER = 100;

  return useMemo(() => {
    // スクロールしていない時（初期状態など）は、安全のため上下とも広く取る
    if (scrollDirection === 'none') {
      return `${settingsRootMargin}px 0px ${settingsRootMargin}px 0px`;
    }

    // 下にスクロール中 (↓)
    // 上(Top)は通り過ぎる方向なので狭く(100px)、下(Bottom)はこれから見るので広く(1000px)
    if (scrollDirection === 'down') {
      return `${BACKWARD_BUFFER}px 0px ${settingsRootMargin}px 0px`;
    }

    // 上にスクロール中 (↑)
    // 上(Top)はこれから見るので広く、下(Bottom)は通り過ぎるので狭く
    return `${settingsRootMargin}px 0px ${BACKWARD_BUFFER}px 0px`;
  }, [settingsRootMargin, scrollDirection]);
};

// src/features/sort-videos/lib/utils.ts

import { VideoFile, SortOption } from '@/shared/types/video';

export const sortVideos = (
  videos: VideoFile[],
  option: SortOption,
  customOrder?: string[] // ▼▼▼ 追加: 保存された順序リスト ▼▼▼
): VideoFile[] => {
  // 元の配列を変更しないようにコピー
  const sorted = [...videos];

  switch (option) {
    case 'custom': {
      // ▼▼▼ 修正: ブロック {} で囲む ▼▼▼
      if (!customOrder || customOrder.length === 0) {
        // 順序データがない場合は、デフォルトで「古い順 (Date Asc)」にする
        // (新規追加ファイルが末尾に来るようにするため)
        return sorted.sort((a, b) => a.updatedAt - b.updatedAt);
      }

      const orderMap = new Map(customOrder.map((path, index) => [path, index]));

      // 順序リストにあるもの
      const inOrder = sorted.filter((v) => orderMap.has(v.path));
      // 順序リストにないもの（新規ファイルなど）
      const notInOrder = sorted.filter((v) => !orderMap.has(v.path));

      // リストにあるものを指定順にソート
      inOrder.sort((a, b) => orderMap.get(a.path)! - orderMap.get(b.path)!);

      // リストにないものは「古い順」でソート
      notInOrder.sort((a, b) => a.updatedAt - b.updatedAt);

      // 結合（保存済み順序 + 未保存分）
      return [...inOrder, ...notInOrder];
    }

    case 'date-desc': // 新しい順
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    case 'date-asc': // 古い順
      return sorted.sort((a, b) => a.updatedAt - b.updatedAt);
    case 'name-asc': // 名前順 (A-Z)
      return sorted.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    case 'name-desc': // 名前順 (Z-A)
      return sorted.sort((a, b) =>
        b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    case 'random':
      // フィッシャー–イェーツのシャッフル
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;
    default:
      return sorted;
  }
};

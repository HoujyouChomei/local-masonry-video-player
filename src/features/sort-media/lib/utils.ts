// src/features/sort-media/lib/utils.ts

import { Media } from '@/shared/schemas/media';
import { SortOption } from '@/shared/schemas/settings';

export const sortMedia = (
  mediaItems: Media[],
  option: SortOption,
  customOrder?: string[]
): Media[] => {
  const sorted = [...mediaItems];

  switch (option) {
    case 'custom': {
      if (!customOrder || customOrder.length === 0) {
        return sorted.sort((a, b) => a.updatedAt - b.updatedAt);
      }

      const orderMap = new Map(customOrder.map((path, index) => [path, index]));

      const inOrder = sorted.filter((v) => orderMap.has(v.path));
      const notInOrder = sorted.filter((v) => !orderMap.has(v.path));

      inOrder.sort((a, b) => orderMap.get(a.path)! - orderMap.get(b.path)!);

      notInOrder.sort((a, b) => a.updatedAt - b.updatedAt);

      return [...inOrder, ...notInOrder];
    }

    case 'date-desc':
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    case 'date-asc':
      return sorted.sort((a, b) => a.updatedAt - b.updatedAt);
    case 'name-asc':
      return sorted.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    case 'name-desc':
      return sorted.sort((a, b) =>
        b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    case 'random':
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;
    default:
      return sorted;
  }
};

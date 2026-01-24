// src/features/sort-media/model/use-folder-order.ts

import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api';

export const useSaveFolderOrder = () => {
  return useMutation({
    mutationFn: ({ folderPath, mediaPaths }: { folderPath: string; mediaPaths: string[] }) =>
      api.sorting.saveFolderOrder(folderPath, mediaPaths),
  });
};

// src/features/sort-videos/model/use-folder-order.ts

import { useMutation } from '@tanstack/react-query';
import { saveFolderOrderApi } from '@/shared/api/electron';
// useSettingsStore のインポートを削除

export const useSaveFolderOrder = () => {
  return useMutation({
    mutationFn: ({ folderPath, videoPaths }: { folderPath: string; videoPaths: string[] }) =>
      saveFolderOrderApi(folderPath, videoPaths),
    // onSuccess の空定義を削除（必要になったら追加）
  });
};

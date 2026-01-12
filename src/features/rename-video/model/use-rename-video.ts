// src/features/rename-video/model/use-rename-video.ts

import { useMutation } from '@tanstack/react-query';
import { renameVideoApi } from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

interface RenameVideoVariables {
  id: string;
  newFileName: string;
}

export const useRenameVideo = () => {
  const { onVideoUpdated } = useVideoCache(); // 追加

  const { mutate: renameVideo, isPending } = useMutation({
    mutationFn: ({ id, newFileName }: RenameVideoVariables) => renameVideoApi(id, newFileName),

    onSuccess: (updatedVideoFile) => {
      if (!updatedVideoFile) return;

      // 変更: 集約されたロジックを使用
      // これだけで、フォルダ/お気に入り/タグ/検索結果 すべてのビューで名前が更新される
      onVideoUpdated(updatedVideoFile);
    },
  });

  return { renameVideo, isPending };
};

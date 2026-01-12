// src/features/toggle-favorite/model/use-favorite.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFavorites, toggleFavoriteApi } from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const { invalidateAllVideoLists } = useVideoCache(); // 追加

  // お気に入りリストの取得
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    staleTime: Infinity,
  });

  // お気に入りトグルのMutation (楽観的更新付き)
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: toggleFavoriteApi,
    onMutate: async (filePath) => {
      // 進行中のリクエストをキャンセル
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // 直前のデータをスナップショットとして保存
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites']);

      // キャッシュを楽観的に更新
      queryClient.setQueryData<string[]>(['favorites'], (old = []) => {
        if (old.includes(filePath)) {
          return old.filter((p) => p !== filePath);
        } else {
          return [...old, filePath];
        }
      });

      return { previousFavorites };
    },
    // 型定義のために引数を指定
    onError: (_err, _newTodo, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      // 変更: 個別のinvalidateを削除し、集約されたメソッドを使用
      // これにより videos, all-favorites-videos, playlists, tags 全ての整合性が保たれる
      invalidateAllVideoLists();
    },
  });

  // 指定したファイルがお気に入りかどうかを判定するヘルパー (IDベース)
  const isFavorite = (videoId: string) => favorites.includes(videoId);

  return { favorites, toggleFavorite, isFavorite };
};

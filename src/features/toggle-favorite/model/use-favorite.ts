// src/features/toggle-favorite/model/use-favorite.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFavorites, toggleFavoriteApi } from '@/shared/api/electron';

export const useFavorites = () => {
  const queryClient = useQueryClient();

  // お気に入りリストの取得
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    staleTime: Infinity, // ユーザー操作以外で変化しないため
  });

  // お気に入りトグルのMutation (楽観的更新付き)
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: toggleFavoriteApi,
    onMutate: async (filePath) => {
      // 進行中のリクエストをキャンセル
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // 直前のデータをスナップショットとして保存
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites']);

      // キャッシュを楽観的に更新 (UIを即座に書き換える)
      queryClient.setQueryData<string[]>(['favorites'], (old = []) => {
        if (old.includes(filePath)) {
          return old.filter((p) => p !== filePath);
        } else {
          return [...old, filePath];
        }
      });

      return { previousFavorites };
    },
    onError: (err, newTodo, context) => {
      // エラーが発生したら元に戻す
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      // 完了したらサーバー(Electron)の最新データと同期
      // ▼▼▼ 修正: 関連する全てのクエリを無効化する ▼▼▼

      // 1. パスリスト
      queryClient.invalidateQueries({ queryKey: ['favorites'] });

      // 2. お気に入り動画一覧 (all-favorites モード用)
      queryClient.invalidateQueries({ queryKey: ['all-favorites-videos'] });

      // 3. 動画リスト (通常フォルダビューなど)
      //    お気に入りの有無によって表示が変わるフィルタリングをしている場合、
      //    基本的には ['favorites'] の更新だけでコンポーネントは再計算されるが、
      //    念のため整合性を保つ
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });

  // 指定したファイルがお気に入りかどうかを判定するヘルパー
  const isFavorite = (filePath: string) => favorites.includes(filePath);

  return { favorites, toggleFavorite, isFavorite };
};

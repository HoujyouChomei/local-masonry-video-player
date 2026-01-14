// src/features/toggle-favorite/model/use-favorite.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFavorites, toggleFavoriteApi } from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache';

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const { invalidateAllVideoLists } = useVideoCache();

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    staleTime: Infinity,
  });

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: toggleFavoriteApi,
    onMutate: async (filePath) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      const previousFavorites = queryClient.getQueryData<string[]>(['favorites']);

      queryClient.setQueryData<string[]>(['favorites'], (old = []) => {
        if (old.includes(filePath)) {
          return old.filter((p) => p !== filePath);
        } else {
          return [...old, filePath];
        }
      });

      return { previousFavorites };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      invalidateAllVideoLists();
    },
  });

  const isFavorite = (videoId: string) => favorites.includes(videoId);

  return { favorites, toggleFavorite, isFavorite };
};

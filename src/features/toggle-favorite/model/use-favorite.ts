// src/features/toggle-favorite/model/use-favorite.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useMediaCache } from '@/shared/lib/use-media-cache';

export const useFavorites = () => {
  const queryClient = useQueryClient();
  const { invalidateAllMediaLists } = useMediaCache();

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.favorites.getAll(),
    staleTime: Infinity,
  });

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: (mediaId: string) => api.favorites.toggle(mediaId),
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
      invalidateAllMediaLists();
    },
  });

  const isFavorite = (mediaId: string) => favorites.includes(mediaId);

  return { favorites, toggleFavorite, isFavorite };
};

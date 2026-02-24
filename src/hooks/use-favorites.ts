'use client';

import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { paths } from '@/api/schema';
import { PlayerService } from '@/services/player-service';

type FavoritesPage =
  paths['/players/me/favorites']['get']['responses'][200]['content']['application/json'];
type FavoriteItem = FavoritesPage['items'][number];
type FavoritesInfiniteData = InfiniteData<FavoritesPage>;
type FavoriteIdsResponse =
  paths['/players/me/favorites/ids']['get']['responses'][200]['content']['application/json'];

function isFavoritesIdsQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === 'favorites' && queryKey[1] === 'ids';
}

function isFavoritesListQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === 'favorites' && queryKey[1] !== 'ids';
}

function updateFavoriteIdsCache(
  data: FavoriteIdsResponse | undefined,
  variables: { targetUserId: string; isFavorited: boolean },
): FavoriteIdsResponse | undefined {
  if (!data) return data;

  if (variables.isFavorited) {
    return {
      ...data,
      ids: data.ids.filter((id) => id !== variables.targetUserId),
    };
  }

  if (data.ids.includes(variables.targetUserId)) return data;

  return {
    ...data,
    ids: [variables.targetUserId, ...data.ids],
  };
}

function upsertFavoriteInCache(
  data: FavoritesInfiniteData | undefined,
  variables: {
    targetUserId: string;
    isFavorited: boolean;
    optimisticItem?: FavoriteItem;
  },
): FavoritesInfiniteData | undefined {
  if (!data) return data;

  if (variables.isFavorited) {
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.userId !== variables.targetUserId),
      })),
    };
  }

  const optimisticItem = variables.optimisticItem;
  if (!optimisticItem) return data;

  const alreadyExists = data.pages.some((page) =>
    page.items.some((item) => item.userId === variables.targetUserId),
  );

  if (alreadyExists) return data;

  if (data.pages.length === 0) {
    return {
      ...data,
      pages: [
        {
          items: [optimisticItem],
          nextCursor: null,
        },
      ],
      pageParams: data.pageParams.length === 0 ? [undefined] : data.pageParams,
    };
  }

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            items: [optimisticItem, ...page.items],
          }
        : page,
    ),
  };
}

export function useFavorites(
  params: NonNullable<paths['/players/me/favorites']['get']['parameters']['query']> = {},
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ['favorites', params] as const,
    queryFn: ({ pageParam }) =>
      PlayerService.listFavorites({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60,
    enabled: options?.enabled ?? true,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      targetUserId: string;
      isFavorited: boolean;
      optimisticItem?: FavoriteItem;
    }) => {
      if (variables.isFavorited) {
        return PlayerService.removeFavorite(variables.targetUserId);
      }
      return PlayerService.addFavorite(variables.targetUserId);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', 'ids'], exact: true });
      await queryClient.cancelQueries({
        predicate: (query) => isFavoritesListQueryKey(query.queryKey),
      });

      const listSnapshots = queryClient.getQueriesData<
        FavoritesInfiniteData
      >({
        predicate: (query) => isFavoritesListQueryKey(query.queryKey),
      });
      const favoriteIdsSnapshot = queryClient.getQueryData<FavoriteIdsResponse>(['favorites', 'ids']);

      queryClient.setQueryData<FavoriteIdsResponse>(['favorites', 'ids'], (old) =>
        updateFavoriteIdsCache(old, variables),
      );

      queryClient.setQueriesData<FavoritesInfiniteData>(
        { predicate: (query) => isFavoritesListQueryKey(query.queryKey) },
        (old) => upsertFavoriteInCache(old, variables),
      );

      return { listSnapshots, favoriteIdsSnapshot };
    },
    onSuccess: (_data, variables) => {
      if (variables.isFavorited) {
        toast.success('Jugador eliminado de favoritos');
      } else {
        toast.success('Jugador guardado');
      }
    },
    onError: (error: Error, _variables, context) => {
      for (const [key, value] of context?.listSnapshots ?? []) {
        queryClient.setQueryData(key, value);
      }
      queryClient.setQueryData(['favorites', 'ids'], context?.favoriteIdsSnapshot);
      toast.error(error.message || 'No se pudo actualizar favoritos');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', 'ids'], exact: true });
      queryClient.invalidateQueries({
        predicate: (query) => isFavoritesListQueryKey(query.queryKey),
      });
    },
  });
}

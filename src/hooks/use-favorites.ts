'use client';

import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { paths } from '@/api/schema';
import { PlayerService } from '@/services/player-service';

function upsertFavoriteInCache(
  data:
    | InfiniteData<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']>
    | undefined,
  variables: {
    targetUserId: string;
    isFavorited: boolean;
    optimisticItem?: paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']['items'][number];
  },
) {
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

  if (!variables.optimisticItem) return data;

  const alreadyExists = data.pages.some((page) =>
    page.items.some((item) => item.userId === variables.targetUserId),
  );

  if (alreadyExists) return data;

  if (data.pages.length === 0) {
    return {
      ...data,
      pages: [
        {
          items: [variables.optimisticItem],
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
            items: [variables.optimisticItem, ...page.items],
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
      optimisticItem?: paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']['items'][number];
    }) => {
      if (variables.isFavorited) {
        return PlayerService.removeFavorite(variables.targetUserId);
      }
      return PlayerService.addFavorite(variables.targetUserId);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'], exact: false });

      const snapshots = queryClient.getQueriesData<
        InfiniteData<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']>
      >({
        queryKey: ['favorites'],
        exact: false,
      });

      queryClient.setQueriesData<
        InfiniteData<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']>
      >(
        { queryKey: ['favorites'], exact: false },
        (old) => upsertFavoriteInCache(old, variables),
      );

      return { snapshots };
    },
    onSuccess: (_data, variables) => {
      if (variables.isFavorited) {
        toast.success('Jugador eliminado de favoritos');
      } else {
        toast.success('Jugador guardado');
      }
    },
    onError: (error: Error, _variables, context) => {
      for (const [key, value] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, value);
      }
      toast.error(error.message || 'No se pudo actualizar favoritos');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'], exact: false });
    },
  });
}

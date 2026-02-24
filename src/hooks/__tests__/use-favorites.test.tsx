import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InfiniteData } from '@tanstack/react-query';
import type { paths } from '@/api/schema';
import { useToggleFavorite } from '@/hooks/use-favorites';
import { PlayerService } from '@/services/player-service';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('@/services/player-service', () => ({
  PlayerService: {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    listFavorites: vi.fn(),
    getFavoriteIds: vi.fn(),
  },
}));

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function makeFavoritesData(
  items: paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']['items'],
): InfiniteData<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']> {
  return {
    pages: [{ items, nextCursor: null }],
    pageParams: [undefined],
  };
}

function makeFavorite(
  overrides: Partial<
    paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']['items'][number]
  > = {},
): paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']['items'][number] {
  return {
    userId: '11111111-1111-4111-8111-111111111111',
    displayName: 'Favorito Uno',
    avatarUrl: null,
    category: 5,
    elo: 1200,
    createdAt: '2026-02-24T12:00:00Z',
    location: { city: 'Cordoba', province: 'Cordoba', country: 'Argentina' },
    ...overrides,
  };
}

describe('useToggleFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('optimistically adds a favorite to cached favorites lists', async () => {
    const client = makeClient();
    const wrapper = makeWrapper(client);
    const optimisticItem = makeFavorite();

    client.setQueryData(['favorites', { limit: 100 }], makeFavoritesData([]));

    let resolvePromise: ((value: { ok: boolean }) => void) | undefined;
    (PlayerService.addFavorite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise<{ ok: boolean }>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => {
      result.current.mutate({
        targetUserId: optimisticItem.userId,
        isFavorited: false,
        optimisticItem,
      });
    });

    await waitFor(() => {
      const optimisticCache = client.getQueryData<
        InfiniteData<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']>
      >(['favorites', { limit: 100 }]);

      expect(optimisticCache?.pages[0]?.items.map((item) => item.userId)).toEqual([
        optimisticItem.userId,
      ]);
    });
    expect(PlayerService.addFavorite).toHaveBeenCalledWith(optimisticItem.userId);

    resolvePromise?.({ ok: true });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('invalidates favorite ids and favorites list queries after toggle settles', async () => {
    const client = makeClient();
    const wrapper = makeWrapper(client);
    const existingItem = makeFavorite();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    client.setQueryData(['favorites', 'ids'], { ids: [existingItem.userId] });
    client.setQueryData(['favorites', { limit: 20 }], makeFavoritesData([existingItem]));
    (PlayerService.removeFavorite as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => {
      result.current.mutate({
        targetUserId: existingItem.userId,
        isFavorited: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(invalidateSpy.mock.calls.some(([filters]) => {
      return (
        typeof filters === 'object' &&
        filters !== null &&
        'queryKey' in filters &&
        Array.isArray((filters as { queryKey?: unknown[] }).queryKey) &&
        (filters as { queryKey?: unknown[] }).queryKey?.[0] === 'favorites' &&
        (filters as { queryKey?: unknown[] }).queryKey?.[1] === 'ids'
      );
    })).toBe(true);
  });

  it('rolls back optimistic add when the mutation fails', async () => {
    const client = makeClient();
    const wrapper = makeWrapper(client);
    const optimisticItem = makeFavorite();

    client.setQueryData(['favorites', { limit: 20 }], makeFavoritesData([]));

    let rejectPromise: ((reason?: unknown) => void) | undefined;
    (PlayerService.addFavorite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise<never>((_resolve, reject) => {
        rejectPromise = reject;
      }),
    );

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => {
      result.current.mutate({
        targetUserId: optimisticItem.userId,
        isFavorited: false,
        optimisticItem,
      });
    });

    await waitFor(() => {
      expect(
        client.getQueryData<
          InfiniteData<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']>
        >(['favorites', { limit: 20 }])?.pages[0]?.items,
      ).toHaveLength(1);
    });

    rejectPromise?.(new Error('boom'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    await waitFor(() => {
      expect(
        client.getQueryData<
          InfiniteData<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']>
        >(['favorites', { limit: 20 }])?.pages[0]?.items,
      ).toHaveLength(0);
    });
    expect(mockToastError).toHaveBeenCalled();
  });

  it('optimistically removes a favorite and calls DELETE when already favorited', async () => {
    const client = makeClient();
    const wrapper = makeWrapper(client);
    const existingItem = makeFavorite();

    client.setQueryData(['favorites', { limit: 20 }], makeFavoritesData([existingItem]));
    (PlayerService.removeFavorite as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => {
      result.current.mutate({
        targetUserId: existingItem.userId,
        isFavorited: true,
      });
    });

    await waitFor(() => {
      expect(
        client.getQueryData<
          InfiniteData<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']>
        >(['favorites', { limit: 20 }])?.pages[0]?.items,
      ).toHaveLength(0);
    });
    expect(PlayerService.removeFavorite).toHaveBeenCalledWith(existingItem.userId);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});

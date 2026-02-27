import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { rankingsService } from '@/services/rankings-service';
import type { Category, RankingEntry, RankingResponse } from '@/types/competitive';
import type { RankingScope } from '@/types/rankings';

function dedupeEntries(items: RankingEntry[]): RankingEntry[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.userId)) return false;
    seen.add(item.userId);
    return true;
  });
}

export function useRankingScopes() {
  return useQuery({
    queryKey: ['rankings', 'scopes'],
    queryFn: () => rankingsService.getScopes(),
    staleTime: 1000 * 60 * 10,
    retry: 0,
  });
}

export function useRankings(scope: RankingScope, category?: Category) {
  return useInfiniteQuery({
    queryKey: ['rankings', { scope, category: category ?? null }],
    queryFn: ({ pageParam }) =>
      rankingsService.getRanking({
        scope,
        category,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, err) => {
      // Never retry geo-requirement errors — UI shows a banner instead
      if (axios.isAxiosError(err) && err.response?.status === 409) return false;
      return failureCount < 2;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: dedupeEntries(data.pages.flatMap((p: RankingResponse) => p.items)),
    }),
  });
}

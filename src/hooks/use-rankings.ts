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

interface UseRankingsParams {
  scope: RankingScope;
  category?: Category;
  provinceCode?: string | null;
  cityId?: string | null;
  enabled?: boolean;
}

export function useRankings({
  scope,
  category,
  provinceCode,
  cityId,
  enabled = true,
}: UseRankingsParams) {
  return useInfiniteQuery({
    queryKey: [
      'rankings',
      {
        scope,
        category: category ?? null,
        provinceCode: provinceCode ?? null,
        cityId: cityId ?? null,
      },
    ],
    queryFn: ({ pageParam }) =>
      rankingsService.getRanking({
        scope,
        category,
        provinceCode: provinceCode ?? undefined,
        cityId: cityId ?? undefined,
        cursor: pageParam as string | undefined,
      }),
    enabled,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, err) => {
      // Never retry geo-requirement errors - UI shows a banner instead.
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const code = (err.response?.data as { code?: unknown } | undefined)?.code;
        if (status === 409) return false;
        if (
          status === 400 &&
          (code === 'PROVINCE_REQUIRED' || code === 'CITY_REQUIRED')
        ) {
          return false;
        }
      }
      return failureCount < 2;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: dedupeEntries(data.pages.flatMap((p: RankingResponse) => p.items)),
    }),
  });
}

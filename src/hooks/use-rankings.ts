import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { rankingsService } from '@/services/rankings-service';
import type {
  Category,
  InsightsMode,
  InsightsTimeframe,
  RankingEntry,
  RankingResponse,
} from '@/types/competitive';
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
  timeframe?: InsightsTimeframe;
  mode?: InsightsMode;
  enabled?: boolean;
}

export function useRankings({
  scope,
  category,
  provinceCode,
  cityId,
  timeframe,
  mode,
  enabled = true,
}: UseRankingsParams) {
  const queryScope = scope;
  const queryProvinceCode = provinceCode ?? null;
  const queryCityId = cityId ?? null;
  const queryCategory = category ?? 'ALL';
  const queryTimeframe = timeframe ?? 'CURRENT_SEASON';
  const queryMode = mode ?? 'COMPETITIVE';

  return useInfiniteQuery({
    queryKey: [
      'rankings',
      queryScope,
      queryProvinceCode,
      queryCityId,
      queryCategory,
      queryTimeframe,
      queryMode,
    ],
    queryFn: ({ pageParam }) =>
      rankingsService.getRanking({
        scope: queryScope,
        category: typeof queryCategory === 'number' ? queryCategory : undefined,
        provinceCode: queryProvinceCode ?? undefined,
        cityId: queryCityId ?? undefined,
        cursor: pageParam as string | undefined,
      }),
    enabled,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, err) => {
      if (!axios.isAxiosError(err)) return false;
      const status = err.response?.status;
      if (typeof status !== 'number') return false;
      if (status >= 400 && status < 500) return false;
      if (status >= 500) {
        return failureCount < 1;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2_000),
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: dedupeEntries(data.pages.flatMap((p: RankingResponse) => p.items)),
    }),
  });
}

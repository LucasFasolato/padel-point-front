import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { COMPETITIVE_RANKING_DEFAULT_LIMIT } from '@/lib/competitive-constants';
import { competitiveService } from '@/services/competitive-service';
import type { Category, RankingEntry, RankingResponse } from '@/types/competitive';

function dedupeRankingEntries(items: RankingEntry[]): RankingEntry[] {
  const seen = new Set<string>();
  const merged: RankingEntry[] = [];

  for (const item of items) {
    if (seen.has(item.userId)) continue;
    seen.add(item.userId);
    merged.push(item);
  }

  return merged;
}

export function useCompetitiveProfile() {
  return useQuery({
    queryKey: ['competitive', 'profile'],
    queryFn: () => competitiveService.getMyProfile(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useEloHistory(limit: number = 30) {
  return useQuery({
    queryKey: ['competitive', 'elo-history', limit],
    queryFn: () => competitiveService.getEloHistory(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOnboardingState() {
  return useQuery({
    queryKey: ['competitive', 'onboarding'],
    queryFn: () => competitiveService.getOnboarding(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useRanking(limit: number = COMPETITIVE_RANKING_DEFAULT_LIMIT) {
  const query = useRankingByCategory(undefined, limit);
  return {
    ...query,
    data: query.data?.items,
  };
}

export function useRankingByCategory(
  category?: Category,
  limit: number = COMPETITIVE_RANKING_DEFAULT_LIMIT
) {
  return useInfiniteQuery({
    queryKey: ['competitive', 'ranking', { category: category ?? null, limit }],
    queryFn: ({ pageParam }) =>
      competitiveService.getRanking({
        category,
        limit,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: dedupeRankingEntries(data.pages.flatMap((page: RankingResponse) => page.items)),
    }),
  });
}

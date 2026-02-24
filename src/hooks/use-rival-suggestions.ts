import { useInfiniteQuery } from '@tanstack/react-query';
import {
  competitiveService,
  type RivalsQuery,
  type RivalsResponse,
} from '@/services/competitive-service';

export type RivalSuggestionFilters = Pick<
  RivalsQuery,
  'range' | 'sameCategory' | 'city' | 'province' | 'country'
> & {
  limit?: number;
};

export function useRivalSuggestions(params: RivalSuggestionFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['matchmaking', 'rivals', params],
    queryFn: ({ pageParam }) =>
      competitiveService.getRivalSuggestions({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 30,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((page: RivalsResponse) => page.items),
      nextCursor: data.pages[data.pages.length - 1]?.nextCursor ?? null,
    }),
  });
}

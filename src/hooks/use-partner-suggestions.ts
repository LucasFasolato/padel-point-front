import { useInfiniteQuery } from '@tanstack/react-query';
import {
  competitiveService,
  type PartnersQuery,
  type PartnersResponse,
} from '@/services/competitive-service';

export type PartnerSuggestionFilters = Pick<
  PartnersQuery,
  'range' | 'sameCategory' | 'city' | 'province' | 'country'
> & {
  limit?: number;
};

export function usePartnerSuggestions(
  params: PartnerSuggestionFilters = {},
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ['matchmaking', 'partners', params],
    queryFn: ({ pageParam }) =>
      competitiveService.getPartnerSuggestions({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 30,
    enabled: options?.enabled ?? true,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((page: PartnersResponse) => page.items),
      nextCursor: data.pages[data.pages.length - 1]?.nextCursor ?? null,
    }),
  });
}

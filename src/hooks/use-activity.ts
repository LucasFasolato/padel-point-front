import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { activityService } from '@/services/activity-service';
import type { MyActivityResponse } from '@/types/activity';

const ACTIVITY_LIMIT = 20;

export const ACTIVITY_QUERY_KEY = ['activity', 'me'] as const;

export function useMyActivity() {
  return useInfiniteQuery({
    queryKey: ACTIVITY_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      activityService.getMyActivity({
        limit: ACTIVITY_LIMIT,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, err) => {
      if (!axios.isAxiosError(err)) return failureCount < 2;
      const status = err.response?.status;
      // Endpoint not yet deployed or geo-gate — don't waste retries
      if (status === 404 || status === 409) return false;
      return failureCount < 2;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((p: MyActivityResponse) => p.items),
    }),
  });
}

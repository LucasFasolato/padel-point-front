import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { insightsService } from '@/services/insights-service';
import type { InsightsMode, InsightsTimeframe, PlayerInsights } from '@/types/competitive';

export function useInsights(
  timeframe: InsightsTimeframe = 'CURRENT_SEASON',
  mode: InsightsMode = 'ALL'
) {
  return useQuery<PlayerInsights>({
    queryKey: ['insights', { timeframe, mode }],
    queryFn: () => insightsService.getMyInsights({ timeframe, mode }),
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, err) => {
      if (axios.isAxiosError(err) && err.response?.status === 400) return false;
      return failureCount < 1;
    },
  });
}

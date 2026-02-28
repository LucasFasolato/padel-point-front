import { useQuery } from '@tanstack/react-query';
import { insightsService } from '@/services/insights-service';
import type { InsightsMode, InsightsTimeframe, PlayerInsights } from '@/types/competitive';

export function useInsights(
  timeframe: InsightsTimeframe = 'CURRENT_SEASON',
  mode: InsightsMode = 'ALL'
) {
  return useQuery<PlayerInsights>({
    queryKey: ['insights', { timeframe, mode }],
    queryFn: () => insightsService.getMyInsights({ timeframe, mode }),
    staleTime: 1000 * 60 * 10,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

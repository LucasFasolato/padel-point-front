import api from '@/lib/api';
import type { InsightsMode, InsightsTimeframe, PlayerInsights } from '@/types/competitive';

export const insightsService = {
  async getMyInsights(params: {
    timeframe?: InsightsTimeframe;
    mode?: InsightsMode;
  } = {}): Promise<PlayerInsights> {
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    );
    const { data } = await api.get<PlayerInsights>('/me/insights', { params: queryParams });
    return data;
  },
};

import api from '@/lib/api';
import type { MyActivityResponse, RawActivityEvent } from '@/types/activity';

const DEFAULT_LIMIT = 20;

function normalizeResponse(raw: unknown): MyActivityResponse {
  if (Array.isArray(raw)) {
    return { items: raw as RawActivityEvent[], nextCursor: null };
  }
  const data = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items)
    ? (data.items as RawActivityEvent[])
    : Array.isArray(data.data)
      ? (data.data as RawActivityEvent[])
      : [];
  return {
    items,
    nextCursor: typeof data.nextCursor === 'string' ? data.nextCursor : null,
  };
}

export const activityService = {
  /**
   * GET /me/activity — personal activity feed, cursor-paginated.
   */
  async getMyActivity(
    params: { limit?: number; cursor?: string } = {},
  ): Promise<MyActivityResponse> {
    const query: Record<string, string | number> = {
      limit: params.limit ?? DEFAULT_LIMIT,
    };
    if (params.cursor) query.cursor = params.cursor;

    const { data } = await api.get('/me/activity', { params: query });
    return normalizeResponse(data);
  },
};

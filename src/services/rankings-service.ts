import api from '@/lib/api';
import type { RankingEntry, RankingResponse } from '@/types/competitive';
import type { RankingsQueryParams, ScopeInfo } from '@/types/rankings';

const DEFAULT_LIMIT = 50;

function normalizeResponse(raw: unknown): RankingResponse {
  if (Array.isArray(raw)) {
    return { items: raw as RankingEntry[], nextCursor: null };
  }
  const data = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.data)
      ? data.data
      : [];
  return {
    items: items as RankingEntry[],
    nextCursor: typeof data.nextCursor === 'string' ? data.nextCursor : null,
  };
}

export const rankingsService = {
  /**
   * GET /competitive/ranking — scope-aware ranking list.
   * `scope` param is forwarded if the backend supports it; ignored otherwise.
   */
  async getRanking(params: RankingsQueryParams = {}): Promise<RankingResponse> {
    const query: Record<string, string | number> = {
      limit: params.limit ?? DEFAULT_LIMIT,
    };
    if (params.scope) query.scope = params.scope;
    if (typeof params.category === 'number') query.category = params.category;
    if (params.cursor) query.cursor = params.cursor;

    const { data } = await api.get('/competitive/ranking', { params: query });
    return normalizeResponse(data);
  },

  /**
   * GET /competitive/ranking/scopes — returns which scopes are available for
   * the current user (city/province requires location to be set on their profile).
   * Falls back to an empty available list so the caller derives scopes from profile.
   */
  async getScopes(): Promise<ScopeInfo> {
    try {
      const { data } = await api.get<ScopeInfo>('/competitive/ranking/scopes');
      return data;
    } catch {
      // Endpoint not yet deployed — caller derives scopes from player profile
      return { available: [] };
    }
  },
};

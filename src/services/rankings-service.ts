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

  // Cursor-based pagination (preferred)
  if (typeof data.nextCursor === 'string') {
    return { items: items as RankingEntry[], nextCursor: data.nextCursor };
  }

  // Page-based pagination: derive a synthetic cursor from meta so InfiniteQuery
  // stays consistent regardless of which backend shape is returned.
  const meta = data.meta as Record<string, unknown> | undefined;
  if (
    meta &&
    typeof meta.page === 'number' &&
    typeof meta.pageSize === 'number' &&
    typeof meta.total === 'number'
  ) {
    const hasMore = meta.page * meta.pageSize < meta.total;
    return {
      items: items as RankingEntry[],
      nextCursor: hasMore ? `page:${meta.page + 1}` : null,
      meta: { page: meta.page, pageSize: meta.pageSize, total: meta.total },
    };
  }

  return { items: items as RankingEntry[], nextCursor: null };
}

export const rankingsService = {
  /**
   * GET /rankings — scope-aware ranking list.
   * `scope` param is forwarded if the backend supports it; ignored otherwise.
   * Supports both cursor-based {nextCursor} and page-based {meta} responses.
   */
  async getRanking(params: RankingsQueryParams = {}): Promise<RankingResponse> {
    const query: Record<string, string | number> = {
      limit: params.limit ?? DEFAULT_LIMIT,
    };
    if (params.scope) query.scope = params.scope;
    if (params.scope === 'province' && params.provinceCode) {
      query.provinceCode = params.provinceCode;
    }
    if (params.scope === 'city' && params.cityId) {
      query.cityId = params.cityId;
    }
    if (typeof params.category === 'number') query.category = params.category;
    if (params.cursor) {
      // Synthetic page cursors are encoded as "page:N" by normalizeResponse
      if (params.cursor.startsWith('page:')) {
        query.page = Number(params.cursor.slice(5));
      } else {
        query.cursor = params.cursor;
      }
    }

    const { data } = await api.get('/rankings', { params: query });
    return normalizeResponse(data);
  },

  /**
   * GET /rankings/scopes — returns which scopes are available for
   * the current user (city/province requires location to be set on their profile).
   * Falls back to an empty available list so the caller derives scopes from profile.
   */
  async getScopes(): Promise<ScopeInfo> {
    try {
      const { data } = await api.get<ScopeInfo>('/rankings/scopes');
      return data;
    } catch {
      // Endpoint not yet deployed — caller derives scopes from player profile
      return { available: [] };
    }
  },
};

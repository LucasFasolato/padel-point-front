import type { Category, RankingEntry, RankingResponse } from './competitive';

export type RankingScope = 'city' | 'province' | 'country';

export interface ScopeInfo {
  available: RankingScope[];
  cityName?: string | null;
  provinceName?: string | null;
}

export interface RankingsQueryParams {
  scope?: RankingScope;
  category?: Category;
  limit?: number;
  cursor?: string;
}

export type { RankingEntry, RankingResponse };

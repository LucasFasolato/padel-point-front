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
  provinceCode?: string;
  cityId?: string;
  /** Fallback when cityId is absent — sent together with provinceCode */
  cityName?: string;
  limit?: number;
  cursor?: string;
}

export type { RankingEntry, RankingResponse };

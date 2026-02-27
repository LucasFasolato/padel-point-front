import  api  from '@/lib/api';
import type { paths } from '@/api/schema';
import {
  COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT,
  COMPETITIVE_RANKING_DEFAULT_LIMIT,
} from '@/lib/competitive-constants';
import type {
  CompetitiveProfile,
  EloHistoryQueryParams,
  EloHistoryResponse,
  OnboardingData,
  RankingQueryParams,
  RankingResponse,
} from '@/types/competitive';

export type CompetitiveSkillRadarResponse =
  paths['/competitive/profile/me/radar']['get']['responses'][200]['content']['application/json'];
export type RivalsResponse =
  paths['/competitive/matchmaking/rivals']['get']['responses'][200]['content']['application/json'];
export type RivalsQuery =
  NonNullable<paths['/competitive/matchmaking/rivals']['get']['parameters']['query']>;
export type RivalItem = RivalsResponse['items'][number];

// Partner matchmaking types.
// NOTE: /competitive/matchmaking/partners is not yet in the OpenAPI schema.
// Replace with schema-derived types once the backend publishes the endpoint.
export type PartnerItem = RivalItem; // same DTO shape as rivals
export type PartnersResponse = { items: PartnerItem[]; nextCursor: string | null };
export type PartnersQuery = {
  limit?: number;
  cursor?: string;
  range?: number;
  sameCategory?: boolean;
  city?: string;
  province?: string;
  country?: string;
};

function normalizeEloHistoryResponse(raw: unknown): EloHistoryResponse {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      nextCursor: null,
    };
  }

  const data = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.data)
      ? data.data
      : [];

  return {
    items: items as EloHistoryResponse['items'],
    nextCursor: typeof data.nextCursor === 'string' ? data.nextCursor : null,
  };
}

function normalizeRankingResponse(raw: unknown): RankingResponse {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      nextCursor: null,
    };
  }

  const data = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.data)
      ? data.data
      : [];

  return {
    items: items as RankingResponse['items'],
    nextCursor: typeof data.nextCursor === 'string' ? data.nextCursor : null,
  };
}

export const competitiveService = {
  /**
   * Obtiene mi perfil competitivo (o lo crea si no existe)
   */
  async getMyProfile(): Promise<CompetitiveProfile> {
    const { data } = await api.get('/competitive/me');
    return data;
  },

  /**
   * Inicializa categoría (solo se puede hacer una vez, antes del primer match)
   */
  async initCategory(category: number): Promise<CompetitiveProfile> {
    const { data } = await api.post('/competitive/profile/init', { category });
    return data;
  },

  /**
   * Obtiene historial de cambios de ELO
   */
  async getEloHistory(params: EloHistoryQueryParams = {}): Promise<EloHistoryResponse> {
    const queryParams: Record<string, string | number> = {
      limit: params.limit ?? COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT,
    };

    if (params.cursor) {
      queryParams.cursor = params.cursor;
    }

    const { data } = await api.get<unknown>(
      '/competitive/profile/me/history',
      {
      params: queryParams,
      }
    );
    return normalizeEloHistoryResponse(data);
  },

  /**
   * Obtiene el radar de skills (últimos partidos).
   */
  async getSkillRadar(): Promise<CompetitiveSkillRadarResponse> {
    const { data } = await api.get<CompetitiveSkillRadarResponse>('/competitive/profile/me/radar');
    return data;
  },

  /**
   * Obtiene sugerencias de rivales para matchmaking competitivo.
   */
  async getRivalSuggestions(params: Partial<RivalsQuery> = {}): Promise<RivalsResponse> {
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as Partial<RivalsQuery>;

    const { data } = await api.get<RivalsResponse>('/competitive/matchmaking/rivals', {
      params: queryParams,
    });
    return data;
  },

  /**
   * Obtiene sugerencias de compañeros para matchmaking competitivo.
   * El endpoint acepta los mismos filtros que /rivals.
   */
  async getPartnerSuggestions(params: Partial<PartnersQuery> = {}): Promise<PartnersResponse> {
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined),
    ) as Partial<PartnersQuery>;

    const { data } = await api.get<PartnersResponse>('/competitive/matchmaking/partners', {
      params: queryParams,
    });
    return data;
  },

  /**
   * Obtiene el estado actual del onboarding competitivo.
   */
  async getOnboarding(): Promise<OnboardingData> {
    const { data } = await api.get('/competitive/onboarding');
    return data;
  },

  /**
   * Guarda el onboarding competitivo (idempotent upsert).
   * Envía category, primaryGoal y playingFrequency en un solo request.
   */
  async putOnboarding(payload: {
    category: number;
    primaryGoal: string;
    playingFrequency: string;
  }): Promise<OnboardingData> {
    const { data } = await api.put('/competitive/onboarding', payload);
    return data;
  },

  /**
   * Obtiene ranking global (TODO: filtrar por club)
   */
  async getRanking(params: RankingQueryParams = {}): Promise<RankingResponse> {
    const queryParams: Record<string, string | number> = {
      limit: params.limit ?? COMPETITIVE_RANKING_DEFAULT_LIMIT,
    };

    if (typeof params.category === 'number') {
      queryParams.category = params.category;
    }

    if (params.cursor) {
      queryParams.cursor = params.cursor;
    }

    const { data } = await api.get('/rankings', {
      params: queryParams,
    });
    return normalizeRankingResponse(data);
  },
};

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

type CompetitiveProfileHistoryResponse =
  paths['/competitive/profile/me/history']['get']['responses'][200]['content']['application/json'];

function normalizeEloHistoryResponse(raw: CompetitiveProfileHistoryResponse | unknown): EloHistoryResponse {
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

    const { data } = await api.get<CompetitiveProfileHistoryResponse>(
      '/competitive/profile/me/history',
      {
      params: queryParams,
      }
    );
    return normalizeEloHistoryResponse(data);
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

    const { data } = await api.get('/competitive/ranking', {
      params: queryParams,
    });
    return normalizeRankingResponse(data);
  },
};

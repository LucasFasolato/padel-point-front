import  api  from '@/lib/api';
import type { CompetitiveProfile, EloHistoryPoint, OnboardingData, RankingEntry } from '@/types/competitive';

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
  async getEloHistory(limit: number = 50): Promise<EloHistoryPoint[]> {
    const { data } = await api.get('/competitive/profile/me/history', {
      params: { limit },
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
  async getRanking(limit: number = 50): Promise<RankingEntry[]> {
    const { data } = await api.get('/competitive/ranking', {
      params: { limit },
    });
    return data;
  },
};

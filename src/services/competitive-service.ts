import  api  from '@/lib/api';
import type { CompetitiveProfile, EloHistoryPoint, RankingEntry } from '@/types/competitive';

export const competitiveService = {
  /**
   * Obtiene mi perfil competitivo (o lo crea si no existe)
   */
  async getMyProfile(): Promise<CompetitiveProfile> {
    const { data } = await api.get('/competitive/profile/me');
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
   * Obtiene ranking global (TODO: filtrar por club)
   */
  async getRanking(limit: number = 50): Promise<RankingEntry[]> {
    const { data } = await api.get('/competitive/ranking', {
      params: { limit },
    });
    return data;
  },
};
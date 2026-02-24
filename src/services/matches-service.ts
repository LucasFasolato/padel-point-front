import api from '@/lib/api';
import type { MatchResult } from '@/types/competitive';

export const matchesService = {
  /**
   * Reportar resultado de match
   */
  async reportMatch(params: {
    challengeId: string;
    playedAt?: string;
    sets: Array<{ a: number; b: number }>;
  }): Promise<MatchResult> {
    const { data } = await api.post('/matches', params);
    return data;
  },

  /**
   * Confirmar resultado de match
   */
  async confirmMatch(matchId: string): Promise<MatchResult> {
    const { data } = await api.patch(`/matches/${matchId}/confirm`);
    return data;
  },

  /**
   * Resolver disputa confirmando resultado "tal cual" (admin/owner)
   */
  async resolveConfirmAsIs(matchId: string): Promise<MatchResult> {
    const { data } = await api.post(`/matches/${matchId}/resolve-confirm-as-is`);
    return data;
  },

  /**
   * Rechazar resultado de match
   */
  async rejectMatch(matchId: string, reason?: string): Promise<MatchResult> {
    const { data } = await api.patch(`/matches/${matchId}/reject`, { reason });
    return data;
  },

  /**
   * Disputar resultado de match confirmado
   */
  async disputeMatch(
    matchId: string,
    params: { reason: string; message?: string }
  ): Promise<MatchResult> {
    const { data } = await api.post(`/matches/${matchId}/dispute`, params);
    return data;
  },

  /**
   * Obtener match por ID
   */
  async getById(matchId: string): Promise<MatchResult> {
    const { data } = await api.get(`/matches/${matchId}`);
    return data;
  },

  /**
   * Obtener partidos pendientes de confirmación por el usuario actual
   */
  async getPendingConfirmations(): Promise<MatchResult[]> {
    const { data } = await api.get('/matches/me/pending-confirmations');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtener match por challenge
   */
  async getByChallenge(challengeId: string): Promise<MatchResult | null> {
    try {
      const { data } = await api.get('/matches', {
        params: { challengeId },
      });
      return Array.isArray(data) ? data[0] : data;
    } catch {
      return null;
    }
  },
};

import  api  from '@/lib/api';
import type { Challenge } from '@/types/competitive';

export const challengesService = {
  /**
   * Crear desafío DIRECT (1v1 o 2v2)
   */
  async createDirect(params: {
    opponentUserId: string;
    partnerUserId?: string;
    reservationId?: string;
    message?: string;
  }): Promise<Challenge> {
    const { data } = await api.post('/challenges/direct', params);
    return data;
  },

  /**
   * Crear desafío OPEN (busco rival de mi categoría)
   */
  async createOpen(params: {
    targetCategory: number;
    partnerUserId?: string;
    reservationId?: string;
    message?: string;
  }): Promise<Challenge> {
    const { data } = await api.post('/challenges/open', params);
    return data;
  },

  /**
   * Listar desafíos OPEN disponibles
   */
  async listOpen(params?: {
    category?: number;
    limit?: number;
  }): Promise<Challenge[]> {
    const { data } = await api.get('/challenges/open', { params });
    return data;
  },

  /**
   * Inbox: desafíos donde me invitaron (DIRECT)
   */
  async getInbox(): Promise<Challenge[]> {
    const { data } = await api.get<Challenge[]>('/challenges/inbox');
    return data as Challenge[];
  },

  /**
   * Outbox: desafíos que yo creé
   */
  async getOutbox(): Promise<Challenge[]> {
    const { data } = await api.get('/challenges/outbox');
    return data;
  },

  /**
   * Obtener detalle de un challenge
   */
  async getById(id: string): Promise<Challenge> {
    const { data } = await api.get(`/challenges/${id}`);
    return data;
  },

  /**
   * Aceptar desafío DIRECT
   */
  async acceptDirect(id: string): Promise<Challenge> {
    const { data } = await api.patch(`/challenges/${id}/accept`);
    return data;
  },

  /**
   * Rechazar desafío DIRECT
   */
  async rejectDirect(id: string): Promise<Challenge> {
    const { data } = await api.patch(`/challenges/${id}/reject`);
    return data;
  },

  /**
   * Cancelar desafío (solo creator)
   */
  async cancel(id: string): Promise<Challenge> {
    const { data } = await api.patch(`/challenges/${id}/cancel`);
    return data;
  },

  /**
   * Aceptar desafío OPEN
   */
  async acceptOpen(id: string, partnerUserId?: string): Promise<Challenge> {
    const { data } = await api.patch(`/challenges/${id}/accept-open`, {
      partnerUserId,
    });
    return data;
  },

  /**
   * Cancelar desafío OPEN
   */
  async cancelOpen(id: string): Promise<Challenge> {
    const { data } = await api.patch(`/challenges/${id}/cancel-open`);
    return data;
  },
};

import api from '@/lib/api';
import type { MatchType } from '@/types/competitive';

export type IntentKind = 'DIRECT' | 'OPEN' | 'FIND_PARTNER';
export type IntentCreatedStatus = 'active' | 'expired' | 'matched' | 'cancelled';

export interface CreatedIntent {
  id: string;
  type: IntentKind;
  status: IntentCreatedStatus;
  matchType: MatchType;
  message: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface BaseParams {
  matchType?: MatchType;
  message?: string;
}

export const intentsService = {
  /**
   * Declarar intención de jugar un partido directo (sin rival específico).
   * El rival puede asignarse más tarde desde /competitive/find.
   */
  async createDirect(params: BaseParams): Promise<CreatedIntent> {
    const { data } = await api.post<CreatedIntent>('/me/intents', {
      type: 'DIRECT',
      matchType: params.matchType ?? 'COMPETITIVE',
      message: params.message ?? null,
    });
    return data;
  },

  /**
   * Publicar desafío abierto — cualquier rival de categoría similar puede aceptar.
   */
  async createOpen(
    params: BaseParams & { expiresInHours?: number }
  ): Promise<CreatedIntent> {
    const { data } = await api.post<CreatedIntent>('/me/intents', {
      type: 'OPEN',
      matchType: params.matchType ?? 'COMPETITIVE',
      message: params.message ?? null,
      expiresInHours: params.expiresInHours ?? 24,
    });
    return data;
  },

  /**
   * Publicar solicitud de compañero (dobles) — alguien de mi categoría se suma.
   */
  async createFindPartner(
    params: BaseParams & { expiresInHours?: number }
  ): Promise<CreatedIntent> {
    const { data } = await api.post<CreatedIntent>('/me/intents', {
      type: 'FIND_PARTNER',
      matchType: params.matchType ?? 'COMPETITIVE',
      message: params.message ?? null,
      expiresInHours: params.expiresInHours ?? 24,
    });
    return data;
  },
};

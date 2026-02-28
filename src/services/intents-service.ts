import api from '@/lib/api';
import type { MatchType } from '@/types/competitive';
import type { UserIntent } from '@/types/competitive';

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
  leagueId?: string;
}

interface ListIntentParams {
  leagueId?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function normalizeIntentType(rawType: unknown): UserIntent['intentType'] {
  const value = asString(rawType)?.toUpperCase();
  if (value === 'CONFIRM_RESULT' || value === 'ACCEPT_CHALLENGE' || value === 'CREATED_INTENT') {
    return value;
  }
  if (value === 'MATCH_CONFIRMATION') return 'CONFIRM_RESULT';
  if (value === 'CHALLENGE') return 'ACCEPT_CHALLENGE';
  if (value === 'CREATED') return 'CREATED_INTENT';
  return (value ?? 'ACCEPT_CHALLENGE') as UserIntent['intentType'];
}

function normalizeUserIntent(raw: unknown): UserIntent {
  const data = (raw ?? {}) as Record<string, unknown>;
  const challengeData = (data.challenge ?? {}) as Record<string, unknown>;
  const matchData = (data.match ?? {}) as Record<string, unknown>;
  const actorData = (data.actor ?? data.fromUser ?? challengeData.teamA ?? {}) as Record<
    string,
    unknown
  >;

  const intentType = normalizeIntentType(data.intentType ?? data.type ?? data.kind);
  const matchId = asString(data.matchId ?? matchData.id);
  const challengeId = asString(data.challengeId ?? challengeData.id);
  const baseId = asString(data.id) ?? matchId ?? challengeId ?? `${Date.now()}`;
  const idPrefix = intentType === 'CONFIRM_RESULT' ? 'match' : 'challenge';

  return {
    id: asString(data.id) ?? `${idPrefix}:${baseId}`,
    intentType,
    status: asString(data.status ?? data.state) ?? 'pending',
    actorName:
      asString(data.actorName ?? actorData.displayName ?? actorData.name) ??
      'Jugador',
    subtitle: asString(data.subtitle ?? data.message ?? data.description) ?? null,
    createdAt:
      asString(data.createdAt ?? data.insertedAt ?? data.updatedAt) ??
      new Date().toISOString(),
    leagueId:
      asString(
        data.leagueId ??
          challengeData.leagueId ??
          matchData.leagueId
      ) ?? null,
    matchId,
    challengeId,
  };
}

function normalizeListResponse(raw: unknown): UserIntent[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown[] } | null | undefined)?.items)
      ? (raw as { items: unknown[] }).items
      : [];

  return list.map(normalizeUserIntent);
}

export const intentsService = {
  async list(params?: ListIntentParams): Promise<UserIntent[]> {
    const { data } = await api.get('/me/intents', {
      params: params?.leagueId ? { leagueId: params.leagueId } : undefined,
    });
    return normalizeListResponse(data);
  },

  /**
   * Declarar intención de jugar un partido directo (sin rival específico).
   * El rival puede asignarse más tarde desde /competitive/find.
   */
  async createDirect(params: BaseParams): Promise<CreatedIntent> {
    const { data } = await api.post<CreatedIntent>('/me/intents', {
      type: 'DIRECT',
      matchType: params.matchType ?? 'COMPETITIVE',
      message: params.message ?? null,
      ...(params.leagueId ? { leagueId: params.leagueId } : {}),
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
      ...(params.leagueId ? { leagueId: params.leagueId } : {}),
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
      ...(params.leagueId ? { leagueId: params.leagueId } : {}),
    });
    return data;
  },
};

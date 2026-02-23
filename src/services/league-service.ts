import api from '@/lib/api';
import { isUuid } from '@/lib/id-utils';
import { normalizeLeagueStatus } from '@/lib/league-utils';
import type {
  League,
  CreateLeaguePayload,
  CreateMiniLeaguePayload,
  CreateMiniLeagueResponse,
  InviteByTokenResponse,
  ReportFromReservationPayload,
  ReportManualPayload,
  ReportFromReservationResponse,
  EligibleReservation,
  LeagueMatch,
  CreateLeagueMatchPayload,
  CaptureLeagueMatchResultPayload,
  LeagueSettings,
  LeagueMemberRole,
  LeagueStandingsResponse,
  StandingsMovementMap,
  CreateLeagueChallengePayload,
  LeagueChallenge,
  LeagueChallengeScope,
  LeagueChallengeParticipant,
  LeagueInviteDispatchResult,
  ActivityEventView,
  ActivityResponse,
} from '@/types/leagues';

/** Normalise status + provide displayName fallbacks for members/standings. */
function normalizeLeague(raw: League): League {
  return {
    ...raw,
    status: normalizeLeagueStatus(raw.status),
    members: raw.members?.map((m) => ({
      ...m,
      displayName: m.displayName || 'Jugador',
    })),
    standings: raw.standings?.map((s) => ({
      ...s,
      displayName: s.displayName || 'Jugador',
    })),
  };
}

function normalizeStandingsMovement(value: unknown): StandingsMovementMap {
  if (!value || typeof value !== 'object') return {};
  const out: StandingsMovementMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(raw);
    if (!Number.isNaN(n)) out[key] = n;
  }
  return out;
}

function normalizeChallengeParticipant(
  raw: unknown,
  idFallback?: string,
  nameFallback?: string
): LeagueChallengeParticipant {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    userId: String(data.userId ?? idFallback ?? ''),
    displayName: String(data.displayName ?? data.name ?? nameFallback ?? 'Jugador'),
  };
}

function normalizeLeagueChallenge(raw: unknown): LeagueChallenge {
  const data = (raw ?? {}) as Record<string, unknown>;

  const challenger = normalizeChallengeParticipant(
    data.challenger ?? data.creator ?? data.fromUser ?? data.teamA,
    typeof data.challengerUserId === 'string' ? data.challengerUserId : undefined,
    typeof data.challengerDisplayName === 'string' ? data.challengerDisplayName : undefined
  );
  const opponent = normalizeChallengeParticipant(
    data.opponent ?? data.invitedOpponent ?? data.toUser ?? data.teamB,
    typeof data.opponentUserId === 'string' ? data.opponentUserId : undefined,
    typeof data.opponentDisplayName === 'string' ? data.opponentDisplayName : undefined
  );

  return {
    id: String(data.id ?? ''),
    status: String(data.status ?? data.state ?? 'pending'),
    message: typeof data.message === 'string' ? data.message : null,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : null,
    challenger,
    opponent,
    matchId: typeof data.matchId === 'string' ? data.matchId : null,
  };
}

function normalizeInviteDispatchResult(raw: unknown): LeagueInviteDispatchResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;

  const invitedUserId =
    typeof data.invitedUserId === 'string'
      ? data.invitedUserId
      : data.invitedUserId === null
        ? null
        : null;

  const result: LeagueInviteDispatchResult = {
    inviteId: typeof data.id === 'string' ? data.id : undefined,
    email: typeof data.email === 'string' ? data.email : undefined,
    invitedUserId,
  };

  return result;
}

function normalizeCreateInvitesResponse(raw: unknown): LeagueInviteDispatchResult[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeInviteDispatchResult)
      .filter((item): item is LeagueInviteDispatchResult => item !== null);
  }

  if (raw && typeof raw === 'object') {
    const data = raw as Record<string, unknown>;

    const wrappedList = data.items ?? data.invites ?? data.data;
    if (Array.isArray(wrappedList)) {
      return wrappedList
        .map(normalizeInviteDispatchResult)
        .filter((item): item is LeagueInviteDispatchResult => item !== null);
    }

    const single = normalizeInviteDispatchResult(raw);
    return single ? [single] : [];
  }

  return [];
}

function normalizeCreateMiniLeagueResponse(raw: unknown): CreateMiniLeagueResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const toCount = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    leagueId: typeof data.leagueId === 'string' ? data.leagueId : '',
    invitedExistingUsers: toCount(data.invitedExistingUsers),
    invitedByEmailOnly: toCount(data.invitedByEmailOnly),
    skipped: toCount(data.skipped),
  };
}

function normalizeLeagueMatch(raw: unknown): LeagueMatch {
  const data = (raw ?? {}) as Record<string, unknown>;
  const statusRaw = typeof data.status === 'string' ? data.status.toLowerCase() : 'pending_confirm';
  const statusNormalized = statusRaw === 'programmed' ? 'scheduled' : statusRaw;
  const status: LeagueMatch['status'] =
    statusNormalized === 'scheduled' ||
    statusNormalized === 'pending_confirm' ||
    statusNormalized === 'confirmed' ||
    statusNormalized === 'disputed' ||
    statusNormalized === 'resolved'
      ? statusNormalized
      : 'pending_confirm';
  const sourceRaw = typeof data.source === 'string' ? data.source.toUpperCase() : '';
  const source = sourceRaw === 'RESERVATION' || sourceRaw === 'MANUAL' ? sourceRaw : undefined;

  const mapTeam = (input: unknown): LeagueMatch['teamA'] => {
    if (!Array.isArray(input)) return [];
    return input.map((item) => {
      const player = (item ?? {}) as Record<string, unknown>;
      return {
        userId: typeof player.userId === 'string' ? player.userId : undefined,
        displayName: String(player.displayName ?? player.name ?? 'Jugador'),
      };
    });
  };

  return {
    id: String(data.id ?? ''),
    playedAt: typeof data.playedAt === 'string' ? data.playedAt : undefined,
    scheduledAt: typeof data.scheduledAt === 'string' ? data.scheduledAt : null,
    score: typeof data.score === 'string' ? data.score : null,
    status,
    source,
    teamA: mapTeam(data.teamA),
    teamB: mapTeam(data.teamB),
  };
}

function normalizeActivityEvent(raw: unknown): ActivityEventView {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(data.id ?? ''),
    leagueId: String(data.leagueId ?? ''),
    type: String(data.type ?? ''),
    actorId: typeof data.actorId === 'string' ? data.actorId : null,
    actorName:
      typeof data.actorName === 'string' && data.actorName.length > 0 ? data.actorName : null,
    payload:
      data.payload && typeof data.payload === 'object'
        ? (data.payload as Record<string, unknown>)
        : {},
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
  };
}

function normalizeActivityResponse(raw: unknown): ActivityResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.data)
      ? data.data
      : [];
  return {
    items: rawItems.map(normalizeActivityEvent),
    nextCursor: typeof data.nextCursor === 'string' ? data.nextCursor : null,
  };
}

function assertValidLeagueId(leagueId: string): string {
  if (!isUuid(leagueId)) {
    throw new Error('Invalid leagueId');
  }
  return leagueId;
}

export const leagueService = {
  /** List all leagues the current user belongs to. */
  async list(): Promise<League[]> {
    const { data } = await api.get('/leagues');
    return (data as League[]).map(normalizeLeague);
  },

  /** Get a single league with members and standings. */
  async getById(id: string): Promise<League> {
    const validLeagueId = assertValidLeagueId(id);
    const { data } = await api.get(`/leagues/${validLeagueId}`);
    return normalizeLeague(data);
  },

  /** Create a new league. */
  async create(payload: CreateLeaguePayload): Promise<League> {
    const { data } = await api.post('/leagues', payload);
    return normalizeLeague(data);
  },

  /** Create a mini league with optional invites. */
  async createMiniLeague(payload: CreateMiniLeaguePayload): Promise<CreateMiniLeagueResponse> {
    const { data } = await api.post('/leagues/mini', payload);
    return normalizeCreateMiniLeagueResponse(data);
  },

  /** Send invites to one or more emails. */
  async createInvites(leagueId: string, emails: string[]): Promise<LeagueInviteDispatchResult[]> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.post(`/leagues/${validLeagueId}/invites`, { emails });
    return normalizeCreateInvitesResponse(data);
  },

  /** Get invite details by token (public, no auth required). */
  async getInviteByToken(token: string): Promise<InviteByTokenResponse> {
    const { data } = await api.get(`/leagues/invites/${token}`);
    return data;
  },

  /** Accept an invite by inviteId. */
  async acceptInvite(inviteId: string): Promise<void> {
    await api.post(`/leagues/invites/${inviteId}/accept`);
  },

  /** Decline an invite by inviteId. */
  async declineInvite(inviteId: string): Promise<void> {
    await api.post(`/leagues/invites/${inviteId}/decline`);
  },

  /** Fetch matches linked to a league. */
  async getMatches(leagueId: string): Promise<LeagueMatch[]> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.get(`/leagues/${validLeagueId}/matches`);
    return Array.isArray(data) ? data.map(normalizeLeagueMatch) : [];
  },

  /** Create a match (played or scheduled). */
  async createMatch(leagueId: string, payload: CreateLeagueMatchPayload): Promise<void> {
    const validLeagueId = assertValidLeagueId(leagueId);
    await api.post(`/leagues/${validLeagueId}/matches`, payload);
  },

  /** Capture result for an already scheduled match. */
  async captureMatchResult(
    leagueId: string,
    matchId: string,
    payload: CaptureLeagueMatchResultPayload
  ): Promise<void> {
    const validLeagueId = assertValidLeagueId(leagueId);
    await api.post(`/leagues/${validLeagueId}/matches/${matchId}/result`, payload);
  },

  /** Fetch confirmed, past reservations eligible for league match reporting. */
  async getEligibleReservations(leagueId: string): Promise<EligibleReservation[]> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.get(`/leagues/${validLeagueId}/eligible-reservations`);
    return Array.isArray(data) ? data : [];
  },

  /** Fetch league settings (scoring, tie-breakers, sources). */
  async getSettings(leagueId: string): Promise<LeagueSettings> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.get(`/leagues/${validLeagueId}/settings`);
    return data;
  },

  /** Fetch standings with movement deltas + computation timestamp. */
  async getStandings(leagueId: string): Promise<LeagueStandingsResponse> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.get(`/leagues/${validLeagueId}/standings`);

    const rowsRaw = (data?.rows ?? data?.standings ?? []) as League['standings'];
    const rows = Array.isArray(rowsRaw)
      ? rowsRaw.map((s) => ({
          ...s,
          displayName: s.displayName || 'Jugador',
        }))
      : [];

    const movement = normalizeStandingsMovement(data?.movement ?? data?.movementMap);
    const computedAt = typeof data?.computedAt === 'string' ? data.computedAt : undefined;

    return { rows, movement, computedAt };
  },

  /** Update league settings. */
  async updateSettings(leagueId: string, payload: Partial<LeagueSettings>): Promise<LeagueSettings> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.patch(`/leagues/${validLeagueId}/settings`, payload);
    return data;
  },

  /** Update a member's role in the league. */
  async updateMemberRole(leagueId: string, userId: string, role: LeagueMemberRole): Promise<void> {
    const validLeagueId = assertValidLeagueId(leagueId);
    await api.patch(`/leagues/${validLeagueId}/members/${userId}/role`, { role });
  },

  /** Report a league match anchored to a reservation. */
  async reportFromReservation(
    leagueId: string,
    payload: ReportFromReservationPayload
  ): Promise<ReportFromReservationResponse> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.post(
      `/leagues/${validLeagueId}/report-from-reservation`,
      payload
    );
    return data;
  },

  /** Report a league match manually (without reservation anchor). */
  async reportManual(
    leagueId: string,
    payload: ReportManualPayload
  ): Promise<ReportFromReservationResponse> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.post(
      `/leagues/${validLeagueId}/report-manual`,
      payload
    );
    return data;
  },

  /** Create a league challenge. */
  async createChallenge(
    leagueId: string,
    payload: CreateLeagueChallengePayload
  ): Promise<LeagueChallenge> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.post(`/leagues/${validLeagueId}/challenges`, payload);
    return normalizeLeagueChallenge(data);
  },

  /** List league challenges by scope (active/history). */
  async getChallenges(
    leagueId: string,
    scope: LeagueChallengeScope
  ): Promise<LeagueChallenge[]> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const { data } = await api.get(`/leagues/${validLeagueId}/challenges`, {
      params: { status: scope },
    });
    const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return list.map(normalizeLeagueChallenge);
  },

  /** Accept challenge invitation. */
  async acceptChallenge(challengeId: string): Promise<LeagueChallenge> {
    const { data } = await api.post(`/challenges/${challengeId}/accept`);
    return normalizeLeagueChallenge(data);
  },

  /** Decline challenge invitation. */
  async declineChallenge(challengeId: string): Promise<LeagueChallenge> {
    const { data } = await api.post(`/challenges/${challengeId}/decline`);
    return normalizeLeagueChallenge(data);
  },

  /** Link a confirmed match to a challenge. */
  async linkChallengeMatch(challengeId: string, matchId: string): Promise<LeagueChallenge> {
    const { data } = await api.post(`/challenges/${challengeId}/link-match`, { matchId });
    return normalizeLeagueChallenge(data);
  },

  /** Fetch activity feed for a league with cursor-based pagination. */
  async getActivity(
    leagueId: string,
    params: { limit?: number; cursor?: string } = {}
  ): Promise<ActivityResponse> {
    const validLeagueId = assertValidLeagueId(leagueId);
    const queryParams: Record<string, string | number> = {};
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    const { data } = await api.get(`/leagues/${validLeagueId}/activity`, {
      params: queryParams,
    });
    return normalizeActivityResponse(data);
  },
};

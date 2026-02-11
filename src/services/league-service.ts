import api from '@/lib/api';
import { normalizeLeagueStatus } from '@/lib/league-utils';
import type {
  League,
  CreateLeaguePayload,
  InviteByTokenResponse,
  ReportFromReservationPayload,
  ReportManualPayload,
  ReportFromReservationResponse,
  EligibleReservation,
  LeagueMatch,
  LeagueSettings,
  LeagueMemberRole,
  LeagueStandingsResponse,
  StandingsMovementMap,
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

export const leagueService = {
  /** List all leagues the current user belongs to. */
  async list(): Promise<League[]> {
    const { data } = await api.get('/leagues');
    return (data as League[]).map(normalizeLeague);
  },

  /** Get a single league with members and standings. */
  async getById(id: string): Promise<League> {
    const { data } = await api.get(`/leagues/${id}`);
    return normalizeLeague(data);
  },

  /** Create a new league. */
  async create(payload: CreateLeaguePayload): Promise<League> {
    const { data } = await api.post('/leagues', payload);
    return normalizeLeague(data);
  },

  /** Send invites to one or more emails. */
  async createInvites(leagueId: string, emails: string[]): Promise<void> {
    await api.post(`/leagues/${leagueId}/invites`, { emails });
  },

  /** Get invite details by token (public, no auth required). */
  async getInviteByToken(token: string): Promise<InviteByTokenResponse> {
    const { data } = await api.get(`/leagues/invites/${token}`);
    return data;
  },

  /** Accept an invite by token. */
  async acceptInvite(token: string): Promise<void> {
    await api.post(`/leagues/invites/${token}/accept`);
  },

  /** Decline an invite by token. */
  async declineInvite(token: string): Promise<void> {
    await api.post(`/leagues/invites/${token}/decline`);
  },

  /** Fetch matches linked to a league. */
  async getMatches(leagueId: string): Promise<LeagueMatch[]> {
    const { data } = await api.get(`/leagues/${leagueId}/matches`);
    return Array.isArray(data) ? data : [];
  },

  /** Fetch confirmed, past reservations eligible for league match reporting. */
  async getEligibleReservations(leagueId: string): Promise<EligibleReservation[]> {
    const { data } = await api.get(`/leagues/${leagueId}/eligible-reservations`);
    return Array.isArray(data) ? data : [];
  },

  /** Fetch league settings (scoring, tie-breakers, sources). */
  async getSettings(leagueId: string): Promise<LeagueSettings> {
    const { data } = await api.get(`/leagues/${leagueId}/settings`);
    return data;
  },

  /** Fetch standings with movement deltas + computation timestamp. */
  async getStandings(leagueId: string): Promise<LeagueStandingsResponse> {
    const { data } = await api.get(`/leagues/${leagueId}/standings`);

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
    const { data } = await api.patch(`/leagues/${leagueId}/settings`, payload);
    return data;
  },

  /** Update a member's role in the league. */
  async updateMemberRole(leagueId: string, userId: string, role: LeagueMemberRole): Promise<void> {
    await api.patch(`/leagues/${leagueId}/members/${userId}/role`, { role });
  },

  /** Report a league match anchored to a reservation. */
  async reportFromReservation(
    leagueId: string,
    payload: ReportFromReservationPayload
  ): Promise<ReportFromReservationResponse> {
    const { data } = await api.post(
      `/leagues/${leagueId}/report-from-reservation`,
      payload
    );
    return data;
  },

  /** Report a league match manually (without reservation anchor). */
  async reportManual(
    leagueId: string,
    payload: ReportManualPayload
  ): Promise<ReportFromReservationResponse> {
    const { data } = await api.post(
      `/leagues/${leagueId}/report-manual`,
      payload
    );
    return data;
  },
};

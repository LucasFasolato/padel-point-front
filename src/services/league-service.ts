import api from '@/lib/api';
import type {
  League,
  CreateLeaguePayload,
  InviteByTokenResponse,
} from '@/types/leagues';

export const leagueService = {
  /** List all leagues the current user belongs to. */
  async list(): Promise<League[]> {
    const { data } = await api.get('/leagues');
    return data;
  },

  /** Get a single league with members and standings. */
  async getById(id: string): Promise<League> {
    const { data } = await api.get(`/leagues/${id}`);
    return data;
  },

  /** Create a new league. */
  async create(payload: CreateLeaguePayload): Promise<League> {
    const { data } = await api.post('/leagues', payload);
    return data;
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
};

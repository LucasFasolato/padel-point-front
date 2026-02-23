import { describe, expect, it, vi, beforeEach } from 'vitest';
import { leagueService } from '../league-service';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '@/lib/api';
const mockedApi = vi.mocked(api);
const LEAGUE_ID = '11111111-1111-4111-8111-111111111111';

describe('leagueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list calls GET /leagues', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    const result = await leagueService.list();
    expect(mockedApi.get).toHaveBeenCalledWith('/leagues');
    expect(result).toEqual([]);
  });

  it('getById calls GET /leagues/:id', async () => {
    const league = { id: LEAGUE_ID, name: 'Test', status: 'active', startDate: '2026-01-01', endDate: '2026-03-01', creatorId: 'u-1', membersCount: 2 };
    mockedApi.get.mockResolvedValue({ data: league });
    const result = await leagueService.getById(LEAGUE_ID);
    expect(mockedApi.get).toHaveBeenCalledWith(`/leagues/${LEAGUE_ID}`);
    expect(result).toMatchObject({ id: LEAGUE_ID, name: 'Test', status: 'active' });
  });

  it('getById normalises draft status to upcoming', async () => {
    const league = { id: LEAGUE_ID, name: 'Draft Liga', status: 'draft', startDate: '2026-01-01', endDate: '2026-03-01', creatorId: 'u-1', membersCount: 1 };
    mockedApi.get.mockResolvedValue({ data: league });
    const result = await leagueService.getById(LEAGUE_ID);
    expect(result.status).toBe('upcoming');
  });

  it('throws before API call when league id is invalid', async () => {
    await expect(leagueService.getById('undefined')).rejects.toThrow('Invalid leagueId');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('create calls POST /leagues', async () => {
    const payload = { name: 'Liga', startDate: '2026-01-01', endDate: '2026-03-01' };
    const created = { id: 'lg-new', ...payload, status: 'upcoming', creatorId: 'u-1', membersCount: 1 };
    mockedApi.post.mockResolvedValue({ data: created });
    const result = await leagueService.create(payload);
    expect(mockedApi.post).toHaveBeenCalledWith('/leagues', payload);
    expect(result).toMatchObject({ id: 'lg-new', name: 'Liga' });
  });

  it('createInvites calls POST /leagues/:id/invites', async () => {
    mockedApi.post.mockResolvedValue({
      data: [{ id: 'inv-1', email: 'a@b.com', invitedUserId: null }],
    });
    const result = await leagueService.createInvites(LEAGUE_ID, ['a@b.com']);
    expect(mockedApi.post).toHaveBeenCalledWith(`/leagues/${LEAGUE_ID}/invites`, { emails: ['a@b.com'] });
    expect(result).toEqual([{ inviteId: 'inv-1', email: 'a@b.com', invitedUserId: null }]);
  });

  it('createInvites unwraps object response with invites list', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        invites: [{ id: 'inv-2', email: 'known@b.com', invitedUserId: 'u-1' }],
      },
    });
    const result = await leagueService.createInvites(LEAGUE_ID, ['known@b.com']);
    expect(result).toEqual([{ inviteId: 'inv-2', email: 'known@b.com', invitedUserId: 'u-1' }]);
  });

  it('acceptInvite calls POST /leagues/invites/:token/accept', async () => {
    mockedApi.post.mockResolvedValue({});
    await leagueService.acceptInvite('tok-123');
    expect(mockedApi.post).toHaveBeenCalledWith('/leagues/invites/tok-123/accept');
  });

  it('declineInvite calls POST /leagues/invites/:token/decline', async () => {
    mockedApi.post.mockResolvedValue({});
    await leagueService.declineInvite('tok-123');
    expect(mockedApi.post).toHaveBeenCalledWith('/leagues/invites/tok-123/decline');
  });

  describe('getActivity', () => {
    const makeEvent = (overrides = {}) => ({
      id: 'ev-1',
      leagueId: LEAGUE_ID,
      type: 'member_joined',
      actorId: 'u-1',
      actorName: 'Juan',
      payload: {},
      createdAt: '2026-01-01T00:00:00Z',
      ...overrides,
    });

    it('calls GET /leagues/:id/activity with no params', async () => {
      mockedApi.get.mockResolvedValue({ data: { items: [], nextCursor: null } });
      const result = await leagueService.getActivity(LEAGUE_ID);
      expect(mockedApi.get).toHaveBeenCalledWith(`/leagues/${LEAGUE_ID}/activity`, { params: {} });
      expect(result).toEqual({ items: [], nextCursor: null });
    });

    it('passes limit and cursor as query params', async () => {
      mockedApi.get.mockResolvedValue({ data: { items: [], nextCursor: 'c-next' } });
      await leagueService.getActivity(LEAGUE_ID, { limit: 20, cursor: 'c-abc' });
      expect(mockedApi.get).toHaveBeenCalledWith(`/leagues/${LEAGUE_ID}/activity`, {
        params: { limit: 20, cursor: 'c-abc' },
      });
    });

    it('normalises items in response', async () => {
      mockedApi.get.mockResolvedValue({ data: { items: [makeEvent()], nextCursor: 'c-next' } });
      const result = await leagueService.getActivity(LEAGUE_ID);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: 'ev-1',
        leagueId: LEAGUE_ID,
        type: 'member_joined',
        actorName: 'Juan',
      });
      expect(result.nextCursor).toBe('c-next');
    });

    it('unwraps data.data fallback when items key is absent', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: [makeEvent()], nextCursor: null } });
      const result = await leagueService.getActivity(LEAGUE_ID);
      expect(result.items).toHaveLength(1);
    });

    it('normalises null actorName when actorName is empty string', async () => {
      mockedApi.get.mockResolvedValue({
        data: { items: [makeEvent({ actorName: '' })], nextCursor: null },
      });
      const result = await leagueService.getActivity(LEAGUE_ID);
      expect(result.items[0].actorName).toBeNull();
    });

    it('throws before API call when leagueId is invalid', async () => {
      await expect(leagueService.getActivity('not-a-uuid')).rejects.toThrow('Invalid leagueId');
      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });
});

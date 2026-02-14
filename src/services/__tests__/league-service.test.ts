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
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { leagueService } from '../league-service';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '@/lib/api';
const mockedApi = vi.mocked(api);

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
    const league = { id: 'lg-1', name: 'Test' };
    mockedApi.get.mockResolvedValue({ data: league });
    const result = await leagueService.getById('lg-1');
    expect(mockedApi.get).toHaveBeenCalledWith('/leagues/lg-1');
    expect(result).toEqual(league);
  });

  it('create calls POST /leagues', async () => {
    const payload = { name: 'Liga', startDate: '2026-01-01', endDate: '2026-03-01' };
    const created = { id: 'lg-new', ...payload };
    mockedApi.post.mockResolvedValue({ data: created });
    const result = await leagueService.create(payload);
    expect(mockedApi.post).toHaveBeenCalledWith('/leagues', payload);
    expect(result).toEqual(created);
  });

  it('createInvites calls POST /leagues/:id/invites', async () => {
    mockedApi.post.mockResolvedValue({});
    await leagueService.createInvites('lg-1', ['a@b.com']);
    expect(mockedApi.post).toHaveBeenCalledWith('/leagues/lg-1/invites', { emails: ['a@b.com'] });
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

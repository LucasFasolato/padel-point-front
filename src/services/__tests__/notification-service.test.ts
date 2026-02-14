import { describe, expect, it, vi, beforeEach } from 'vitest';
import { notificationService, normalizeList } from '../notification-service';
import { NOTIFICATION_TYPES } from '@/types/notifications';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '@/lib/api';
const mockedApi = vi.mocked(api);

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list calls GET /notifications with limit', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    await notificationService.list(25);
    expect(mockedApi.get).toHaveBeenCalledWith('/notifications', { params: { limit: 25 } });
  });

  it('getUnreadCount calls GET /notifications/unread-count', async () => {
    mockedApi.get.mockResolvedValue({ data: { count: 7 } });
    const result = await notificationService.getUnreadCount();
    expect(mockedApi.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(result).toBe(7);
  });

  it('markRead calls POST /notifications/:id/read', async () => {
    mockedApi.post.mockResolvedValue({});
    await notificationService.markRead('abc123');
    expect(mockedApi.post).toHaveBeenCalledWith('/notifications/abc123/read');
  });

  it('markAllRead calls POST /notifications/read-all', async () => {
    mockedApi.post.mockResolvedValue({});
    await notificationService.markAllRead();
    expect(mockedApi.post).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('list returns empty array when backend returns non-array', async () => {
    mockedApi.get.mockResolvedValue({ data: { count: 5 } });
    const result = await notificationService.list();
    expect(result).toEqual([]);
  });

  it('list normalizes { items: [...] } wrapper', async () => {
    const createdAt = '2025-01-01T00:00:00.000Z';
    const items = [{ id: '1', type: 'system', title: 'Hi', message: '', createdAt }];
    mockedApi.get.mockResolvedValue({ data: { items } });
    const result = await notificationService.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '1',
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Hi',
      message: '',
      priority: 'normal',
      read: false,
      link: null,
      createdAt,
    });
  });

  it('list returns empty array when backend returns null', async () => {
    mockedApi.get.mockResolvedValue({ data: null });
    const result = await notificationService.list();
    expect(result).toEqual([]);
  });
});

describe('normalizeList', () => {
  it('normalizes arrays', () => {
    const createdAt = '2025-01-01T00:00:00.000Z';
    const arr = [{ id: '1', type: 'league_invite_received', title: 'Inv', message: '', createdAt }];
    const result = normalizeList(arr);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '1',
      type: NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED,
      title: 'Inv',
      message: '',
      createdAt,
    });
  });

  it('maps actionMeta.inviteToken to actionMeta.inviteId', () => {
    const result = normalizeList([
      {
        id: '1',
        type: 'league_invite_received',
        title: 'Inv',
        message: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        actionMeta: { inviteToken: 'inv-123', leagueId: 'lg-1' },
      },
    ]);

    expect(result[0].actionMeta).toEqual({ inviteId: 'inv-123', leagueId: 'lg-1' });
  });

  it('normalizes dot-notation invite type to canonical enum', () => {
    const result = normalizeList([
      {
        id: 'dot-1',
        type: 'league.invite_received',
        title: 'Inv',
        message: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        data: { inviteId: 'inv-dot-1' },
      },
    ]);

    expect(result[0].type).toBe(NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED);
  });

  it('normalizes dot-notation match types to canonical enum', () => {
    const result = normalizeList([
      {
        id: 'dot-2',
        type: 'match.disputed',
        title: 'Disputed',
        message: '',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'dot-3',
        type: 'match.resolved',
        title: 'Resolved',
        message: '',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    expect(result[0].type).toBe(NOTIFICATION_TYPES.MATCH_DISPUTED);
    expect(result[1].type).toBe(NOTIFICATION_TYPES.MATCH_RESOLVED);
  });

  it('maps data.inviteToken to data.inviteId and fallback actionMeta', () => {
    const result = normalizeList([
      {
        id: '2',
        type: 'league_invite_received',
        title: 'Inv',
        message: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        data: { inviteToken: 'inv-456' },
      },
    ]);

    expect(result[0].data?.inviteId).toBe('inv-456');
    expect(result[0].actionMeta).toEqual({ inviteId: 'inv-456' });
  });

  it('maps readAt to read=true deterministically', () => {
    const result = normalizeList([
      {
        id: '3',
        type: 'league_invite_received',
        title: 'Inv',
        message: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        readAt: '2025-01-02T00:00:00.000Z',
        data: { inviteId: 'inv-789' },
      },
    ]);

    expect(result[0].read).toBe(true);
    expect(result[0].actionMeta).toEqual({ inviteId: 'inv-789' });
  });

  it('does not map generic data.status into inviteStatus', () => {
    const result = normalizeList([
      {
        id: '4',
        type: 'league_invite_received',
        title: 'Inv',
        message: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        data: { inviteId: 'inv-999', status: 'read' },
      },
    ]);

    expect(result[0].data?.inviteStatus).toBeUndefined();
    expect(result[0].actionMeta).toEqual({ inviteId: 'inv-999' });
  });

  it('unwraps { items: [...] }', () => {
    const items = [{ id: '1', type: 'general', title: 'Hi', message: '', createdAt: '2025-01-01T00:00:00.000Z' }];
    expect(normalizeList({ items })).toHaveLength(1);
  });

  it('unwraps { data: [...] }', () => {
    const data = [{ id: '1', type: 'general', title: 'Hi', message: '', createdAt: '2025-01-01T00:00:00.000Z' }];
    expect(normalizeList({ data })).toHaveLength(1);
  });

  it('returns [] for null', () => {
    expect(normalizeList(null)).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(normalizeList(undefined)).toEqual([]);
  });

  it('returns [] for number', () => {
    expect(normalizeList(42)).toEqual([]);
  });

  it('returns [] for string', () => {
    expect(normalizeList('hello')).toEqual([]);
  });

  it('returns [] for empty object', () => {
    expect(normalizeList({})).toEqual([]);
  });

  it('returns [] for object with non-array items', () => {
    expect(normalizeList({ items: 'not-an-array' })).toEqual([]);
  });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { notificationService, normalizeList } from '../notification-service';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
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

  it('markRead calls PATCH /notifications/:id/read', async () => {
    mockedApi.patch.mockResolvedValue({});
    await notificationService.markRead('abc123');
    expect(mockedApi.patch).toHaveBeenCalledWith('/notifications/abc123/read');
  });

  it('markAllRead calls PATCH /notifications/read-all', async () => {
    mockedApi.patch.mockResolvedValue({});
    await notificationService.markAllRead();
    expect(mockedApi.patch).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('list returns empty array when backend returns non-array', async () => {
    mockedApi.get.mockResolvedValue({ data: { count: 5 } });
    const result = await notificationService.list();
    expect(result).toEqual([]);
  });

  it('list normalizes { items: [...] } wrapper', async () => {
    const items = [{ id: '1', type: 'system', title: 'Hi' }];
    mockedApi.get.mockResolvedValue({ data: { items } });
    const result = await notificationService.list();
    expect(result).toEqual(items);
  });

  it('list returns empty array when backend returns null', async () => {
    mockedApi.get.mockResolvedValue({ data: null });
    const result = await notificationService.list();
    expect(result).toEqual([]);
  });
});

describe('normalizeList', () => {
  it('returns array as-is', () => {
    const arr = [{ id: '1' }];
    expect(normalizeList(arr)).toBe(arr);
  });

  it('unwraps { items: [...] }', () => {
    const items = [{ id: '1' }];
    expect(normalizeList({ items })).toBe(items);
  });

  it('unwraps { data: [...] }', () => {
    const data = [{ id: '1' }];
    expect(normalizeList({ data })).toBe(data);
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

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { notificationService } from '../notification-service';

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
});

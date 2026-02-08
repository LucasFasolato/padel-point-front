import api from '@/lib/api';
import type { AppNotification, UnreadCountResponse } from '@/types/notifications';

/**
 * Normalizes any backend response shape into a plain array.
 * Handles: array, { items: [...] }, { data: [...] }, null/undefined, or non-object.
 */
export function normalizeList(raw: unknown): AppNotification[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

export const notificationService = {
  async list(limit: number = 50): Promise<AppNotification[]> {
    const { data } = await api.get('/notifications', { params: { limit } });
    return normalizeList(data);
  },

  async getUnreadCount(): Promise<number> {
    try {
      const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count');
      return typeof data?.count === 'number' ? data.count : 0;
    } catch {
      // 304 or empty body — keep UI working, default to 0
      return 0;
    }
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};

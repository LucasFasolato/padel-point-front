import api from '@/lib/api';
import type { AppNotification, UnreadCountResponse } from '@/types/notifications';

export const notificationService = {
  async list(limit: number = 50): Promise<AppNotification[]> {
    const { data } = await api.get('/notifications', { params: { limit } });
    return data;
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

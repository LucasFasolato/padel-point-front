import api from '@/lib/api';
import type {
  AppNotification,
  NotificationActionMeta,
  NotificationPriority,
  UnreadCountResponse,
} from '@/types/notifications';
import { normalizeNotificationType } from '@/types/notifications';

function normalizeActionMeta(raw: unknown): NotificationActionMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const meta = raw as Record<string, unknown>;
  const inviteId =
    typeof meta.inviteId === 'string'
      ? meta.inviteId
      : typeof meta.inviteToken === 'string'
        ? meta.inviteToken
        : undefined;

  const next: NotificationActionMeta = {
    inviteId,
    leagueId: typeof meta.leagueId === 'string' ? meta.leagueId : undefined,
    leagueName: typeof meta.leagueName === 'string' ? meta.leagueName : undefined,
    inviterName: typeof meta.inviterName === 'string' ? meta.inviterName : undefined,
  };

  return Object.values(next).some((value) => typeof value === 'string') ? next : undefined;
}

function normalizePriority(value: unknown): NotificationPriority {
  if (value === 'high' || value === 'normal' || value === 'low') {
    return value;
  }
  return 'normal';
}

function normalizeNotification(raw: unknown): AppNotification | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Record<string, unknown>;
  const rawType = typeof data.type === 'string' ? data.type : 'GENERAL';
  const normalizedType = normalizeNotificationType(rawType);

  return {
    id: String(data.id ?? ''),
    type: normalizedType ?? rawType,
    title: typeof data.title === 'string' ? data.title : '',
    message: typeof data.message === 'string' ? data.message : '',
    priority: normalizePriority(data.priority),
    read: data.read === true,
    link: typeof data.link === 'string' ? data.link : null,
    createdAt:
      typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    actionMeta: normalizeActionMeta(data.actionMeta),
  };
}

/**
 * Normalizes any backend response shape into a plain array.
 * Handles: array, { items: [...] }, { data: [...] }, null/undefined, or non-object.
 */
export function normalizeList(raw: unknown): AppNotification[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeNotification).filter((item): item is AppNotification => item !== null);
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return obj.items
        .map(normalizeNotification)
        .filter((item): item is AppNotification => item !== null);
    }
    if (Array.isArray(obj.data)) {
      return obj.data
        .map(normalizeNotification)
        .filter((item): item is AppNotification => item !== null);
    }
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
    await api.post(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  }
};

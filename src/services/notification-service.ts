import api from '@/lib/api';
import type {
  AppNotification,
  NotificationActionMeta,
  NotificationPayloadData,
  NotificationPriority,
  UnreadCountResponse,
} from '@/types/notifications';
import { normalizeNotificationType } from '@/types/notifications';

function normalizeInviteId(raw: Record<string, unknown>): string | undefined {
  if (typeof raw.inviteId === 'string') return raw.inviteId;
  if (typeof raw.inviteToken === 'string') return raw.inviteToken;
  return undefined;
}

function normalizeActionMeta(raw: unknown): NotificationActionMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const meta = raw as Record<string, unknown>;
  const inviteId = normalizeInviteId(meta);
  const next: NotificationActionMeta = {};

  if (inviteId) next.inviteId = inviteId;
  if (typeof meta.inviteStatus === 'string') next.inviteStatus = meta.inviteStatus;
  if (typeof meta.leagueId === 'string') next.leagueId = meta.leagueId;
  if (typeof meta.leagueName === 'string') next.leagueName = meta.leagueName;
  if (typeof meta.inviterName === 'string') next.inviterName = meta.inviterName;

  return Object.keys(next).length > 0 ? next : undefined;
}

function normalizePriority(value: unknown): NotificationPriority {
  if (value === 'high' || value === 'normal' || value === 'low') {
    return value;
  }
  return 'normal';
}

function normalizePayloadData(raw: unknown): NotificationPayloadData | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const data = raw as Record<string, unknown>;
  const normalizedInviteId = normalizeInviteId(data);
  const normalizedInviteStatus =
    typeof data.inviteStatus === 'string'
      ? data.inviteStatus
      : typeof data.status === 'string'
        ? data.status
        : undefined;

  return {
    ...data,
    inviteId: normalizedInviteId,
    inviteStatus: normalizedInviteStatus,
  };
}

function normalizeNotification(raw: unknown): AppNotification | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Record<string, unknown>;
  const rawType = typeof data.type === 'string' ? data.type : 'GENERAL';
  const normalizedType = normalizeNotificationType(rawType);
  const normalizedPayloadData = normalizePayloadData(data.data);

  const actionMeta =
    normalizeActionMeta(data.actionMeta) ??
    (normalizedPayloadData?.inviteId
      ? { inviteId: normalizedPayloadData.inviteId, inviteStatus: normalizedPayloadData.inviteStatus }
      : undefined);

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
    actionMeta,
    data: normalizedPayloadData,
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

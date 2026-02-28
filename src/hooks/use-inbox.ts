import { useIntents } from '@/hooks/use-intents';
import { useNotifications } from '@/hooks/use-notifications';
import { NOTIFICATION_TYPES } from '@/types/notifications';
import type { UserIntent } from '@/types/competitive';
import type { AppNotification } from '@/types/notifications';

/** Notification types routed to the "Ligas" (invites) tab */
const INVITE_TYPES = new Set<string>([NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED]);

/** Unread first, then descending by date */
function sortByUnreadThenNewest(a: AppNotification, b: AppNotification): number {
  if (a.read !== b.read) return a.read ? 1 : -1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export interface InboxSectionState<T> {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export interface UseInboxResult {
  /** Unified pending-action items: match confirmations + incoming challenges */
  intents: InboxSectionState<UserIntent>;
  invites: InboxSectionState<AppNotification>;
  alerts: InboxSectionState<AppNotification>;
  /** Actionable count: intents + unacted league invites */
  actionableCount: number;
}

/**
 * Aggregates three parallel queries into a unified inbox shape.
 * Each section exposes its own isLoading/isError/refetch so the UI
 * can show compact per-section error panels without crashing.
 */
export function useInbox(): UseInboxResult {
  const intentsQ = useIntents();
  const notificationsQ = useNotifications(50);

  const allNotifs = notificationsQ.data ?? [];
  const inviteItems = allNotifs.filter((n) => INVITE_TYPES.has(n.type)).sort(sortByUnreadThenNewest);
  const alertItems = allNotifs.filter((n) => !INVITE_TYPES.has(n.type)).sort(sortByUnreadThenNewest);

  return {
    intents: {
      items: intentsQ.items,
      isLoading: intentsQ.isLoading,
      isError: intentsQ.isError,
      refetch: intentsQ.refetch,
    },
    invites: {
      items: inviteItems,
      isLoading: notificationsQ.isLoading,
      isError: notificationsQ.isError,
      refetch: () => notificationsQ.refetch(),
    },
    alerts: {
      items: alertItems,
      isLoading: notificationsQ.isLoading,
      isError: notificationsQ.isError,
      refetch: () => notificationsQ.refetch(),
    },
    actionableCount: intentsQ.items.length + inviteItems.length,
  };
}

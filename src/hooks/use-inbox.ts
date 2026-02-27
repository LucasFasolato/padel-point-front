import { usePendingConfirmations } from '@/hooks/use-matches';
import { useChallengesInbox } from '@/hooks/use-challenges';
import { useNotifications } from '@/hooks/use-notifications';
import { NOTIFICATION_TYPES } from '@/types/notifications';
import type { MatchResult, Challenge } from '@/types/competitive';
import type { AppNotification } from '@/types/notifications';

/** Notification types routed to the "Ligas" (invites) tab */
const INVITE_TYPES = new Set<string>([NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED]);

export interface InboxSectionState<T> {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export interface UseInboxResult {
  confirmations: InboxSectionState<MatchResult>;
  challenges: InboxSectionState<Challenge>;
  invites: InboxSectionState<AppNotification>;
  alerts: InboxSectionState<AppNotification>;
  /** Actionable count (confirmations + pending challenges + unacted invites) */
  actionableCount: number;
}

/**
 * Aggregates three parallel queries into a unified inbox shape.
 * Each section exposes its own isLoading/isError/refetch so the UI
 * can show compact per-section error panels instead of crashing.
 *
 * Reuses the same query keys as the competitive page → no extra network calls
 * when both are mounted (React Query deduplicates by key).
 */
export function useInbox(): UseInboxResult {
  const confirmationsQ = usePendingConfirmations();
  const challengesQ = useChallengesInbox(); // no limit → all pending
  const notificationsQ = useNotifications(50);

  const confirmationItems = (
    Array.isArray(confirmationsQ.data) ? confirmationsQ.data : []
  ).filter((m): m is MatchResult => Boolean(m?.id));

  const challengeItems = (challengesQ.data ?? []).filter(
    (c) => c.status === 'pending',
  );

  const allNotifs = notificationsQ.data ?? [];
  const inviteItems = allNotifs.filter((n) => INVITE_TYPES.has(n.type));
  const alertItems = allNotifs.filter((n) => !INVITE_TYPES.has(n.type));

  return {
    confirmations: {
      items: confirmationItems,
      isLoading: confirmationsQ.isLoading,
      isError: confirmationsQ.isError,
      refetch: () => confirmationsQ.refetch(),
    },
    challenges: {
      items: challengeItems,
      isLoading: challengesQ.isLoading,
      isError: challengesQ.isError,
      refetch: () => challengesQ.refetch(),
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
    actionableCount:
      confirmationItems.length + challengeItems.length + inviteItems.length,
  };
}

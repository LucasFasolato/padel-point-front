import type { QueryClient, InfiniteData } from '@tanstack/react-query';
import type { AppNotification } from '@/types/notifications';
import {
  NOTIFICATION_TYPES,
  TOAST_WORTHY_TYPES,
  normalizeNotificationType,
} from '@/types/notifications';
import { NOTIFICATION_QUERY_KEYS } from '@/hooks/use-notifications';
import { toastManager } from '@/lib/toast';
import type { ActivityEventView, ActivityResponse } from '@/types/leagues';

const WS_RECONNECT_BASE_MS = 2000;
const WS_RECONNECT_MAX_MS = 30000;

const COMPETITIVE_RANKING_EVENT_NAMES = new Set([
  'ranking:moved',
  'league:ranking_moved',
  'league:ranking-moved',
  'competitive:ranking_moved',
  'competitive:ranking-moved',
]);

const CHALLENGE_UPDATE_EVENT_NAMES = new Set([
  'challenge:updated',
  'challenge:new',
  'challenge:received',
]);

export interface NotificationSocketOptions {
  url: string;
  token: string;
  queryClient: QueryClient;
  onStatusChange?: (connected: boolean) => void;
  /** Called for every "league:activity" event received over WS. */
  onLeagueActivity?: (event: ActivityEventView) => void;
}

/**
 * Manages a WebSocket connection for realtime notifications.
 * On "notification:new", updates the React Query cache and optionally shows a toast.
 * On "league:activity", prepends the event into the activity feed cache.
 * Reconnects with exponential backoff on disconnect.
 */
export class NotificationSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private options: NotificationSocketOptions;
  /** Set of leagueIds the client has subscribed to (best-effort, re-sent on reconnect). */
  private subscribedLeagues = new Set<string>();

  constructor(options: NotificationSocketOptions) {
    this.options = options;
  }

  connect(): void {
    if (this.disposed) return;
    this.cleanup();

    try {
      const separator = this.options.url.includes('?') ? '&' : '?';
      this.ws = new WebSocket(
        `${this.options.url}${separator}token=${encodeURIComponent(this.options.token)}`
      );
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.options.onStatusChange?.(true);
      // Re-subscribe to all leagues after reconnect (best-effort).
      for (const leagueId of this.subscribedLeagues) {
        this.sendJson({ event: 'league:subscribe', leagueId });
      }
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.options.onStatusChange?.(false);
      if (!this.disposed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, triggering reconnect
    };
  }

  /** Subscribe to league-specific realtime events for the given leagueId. */
  subscribeLeague(leagueId: string): void {
    this.subscribedLeagues.add(leagueId);
    this.sendJson({ event: 'league:subscribe', leagueId });
  }

  /** Unsubscribe from league-specific realtime events. */
  unsubscribeLeague(leagueId: string): void {
    this.subscribedLeagues.delete(leagueId);
    this.sendJson({ event: 'league:unsubscribe', leagueId });
  }

  dispose(): void {
    this.disposed = true;
    this.cleanup();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private sendJson(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private cleanup(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    const delay = Math.min(
      WS_RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempt),
      WS_RECONNECT_MAX_MS
    );
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private handleMessage(raw: string): void {
    let parsed: { event?: string; data?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (parsed.event === 'notification:new' && parsed.data) {
      const notification = parsed.data as AppNotification;
      this.onNewNotification(notification);
    }

    if (parsed.event === 'league:activity' && parsed.data) {
      const event = parsed.data as ActivityEventView;
      handleLeagueActivity(this.options.queryClient, event);
      this.options.onLeagueActivity?.(event);
    }

    if (parsed.event && COMPETITIVE_RANKING_EVENT_NAMES.has(parsed.event)) {
      invalidateCompetitiveRatingQueries(this.options.queryClient);
    }

    if (parsed.event && CHALLENGE_UPDATE_EVENT_NAMES.has(parsed.event)) {
      invalidateChallengeInboxQueries(this.options.queryClient);
    }
  }

  private onNewNotification(notification: AppNotification): void {
    const { queryClient } = this.options;

    // Update unread count cache
    const currentCount = queryClient.getQueryData<number>(NOTIFICATION_QUERY_KEYS.unread);
    if (typeof currentCount === 'number') {
      queryClient.setQueryData<number>(NOTIFICATION_QUERY_KEYS.unread, currentCount + 1);
    } else {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unread });
    }

    // Prepend into list cache
    const currentList = queryClient.getQueryData<AppNotification[]>([
      ...NOTIFICATION_QUERY_KEYS.list,
      50,
    ]);
    if (Array.isArray(currentList)) {
      queryClient.setQueryData<AppNotification[]>(
        [...NOTIFICATION_QUERY_KEYS.list, 50],
        [notification, ...currentList]
      );
    } else {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.list });
    }

    // Show toast only for high-priority types
    const type = normalizeNotificationType(notification.type);
    if (type && shouldInvalidateCompetitiveRanking(type)) {
      invalidateCompetitiveRatingQueries(queryClient);
    }
    if (type && shouldInvalidateChallengesInbox(type)) {
      invalidateChallengeInboxQueries(queryClient);
    }
    if (type && TOAST_WORTHY_TYPES.includes(type)) {
      toastManager.info(notification.title, {
        idempotencyKey: `notif-${notification.id}`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Standalone handlers — exported for testing
// ---------------------------------------------------------------------------

/**
 * Processes a raw "notification:new" payload against a QueryClient.
 * Returns true if the notification was handled.
 */
export function handleNewNotification(
  queryClient: QueryClient,
  notification: AppNotification
): boolean {
  const normalizedType = normalizeNotificationType(notification.type);

  const currentCount = queryClient.getQueryData<number>(NOTIFICATION_QUERY_KEYS.unread);
  if (typeof currentCount === 'number') {
    queryClient.setQueryData<number>(NOTIFICATION_QUERY_KEYS.unread, currentCount + 1);
  }

  const currentList = queryClient.getQueryData<AppNotification[]>([
    ...NOTIFICATION_QUERY_KEYS.list,
    50,
  ]);
  if (currentList) {
    queryClient.setQueryData<AppNotification[]>(
      [...NOTIFICATION_QUERY_KEYS.list, 50],
      [notification, ...currentList]
    );
  }

  if (normalizedType && shouldInvalidateCompetitiveRanking(normalizedType)) {
    invalidateCompetitiveRatingQueries(queryClient);
  }

  if (normalizedType && shouldInvalidateChallengesInbox(normalizedType)) {
    invalidateChallengeInboxQueries(queryClient);
  }

  return true;
}

export function shouldInvalidateCompetitiveRanking(type: string): boolean {
  return (
    type === NOTIFICATION_TYPES.ELO_UPDATED || type === NOTIFICATION_TYPES.LEAGUE_RANKING_MOVED
  );
}

export function invalidateCompetitiveRatingQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === 'competitive' &&
      (query.queryKey[1] === 'ranking' ||
        query.queryKey[1] === 'profile' ||
        query.queryKey[1] === 'elo-history'),
  });
}

export function shouldInvalidateChallengesInbox(type: string): boolean {
  return type === NOTIFICATION_TYPES.CHALLENGE_RECEIVED;
}

export function invalidateChallengeInboxQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === 'challenges' &&
      query.queryKey[1] === 'inbox',
  });
}

/**
 * Prepend a league activity event into all cached activity queries for that leagueId.
 * Uses a prefix predicate so it works regardless of the `limit` param in the query key.
 * Deduplicates by id to prevent double entries when REST and WS race.
 */
export function handleLeagueActivity(
  queryClient: QueryClient,
  event: ActivityEventView
): void {
  queryClient.setQueriesData<InfiniteData<ActivityResponse>>(
    { queryKey: ['leagues', 'activity', event.leagueId], exact: false },
    (old) => {
      if (!old?.pages?.length) return old;
      const alreadyPresent = old.pages.some((p) => p.items.some((i) => i.id === event.id));
      if (alreadyPresent) return old;
      return {
        ...old,
        pages: [
          { ...old.pages[0], items: [event, ...old.pages[0].items] },
          ...old.pages.slice(1),
        ],
      };
    }
  );
}

import type { QueryClient } from '@tanstack/react-query';
import type { AppNotification } from '@/types/notifications';
import { TOAST_WORTHY_TYPES } from '@/types/notifications';
import { NOTIFICATION_QUERY_KEYS } from '@/hooks/use-notifications';
import { toastManager } from '@/lib/toast';

const WS_RECONNECT_BASE_MS = 2000;
const WS_RECONNECT_MAX_MS = 30000;

export interface NotificationSocketOptions {
  url: string;
  token: string;
  queryClient: QueryClient;
}

/**
 * Manages a WebSocket connection for realtime notifications.
 * On "notification:new", updates the React Query cache and optionally shows a toast.
 * Reconnects with exponential backoff on disconnect.
 */
export class NotificationSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private options: NotificationSocketOptions;

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
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      if (!this.disposed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, triggering reconnect
    };
  }

  dispose(): void {
    this.disposed = true;
    this.cleanup();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
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
    if (currentList) {
      queryClient.setQueryData<AppNotification[]>(
        [...NOTIFICATION_QUERY_KEYS.list, 50],
        [notification, ...currentList]
      );
    } else {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.list });
    }

    // Show toast only for high-priority types
    if (TOAST_WORTHY_TYPES.includes(notification.type)) {
      toastManager.info(notification.title, {
        idempotencyKey: `notif-${notification.id}`,
      });
    }
  }
}

/**
 * Standalone handler for testing: processes a raw "notification:new" payload
 * against a QueryClient. Returns true if the notification was handled.
 */
export function handleNewNotification(
  queryClient: QueryClient,
  notification: AppNotification
): boolean {
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

  return true;
}

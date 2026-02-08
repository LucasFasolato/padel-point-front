'use client';

import { useNotificationSocket } from '@/hooks/use-notification-socket';

/**
 * Client component that activates the notification WebSocket.
 * Renders nothing — only manages the socket lifecycle.
 */
export function NotificationProvider() {
  useNotificationSocket();
  return null;
}

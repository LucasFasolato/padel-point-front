import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { NotificationSocket } from '@/lib/notification-socket';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

/**
 * Connects to the notification WebSocket when the user is authenticated.
 * Automatically reconnects on disconnect with exponential backoff.
 * Disposes cleanly on unmount or logout.
 */
export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<NotificationSocket | null>(null);

  useEffect(() => {
    if (!token || !WS_URL) return;

    const socket = new NotificationSocket({
      url: WS_URL,
      token,
      queryClient,
    });
    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.dispose();
      socketRef.current = null;
    };
  }, [token, queryClient]);
}

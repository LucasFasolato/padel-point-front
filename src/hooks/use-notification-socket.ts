import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { NotificationSocket } from '@/lib/notification-socket';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

// ---------------------------------------------------------------------------
// Tiny pub/sub for WebSocket connection status so any component can subscribe
// ---------------------------------------------------------------------------
let wsConnected = false;
const listeners = new Set<() => void>();

function setWsConnected(value: boolean) {
  if (wsConnected !== value) {
    wsConnected = value;
    listeners.forEach((l) => l());
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return wsConnected;
}

/** Returns `true` when the notification WebSocket is connected. */
export function useNotificationSocketStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Connects to the notification WebSocket when the user is authenticated.
 * Automatically reconnects on disconnect with exponential backoff.
 * Disposes cleanly on unmount or logout.
 */
export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<NotificationSocket | null>(null);

  const handleStatusChange = useCallback((connected: boolean) => {
    setWsConnected(connected);
  }, []);

  useEffect(() => {
    if (!token || !WS_URL) return;

    const socket = new NotificationSocket({
      url: WS_URL,
      token,
      queryClient,
      onStatusChange: handleStatusChange,
    });
    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.dispose();
      socketRef.current = null;
      setWsConnected(false);
    };
  }, [token, queryClient, handleStatusChange]);
}

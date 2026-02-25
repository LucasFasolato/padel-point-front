import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { NotificationSocket, handleLeagueActivity } from '@/lib/notification-socket';
import type { ActivityEventView } from '@/types/leagues';

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

// ---------------------------------------------------------------------------
// Module-level global socket reference (set by useNotificationSocket)
// ---------------------------------------------------------------------------
let globalSocket: NotificationSocket | null = null;

/**
 * Subscribe to league-specific realtime events for the given leagueId.
 * Sends "league:subscribe" to the server (best-effort — no error if socket is absent).
 */
export function subscribeLeagueSocket(leagueId: string): void {
  globalSocket?.subscribeLeague(leagueId);
}

/**
 * Unsubscribe from league-specific realtime events.
 */
export function unsubscribeLeagueSocket(leagueId: string): void {
  globalSocket?.unsubscribeLeague(leagueId);
}

// ---------------------------------------------------------------------------
// League activity listener bus (module-level, survives re-renders)
// ---------------------------------------------------------------------------
const leagueActivityListeners = new Set<(event: ActivityEventView) => void>();

/**
 * Register a callback invoked for every incoming "league:activity" WS event.
 * Returns an unsubscribe function.
 */
export function addLeagueActivityListener(
  handler: (event: ActivityEventView) => void
): () => void {
  leagueActivityListeners.add(handler);
  return () => leagueActivityListeners.delete(handler);
}

// ---------------------------------------------------------------------------
// Main notification socket hook (mounted once in the player layout)
// ---------------------------------------------------------------------------

/**
 * Connects to the notification WebSocket when the user is authenticated.
 * Automatically reconnects on disconnect with exponential backoff.
 * Disposes cleanly on unmount or logout.
 * Also forwards league:activity events to the module-level listener bus.
 */
export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<NotificationSocket | null>(null);

  const handleStatusChange = useCallback((connected: boolean) => {
    setWsConnected(connected);
  }, []);

  useEffect(() => {
    if (!user?.userId || !WS_URL) return;

    const socket = new NotificationSocket({
      url: WS_URL,
      queryClient,
      onStatusChange: handleStatusChange,
      onLeagueActivity: (event) => {
        leagueActivityListeners.forEach((handler) => handler(event));
      },
    });
    socket.connect();
    socketRef.current = socket;
    globalSocket = socket;

    return () => {
      socket.dispose();
      socketRef.current = null;
      globalSocket = null;
      setWsConnected(false);
    };
  }, [user?.userId, queryClient, handleStatusChange]);
}

// ---------------------------------------------------------------------------
// Per-league realtime hook (used by league detail page)
// ---------------------------------------------------------------------------

/**
 * Subscribe to realtime activity events for a specific league.
 * Sends "league:subscribe" to the WS server and prepends incoming events
 * into the React Query activity feed cache (deduped by id).
 * Cleans up (unsubscribes) automatically on unmount.
 */
export function useLeagueActivitySocket(leagueId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!leagueId) return;

    // Subscribe to the league room on the server (best-effort)
    subscribeLeagueSocket(leagueId);

    // Forward only events for this leagueId into the React Query cache
    const removeListener = addLeagueActivityListener((event) => {
      if (event.leagueId !== leagueId) return;
      handleLeagueActivity(queryClient, event);
    });

    return () => {
      removeListener();
      unsubscribeLeagueSocket(leagueId);
    };
  }, [leagueId, queryClient]);
}

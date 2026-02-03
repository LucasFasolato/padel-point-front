'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import api from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import type {
  ReservationNotificationResponse,
  ReservationNotificationStatus,
} from '@/types';

type NotificationSource = 'api' | 'mock';

type NotificationState = {
  status: ReservationNotificationStatus;
  lastAttemptAt: string | null;
  message: string | null;
  source: NotificationSource;
};

type UseReservationNotificationsArgs = {
  reservationId: string;
  receiptToken: string;
  enabled?: boolean;
};

const statuses: ReservationNotificationStatus[] = ['sent', 'pending', 'error'];

const getMockStatus = (reservationId: string): ReservationNotificationStatus => {
  const hash = reservationId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return statuses[hash % statuses.length];
};

const normalizeResponse = (
  response: ReservationNotificationResponse,
): NotificationState => ({
  status: response.status,
  lastAttemptAt: response.lastAttemptAt ?? null,
  message: response.message ?? null,
  source: 'api',
});

const getMockState = (reservationId: string): NotificationState => ({
  status: getMockStatus(reservationId),
  lastAttemptAt: new Date().toISOString(),
  message: 'Mock: notificación registrada.',
  source: 'mock',
});

export function useReservationNotifications({
  reservationId,
  receiptToken,
  enabled = true,
}: UseReservationNotificationsArgs) {
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasToken = Boolean(receiptToken);
  const active = enabled && Boolean(reservationId);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((updater: () => void) => {
    if (mountedRef.current) updater();
  }, []);

  const handleMissingToken = useCallback(() => {
    setSafeState(() => {
      setError('Falta receiptToken para consultar o reenviar notificaciones.');
      setNotification(null);
      setLoading(false);
    });
  }, [setSafeState]);

  const fetchStatus = useCallback(async () => {
    if (!active) return;
    if (!hasToken) {
      handleMissingToken();
      return;
    }

    setSafeState(() => {
      setLoading(true);
      setError(null);
    });

    try {
      const { data } = await api.get<ReservationNotificationResponse>(
        `/public/reservations/${reservationId}/notifications`,
        {
          params: { token: receiptToken },
        },
      );
      setSafeState(() => {
        setNotification(normalizeResponse(data));
      });
    } catch {
      setSafeState(() => {
        setNotification(getMockState(reservationId));
      });
    } finally {
      setSafeState(() => setLoading(false));
    }
  }, [active, handleMissingToken, hasToken, receiptToken, reservationId, setSafeState]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const resend = useCallback(async () => {
    if (!active) return;
    if (!hasToken) {
      handleMissingToken();
      showErrorToast('Falta receiptToken para reenviar la notificación.');
      return;
    }

    setSafeState(() => {
      setResending(true);
      setNotification((prev) =>
        prev
          ? { ...prev, status: 'pending', message: 'Reintentando envío...' }
          : { ...getMockState(reservationId), status: 'pending' },
      );
    });

    try {
      const { data } = await api.post<ReservationNotificationResponse>(
        `/public/reservations/${reservationId}/notifications`,
        {
          token: receiptToken,
        },
      );
      setSafeState(() => setNotification(normalizeResponse(data)));
      showSuccessToast('Notificación reenviada ✅');
    } catch {
      setSafeState(() =>
        setNotification({
          status: 'error',
          lastAttemptAt: new Date().toISOString(),
          message: 'No pudimos reenviar la notificación.',
          source: 'mock',
        }),
      );
      showErrorToast('No pudimos reenviar la notificación.');
    } finally {
      setSafeState(() => setResending(false));
    }
  }, [active, handleMissingToken, hasToken, receiptToken, reservationId, setSafeState]);

  const canResend = useMemo(() => hasToken && active, [active, hasToken]);

  return {
    notification,
    loading,
    error,
    resend,
    canResend,
    isResending: resending,
  };
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import api from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import type {
  ReservationNotificationResponse,
  ReservationNotificationStatus,
} from '@/types';

type NotificationState = {
  status: ReservationNotificationStatus;
  lastAttemptAt: string | null;
  message: string | null;
};

type UseReservationNotificationsArgs = {
  reservationId: string;
  receiptToken: string;
  enabled?: boolean;
};

const normalizeResponse = (
  response: ReservationNotificationResponse,
): NotificationState => ({
  status: response.status,
  lastAttemptAt: response.lastAttemptAt ?? null,
  message: response.message ?? null,
});

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    const status = response?.status;
    if (status === 401 || status === 403) {
      return 'Token invalido o expirado.';
    }
    if (status === 404) {
      return 'No encontramos la notificacion asociada a este receiptToken.';
    }
  }
  return fallback;
};

export function useReservationNotifications({
  reservationId,
  receiptToken,
  enabled = true,
}: UseReservationNotificationsArgs) {
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );
  const [isFetching, setIsFetching] = useState(true);
  const [isResending, setIsResending] = useState(false);
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
      setNotification({
        status: 'error',
        lastAttemptAt: null,
        message: null,
      });
      setIsFetching(false);
    });
  }, [setSafeState]);

  const fetchStatus = useCallback(async () => {
    if (!active) return;
    if (!hasToken) {
      handleMissingToken();
      return;
    }

    setSafeState(() => {
      setIsFetching(true);
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
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        'No pudimos consultar el estado de la notificacion.',
      );
      setSafeState(() => {
        setError(message);
        setNotification({
          status: 'error',
          lastAttemptAt: null,
          message: null,
        });
      });
    } finally {
      setSafeState(() => setIsFetching(false));
    }
  }, [active, handleMissingToken, hasToken, receiptToken, reservationId, setSafeState]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const resend = useCallback(async () => {
    if (!active) return;
    if (!hasToken) {
      handleMissingToken();
      showErrorToast('Falta receiptToken para reenviar la notificacion.');
      return;
    }

    setSafeState(() => {
      setIsResending(true);
      setNotification((prev) =>
        prev
          ? { ...prev, status: 'pending', message: 'Reintentando envio...' }
          : {
              status: 'pending',
              lastAttemptAt: null,
              message: 'Reintentando envio...',
            },
      );
    });

    try {
      const { data } = await api.post<ReservationNotificationResponse>(
        `/public/reservations/${reservationId}/notifications/resend`,
        {
          token: receiptToken,
        },
      );
      setSafeState(() => setNotification(normalizeResponse(data)));
      showSuccessToast('Notificacion reenviada.');
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        'No pudimos reenviar la notificacion.',
      );
      setSafeState(() => {
        setError(message);
        setNotification({
          status: 'error',
          lastAttemptAt: new Date().toISOString(),
          message: null,
        });
      });
      showErrorToast(message);
    } finally {
      setSafeState(() => setIsResending(false));
    }
  }, [active, handleMissingToken, hasToken, receiptToken, reservationId, setSafeState]);

  const canResend = useMemo(() => hasToken && active, [active, hasToken]);

  return {
    notification,
    loading: isFetching || isResending,
    state:
      isFetching || isResending
        ? 'loading'
        : error || notification?.status === 'error'
          ? 'error'
          : notification?.status === 'sent'
            ? 'sent'
            : 'error',
    error,
    resend,
    canResend,
    isResending,
  };
}

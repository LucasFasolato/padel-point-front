'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ReservationNotificationStatus } from '@/types';

type ReservationNotificationCardProps = {
  status: ReservationNotificationStatus;
  lastAttemptAt: string | null;
  message: string | null;
  loading: boolean;
  errorMessage: string | null;
  canResend: boolean;
  isResending: boolean;
  onResend: () => void;
};

const statusConfig: Record<
  ReservationNotificationStatus,
  {
    label: string;
    description: string;
    icon: typeof CheckCircle2;
    badge: string;
    iconColor: string;
  }
> = {
  sent: {
    label: 'Enviada',
    description: 'Notificación enviada',
    icon: CheckCircle2,
    badge: 'bg-success/10 text-success ring-1 ring-success/20',
    iconColor: 'text-success',
  },
  pending: {
    label: 'Pendiente',
    description: 'Notificación pendiente',
    icon: Clock,
    badge: 'bg-warning/10 text-warning ring-1 ring-warning/25',
    iconColor: 'text-warning',
  },
  error: {
    label: 'Error',
    description: 'No pudimos enviar la notificación',
    icon: AlertTriangle,
    badge: 'bg-danger/10 text-danger ring-1 ring-danger/20',
    iconColor: 'text-danger',
  },
};

export function ReservationNotificationCard({
  status,
  lastAttemptAt,
  message,
  loading,
  errorMessage,
  canResend,
  isResending,
  onResend,
}: ReservationNotificationCardProps) {
  if (loading && !isResending) {
    return (
      <div className="rounded-2xl bg-surface p-6 ring-1 ring-border animate-pulse space-y-4">
        <div className="h-4 w-28 rounded-full bg-surface2" />
        <div className="h-6 w-40 rounded-full bg-surface2" />
        <div className="h-4 w-64 rounded-full bg-surface2" />
        <div className="h-10 w-full rounded-xl bg-surface2" />
      </div>
    );
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="rounded-2xl bg-surface p-6 ring-1 ring-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-textMuted uppercase tracking-wide">
          Notificación
        </p>

        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold',
            config.badge
          )}
        >
          <Icon size={14} className={config.iconColor} />
          {config.label}
        </span>
      </div>

      <div>
        <p className="text-base font-bold text-text">
          {config.description}
        </p>

        {message && (
          <p className="mt-1 text-sm text-textMuted">{message}</p>
        )}

        {errorMessage && (
          <p className="mt-2 text-sm text-danger">{errorMessage}</p>
        )}

        {lastAttemptAt && (
          <p className="mt-2 text-xs text-textMuted">
            Último intento:{' '}
            {format(parseISO(lastAttemptAt), 'd MMM yyyy HH:mm', {
              locale: es,
            })}
          </p>
        )}
      </div>

      {canResend ? (
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg',
            isResending
              ? 'border-border bg-surface2 text-textMuted'
              : 'border-border bg-surface text-text hover:bg-surface2'
          )}
        >
          {isResending ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Reenviando...
            </>
          ) : (
            (status === 'error' ? 'Reintentar' : 'Reenviar')
          )}
        </button>
      ) : (
        <p className="text-xs text-textMuted">
          No se puede reenviar sin un receiptToken válido.
        </p>
      )}
    </div>
  );
}

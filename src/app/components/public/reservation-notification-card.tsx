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
  source: 'api' | 'mock';
  onResend: () => void;
};

const statusConfig: Record<
  ReservationNotificationStatus,
  { label: string; description: string; icon: typeof CheckCircle2; badge: string }
> = {
  sent: {
    label: 'Enviada',
    description: 'Notificación enviada',
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-700',
  },
  pending: {
    label: 'Pendiente',
    description: 'Notificación pendiente',
    icon: Clock,
    badge: 'bg-amber-100 text-amber-700',
  },
  error: {
    label: 'Error',
    description: 'No pudimos enviar la notificación',
    icon: AlertTriangle,
    badge: 'bg-red-100 text-red-600',
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
  source,
  onResend,
}: ReservationNotificationCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4">
        <div className="h-4 w-28 rounded-full bg-slate-200" />
        <div className="h-6 w-40 rounded-full bg-slate-200" />
        <div className="h-4 w-64 rounded-full bg-slate-200" />
        <div className="h-10 w-full rounded-xl bg-slate-200" />
      </div>
    );
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
          Notificación
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold',
            config.badge,
          )}
        >
          <Icon size={14} /> {config.label}
        </span>
      </div>

      <div>
        <p className="text-base font-bold text-slate-900">
          {config.description}
          {source === 'mock' ? ' (mock)' : ''}
        </p>
        {message && (
          <p className="text-sm text-slate-500 mt-1">{message}</p>
        )}
        {errorMessage && (
          <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
        )}
        {lastAttemptAt && (
          <p className="text-xs text-slate-400 mt-2">
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
            'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 transition-colors',
            isResending
              ? 'bg-slate-100 text-slate-400'
              : 'bg-white hover:bg-slate-50',
          )}
        >
          {isResending ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Reenviando...
            </>
          ) : (
            'Reenviar'
          )}
        </button>
      ) : (
        <p className="text-xs text-slate-400">
          No se puede reenviar sin un receiptToken válido.
        </p>
      )}
    </div>
  );
}

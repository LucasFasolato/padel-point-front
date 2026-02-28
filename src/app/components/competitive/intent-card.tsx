'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Swords, Trophy } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/lib/utils';
import { normalizeIntentStatus } from '@/lib/intents';
import type { UserIntent } from '@/types/competitive';

interface IntentCardLabels {
  accept: string;
  decline: string;
  confirm: string;
  view: string;
  report: string;
}

const DEFAULT_LABELS: IntentCardLabels = {
  accept: 'Aceptar',
  decline: 'Rechazar',
  confirm: 'Confirmar resultado',
  view: 'Ver partido',
  report: 'Reportar resultado',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  ready: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  declined: 'bg-rose-100 text-rose-700',
  expired: 'bg-slate-100 text-slate-600',
  completed: 'bg-slate-100 text-slate-600',
  linked: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  pending_confirm: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  ready: 'Aceptado',
  rejected: 'Rechazado',
  declined: 'Rechazado',
  expired: 'Expirado',
  completed: 'Completado',
  linked: 'Completado',
  active: 'Activo',
  pending_confirm: 'Pendiente',
};

export interface IntentCardProps {
  intent: UserIntent;
  isLoading?: boolean;
  className?: string;
  labels?: Partial<IntentCardLabels>;
  onAcceptChallenge?: (challengeId: string) => void;
  onDeclineChallenge?: (challengeId: string) => void;
  onConfirmResult?: (matchId: string) => void;
  onViewMatch?: (matchId: string) => void;
  onReportChallenge?: (challengeId: string) => void;
}

function getIntentIcon(intent: UserIntent) {
  if (intent.intentType === 'CONFIRM_RESULT') {
    return { Icon: CheckCircle2, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' };
  }

  const status = normalizeIntentStatus(intent.status);
  if (status === 'accepted' || status === 'ready') {
    return { Icon: Trophy, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' };
  }

  return { Icon: Swords, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' };
}

function getStatusPill(status: string) {
  const normalized = normalizeIntentStatus(status);
  return {
    label: STATUS_LABELS[normalized] ?? status,
    className: STATUS_STYLES[normalized] ?? 'bg-slate-100 text-slate-600',
  };
}

export function IntentCard({
  intent,
  isLoading = false,
  className,
  labels,
  onAcceptChallenge,
  onDeclineChallenge,
  onConfirmResult,
  onViewMatch,
  onReportChallenge,
}: IntentCardProps) {
  const resolvedLabels: IntentCardLabels = { ...DEFAULT_LABELS, ...labels };
  const status = normalizeIntentStatus(intent.status);
  const { Icon, iconBg, iconColor } = getIntentIcon(intent);
  const statusPill = getStatusPill(intent.status);
  const timeAgo = formatDistanceToNow(new Date(intent.createdAt), {
    addSuffix: true,
    locale: es,
  });

  if (intent.intentType === 'CREATED_INTENT') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {intent.subtitle ?? 'Tu desafio'}
            </p>
            <p className="text-xs text-slate-500">Buscando rival</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#0E7C66]/10 px-2.5 py-1 text-xs font-bold text-[#0E7C66]">
            Activo
          </span>
        </div>
      </div>
    );
  }

  if (
    intent.intentType !== 'CONFIRM_RESULT' &&
    intent.intentType !== 'ACCEPT_CHALLENGE'
  ) {
    return null;
  }

  const title =
    intent.intentType === 'CONFIRM_RESULT'
      ? `${intent.actorName} reporto un resultado`
      : intent.actorName;

  const subtitle =
    intent.intentType === 'CONFIRM_RESULT'
      ? intent.subtitle
      : intent.subtitle ?? 'Te desafio a un partido';

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            iconBg
          )}
          aria-hidden
        >
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug text-slate-900">{title}</p>
            <time className="mt-px shrink-0 text-[10px] font-medium text-slate-400">
              {timeAgo}
            </time>
          </div>

          {subtitle && <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>}

          <div className="mt-2">
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                statusPill.className
              )}
            >
              {statusPill.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        {intent.intentType === 'CONFIRM_RESULT' && intent.matchId && onConfirmResult && (
          <Button
            type="button"
            size="sm"
            fullWidth
            disabled={isLoading}
            onClick={() => onConfirmResult(intent.matchId!)}
          >
            {resolvedLabels.confirm}
          </Button>
        )}

        {intent.intentType === 'ACCEPT_CHALLENGE' &&
          status === 'pending' &&
          intent.challengeId &&
          onAcceptChallenge &&
          onDeclineChallenge && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={isLoading}
                onClick={() => onDeclineChallenge(intent.challengeId!)}
              >
                {resolvedLabels.decline}
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                disabled={isLoading}
                onClick={() => onAcceptChallenge(intent.challengeId!)}
              >
                {resolvedLabels.accept}
              </Button>
            </div>
          )}

        {intent.intentType === 'ACCEPT_CHALLENGE' &&
          (status === 'accepted' || status === 'ready') &&
          (intent.matchId || intent.challengeId) && (
            <div className="flex gap-2">
              {intent.matchId && onViewMatch && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                  onClick={() => onViewMatch(intent.matchId!)}
                >
                  {resolvedLabels.view}
                </Button>
              )}
              {intent.challengeId && onReportChallenge && (
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={isLoading}
                  onClick={() => onReportChallenge(intent.challengeId!)}
                >
                  {resolvedLabels.report}
                </Button>
              )}
            </div>
          )}
      </div>
    </div>
  );
}


'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Challenge, MatchType } from '@/types/competitive';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { CATEGORY_LABELS } from '@/lib/competitive-utils';
import { useRouter } from 'next/navigation';
import { Trophy, Calendar } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  variant: 'inbox' | 'outbox' | 'ready';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  isAcceptPending?: boolean;
  isRejectPending?: boolean;
  isCancelPending?: boolean;
  className?: string;
}

const MATCH_TYPE_CONFIG: Record<MatchType, { label: string; className: string }> = {
  COMPETITIVE: {
    label: 'Competitivo',
    className: 'bg-[#0E7C66]/10 text-[#0E7C66]',
  },
  FRIENDLY: {
    label: 'Amistoso',
    className: 'bg-slate-100 text-slate-500',
  },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Aceptado', className: 'bg-blue-100 text-blue-800' },
  ready: { label: 'Listo para jugar', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelado', className: 'bg-slate-100 text-slate-600' },
  expired: { label: 'Expirado', className: 'bg-slate-100 text-slate-500' },
  completed: { label: 'Completado', className: 'bg-slate-100 text-slate-600' },
  finished: { label: 'Finalizado', className: 'bg-slate-100 text-slate-600' },
};

export function ChallengeCard({
  challenge,
  variant,
  onAccept,
  onReject,
  onCancel,
  isAcceptPending,
  isRejectPending,
  isCancelPending,
  className,
}: ChallengeCardProps) {
  const router = useRouter();
  const isInbox = variant === 'inbox';
  const isReady = variant === 'ready';
  const isPending = challenge.status === 'pending';
  const isReadyStatus = challenge.status === 'ready';

  const creator = challenge.teamA.p1;
  const opponent = isInbox ? creator : challenge.invitedOpponent;

  const matchType: MatchType = challenge.matchType ?? 'COMPETITIVE';
  const matchTypeCfg = MATCH_TYPE_CONFIG[matchType];
  const statusCfg = STATUS_CONFIG[challenge.status];

  const categoryLabel = challenge.targetCategory
    ? CATEGORY_LABELS[challenge.targetCategory as keyof typeof CATEGORY_LABELS]
    : null;

  const showTeams =
    (challenge.status === 'accepted' || challenge.status === 'ready') && challenge.teamB.p1;

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="p-4">
        {/* Header: name + badges */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">
              {isInbox
                ? `${creator.displayName} te desafió`
                : `Desafiaste a ${opponent?.displayName ?? 'un rival'}`}
            </p>
            {categoryLabel && (
              <p className="mt-0.5 text-sm text-slate-500">Cat. {categoryLabel}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={cn(
                'inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold',
                matchTypeCfg.className
              )}
            >
              {matchTypeCfg.label}
            </span>
            {statusCfg && (
              <span
                className={cn(
                  'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                  statusCfg.className
                )}
              >
                {statusCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Message */}
        {challenge.message && (
          <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-sm italic text-slate-600">
            &quot;{challenge.message}&quot;
          </div>
        )}

        {/* Teams (accepted / ready) */}
        {showTeams && (
          <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <div>
              <span className="font-medium text-slate-800">Equipo A:</span>{' '}
              {challenge.teamA.p1.displayName}
              {challenge.teamA.p2 ? ` + ${challenge.teamA.p2.displayName}` : ''}
            </div>
            {challenge.teamB.p1 && (
              <div className="mt-0.5">
                <span className="font-medium text-slate-800">Equipo B:</span>{' '}
                {challenge.teamB.p1.displayName}
                {challenge.teamB.p2 ? ` + ${challenge.teamB.p2.displayName}` : ''}
              </div>
            )}
          </div>
        )}

        {/* Reservation */}
        {challenge.reservationId && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm">
            <Calendar size={14} className="shrink-0 text-blue-600" />
            <span className="font-medium text-blue-800">Reserva confirmada</span>
          </div>
        )}

        {/* Footer: timestamp + actions */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(challenge.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>

          <div className="flex gap-2">
            {isInbox && isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReject}
                  loading={isRejectPending}
                  disabled={isAcceptPending}
                >
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={onAccept}
                  loading={isAcceptPending}
                  disabled={isRejectPending}
                >
                  Aceptar
                </Button>
              </>
            )}

            {!isInbox && isPending && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                loading={isCancelPending}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Report CTA */}
      {isReady && isReadyStatus && (
        <div className="border-t border-slate-100 bg-[#0E7C66]/5 px-4 py-3">
          <Button
            fullWidth
            onClick={() => router.push(`/competitive/challenges/${challenge.id}/report`)}
            className="gap-2"
          >
            <Trophy size={16} />
            Reportar resultado
          </Button>
        </div>
      )}
    </div>
  );
}

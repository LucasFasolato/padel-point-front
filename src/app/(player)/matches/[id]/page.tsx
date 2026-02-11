'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { DisputeModal } from '@/app/components/competitive/dispute-modal';
import { useMatch, useMatchActions } from '@/hooks/use-matches';
import { useAuthStore } from '@/store/auth-store';
import { MatchResultStatus } from '@/types/competitive';
import { getMatchSourceColors, getMatchSourceLabel } from '@/lib/league-utils';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [MatchResultStatus.PENDING_CONFIRM]: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800',
  },
  [MatchResultStatus.CONFIRMED]: {
    label: 'Confirmado',
    className: 'bg-emerald-100 text-emerald-800',
  },
  [MatchResultStatus.REJECTED]: {
    label: 'Rechazado',
    className: 'bg-red-100 text-red-800',
  },
  [MatchResultStatus.DISPUTED]: {
    label: 'En disputa',
    className: 'bg-amber-100 text-amber-800',
  },
  [MatchResultStatus.RESOLVED]: {
    label: 'Resuelto',
    className: 'bg-blue-100 text-blue-800',
  },
};

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading, isError, refetch } = useMatch(id);
  const { confirmMatch, disputeMatch, resolveConfirmAsIs } = useMatchActions();
  const user = useAuthStore((s) => s.user);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  if (isLoading) {
    return (
      <>
        <PublicTopBar title="Detalle del partido" backHref="/competitive-matches" />
        <div className="space-y-4 px-4 py-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (isError || !match) {
    return (
      <>
        <PublicTopBar title="Detalle del partido" backHref="/competitive-matches" />
        <div className="px-4 py-16 text-center">
          <p className="mb-4 text-sm text-slate-600">No pudimos cargar el partido</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </>
    );
  }

  const statusConfig = STATUS_CONFIG[match.status] ?? {
    label: match.status,
    className: 'bg-slate-100 text-slate-700',
  };

  const participantIds = new Set<string>();
  if (match.reportedByUserId) participantIds.add(match.reportedByUserId);
  if (match.confirmedByUserId) participantIds.add(match.confirmedByUserId);

  if (match.challenge) {
    participantIds.add(match.challenge.teamA.p1.userId);
    if (match.challenge.teamA.p2?.userId) participantIds.add(match.challenge.teamA.p2.userId);
    if (match.challenge.teamB.p1?.userId) participantIds.add(match.challenge.teamB.p1.userId);
    if (match.challenge.teamB.p2?.userId) participantIds.add(match.challenge.teamB.p2.userId);
  }

  (match.teamA ?? []).forEach((p) => {
    if (p.userId) participantIds.add(p.userId);
  });
  (match.teamB ?? []).forEach((p) => {
    if (p.userId) participantIds.add(p.userId);
  });

  const isParticipant = !!user?.userId && participantIds.has(user.userId);
  const isPendingConfirm = match.status === MatchResultStatus.PENDING_CONFIRM;
  const isDisputed = match.status === MatchResultStatus.DISPUTED;

  const canConfirm = isParticipant && isPendingConfirm;
  const canDispute = isParticipant && (isPendingConfirm || match.status === MatchResultStatus.CONFIRMED);

  const isLeagueOwnerOrAdmin =
    match.leagueContextRole === 'owner' || match.leagueContextRole === 'admin';
  const isPlatformAdmin = user?.role === 'ADMIN';
  const canResolveAsIs =
    (isLeagueOwnerOrAdmin || isPlatformAdmin) &&
    (isPendingConfirm || isDisputed);

  const sourceLabel = getMatchSourceLabel(match.source);
  const sourceColors = getMatchSourceColors(match.source);

  const sets = [
    { a: match.teamASet1, b: match.teamBSet1 },
    { a: match.teamASet2, b: match.teamBSet2 },
    ...(match.teamASet3 !== null
      ? [{ a: match.teamASet3!, b: match.teamBSet3! }]
      : []),
  ];

  const handleDispute = (reason: string, message?: string) => {
    disputeMatch.mutate(
      { matchId: match.id, reason, message },
      { onSuccess: () => setShowDisputeModal(false) }
    );
  };

  return (
    <>
      <PublicTopBar title="Detalle del partido" backHref="/competitive-matches" />

      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
              statusConfig.className
            )}
          >
            {statusConfig.label}
          </span>
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(match.playedAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>

        {/* Disputed banner */}
        {isDisputed && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Este resultado está en revisión
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Un administrador resolverá la disputa.
              </p>
            </div>
          </div>
        )}

        {/* Score card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Resultado
          </p>
          <div className="flex items-center justify-center gap-4">
            {sets.map((set, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-slate-400">Set {i + 1}</p>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {set.a}-{set.b}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-slate-600">
            Ganador: Equipo {match.winnerTeam}
          </p>
        </div>

        {/* Match info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          {sourceLabel && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Fuente</span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  sourceColors.bg,
                  sourceColors.text
                )}
              >
                {sourceLabel}
              </span>
            </div>
          )}
          {match.eloApplied && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">ELO aplicado</span>
              <span className="font-semibold text-emerald-600">Sí</span>
            </div>
          )}
          {match.rejectionReason && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Motivo de rechazo</span>
              <span className="font-semibold text-slate-700">{match.rejectionReason}</span>
            </div>
          )}
        </div>

        {canConfirm && (
          <Button
            fullWidth
            onClick={() => confirmMatch.mutate(match.id)}
            loading={confirmMatch.isPending}
          >
            Confirmar
          </Button>
        )}

        {canDispute && (
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowDisputeModal(true)}
            className="border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
          >
            Disputar resultado
          </Button>
        )}

        {canResolveAsIs && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => resolveConfirmAsIs.mutate(match.id)}
            loading={resolveConfirmAsIs.isPending}
          >
            Confirmar tal cual
          </Button>
        )}
      </div>

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSubmit={handleDispute}
        loading={disputeMatch.isPending}
      />
    </>
  );
}

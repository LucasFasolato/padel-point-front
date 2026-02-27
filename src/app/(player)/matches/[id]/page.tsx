'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Clock, Swords, TrendingDown, TrendingUp } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { DisputeModal } from '@/app/components/competitive/dispute-modal';
import { useMatch, useMatchActions } from '@/hooks/use-matches';
import { useAuthStore } from '@/store/auth-store';
import { MatchResultStatus } from '@/types/competitive';
import type { MatchType, UserBasic } from '@/types/competitive';
import { getMatchSourceColors, getMatchSourceLabel } from '@/lib/league-utils';
import { cn } from '@/lib/utils';

// ─── status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [MatchResultStatus.PENDING_CONFIRM]: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-800',
  },
  [MatchResultStatus.CONFIRMED]: {
    label: 'Confirmado',
    className: 'bg-emerald-100 text-emerald-700',
  },
  [MatchResultStatus.REJECTED]: {
    label: 'Rechazado',
    className: 'bg-red-100 text-red-700',
  },
  [MatchResultStatus.DISPUTED]: {
    label: 'En disputa',
    className: 'bg-amber-100 text-amber-800',
  },
  [MatchResultStatus.RESOLVED]: {
    label: 'Resuelto',
    className: 'bg-blue-100 text-blue-700',
  },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function MatchTypeBadge({ matchType }: { matchType?: MatchType }) {
  if (!matchType) return null;
  return matchType === 'COMPETITIVE' ? (
    <span className="inline-flex items-center rounded-full bg-[#0E7C66]/10 px-2.5 py-0.5 text-xs font-bold text-[#0E7C66]">
      Competitivo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
      Amistoso
    </span>
  );
}

// ─── participant row ──────────────────────────────────────────────────────────

function ParticipantRow({
  player,
  position,
  isReporter,
  isConfirmer,
  isPendingConfirm,
  isCurrentUser,
}: {
  player: UserBasic | { userId?: string; displayName: string };
  position?: 'Drive' | 'Revés';
  isReporter: boolean;
  isConfirmer: boolean;
  isPendingConfirm: boolean;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-xl px-3 py-2.5',
        isCurrentUser ? 'bg-[#0E7C66]/5' : 'bg-slate-50'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'truncate text-sm font-semibold',
              isCurrentUser && 'text-[#0E7C66]'
            )}
          >
            {player.displayName}
          </span>
          {isCurrentUser && (
            <span className="shrink-0 rounded-full bg-[#0E7C66] px-1.5 py-0.5 text-[9px] font-bold text-white">
              Vos
            </span>
          )}
        </div>
        {position && <span className="text-[11px] text-slate-500">{position}</span>}
      </div>
      <div className="shrink-0">
        {isReporter && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
            <CheckCircle2 size={10} />
            Reportó
          </span>
        )}
        {isConfirmer && !isReporter && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
            <CheckCircle2 size={10} />
            Confirmó
          </span>
        )}
        {!isReporter && !isConfirmer && isPendingConfirm && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
            <Clock size={10} />
            Pendiente
          </span>
        )}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading, isError, refetch } = useMatch(id);
  const { confirmMatch, disputeMatch, resolveConfirmAsIs } = useMatchActions();
  const user = useAuthStore((s) => s.user);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  if (isLoading) {
    return (
      <>
        <PublicTopBar title="Detalle del partido" backHref="/matches" />
        <div className="space-y-4 px-4 py-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (isError || !match) {
    return (
      <>
        <PublicTopBar title="Detalle del partido" backHref="/matches" />
        <div className="px-4 py-16 text-center">
          <p className="mb-4 text-sm text-slate-600">No pudimos cargar el partido</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </>
    );
  }

  // ─── derived state ──────────────────────────────────────────────────────

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
  (match.teamA ?? []).forEach((p) => { if (p.userId) participantIds.add(p.userId); });
  (match.teamB ?? []).forEach((p) => { if (p.userId) participantIds.add(p.userId); });

  const isParticipant = !!user?.userId && participantIds.has(user.userId);
  const isReporter = !!user?.userId && match.reportedByUserId === user.userId;
  const isPendingConfirm = match.status === MatchResultStatus.PENDING_CONFIRM;
  const isDisputed = match.status === MatchResultStatus.DISPUTED;

  // Reporter cannot confirm their own result — only the opponent can
  const canConfirm = isParticipant && isPendingConfirm && !isReporter;
  const canDispute =
    isParticipant &&
    (isPendingConfirm || match.status === MatchResultStatus.CONFIRMED);

  const isLeagueOwnerOrAdmin =
    match.leagueContextRole === 'owner' || match.leagueContextRole === 'admin';
  const isPlatformAdmin = user?.role === 'ADMIN';
  const canResolveAsIs =
    (isLeagueOwnerOrAdmin || isPlatformAdmin) && (isPendingConfirm || isDisputed);

  // matchType — prefer direct field, fall back to challenge relation
  const matchType: MatchType | undefined = match.matchType ?? match.challenge?.matchType;
  const eloImpactKnown = matchType !== undefined || match.impactRanking !== undefined;
  const impactsElo =
    matchType === 'COMPETITIVE' ||
    match.impactRanking === true ||
    (matchType === undefined && match.impactRanking === undefined && match.eloApplied);

  const sourceLabel = getMatchSourceLabel(match.source);
  const sourceColors = getMatchSourceColors(match.source);

  const sets = [
    { a: match.teamASet1, b: match.teamBSet1 },
    { a: match.teamASet2, b: match.teamBSet2 },
    ...(match.teamASet3 !== null ? [{ a: match.teamASet3!, b: match.teamBSet3! }] : []),
  ];

  // ─── participants ────────────────────────────────────────────────────────

  type ParticipantEntry = {
    player: UserBasic | { userId?: string; displayName: string };
    position?: 'Drive' | 'Revés';
    team: 'A' | 'B';
  };

  const participants: ParticipantEntry[] = [];

  if (match.challenge) {
    const ch = match.challenge;
    participants.push({ player: ch.teamA.p1, position: 'Drive', team: 'A' });
    if (ch.teamA.p2) participants.push({ player: ch.teamA.p2, position: 'Revés', team: 'A' });
    if (ch.teamB.p1) participants.push({ player: ch.teamB.p1, position: 'Drive', team: 'B' });
    if (ch.teamB.p2) participants.push({ player: ch.teamB.p2, position: 'Revés', team: 'B' });
  } else {
    (match.teamA ?? []).forEach((p) => participants.push({ player: p, team: 'A' }));
    (match.teamB ?? []).forEach((p) => participants.push({ player: p, team: 'B' }));
  }

  const teamAParticipants = participants.filter((p) => p.team === 'A');
  const teamBParticipants = participants.filter((p) => p.team === 'B');

  const handleDispute = (reason: string, message?: string) => {
    disputeMatch.mutate(
      { matchId: match.id, reason, message },
      { onSuccess: () => setShowDisputeModal(false) }
    );
  };

  // ─── render ─────────────────────────────────────────────────────────────

  return (
    <>
      <PublicTopBar title="Detalle del partido" backHref="/matches" />

      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        {/* Status + matchType row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
                statusConfig.className
              )}
            >
              {statusConfig.label}
            </span>
            <MatchTypeBadge matchType={matchType} />
          </div>
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(match.playedAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>

        {/* ELO impact notice */}
        {eloImpactKnown && (
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-4 py-3',
              impactsElo
                ? 'border-[#0E7C66]/20 bg-[#0E7C66]/5'
                : 'border-slate-200 bg-slate-50'
            )}
          >
            {impactsElo ? (
              <TrendingUp size={16} className="shrink-0 text-[#0E7C66]" />
            ) : (
              <TrendingDown size={16} className="shrink-0 text-slate-400" />
            )}
            <p
              className={cn(
                'text-sm font-semibold',
                impactsElo ? 'text-[#0E7C66]' : 'text-slate-500'
              )}
            >
              {impactsElo ? 'Impactará tu ELO' : 'No impactará el ELO'}
            </p>
          </div>
        )}

        {/* Pending confirmation banner — reporter perspective */}
        {isReporter && isPendingConfirm && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Pendiente de confirmación
              </p>
              <p className="mt-0.5 text-xs text-blue-700">
                El resultado fue reportado. Esperando que el rival confirme.
              </p>
            </div>
          </div>
        )}

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
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Resultado
          </p>
          <div className="flex items-center justify-center gap-6">
            {sets.map((set, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-slate-400">Set {i + 1}</p>
                <p className="mt-1 font-mono text-xl font-bold text-slate-900">
                  {set.a}–{set.b}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-slate-600">
            Ganador: Equipo {match.winnerTeam}
          </p>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Swords size={14} className="text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Participantes
              </p>
            </div>

            <div className="space-y-4">
              {teamAParticipants.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Equipo A
                  </p>
                  <div className="space-y-1.5">
                    {teamAParticipants.map((entry, i) => {
                      const uid =
                        'userId' in entry.player ? entry.player.userId : undefined;
                      return (
                        <ParticipantRow
                          key={uid ?? i}
                          player={entry.player}
                          position={entry.position}
                          isReporter={uid === match.reportedByUserId}
                          isConfirmer={!!uid && uid === match.confirmedByUserId}
                          isPendingConfirm={isPendingConfirm}
                          isCurrentUser={uid === user?.userId}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {teamBParticipants.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Equipo B
                  </p>
                  <div className="space-y-1.5">
                    {teamBParticipants.map((entry, i) => {
                      const uid =
                        'userId' in entry.player ? entry.player.userId : undefined;
                      return (
                        <ParticipantRow
                          key={uid ?? i}
                          player={entry.player}
                          position={entry.position}
                          isReporter={uid === match.reportedByUserId}
                          isConfirmer={!!uid && uid === match.confirmedByUserId}
                          isPendingConfirm={isPendingConfirm}
                          isCurrentUser={uid === user?.userId}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Match metadata */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
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
              <span className="font-semibold text-[#0E7C66]">Sí</span>
            </div>
          )}
          {match.rejectionReason && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Motivo de rechazo</span>
              <span className="font-semibold text-slate-700">{match.rejectionReason}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {canConfirm && (
          <Button
            fullWidth
            onClick={() => confirmMatch.mutate(match.id)}
            loading={confirmMatch.isPending}
          >
            Confirmar resultado
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

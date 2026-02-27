'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Trophy } from 'lucide-react';
import {
  useCompetitiveProfile,
  useEloHistory,
  useSkillRadar,
} from '@/hooks/use-competitive-profile';
import { useChallengeActions, useChallengesInbox } from '@/hooks/use-challenges';
import { usePendingConfirmations } from '@/hooks/use-matches';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { EloChart } from '@/app/components/competitive/elo-chart';
import { ActivityFeed } from '@/app/components/competitive/activity-feed';
import { SkillRadarCard } from '@/app/components/competitive/skill-radar-card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT } from '@/lib/competitive-constants';
import { formatEloChange, getEloHistoryReasonLabel } from '@/lib/competitive-utils';
import { cn } from '@/lib/utils';
import type { Challenge, EloHistoryPoint, MatchResult } from '@/types/competitive';

const CHALLENGES_LIMIT = 5;

export default function CompetitivePage() {
  const router = useRouter();
  const [hiddenChallengeIds, setHiddenChallengeIds] = useState<string[]>([]);
  const [challengeActionError, setChallengeActionError] = useState<string | null>(null);
  const [actingChallengeId, setActingChallengeId] = useState<string | null>(null);
  const [chartOpen, setChartOpen] = useState(true);

  const {
    data: profile,
    isLoading: loadingProfile,
    isError: profileError,
    error: profileErrorData,
  } = useCompetitiveProfile();
  const eloHistoryQuery = useEloHistory(COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT);
  const skillRadarQuery = useSkillRadar();
  const inboxQuery = useChallengesInbox(CHALLENGES_LIMIT);
  const { acceptDirect, rejectDirect } = useChallengeActions();
  const { data: pendingConfirmationsData } = usePendingConfirmations();

  if (loadingProfile) {
    return (
      <>
        <PublicTopBar title="Competitivo" />
        <CompetitivePageSkeleton />
      </>
    );
  }

  if (profileError) {
    // CITY_REQUIRED: OnboardingGuard in layout handles redirect. Show skeleton.
    const status = (profileErrorData as { response?: { status?: number } } | null)?.response
      ?.status;
    if (status === 409) {
      return (
        <>
          <PublicTopBar title="Competitivo" />
          <CompetitivePageSkeleton />
        </>
      );
    }
    return (
      <>
        <PublicTopBar title="Competitivo" />
        <CompetitiveErrorState />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <PublicTopBar title="Competitivo" />
        <CompetitiveEmptyState />
      </>
    );
  }

  const pendingConfirmations = pendingConfirmationsData ?? [];
  const pendingChallenges = (inboxQuery.data ?? []).filter(
    (c) => c.status === 'pending' && !hiddenChallengeIds.includes(c.id)
  );
  const eloHistory = eloHistoryQuery.data?.items ?? [];
  const latestEloPoint = eloHistory.length > 0 ? eloHistory[0] : null;
  const recentEloEvents = eloHistory.slice(0, 3);

  const eloDelta30d = profile.eloDelta30d ?? 0;
  const streakCurrent = profile.winStreakCurrent ?? 0;
  const winrate =
    profile.matchesPlayed > 0 ? Math.round((profile.wins / profile.matchesPlayed) * 100) : 0;
  const peakElo = profile.peakElo ?? profile.elo;

  const hasActivity =
    pendingConfirmations.length > 0 ||
    pendingChallenges.length > 0 ||
    recentEloEvents.length > 0;

  const handleChallengeAction = async (action: 'accept' | 'reject', challengeId: string) => {
    setChallengeActionError(null);
    setActingChallengeId(challengeId);
    setHiddenChallengeIds((prev) => (prev.includes(challengeId) ? prev : [...prev, challengeId]));
    try {
      if (action === 'accept') await acceptDirect.mutateAsync(challengeId);
      else await rejectDirect.mutateAsync(challengeId);
    } catch {
      setHiddenChallengeIds((prev) => prev.filter((id) => id !== challengeId));
      setChallengeActionError('No pudimos actualizar el desafío. Reintentá.');
    } finally {
      setActingChallengeId(null);
    }
  };

  return (
    <>
      <PublicTopBar title="Competitivo" />

      <div className="space-y-4 px-4 py-4">
        {/* ── Primary & secondary CTAs ── */}
        <section className="space-y-2.5">
          <button
            type="button"
            onClick={() => router.push('/competitive/find')}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#22C55E] py-4 text-base font-bold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-[#16A34A]"
          >
            🎾 Buscar partido
          </button>
          <button
            type="button"
            onClick={() => router.push('/leagues')}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-transform active:scale-[0.98] hover:bg-slate-50"
          >
            🏟 Ligas
          </button>
        </section>

        {/* ── Competitive status card ── */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                ELO actual
              </p>
              <p className="mt-1 text-5xl font-extrabold leading-none tracking-tight text-slate-900">
                {profile.elo}
              </p>
              <p className="mt-1.5 text-sm text-slate-500">{profile.displayName}</p>
            </div>
            <div className="flex flex-col items-end gap-2 pt-1">
              <CategoryBadge category={profile.category} size="md" />
              <MovementBadge delta={eloDelta30d} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-4">
            <StatCell
              label="Racha"
              value={streakCurrent > 0 ? `${streakCurrent}W` : '—'}
            />
            <StatCell
              label="Winrate"
              value={profile.matchesPlayed > 0 ? `${winrate}%` : '—'}
            />
            <StatCell label="Partidos" value={profile.matchesPlayed} />
          </div>
        </section>

        {/* ── Activity feed ── */}
        {hasActivity && (
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-bold text-slate-900">Actividad reciente</h2>
            </div>

            {/* Pending confirmations */}
            {pendingConfirmations.length > 0 && (
              <div>
                <div className="bg-amber-50/80 px-5 py-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    <CheckCircle2 size={12} />
                    Resultados por confirmar
                  </p>
                </div>
                <div className="divide-y divide-slate-50">
                  {pendingConfirmations.slice(0, 3).map((match) => (
                    <PendingConfirmationCard
                      key={match.id}
                      match={match}
                      onConfirm={() => router.push(`/matches/${match.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending challenges */}
            {pendingChallenges.length > 0 && (
              <div className="border-t border-slate-100">
                <div className="bg-slate-50/60 px-5 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Desafíos pendientes
                  </p>
                </div>

                {challengeActionError && (
                  <p
                    role="alert"
                    className="mx-5 mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  >
                    {challengeActionError}
                  </p>
                )}

                <div className="divide-y divide-slate-50">
                  {pendingChallenges.map((challenge) => (
                    <PendingChallengeInboxCard
                      key={challenge.id}
                      challenge={challenge}
                      isLoading={actingChallengeId === challenge.id}
                      onAccept={() => handleChallengeAction('accept', challenge.id)}
                      onReject={() => handleChallengeAction('reject', challenge.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent ELO movement */}
            {recentEloEvents.length > 0 && (
              <div className="border-t border-slate-100">
                <div className="bg-slate-50/60 px-5 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Movimientos ELO
                  </p>
                </div>
                <div className="divide-y divide-slate-50">
                  {recentEloEvents.map((point) => (
                    <EloFeedItem key={point.id} point={point} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Activity feed ── */}
        <ActivityFeed />

        {/* ── Tu progreso (ELO chart) ── */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Tu progreso</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setChartOpen((p) => !p)}
            >
              {chartOpen ? 'Ocultar' : 'Ver gráfico'}
            </Button>
          </div>

          {latestEloPoint ? (
            <p className="mt-2 text-xs text-slate-500">
              Último cambio:{' '}
              <span className={getInlineDeltaClassName(latestEloPoint.delta)}>
                {formatEloChange(latestEloPoint.delta)}
              </span>{' '}
              · {getEloHistoryReasonLabel(latestEloPoint.reason)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Todavía no tenés movimientos de ELO registrados.
            </p>
          )}

          <div className={cn('mt-3', !chartOpen && 'hidden')}>
            {eloHistoryQuery.isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : eloHistoryQuery.isError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-center">
                <p className="text-sm text-rose-700">No pudimos cargar tu historial de ELO.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => eloHistoryQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <EloChart history={eloHistory} />
            )}
          </div>

          {chartOpen && eloHistoryQuery.hasNextPage && (
            <div className="mt-3 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => eloHistoryQuery.fetchNextPage()}
                disabled={eloHistoryQuery.isFetchingNextPage}
              >
                {eloHistoryQuery.isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          )}
        </section>

        {/* ── Skill radar ── */}
        {skillRadarQuery.isLoading ? (
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <Skeleton className="h-60 w-full rounded-xl" />
          </section>
        ) : skillRadarQuery.isError ? null : (
          <SkillRadarCard radar={skillRadarQuery.data} />
        )}

        {/* ── Peak ELO ── */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-amber-50/60 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/70">
                Pico histórico
              </p>
              <p className="text-sm font-semibold text-amber-900">ELO máximo</p>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-amber-900">{peakElo}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MovementBadge({ delta }: { delta: number }) {
  if (delta > 0) return <Badge variant="up">▲ +{delta} pts (30d)</Badge>;
  if (delta < 0) return <Badge variant="down">▼ {delta} pts (30d)</Badge>;
  return <Badge variant="neutral">— sin cambio (30d)</Badge>;
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-3 text-center first:pl-0 last:pr-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function EloFeedItem({ point }: { point: EloHistoryPoint }) {
  const isPositive = point.delta > 0;
  const isNegative = point.delta < 0;
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {getEloHistoryReasonLabel(point.reason)}
        </p>
        <p className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(point.createdAt), { addSuffix: true, locale: es })}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 text-sm font-bold',
          isPositive && 'text-[#22C55E]',
          isNegative && 'text-rose-600',
          !isPositive && !isNegative && 'text-slate-500'
        )}
      >
        {formatEloChange(point.delta)}
      </span>
    </div>
  );
}

function PendingChallengeInboxCard({
  challenge,
  isLoading,
  onAccept,
  onReject,
}: {
  challenge: Challenge;
  isLoading?: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const challengerName = challenge.teamA?.p1?.displayName || 'Un jugador';

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{challengerName}</p>
          <p className="text-xs text-slate-500">Te desafió a un partido</p>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true, locale: es })}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-[40px]"
            disabled={isLoading}
            onClick={onReject}
          >
            Rechazar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            className="min-h-[40px]"
            disabled={isLoading}
            onClick={onAccept}
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}

function PendingConfirmationCard({
  match,
  onConfirm,
}: {
  match: MatchResult;
  onConfirm: () => void;
}) {
  const reporterName =
    match.challenge?.teamA?.p1?.displayName ??
    match.teamA?.[0]?.displayName ??
    'Un jugador';

  const sets = [
    `${match.teamASet1}-${match.teamBSet1}`,
    `${match.teamASet2}-${match.teamBSet2}`,
    match.teamASet3 != null ? `${match.teamASet3}-${match.teamBSet3}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {reporterName} reportó un resultado
        </p>
        {sets && <p className="text-xs text-slate-500">{sets}</p>}
      </div>
      <Button type="button" size="sm" onClick={onConfirm} className="shrink-0">
        Confirmar
      </Button>
    </div>
  );
}

function CompetitivePageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="space-y-2.5">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

function getInlineDeltaClassName(delta: number) {
  if (delta > 0) return 'font-semibold text-[#22C55E]';
  if (delta < 0) return 'font-semibold text-rose-600';
  return 'font-semibold text-slate-600';
}

function CompetitiveErrorState() {
  return (
    <div className="px-4 py-16 text-center">
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-lg font-semibold text-rose-900">No pudimos cargar tu progreso</h1>
        <p className="mt-2 text-sm text-rose-700">
          Reintentemos para actualizar tu perfil competitivo.
        </p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}

function CompetitiveEmptyState() {
  const router = useRouter();

  return (
    <div className="px-4 py-16 text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#0E7C66]/10">
          <Trophy size={36} className="text-[#0E7C66]" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-slate-900">Activá tu perfil competitivo</h1>
        <p className="text-slate-600">Seguí tu progreso, desafiá amigos y mejorá tu juego</p>
      </div>
      <Button size="lg" onClick={() => router.push('/competitive/onboarding')}>
        Activar ahora
      </Button>
    </div>
  );
}

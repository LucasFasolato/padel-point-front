'use client';

import { useState } from 'react';
import {
  useCompetitiveProfile,
  useEloHistory,
  useOnboardingState,
  useSkillRadar,
} from '@/hooks/use-competitive-profile';
import { useChallengeActions, useChallengesInbox } from '@/hooks/use-challenges';
import { useMyMatches, usePendingConfirmations } from '@/hooks/use-matches';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { EloChart } from '@/app/components/competitive/elo-chart';
import { SkillRadarCard } from '@/app/components/competitive/skill-radar-card';
import { StatsSummary } from '@/app/components/competitive/stats-summary';
import { MatchCard } from '@/app/components/competitive/match-card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT } from '@/lib/competitive-constants';
import { formatEloChange, getEloHistoryReasonLabel } from '@/lib/competitive-utils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Challenge, EloHistoryPoint, MatchResult } from '@/types/competitive';

const COMPETITIVE_PENDING_CHALLENGES_LIMIT = 3;

export default function CompetitivePage() {
  const router = useRouter();
  const [isProgressChartOpen, setIsProgressChartOpen] = useState(true);
  const [hiddenChallengeIds, setHiddenChallengeIds] = useState<string[]>([]);
  const [challengeActionError, setChallengeActionError] = useState<string | null>(null);
  const [actingChallengeId, setActingChallengeId] = useState<string | null>(null);
  const {
    data: onboarding,
    isLoading: loadingOnboarding,
  } = useOnboardingState();
  const {
    data: profile,
    isLoading: loadingProfile,
    isError: profileError,
  } = useCompetitiveProfile();
  const eloHistoryQuery = useEloHistory(COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT);
  const skillRadarQuery = useSkillRadar();
  const inboxQuery = useChallengesInbox(COMPETITIVE_PENDING_CHALLENGES_LIMIT);
  const { acceptDirect, rejectDirect } = useChallengeActions();
  const { data: matches, isLoading: loadingMatches, error: matchesError } = useMyMatches();
  const { data: pendingConfirmationsData } = usePendingConfirmations();

  if (loadingOnboarding || loadingProfile) {
    return (
      <>
        <PublicTopBar title="Competitivo" backHref="/" />
        <CompetitivePageSkeleton />
      </>
    );
  }

  if (profileError) {
    return (
      <>
        <PublicTopBar title="Competitivo" backHref="/" />
        <CompetitiveErrorState />
      </>
    );
  }

  if (onboarding && !onboarding.onboardingComplete) {
    router.replace('/competitive/onboarding');
    return (
      <>
        <PublicTopBar title="Competitivo" backHref="/" />
        <CompetitivePageSkeleton />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <PublicTopBar title="Competitivo" backHref="/" />
        <CompetitiveEmptyState />
      </>
    );
  }

  const confirmedMatches = matches?.filter((m) => m.status === 'confirmed').slice(0, 5) || [];
  const pendingConfirmations = pendingConfirmationsData ?? [];
  const pendingChallenges = (inboxQuery.data ?? []).filter(
    (challenge) =>
      challenge.status === 'pending' && !hiddenChallengeIds.includes(challenge.id)
  );
  const eloHistory = eloHistoryQuery.data?.items ?? [];
  const latestEloPoint = getLatestEloPoint(eloHistory);
  const streakCurrent = profile.winStreakCurrent ?? 0;
  const streakBest = profile.winStreakBest ?? 0;
  const last10 = Array.isArray(profile.last10) ? profile.last10.slice(0, 10) : [];
  const eloDelta30d = profile.eloDelta30d ?? 0;
  const peakElo = profile.peakElo ?? profile.elo;

  const handleChallengeAction = async (action: 'accept' | 'reject', challengeId: string) => {
    setChallengeActionError(null);
    setActingChallengeId(challengeId);
    setHiddenChallengeIds((prev) => (prev.includes(challengeId) ? prev : [...prev, challengeId]));

    try {
      if (action === 'accept') {
        await acceptDirect.mutateAsync(challengeId);
      } else {
        await rejectDirect.mutateAsync(challengeId);
      }
    } catch {
      setHiddenChallengeIds((prev) => prev.filter((id) => id !== challengeId));
      setChallengeActionError('No pudimos actualizar el desafío. Reintentá.');
    } finally {
      setActingChallengeId(null);
    }
  };

  return (
    <>
      <PublicTopBar title="Competitivo" backHref="/" />

      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{profile.displayName}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                ELO actual
              </p>
              <p className="mt-1 text-4xl font-bold leading-none text-slate-900">{profile.elo}</p>
            </div>
            <div className={getDeltaBadgeClassName(eloDelta30d)}>
              {formatDeltaLabel(eloDelta30d)} (30d)
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <CategoryBadge category={profile.category} size="lg" />
            <p className="text-sm text-slate-600">{profile.matchesPlayed} partidos jugados</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StreakStat label="Racha actual" value={streakCurrent} />
            <StreakStat label="Mejor racha" value={streakBest} />
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-900">ELO máximo</span>
              <span className="text-sm font-semibold text-amber-950">{peakElo}</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tu progreso</h2>
              <p className="mt-1 text-sm text-slate-600">
                Seguí la evolución de tu ELO y tus últimos cambios.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsProgressChartOpen((prev) => !prev)}
            >
              {isProgressChartOpen ? 'Ocultar gráfico' : 'Ver gráfico'}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">ELO actual</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{profile.elo}</p>
            </div>
            <CategoryBadge category={profile.category} size="md" />
          </div>

          {latestEloPoint ? (
            <p className="mt-3 text-sm text-slate-600">
              Último cambio: <span className={getInlineDeltaClassName(latestEloPoint.delta)}>{formatEloChange(latestEloPoint.delta)}</span>{' '}
              · {getEloHistoryReasonLabel(latestEloPoint.reason)}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Todavía no tenés movimientos de ELO registrados.
            </p>
          )}

          <div className={cn('mt-4', !isProgressChartOpen && 'hidden md:block')}>
            {eloHistoryQuery.isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : eloHistoryQuery.isError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-5">
                <p className="text-sm text-rose-700">No pudimos cargar tu historial de ELO.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => eloHistoryQuery.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <EloChart history={eloHistory} />
            )}
          </div>

          {isProgressChartOpen && eloHistoryQuery.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => eloHistoryQuery.fetchNextPage()}
                disabled={eloHistoryQuery.isFetchingNextPage}
              >
                {eloHistoryQuery.isFetchingNextPage ? 'Cargando...' : 'Cargar más historial'}
              </Button>
            </div>
          )}
        </section>

        {skillRadarQuery.isLoading ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Radar de juego</h2>
              <p className="mt-1 text-sm text-slate-600">Cargando métricas de juego...</p>
            </div>
            <Skeleton className="h-72 w-full rounded-lg" />
          </section>
        ) : skillRadarQuery.isError ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-rose-900">Radar de juego</h2>
            <p className="mt-2 text-sm text-rose-700">
              No pudimos cargar tu radar de juego.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => skillRadarQuery.refetch()}
            >
              Reintentar
            </Button>
          </section>
        ) : (
          <SkillRadarCard radar={skillRadarQuery.data} />
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Últimos 10</h2>
            <span className="text-xs font-medium text-slate-500">{last10.length}/10</span>
          </div>

          {last10.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              Jugá tu primer partido para registrar tu forma.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {last10.map((result, index) => (
                <span
                  key={`${result}-${index}`}
                  className={
                    result === 'W'
                      ? 'inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md bg-emerald-100 px-3 text-sm font-semibold text-emerald-800'
                      : result === 'D'
                        ? 'inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md bg-amber-100 px-3 text-sm font-semibold text-amber-800'
                        : 'inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md bg-rose-100 px-3 text-sm font-semibold text-rose-800'
                  }
                >
                  {result}
                </span>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Resumen</h2>
          <StatsSummary
            wins={profile.wins}
            losses={profile.losses}
            totalMatches={profile.matchesPlayed}
          />
        </div>

        <div>
          {(inboxQuery.isLoading || pendingChallenges.length > 0) && (
            <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Desafíos pendientes</h2>

              {challengeActionError && (
                <p
                  role="alert"
                  className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {challengeActionError}
                </p>
              )}

              {inboxQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
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
              )}
            </section>
          )}

          {pendingConfirmations.length > 0 && (
            <section className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-blue-900">
                Resultados por confirmar
              </h2>
              <div className="space-y-3">
                {pendingConfirmations.map((match) => (
                  <PendingConfirmationCard
                    key={match.id}
                    match={match}
                    onConfirm={() => router.push(`/matches/${match.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Últimos partidos</h2>
            {confirmedMatches.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/competitive-matches')}
              >
                Ver todos
              </Button>
            )}
          </div>

          {loadingMatches ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : matchesError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-6 text-center">
              <p className="text-sm text-rose-700">No pudimos cargar tus partidos recientes.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </Button>
            </div>
          ) : confirmedMatches.length > 0 ? (
            <div className="space-y-3">
              {confirmedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => router.push(`/matches/${match.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center">
              <p className="mb-4 text-slate-600">Todavia no jugaste partidos competitivos</p>
              <Button onClick={() => router.push('/competitive/challenges')}>Desafiar jugador</Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" onClick={() => router.push('/leagues/new')}>
            Crear liga
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/leagues')}>
            Ver mis ligas
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" variant="secondary" onClick={() => router.push('/competitive/challenges')}>
            Mis desafios
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/competitive/find')}>
            Buscar rival
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button size="lg" variant="outline" onClick={() => router.push('/ranking')}>
            Ver ranking
          </Button>
        </div>
      </div>
    </>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{challengerName}</p>
          <p className="text-sm text-slate-600">Te desafió a un partido</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDistanceToNow(new Date(challenge.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>

        <div className="flex min-w-[176px] shrink-0 gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-[44px] flex-1"
            disabled={isLoading}
            onClick={onReject}
          >
            Rechazar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            className="min-h-[44px] flex-1"
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
    <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{reporterName} reportó un resultado</p>
        {sets && <p className="mt-0.5 text-xs text-slate-500">{sets}</p>}
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onConfirm}
        className="shrink-0"
      >
        Confirmar
      </Button>
    </div>
  );
}

function CompetitivePageSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function StreakStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function getLatestEloPoint(history: EloHistoryPoint[]): EloHistoryPoint | null {
  if (!history.length) return null;

  return history.reduce((latest, current) => {
    if (!latest) return current;
    return new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime()
      ? current
      : latest;
  }, history[0] ?? null);
}

function formatDeltaLabel(delta: number) {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function getInlineDeltaClassName(delta: number) {
  if (delta > 0) return 'font-semibold text-emerald-700';
  if (delta < 0) return 'font-semibold text-rose-700';
  return 'font-semibold text-slate-700';
}

function getDeltaBadgeClassName(delta: number) {
  const baseClassName =
    'inline-flex min-h-[32px] items-center rounded-full px-3 text-xs font-semibold';
  if (delta > 0) return `${baseClassName} bg-emerald-100 text-emerald-800`;
  if (delta < 0) return `${baseClassName} bg-rose-100 text-rose-800`;
  return `${baseClassName} bg-slate-100 text-slate-600`;
}

function CompetitiveErrorState() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
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
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <span className="text-4xl">T</span>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Activá tu perfil competitivo</h1>
        <p className="text-slate-600">Segui tu progreso, desafia amigos y mejora tu juego</p>
      </div>

      <Button size="lg" onClick={() => router.push('/competitive/onboarding')}>
        Activar ahora
      </Button>
    </div>
  );
}

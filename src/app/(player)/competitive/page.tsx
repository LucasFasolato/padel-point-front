'use client';

import { useState } from 'react';
import {
  useCompetitiveProfile,
  useEloHistory,
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
import {
  Search,
  Swords,
  Trophy,
  Users,
  BarChart2,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import type { Challenge, EloHistoryPoint, MatchResult } from '@/types/competitive';

const COMPETITIVE_PENDING_CHALLENGES_LIMIT = 3;

export default function CompetitivePage() {
  const router = useRouter();
  const [isProgressChartOpen, setIsProgressChartOpen] = useState(true);
  const [hiddenChallengeIds, setHiddenChallengeIds] = useState<string[]>([]);
  const [challengeActionError, setChallengeActionError] = useState<string | null>(null);
  const [actingChallengeId, setActingChallengeId] = useState<string | null>(null);
  const {
    data: profile,
    isLoading: loadingProfile,
    isError: profileError,
    error: profileErrorData,
  } = useCompetitiveProfile();
  const eloHistoryQuery = useEloHistory(COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT);
  const skillRadarQuery = useSkillRadar();
  const inboxQuery = useChallengesInbox(COMPETITIVE_PENDING_CHALLENGES_LIMIT);
  const { acceptDirect, rejectDirect } = useChallengeActions();
  const { data: matches, isLoading: loadingMatches, error: matchesError } = useMyMatches();
  const { data: pendingConfirmationsData } = usePendingConfirmations();

  if (loadingProfile) {
    return (
      <>
        <PublicTopBar title="Competitivo" backHref="/" />
        <CompetitivePageSkeleton />
      </>
    );
  }

  if (profileError) {
    // CITY_REQUIRED: the OnboardingGuard in layout will redirect.
    // Show skeleton to avoid flashing an error state.
    const status = (profileErrorData as { response?: { status?: number } } | null)?.response
      ?.status;
    if (status === 409) {
      return (
        <>
          <PublicTopBar title="Competitivo" backHref="/" />
          <CompetitivePageSkeleton />
        </>
      );
    }
    return (
      <>
        <PublicTopBar title="Competitivo" backHref="/" />
        <CompetitiveErrorState />
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

      <div className="container mx-auto max-w-4xl space-y-4 px-4 py-4">
        {/* ── Hero card: ELO + CTA ── */}
        <section className="rounded-2xl bg-gradient-to-br from-[#0E7C66] to-[#065F46] p-6 shadow-lg text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/70 tracking-wide">{profile.displayName}</p>
              <p className="mt-1.5 text-5xl font-extrabold leading-none tracking-tight">{profile.elo}</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mt-1.5">
                ELO actual
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <CategoryBadge
                category={profile.category}
                size="md"
                className="bg-white/20 text-white border-0"
              />
              <div className={getDeltaBadgeClassName(eloDelta30d)}>
                {formatDeltaLabel(eloDelta30d)} (30d)
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => router.push('/competitive/find')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-base font-bold text-[#0E7C66] shadow-sm active:scale-[0.98] transition-transform hover:bg-white/95"
          >
            <Search size={20} />
            Buscar rival
          </button>
        </section>

        {/* ── Pending confirmations – MUST NOT MISS ── */}
        {pendingConfirmations.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-amber-600" />
              <h2 className="text-sm font-bold text-amber-900">
                Resultados por confirmar ({pendingConfirmations.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pendingConfirmations.slice(0, 3).map((match) => (
                <PendingConfirmationCard
                  key={match.id}
                  match={match}
                  onConfirm={() => router.push(`/matches/${match.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Action grid ── */}
        <section className="grid grid-cols-2 gap-3">
          <ActionButton
            icon={<Swords size={20} />}
            label="Mis desafíos"
            badge={pendingChallenges.length > 0 ? pendingChallenges.length : undefined}
            onClick={() => router.push('/competitive/challenges')}
            variant="default"
          />
          <ActionButton
            icon={<Users size={20} />}
            label="Mis ligas"
            onClick={() => router.push('/leagues')}
            variant="default"
          />
          <ActionButton
            icon={<BarChart2 size={20} />}
            label="Ver ranking"
            onClick={() => router.push('/ranking')}
            variant="default"
          />
          <ActionButton
            icon={<Plus size={20} />}
            label="Nueva liga"
            onClick={() => router.push('/leagues/new')}
            variant="subtle"
          />
        </section>

        {/* ── Pending challenges inbox ── */}
        {(inboxQuery.isLoading || pendingChallenges.length > 0) && (
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Desafíos pendientes</h2>

            {challengeActionError && (
              <p
                role="alert"
                className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {challengeActionError}
              </p>
            )}

            {inboxQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-2">
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

        {/* ── Tu progreso (compact) ── */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Tu progreso</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsProgressChartOpen((prev) => !prev)}
            >
              {isProgressChartOpen ? 'Ocultar' : 'Ver gráfico'}
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <StreakStat label="Racha actual" value={streakCurrent} />
            <StreakStat label="Mejor racha" value={streakBest} />
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

          <div className={cn('mt-3', !isProgressChartOpen && 'hidden')}>
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

          {isProgressChartOpen && eloHistoryQuery.hasNextPage && (
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

        {/* ── Últimos 10 ── */}
        {last10.length > 0 && (
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Últimos 10</h2>
              <span className="text-xs text-slate-400">{last10.length}/10</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {last10.map((result, index) => (
                <span
                  key={`${result}-${index}`}
                  className={
                    result === 'W'
                      ? 'inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg bg-[#0E7C66]/10 px-2 text-sm font-bold text-[#0E7C66]'
                      : result === 'D'
                        ? 'inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg bg-amber-100 px-2 text-sm font-bold text-amber-700'
                        : 'inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg bg-rose-100 px-2 text-sm font-bold text-rose-700'
                  }
                >
                  {result}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Resumen ── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Resumen</h2>
          <StatsSummary
            wins={profile.wins}
            losses={profile.losses}
            totalMatches={profile.matchesPlayed}
          />
        </div>

        {/* ── Últimos partidos ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Últimos partidos</h2>
            {confirmedMatches.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => router.push('/competitive-matches')}>
                Ver todos
              </Button>
            )}
          </div>

          {loadingMatches ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : matchesError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center">
              <p className="text-sm text-rose-700">No pudimos cargar tus partidos.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          ) : confirmedMatches.length > 0 ? (
            <div className="space-y-2">
              {confirmedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => router.push(`/matches/${match.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F7F8FA] py-10 text-center">
              <p className="mb-3 text-sm text-slate-500">Todavía no jugaste partidos competitivos</p>
              <Button onClick={() => router.push('/competitive/challenges/new')}>
                Desafiar jugador
              </Button>
            </div>
          )}
        </div>

        {/* ── ELO máximo ── */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-amber-50/60 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/70">Pico histórico</p>
              <p className="text-sm font-semibold text-amber-900">ELO máximo</p>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-amber-900">{peakElo}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  badge,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
  variant?: 'default' | 'subtle';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-sm font-semibold transition-all active:scale-[0.97] min-h-[90px]',
        variant === 'default'
          ? 'bg-white border border-slate-100 text-slate-800 shadow-sm hover:border-[#0E7C66]/20 hover:shadow-md'
          : 'bg-[#F7F8FA] text-slate-500 hover:bg-slate-100'
      )}
    >
      <span className={cn(variant === 'default' ? 'text-[#0E7C66]' : 'text-slate-400')}>
        {icon}
      </span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
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
    <div className="rounded-2xl border border-slate-100 bg-[#F7F8FA] p-3">
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white px-3 py-2.5 shadow-sm">
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

function StreakStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#F7F8FA] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function CompetitivePageSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl space-y-4 px-4 py-4">
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
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
  if (delta > 0) return 'font-semibold text-[#0E7C66]';
  if (delta < 0) return 'font-semibold text-rose-600';
  return 'font-semibold text-slate-600';
}

function getDeltaBadgeClassName(delta: number) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold';
  if (delta > 0) return `${base} bg-white/15 text-white`;
  if (delta < 0) return `${base} bg-rose-100/60 text-rose-900`;
  return `${base} bg-white/15 text-white`;
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

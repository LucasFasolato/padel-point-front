'use client';

import { useCompetitiveProfile, useOnboardingState } from '@/hooks/use-competitive-profile';
import { useMyMatches } from '@/hooks/use-matches';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { StatsSummary } from '@/app/components/competitive/stats-summary';
import { MatchCard } from '@/app/components/competitive/match-card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { useRouter } from 'next/navigation';

export default function CompetitivePage() {
  const router = useRouter();
  const {
    data: onboarding,
    isLoading: loadingOnboarding,
  } = useOnboardingState();
  const {
    data: profile,
    isLoading: loadingProfile,
    isError: profileError,
  } = useCompetitiveProfile();
  const { data: matches, isLoading: loadingMatches, error: matchesError } = useMyMatches();

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
  const streakCurrent = profile.winStreakCurrent ?? 0;
  const streakBest = profile.winStreakBest ?? 0;
  const last10 = Array.isArray(profile.last10) ? profile.last10.slice(0, 10) : [];
  const eloDelta30d = profile.eloDelta30d ?? 0;
  const peakElo = profile.peakElo ?? profile.elo;

  return (
    <>
      <PublicTopBar title="Competitivo" backHref="/" />

      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{profile.displayName}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current ELO
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
            <StreakStat label="Current streak" value={streakCurrent} />
            <StreakStat label="Best streak" value={streakBest} />
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-900">Peak ELO</span>
              <span className="text-sm font-semibold text-amber-950">{peakElo}</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Last 10 form</h2>
            <span className="text-xs font-medium text-slate-500">{last10.length}/10</span>
          </div>

          {last10.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              Play your first match to start tracking form.
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Ultimos partidos</h2>
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
          <Button size="lg" onClick={() => router.push('/minileague/new')}>
            Create MiniLeague
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/leagues')}>
            View my leagues
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" variant="secondary" onClick={() => router.push('/competitive/challenges')}>
            Mis desafios
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/ranking')}>
            Ver ranking
          </Button>
        </div>
      </div>
    </>
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

function formatDeltaLabel(delta: number) {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
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

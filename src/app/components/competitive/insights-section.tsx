'use client';

import { useRouter } from 'next/navigation';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useInsights } from '@/hooks/use-insights';
import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { InsightsMode, InsightsTimeframe } from '@/types/competitive';

interface InsightsSectionProps {
  timeframe?: InsightsTimeframe;
  mode?: InsightsMode;
}

export function InsightsSection({ timeframe = 'season', mode = 'ALL' }: InsightsSectionProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useInsights(timeframe, mode);

  if (isLoading) return <InsightsSkeleton />;
  if (isError || !data) return null;

  const eloDelta = data.eloDelta ?? 0;
  const eloDeltaPos = eloDelta > 0;
  const eloDeltaNeg = eloDelta < 0;

  const streakLabel =
    data.streakType === 'W'
      ? `${data.streak}W`
      : data.streakType === 'L'
        ? `${data.streak}L`
        : data.streakType === 'D'
          ? `${data.streak}E`
          : '—';

  const hasNeededForRanking =
    data.neededForRanking != null && data.neededForRanking.remaining > 0;

  return (
    <section className="space-y-2.5">
      <h2 className="px-1 text-sm font-bold text-slate-900">Esta temporada</h2>

      {/* ── Hero card ── */}
      <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Partidos jugados
        </p>
        <p className="mt-1 text-5xl font-extrabold leading-none tracking-tight text-slate-900">
          {data.matchesPlayed}
        </p>
        <p className="mt-1.5 text-xs text-slate-500">
          {data.wins}G · {data.losses}P{data.draws > 0 ? ` · ${data.draws}E` : ''}
        </p>
      </div>

      {/* ── 3 small stat cards ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Win rate */}
        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Win rate
          </p>
          <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-tight text-slate-900">
            {data.winRate}%
          </p>
        </div>

        {/* ELO Δ */}
        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            ELO Δ
          </p>
          <div className="mt-1.5 flex items-center gap-0.5">
            {eloDeltaPos && <TrendingUp size={14} className="shrink-0 text-[#22C55E]" />}
            {eloDeltaNeg && <TrendingDown size={14} className="shrink-0 text-rose-500" />}
            <p
              className={cn(
                'text-2xl font-extrabold leading-none tracking-tight',
                eloDeltaPos && 'text-[#22C55E]',
                eloDeltaNeg && 'text-rose-600',
                !eloDeltaPos && !eloDeltaNeg && 'text-slate-900'
              )}
            >
              {eloDeltaPos ? `+${eloDelta}` : eloDelta === 0 ? '0' : `${eloDelta}`}
            </p>
          </div>
        </div>

        {/* Racha */}
        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Racha
          </p>
          <p
            className={cn(
              'mt-1.5 text-2xl font-extrabold leading-none tracking-tight',
              data.streakType === 'W' && 'text-[#22C55E]',
              data.streakType === 'L' && 'text-rose-600',
              data.streakType === 'D' && 'text-amber-600',
              !data.streakType && 'text-slate-400'
            )}
          >
            {streakLabel}
          </p>
        </div>
      </div>

      {/* ── Ranking progress pill ── */}
      {hasNeededForRanking && (
        <div className="rounded-2xl bg-gradient-to-r from-[#0E7C66]/10 to-[#0E7C66]/5 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Target size={16} className="shrink-0 text-[#0E7C66]" />
            <p className="min-w-0 flex-1 text-sm font-semibold text-[#0E7C66]">
              Te faltan {data.neededForRanking!.remaining} partido
              {data.neededForRanking!.remaining !== 1 ? 's' : ''} para entrar al ranking
            </p>
            <button
              type="button"
              onClick={() => router.push('/competitive/find')}
              className="shrink-0 rounded-xl bg-[#0E7C66] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0B6B58] active:scale-[0.98]"
            >
              Crear desafío
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function InsightsSkeleton() {
  return (
    <section className="space-y-2.5">
      <Skeleton className="h-4 w-28 rounded" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-2.5">
        <Skeleton className="h-[72px] rounded-2xl" />
        <Skeleton className="h-[72px] rounded-2xl" />
        <Skeleton className="h-[72px] rounded-2xl" />
      </div>
    </section>
  );
}

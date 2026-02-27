'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow, isSameMonth, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useMatchResultsList } from '@/hooks/use-matches';
import { useAuthStore } from '@/store/auth-store';
import type { MatchResult, MatchType } from '@/types/competitive';
import { MatchResultStatus } from '@/types/competitive';
import { cn } from '@/lib/utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

type TypeFilter = 'all' | 'COMPETITIVE' | 'FRIENDLY';

const STATUS_LABEL: Record<string, string> = {
  [MatchResultStatus.PENDING_CONFIRM]: 'Pendiente',
  [MatchResultStatus.CONFIRMED]: 'Confirmado',
  [MatchResultStatus.REJECTED]: 'Rechazado',
  [MatchResultStatus.DISPUTED]: 'En disputa',
  [MatchResultStatus.RESOLVED]: 'Resuelto',
};

const STATUS_CLASS: Record<string, string> = {
  [MatchResultStatus.PENDING_CONFIRM]: 'bg-amber-100 text-amber-800',
  [MatchResultStatus.CONFIRMED]: 'bg-emerald-100 text-emerald-700',
  [MatchResultStatus.REJECTED]: 'bg-red-100 text-red-700',
  [MatchResultStatus.DISPUTED]: 'bg-amber-100 text-amber-800',
  [MatchResultStatus.RESOLVED]: 'bg-blue-100 text-blue-700',
};

function buildScore(m: MatchResult): string {
  const sets = [
    `${m.teamASet1}-${m.teamBSet1}`,
    `${m.teamASet2}-${m.teamBSet2}`,
  ];
  if (m.teamASet3 !== null && m.teamBSet3 !== null) {
    sets.push(`${m.teamASet3}-${m.teamBSet3}`);
  }
  return sets.join('  ');
}

function resolveMatchType(m: MatchResult): MatchType | undefined {
  return m.matchType ?? m.challenge?.matchType;
}

function isImpactingElo(m: MatchResult): boolean {
  const mt = resolveMatchType(m);
  if (mt === 'COMPETITIVE') return true;
  if (mt === 'FRIENDLY') return false;
  return m.impactRanking ?? m.eloApplied;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function TypeBadge({ matchType }: { matchType?: MatchType }) {
  if (!matchType) return null;
  return matchType === 'COMPETITIVE' ? (
    <span className="inline-flex items-center rounded-full bg-[#0E7C66]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0E7C66]">
      Competitivo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
      Amistoso
    </span>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'min-h-[36px] shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
        active
          ? 'bg-[#0E7C66] text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      )}
    >
      {children}
    </button>
  );
}

function MatchListSkeleton() {
  return (
    <div className="space-y-3 px-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[88px] w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState({ typeFilter }: { typeFilter: TypeFilter }) {
  const router = useRouter();
  const label =
    typeFilter === 'COMPETITIVE'
      ? 'No tenés partidos competitivos.'
      : typeFilter === 'FRIENDLY'
        ? 'No tenés partidos amistosos.'
        : 'Todavía no jugaste ningún partido.';

  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        🎾
      </div>
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-sm text-slate-500">Buscá un rival y empezá a jugar.</p>
      <button
        onClick={() => router.push('/competitive/find')}
        className="mt-5 min-h-[44px] rounded-xl bg-[#0E7C66] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0A6657]"
      >
        Buscar partido
      </button>
    </div>
  );
}

function MatchRow({
  match,
  myUserId,
  onClick,
}: {
  match: MatchResult;
  myUserId: string;
  onClick: () => void;
}) {
  // Determine which team the current user is on
  const inTeamA = (match.teamA ?? []).some((p) => p.userId === myUserId);
  const inTeamB = (match.teamB ?? []).some((p) => p.userId === myUserId);
  const inChallengeTeamA =
    match.challenge?.teamA.p1.userId === myUserId ||
    match.challenge?.teamA.p2?.userId === myUserId;
  const effectiveIsTeamA = (match.teamA?.length ?? 0) > 0 ? inTeamA : inChallengeTeamA;

  // Opponent names
  let opponentNames = 'Oponente';
  if (match.teamA?.length || match.teamB?.length) {
    const opp = effectiveIsTeamA ? (match.teamB ?? []) : (match.teamA ?? []);
    if (opp.length) opponentNames = opp.map((p) => p.displayName).join(' / ');
  } else if (match.challenge) {
    if (effectiveIsTeamA) {
      opponentNames = [
        match.challenge.teamB.p1?.displayName,
        match.challenge.teamB.p2?.displayName,
      ]
        .filter(Boolean)
        .join(' / ');
    } else {
      opponentNames = [
        match.challenge.teamA.p1.displayName,
        match.challenge.teamA.p2?.displayName,
      ]
        .filter(Boolean)
        .join(' / ');
    }
  }

  // Partner name
  const myTeam = effectiveIsTeamA ? (match.teamA ?? []) : (match.teamB ?? []);
  const partner = myTeam.find((p) => p.userId !== myUserId)?.displayName;

  const isPending = match.status === MatchResultStatus.PENDING_CONFIRM;
  const isWin =
    !isPending &&
    ((effectiveIsTeamA && match.winnerTeam === 'A') ||
      (!effectiveIsTeamA && match.winnerTeam === 'B'));
  const isLoss = !isPending && !isWin;

  const score = buildScore(match);
  const matchType = resolveMatchType(match);
  const impactsElo = isImpactingElo(match);
  const eloApplied = match.status === MatchResultStatus.CONFIRMED && match.eloApplied;

  const resultLabel = isPending ? '·' : isWin ? 'G' : 'P';
  const resultClass = isPending
    ? 'bg-amber-50 text-amber-500'
    : isWin
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-rose-50 text-rose-600';

  const statusLabel = STATUS_LABEL[match.status] ?? match.status;
  const statusClass = STATUS_CLASS[match.status] ?? 'bg-slate-100 text-slate-600';

  // suppress unused
  void inTeamB;
  void isLoss;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98] hover:shadow-md hover:border-[#0E7C66]/15 text-left"
    >
      <div className="flex items-start gap-3">
        {/* Result pill */}
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black',
            resultClass
          )}
        >
          {resultLabel}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Row 1: opponent + status badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">vs. {opponentNames}</p>
              {partner && (
                <p className="truncate text-xs text-slate-500">Con {partner}</p>
              )}
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                statusClass
              )}
            >
              {statusLabel}
            </span>
          </div>

          {/* Row 2: score */}
          <p className="mt-1 font-mono text-sm font-semibold text-slate-600">{score}</p>

          {/* Row 3: type badge + elo indicator + time */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TypeBadge matchType={matchType} />
            {eloApplied && (
              <span
                className={cn(
                  'text-[10px] font-semibold',
                  impactsElo ? 'text-[#0E7C66]' : 'text-slate-400'
                )}
              >
                {impactsElo ? '● Impactó ELO' : '● Sin impacto ELO'}
              </span>
            )}
            <span className="ml-auto text-[10px] text-slate-400">
              {formatDistanceToNow(parseISO(match.playedAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function MonthFilter({
  months,
  selected,
  onSelect,
}: {
  months: Date[];
  selected: Date | null;
  onSelect: (m: Date | null) => void;
}) {
  if (months.length <= 1) return null;
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
      <FilterPill active={selected === null} onClick={() => onSelect(null)}>
        Todos los meses
      </FilterPill>
      {months.map((m) => {
        const label = format(m, 'MMM yy', { locale: es });
        const isActive = selected !== null && isSameMonth(m, selected);
        return (
          <FilterPill key={m.toISOString()} active={isActive} onClick={() => onSelect(m)}>
            {label.charAt(0).toUpperCase() + label.slice(1)}
          </FilterPill>
        );
      })}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function MyMatchesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: matches, isLoading, isError, refetch } = useMatchResultsList();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [monthFilter, setMonthFilter] = useState<Date | null>(null);

  const months = useMemo(() => {
    if (!matches?.length) return [];
    const seen = new Set<string>();
    const result: Date[] = [];
    const sorted = [...matches].sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
    for (const m of sorted) {
      const key = format(parseISO(m.playedAt), 'yyyy-MM');
      if (!seen.has(key)) {
        seen.add(key);
        result.push(startOfMonth(parseISO(m.playedAt)));
      }
    }
    return result;
  }, [matches]);

  const filtered = useMemo(() => {
    let list = matches ?? [];
    list = [...list].sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
    if (typeFilter !== 'all') {
      list = list.filter((m) => resolveMatchType(m) === typeFilter);
    }
    if (monthFilter !== null) {
      list = list.filter((m) => isSameMonth(parseISO(m.playedAt), monthFilter));
    }
    return list;
  }, [matches, typeFilter, monthFilter]);

  return (
    <>
      <PublicTopBar title="Mis Partidos" backHref="/competitive" />

      <div className="pb-6 pt-4">
        {/* Type filter pills */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
          <FilterPill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
            Todos
          </FilterPill>
          <FilterPill
            active={typeFilter === 'COMPETITIVE'}
            onClick={() => setTypeFilter('COMPETITIVE')}
          >
            Competitivo
          </FilterPill>
          <FilterPill
            active={typeFilter === 'FRIENDLY'}
            onClick={() => setTypeFilter('FRIENDLY')}
          >
            Amistoso
          </FilterPill>
        </div>

        {/* Month filter (only shown when matches span multiple months) */}
        {!isLoading && !isError && (
          <MonthFilter months={months} selected={monthFilter} onSelect={setMonthFilter} />
        )}

        {/* Content */}
        {isLoading ? (
          <div className="mt-3">
            <MatchListSkeleton />
          </div>
        ) : isError ? (
          <div className="mt-10 flex flex-col items-center gap-4 px-6 text-center">
            <p className="text-sm text-slate-500">No pudimos cargar tus partidos.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              <Loader2 className="animate-spin" size={14} />
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState typeFilter={typeFilter} />
        ) : (
          <div className="mt-3 space-y-3 px-4">
            {filtered.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                myUserId={user?.userId ?? ''}
                onClick={() => router.push(`/matches/${m.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

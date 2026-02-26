'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RankingTable } from '@/app/components/competitive/ranking-table';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useRankingByCategory } from '@/hooks/use-competitive-profile';
import { COMPETITIVE_RANKING_CATEGORIES } from '@/lib/competitive-constants';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type { Category } from '@/types/competitive';

const EMPTY_RANKING_COPY =
  'Jug\u00E1 al menos 1 partido confirmado para aparecer en el ranking';

type RankingTab = {
  label: string;
  value?: Category;
};

const RANKING_TABS: RankingTab[] = [
  { label: 'Todos' },
  ...COMPETITIVE_RANKING_CATEGORIES.map((category) => ({
    label: `Cat ${category}`,
    value: category,
  })),
];

function getPositionDeltaLabel(delta?: number | null): string | null {
  if (typeof delta !== 'number') return null;
  if (delta > 0) return `\u25B2${delta}`;
  if (delta < 0) return `\u25BC${Math.abs(delta)}`;
  return '-';
}

export default function RankingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [isMyRowVisible, setIsMyRowVisible] = useState(true);
  const myRowRef = useRef<HTMLTableRowElement | null>(null);

  // Segmented selector state
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const isAuthed = !!user?.userId;

  const rankingQuery = useRankingByCategory(selectedCategory);
  const players = rankingQuery.data?.items ?? [];

  const myPlayerIndex = players.findIndex((player) => player.userId === user?.userId);
  const myPlayer = myPlayerIndex >= 0 ? players[myPlayerIndex] : null;
  const myPosition = myPlayer ? (myPlayer.position ?? myPlayerIndex + 1) : null;
  const myPositionDeltaLabel = myPlayer ? getPositionDeltaLabel(myPlayer.positionDelta) : null;
  const shouldShowMyPositionCard = Boolean(isAuthed && myPlayer && !isMyRowVisible);

  // Update sliding indicator position
  useEffect(() => {
    const activeIndex = RANKING_TABS.findIndex((t) => t.value === selectedCategory);
    const el = tabRefs.current[activeIndex];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    }
  }, [selectedCategory]);

  // Initialise indicator on mount
  useEffect(() => {
    const el = tabRefs.current[0];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    }
  }, []);

  useEffect(() => {
    setIsMyRowVisible(true);

    const row = myRowRef.current;
    if (!row || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMyRowVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(row);
    return () => observer.disconnect();
  }, [selectedCategory, players.length, user?.userId]);

  const handleChallenge = (playerId: string) => {
    router.push(`/competitive/challenges/new?opponentId=${playerId}`);
  };

  return (
    <>
      <PublicTopBar title="Ranking" backHref="/" />

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Ranking General
          </h1>
          <p className="text-sm text-slate-500">Los mejores jugadores de PadelPoint por ELO</p>
        </div>

        {/* Segmented category selector */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-1">
          <div
            className="relative inline-flex min-w-max rounded-2xl bg-slate-100 p-1.5"
            role="tablist"
            aria-label="Ranking categories"
          >
            {/* Sliding indicator */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1.5 rounded-xl bg-white shadow-sm transition-all duration-300 ease-in-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                opacity: indicatorStyle.opacity,
                height: 'calc(100% - 12px)',
              }}
            />

            {RANKING_TABS.map((tab, i) => {
              const isActive = tab.value === selectedCategory;
              return (
                <button
                  key={tab.label}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(tab.value)}
                  className={cn(
                    'relative z-10 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200',
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {rankingQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
            ))}
          </div>
        ) : rankingQuery.isError ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">No se pudo cargar el ranking.</p>
            <button
              type="button"
              onClick={() => rankingQuery.refetch()}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Reintentar
            </button>
          </div>
        ) : players.length > 0 ? (
          <div className="space-y-4">
            <RankingTable
              players={players}
              currentUserId={user?.userId}
              myRowRef={myRowRef}
              onChallenge={isAuthed ? handleChallenge : undefined}
            />

            {rankingQuery.hasNextPage && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => rankingQuery.fetchNextPage()}
                  disabled={rankingQuery.isFetchingNextPage}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rankingQuery.isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 py-20 text-center text-sm text-slate-500">
            {EMPTY_RANKING_COPY}
          </div>
        )}
      </div>

      {/* Sticky my-position card */}
      {shouldShowMyPositionCard && myPlayer && myPosition && (
        <div className="fixed inset-x-4 bottom-4 z-20 md:hidden">
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white/95 shadow-xl backdrop-blur-sm">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  Tu posición
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{myPlayer.displayName}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                  #{myPosition}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  <span className="font-bold text-emerald-600">{myPlayer.elo}</span> ELO
                  {myPositionDeltaLabel ? (
                    <span
                      className={cn(
                        'ml-1.5 font-semibold',
                        myPlayer.positionDelta && myPlayer.positionDelta > 0
                          ? 'text-emerald-600'
                          : 'text-rose-500'
                      )}
                    >
                      {myPositionDeltaLabel}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

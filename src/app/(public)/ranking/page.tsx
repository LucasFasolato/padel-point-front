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
  { label: 'All' },
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
  const token = useAuthStore((s) => s.token);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [isMyRowVisible, setIsMyRowVisible] = useState(true);
  const myRowRef = useRef<HTMLTableRowElement | null>(null);

  const isAuthed = !!token && !!user?.userId;

  const rankingQuery = useRankingByCategory(selectedCategory);
  const players = rankingQuery.data?.items ?? [];

  const myPlayerIndex = players.findIndex((player) => player.userId === user?.userId);
  const myPlayer = myPlayerIndex >= 0 ? players[myPlayerIndex] : null;
  const myPosition = myPlayer ? (myPlayer.position ?? myPlayerIndex + 1) : null;
  const myPositionDeltaLabel = myPlayer ? getPositionDeltaLabel(myPlayer.positionDelta) : null;
  const shouldShowMyPositionCard = Boolean(isAuthed && myPlayer && !isMyRowVisible);

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
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Ranking General</h1>
          <p className="text-slate-600">Los mejores jugadores de PadelPoint</p>
        </div>

        <div className="mb-4 -mx-4 overflow-x-auto px-4">
          <div className="inline-flex min-w-full gap-2 sm:min-w-0" role="tablist" aria-label="Ranking categories">
            {RANKING_TABS.map((tab) => {
              const isActive = tab.value === selectedCategory;
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(tab.value)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {rankingQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : rankingQuery.isError ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-600">No se pudo cargar el ranking.</p>
            <button
              type="button"
              onClick={() => rankingQuery.refetch()}
              className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => rankingQuery.fetchNextPage()}
                  disabled={rankingQuery.isFetchingNextPage}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rankingQuery.isFetchingNextPage ? 'Cargando...' : 'Cargar mas'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-16 text-center text-slate-600">
            {EMPTY_RANKING_COPY}
          </div>
        )}
      </div>

      {shouldShowMyPositionCard && myPlayer && myPosition && (
        <div className="fixed inset-x-4 bottom-4 z-20 md:hidden">
          <div className="rounded-xl border border-blue-200 bg-white/95 p-3 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Tu posicion</p>
                <p className="text-sm font-semibold text-slate-900">{myPlayer.displayName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">#{myPosition}</p>
                <p className="text-xs text-slate-600">
                  {myPlayer.elo} ELO
                  {myPositionDeltaLabel ? `  ${myPositionDeltaLabel}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

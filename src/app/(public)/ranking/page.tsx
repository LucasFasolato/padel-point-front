'use client';

import { useRanking } from '@/hooks/use-competitive-profile';
import { RankingTable } from '@/app/components/competitive/ranking-table';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function RankingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const isAuthed = !!token && !!user?.userId;

  const { data: players, isLoading } = useRanking(50);

  const handleChallenge = (playerId: string) => {
    router.push(`/competitive/challenges/new?opponentId=${playerId}`);
  };

  return (
    <>
      <PublicTopBar title="Ranking" backHref="/" />

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">🏆 Ranking General</h1>
          <p className="text-slate-600">Los mejores jugadores de PadelPoint</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : players && players.length > 0 ? (
          <RankingTable
            players={players}
            currentUserId={user?.userId}
            onChallenge={isAuthed ? handleChallenge : undefined}
          />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-16 text-center text-slate-600">
            Todavía no hay jugadores en el ranking
          </div>
        )}
      </div>
    </>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Plus } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { LeagueCard } from '@/app/components/leagues';
import { useLeaguesList } from '@/hooks/use-leagues';
import { groupLeaguesByStatus } from '@/lib/league-utils';

export default function LeaguesPage() {
  const router = useRouter();
  const { data: leagues, isLoading, isError, refetch } = useLeaguesList();

  return (
    <>
      <PublicTopBar title="Mis ligas" backHref="/" />

      <div className="px-4 py-6 pb-28 space-y-6">
        {isLoading && <PageSkeleton />}

        {isError && <LeaguesErrorCard onRetry={() => refetch()} />}

        {!isLoading && !isError && leagues && leagues.length === 0 && (
          <EmptyState onCreateClick={() => router.push('/leagues/new')} />
        )}

        {!isLoading && !isError && leagues && leagues.length > 0 && (
          <>
            {groupLeaguesByStatus(leagues).map((group) => (
              <section key={group.status}>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {group.label}
                </h2>
                <div className="space-y-3">
                  {group.items.map((league) => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      onClick={() => router.push(`/leagues/${league.id}`)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* Sticky bottom FAB */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#F7F8FA] via-[#F7F8FA]/95 to-transparent pb-4 pt-6 px-4">
        <Button
          fullWidth
          size="lg"
          onClick={() => router.push('/leagues/new')}
          className="gap-2 shadow-lg"
        >
          <Plus size={18} />
          Nueva liga
        </Button>
      </div>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

function LeaguesErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#F7F8FA] p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <Trophy size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-800">No pudimos cargar tus ligas</p>
      <p className="mt-1 text-xs text-slate-500">Revisá tu conexión y reintentá.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[#0E7C66] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B6B58] active:scale-[0.98]"
      >
        Reintentar
      </button>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F7F8FA] py-16 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
        <Trophy size={36} className="text-[#0E7C66]" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">
        Todavía no tenés ligas
      </h3>
      <p className="mb-6 px-6 text-sm text-slate-500">
        Creá tu primera liga y desafiá a tus amigos a competir.
      </p>
    </div>
  );
}

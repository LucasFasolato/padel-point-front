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
  const { data: leagues, isLoading, error } = useLeaguesList();

  return (
    <>
      <PublicTopBar title="Mis ligas" backHref="/" />

      <div className="px-4 py-6 space-y-6">
        {isLoading && <PageSkeleton />}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm text-rose-700">No se pudieron cargar las ligas.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !error && leagues && leagues.length === 0 && (
          <EmptyState onCreateClick={() => router.push('/leagues/new')} />
        )}

        {!isLoading && !error && leagues && leagues.length > 0 && (
          <>
            <Button
              fullWidth
              size="lg"
              onClick={() => router.push('/leagues/new')}
              className="gap-2"
            >
              <Plus size={18} />
              Crear liga
            </Button>

            {groupLeaguesByStatus(leagues).map((group) => (
              <section key={group.status}>
                <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
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
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
        <Trophy size={36} className="text-emerald-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        Todavía no tenés ligas
      </h3>
      <p className="mb-6 text-sm text-slate-600 px-6">
        Creá tu primera liga y desafiá a tus amigos a competir durante la temporada.
      </p>
      <Button onClick={onCreateClick} className="gap-2">
        <Plus size={16} />
        Crear liga
      </Button>
    </div>
  );
}


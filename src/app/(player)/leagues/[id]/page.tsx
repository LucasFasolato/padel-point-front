'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, UserPlus, Calendar } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { LeagueStatusBadge, StandingsTable, InviteModal } from '@/app/components/leagues';
import { useLeagueDetail, useCreateInvites } from '@/hooks/use-leagues';
import { useAuthStore } from '@/store/auth-store';
import { formatDateRange } from '@/lib/league-utils';

export default function LeagueDetailPage() {
  const { id } = useParams() as { id: string };
  const user = useAuthStore((s) => s.user);
  const { data: league, isLoading, error } = useLeagueDetail(id);
  const inviteMutation = useCreateInvites(id);
  const [showInvite, setShowInvite] = useState(false);

  if (isLoading) {
    return (
      <>
        <PublicTopBar title="Liga" backHref="/leagues" />
        <DetailSkeleton />
      </>
    );
  }

  if (error || !league) {
    return (
      <>
        <PublicTopBar title="Liga" backHref="/leagues" />
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-slate-500">No se pudo cargar la liga.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicTopBar title={league.name} backHref="/leagues" />

      <div className="px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-xl font-bold pr-2">{league.name}</h1>
            <LeagueStatusBadge
              status={league.status}
              className="bg-white/20 text-white shrink-0"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-emerald-100">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDateRange(league.startDate, league.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {league.membersCount} jugadores
            </span>
          </div>
        </div>

        {/* Standings */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Tabla de posiciones
          </h2>
          <StandingsTable
            standings={league.standings ?? []}
            currentUserId={user?.userId}
          />
        </section>

        {/* Members */}
        {league.members && league.members.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Miembros
            </h2>
            <div className="space-y-2">
              {league.members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {(m.displayName || 'J').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {m.displayName || 'Jugador'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Invite CTA */}
        <Button
          fullWidth
          size="lg"
          variant="secondary"
          className="gap-2"
          onClick={() => setShowInvite(true)}
        >
          <UserPlus size={18} />
          Invitar jugadores
        </Button>
      </div>

      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        onSubmit={(emails) => {
          inviteMutation.mutate(emails, {
            onSuccess: () => setShowInvite(false),
          });
        }}
        isPending={inviteMutation.isPending}
      />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

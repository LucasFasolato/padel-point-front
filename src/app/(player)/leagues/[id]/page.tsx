'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, UserPlus, Calendar, Trophy, Info } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import {
  LeagueStatusBadge,
  StandingsTable,
  InviteModal,
  ReportFromReservationModal,
  LeagueMatchCard,
} from '@/app/components/leagues';
import {
  useLeagueDetail,
  useCreateInvites,
  useEligibleReservations,
  useReportFromReservation,
  useLeagueMatches,
} from '@/hooks/use-leagues';
import { useAuthStore } from '@/store/auth-store';
import { formatDateRange, getModeLabel } from '@/lib/league-utils';

export default function LeagueDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: league, isLoading, error } = useLeagueDetail(id);
  const inviteMutation = useCreateInvites(id);
  const reportMutation = useReportFromReservation(id);
  const { data: reservations, isLoading: reservationsLoading } = useEligibleReservations(id);
  const { data: matches } = useLeagueMatches(id);
  const [showInvite, setShowInvite] = useState(false);
  const [showReport, setShowReport] = useState(false);

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

  const isOpen = league.mode === 'open';
  const isScheduled = !isOpen;
  const isActive = league.status === 'active';
  const isFinished = league.status === 'finished';
  const isUpcoming = league.status === 'upcoming';
  const matchList = Array.isArray(matches) ? matches : [];

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

          {/* Mode label */}
          <p className="text-sm font-medium text-emerald-50 mb-2">
            {getModeLabel(league.mode)}
          </p>

          <div className="flex items-center gap-4 text-sm text-emerald-100">
            {/* Date info: only show range for scheduled leagues */}
            {isScheduled && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                Temporada: {formatDateRange(league.startDate, league.endDate)}
              </span>
            )}
            {isOpen && (
              <span className="text-xs text-emerald-200">
                Se actualiza con cada partido confirmado
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {league.membersCount} jugadores
            </span>
          </div>
        </div>

        {/* Status-specific CTA area */}
        {isActive && (
          <Button
            fullWidth
            size="lg"
            className="gap-2"
            onClick={() => setShowReport(true)}
          >
            <Trophy size={18} />
            Cargar resultado
          </Button>
        )}

        {isUpcoming && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm text-blue-800">
              La liga aún no está activa. Activala para empezar a cargar partidos.
            </p>
          </div>
        )}

        {isFinished && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-sm text-slate-600">
              Liga finalizada. No se pueden cargar más resultados.
            </p>
          </div>
        )}

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

        {/* Match history */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Partidos
          </h2>
          {matchList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-900">
                Todavía no hay partidos
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Solo cuentan partidos vinculados a reservas confirmadas.
              </p>
              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() => setShowReport(true)}
                >
                  <Trophy size={14} />
                  Cargar primer resultado
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {matchList.map((m) => (
                <LeagueMatchCard
                  key={m.id}
                  match={m}
                  onClick={() => router.push(`/matches/${m.id}`)}
                />
              ))}
            </div>
          )}
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

      <ReportFromReservationModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={(payload) => {
          reportMutation.mutate(payload, {
            onSuccess: (result) => {
              setShowReport(false);
              if (result?.matchId) {
                router.push(`/matches/${result.matchId}`);
              }
            },
          });
        }}
        isPending={reportMutation.isPending}
        members={league.members ?? []}
        reservations={reservations ?? []}
        reservationsLoading={reservationsLoading}
      />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

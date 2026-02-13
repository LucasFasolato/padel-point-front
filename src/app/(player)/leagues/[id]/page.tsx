'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, UserPlus, Calendar, Trophy, Info } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import {
  LeagueStatusBadge,
  StandingsTable,
  InviteModal,
  ReportFromReservationModal,
  ReportManualModal,
  ReportMethodSheet,
  LeagueChallengesSection,
  LeagueMatchCard,
  LeagueSettingsPanel,
} from '@/app/components/leagues';
import {
  useLeagueDetail,
  useLeagueStandings,
  useCreateInvites,
  useEligibleReservations,
  useReportFromReservation,
  useReportManual,
  useLeagueMatches,
  useLeagueSettings,
  useUpdateLeagueSettings,
  useUpdateMemberRole,
} from '@/hooks/use-leagues';
import { useAuthStore } from '@/store/auth-store';
import { formatDateRange, getModeLabel } from '@/lib/league-utils';
import type { LeagueMemberRole } from '@/types/leagues';

const ROLE_LABELS: Record<LeagueMemberRole, string> = {
  member: 'Miembro',
  owner: 'Owner',
};

export default function LeagueDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: league, isLoading, error } = useLeagueDetail(id);
  const { data: standingsData, isLoading: standingsLoading } = useLeagueStandings(id);
  const inviteMutation = useCreateInvites(id);
  const reportFromReservation = useReportFromReservation(id);
  const reportManual = useReportManual(id);
  const { data: reservations, isLoading: reservationsLoading } = useEligibleReservations(id);
  const { data: matches } = useLeagueMatches(id);
  const { data: settings } = useLeagueSettings(id);
  const updateSettings = useUpdateLeagueSettings(id);
  const updateMemberRole = useUpdateMemberRole(id);
  const [showInvite, setShowInvite] = useState(false);
  const [showReportMethodSheet, setShowReportMethodSheet] = useState(false);
  const [showReservationReport, setShowReservationReport] = useState(false);
  const [showManualReport, setShowManualReport] = useState(false);
  const [partidosView, setPartidosView] = useState<'matches' | 'challenges'>('matches');

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
  const standingsRows = standingsData?.rows ?? league.standings ?? [];
  const showStandingsLoading = standingsLoading && standingsRows.length === 0;

  // Determine user role from members list
  const currentMember = league.members?.find((m) => m.userId === user?.userId);
const userRole = (currentMember?.role ?? 'member').toLowerCase() as LeagueMemberRole;
const isReadOnly = userRole === 'member';
  console.log({
    userId: user?.userId,
    members: league.members,
    currentMember,
    userRole,
    isReadOnly,
  });
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
            onClick={() => setShowReportMethodSheet(true)}
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

        {/* Tabs */}
        <Tabs defaultValue="tabla" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="tabla">Tabla</TabsTrigger>
            <TabsTrigger value="partidos">Partidos</TabsTrigger>
            <TabsTrigger value="miembros">Miembros</TabsTrigger>
            <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
          </TabsList>

          {/* Tabla tab */}
          <TabsContent value="tabla">
            <StandingsTable
              standings={standingsRows}
              movement={standingsData?.movement}
              computedAt={standingsData?.computedAt}
              isLoading={showStandingsLoading}
              currentUserId={user?.userId}
            />
          </TabsContent>

          {/* Partidos tab */}
          <TabsContent value="partidos">
            <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setPartidosView('matches')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  partidosView === 'matches'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Partidos
              </button>
              <button
                type="button"
                onClick={() => setPartidosView('challenges')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  partidosView === 'challenges'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Desafíos
              </button>
            </div>

            {partidosView === 'matches' ? (
              matchList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-900">
                    Todavía no hay partidos
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Podés cargar partidos desde reserva o manualmente.
                  </p>
                  {isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                      onClick={() => setShowReportMethodSheet(true)}
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
              )
            ) : (
              <LeagueChallengesSection
                leagueId={id}
                members={league.members ?? []}
                currentUserId={user?.userId}
              />
            )}
          </TabsContent>

          {/* Miembros tab */}
          <TabsContent value="miembros">
            {league.members && league.members.length > 0 ? (
              <div className="space-y-2">
                {league.members.map((m) => {
                  const memberRole: LeagueMemberRole = m.role ?? 'member';
                  const canEditRole = !isReadOnly;

                  return (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                          {(m.displayName || 'J').charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-sm font-medium text-slate-900">
                          {m.displayName || 'Jugador'}
                        </span>
                      </div>

                      {canEditRole ? (
                        <select
                          aria-label={`Rol de ${m.displayName || 'Jugador'}`}
                          value={memberRole}
                          disabled={updateMemberRole.isPending}
                          onChange={(e) => {
                            const nextRole = e.target.value as LeagueMemberRole;
                            if (nextRole === memberRole) return;
                            updateMemberRole.mutate({ userId: m.userId, role: nextRole });
                          }}
                          className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="member">{ROLE_LABELS.member}</option>
                          <option value="owner">{ROLE_LABELS.owner}</option>
                        </select>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {ROLE_LABELS[memberRole] ?? memberRole}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                No hay miembros todavía.
              </p>
            )}

            <Button
              fullWidth
              size="lg"
              variant="secondary"
              className="gap-2 mt-4"
              disabled={isReadOnly}
              onClick={() => {
                if (isReadOnly) return;
                setShowInvite(true);
              }}
            >
              <UserPlus size={18} />
              Invitar jugadores
            </Button>
            {isReadOnly && (
              <p className="mt-2 text-center text-xs text-slate-500">
                Solo administradores pueden invitar o editar roles.
              </p>
            )}
          </TabsContent>

          {/* Ajustes tab */}
          <TabsContent value="ajustes">
            <LeagueSettingsPanel
              settings={settings}
              isReadOnly={isReadOnly}
              onSave={(s) => updateSettings.mutate(s)}
              isSaving={updateSettings.isPending}
            />
          </TabsContent>
        </Tabs>
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

      <ReportMethodSheet
        isOpen={showReportMethodSheet}
        onClose={() => setShowReportMethodSheet(false)}
        onReservation={() => {
          setShowReportMethodSheet(false);
          setShowReservationReport(true);
        }}
        onManual={() => {
          setShowReportMethodSheet(false);
          setShowManualReport(true);
        }}
      />

      <ReportFromReservationModal
        isOpen={showReservationReport}
        onClose={() => setShowReservationReport(false)}
        onSubmit={(payload) => {
          reportFromReservation.mutate(payload, {
            onSuccess: (result) => {
              setShowReservationReport(false);
              if (result?.matchId) {
                router.push(`/matches/${result.matchId}`);
              }
            },
          });
        }}
        isPending={reportFromReservation.isPending}
        members={league.members ?? []}
        reservations={reservations ?? []}
        reservationsLoading={reservationsLoading}
      />

      <ReportManualModal
        isOpen={showManualReport}
        onClose={() => setShowManualReport(false)}
        onSubmit={(payload) => {
          reportManual.mutate(payload, {
            onSuccess: (result) => {
              setShowManualReport(false);
              if (result?.matchId) {
                router.push(`/matches/${result.matchId}`);
              }
            },
          });
        }}
        isPending={reportManual.isPending}
        members={league.members ?? []}
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
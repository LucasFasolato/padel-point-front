'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Users, UserPlus, Calendar, Trophy, Info, Plus } from 'lucide-react';
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
  LeagueMatchModeSheet,
  LeagueMatchCreateModal,
  LeagueMatchResultModal,
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
  useCreateLeagueMatch,
  useCaptureLeagueMatchResult,
} from '@/hooks/use-leagues';
import { useAuthStore } from '@/store/auth-store';
import { formatDateRange, getModeLabel } from '@/lib/league-utils';
import { getSingleParam, isUuid } from '@/lib/id-utils';
import type { LeagueMatch, LeagueMatchCreateMode, LeagueMemberRole } from '@/types/leagues';

const ROLE_LABELS: Record<LeagueMemberRole, string> = {
  member: 'Miembro',
  owner: 'Owner',
};

type LeagueDetailTab = 'tabla' | 'partidos' | 'miembros' | 'ajustes';

function normalizeLeagueTab(rawTab: string | null | undefined): LeagueDetailTab {
  const tab = (rawTab ?? '').toLowerCase();

  if (tab === 'tabla' || tab === 'standings') return 'tabla';
  if (tab === 'partidos' || tab === 'matches') return 'partidos';
  if (tab === 'miembros' || tab === 'members') return 'miembros';
  if (tab === 'ajustes' || tab === 'settings') return 'ajustes';

  return 'tabla';
}

function isForbiddenOrNotFound(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 403 || status === 404;
}

export default function LeagueDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const searchParams = useSearchParams();
  const rawId = getSingleParam(params?.id);
  if (!isUuid(rawId)) {
    return <LeagueNotFoundState />;
  }

  const tabParam = searchParams.get('tab');

  return <LeagueDetailContent leagueId={rawId} initialTabParam={tabParam} />;
}

interface LeagueDetailContentProps {
  leagueId: string;
  initialTabParam: string | null;
}

function LeagueDetailContent({ leagueId, initialTabParam }: LeagueDetailContentProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: league, isLoading, error } = useLeagueDetail(leagueId);
  const { data: standingsData, isLoading: standingsLoading } = useLeagueStandings(leagueId);
  const inviteMutation = useCreateInvites(leagueId);
  const reportFromReservation = useReportFromReservation(leagueId);
  const reportManual = useReportManual(leagueId);
  const createLeagueMatch = useCreateLeagueMatch(leagueId);
  const captureMatchResult = useCaptureLeagueMatchResult(leagueId);
  const { data: reservations, isLoading: reservationsLoading } = useEligibleReservations(leagueId);
  const { data: matches, isLoading: matchesLoading } = useLeagueMatches(leagueId);
  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useLeagueSettings(leagueId);
  const updateSettings = useUpdateLeagueSettings(leagueId);
  const updateMemberRole = useUpdateMemberRole(leagueId);
  const [showInvite, setShowInvite] = useState(false);
  const [showReportMethodSheet, setShowReportMethodSheet] = useState(false);
  const [showReservationReport, setShowReservationReport] = useState(false);
  const [showManualReport, setShowManualReport] = useState(false);
  const [showMatchModeSheet, setShowMatchModeSheet] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [createMatchMode, setCreateMatchMode] = useState<LeagueMatchCreateMode>('played');
  const [showMatchResultModal, setShowMatchResultModal] = useState(false);
  const [selectedScheduledMatch, setSelectedScheduledMatch] = useState<LeagueMatch | null>(null);
  const [partidosView, setPartidosView] = useState<'matches' | 'challenges'>('matches');
  const [activeTab, setActiveTab] = useState<LeagueDetailTab>(() =>
    normalizeLeagueTab(initialTabParam)
  );

  useEffect(() => {
    setActiveTab(normalizeLeagueTab(initialTabParam));
  }, [initialTabParam]);

  const handleTabChange = (value: string) => setActiveTab(normalizeLeagueTab(value));

  if (isLoading) {
    return (
      <>
        <PublicTopBar title="Liga" backHref="/leagues" />
        <DetailSkeleton />
      </>
    );
  }

  if (isForbiddenOrNotFound(error) || !league) {
    return <LeagueNotFoundState />;
  }

  if (error) {
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
              <div className="space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  className="gap-2"
                  onClick={() => setShowMatchModeSheet(true)}
                  disabled={isReadOnly || isFinished}
                >
                  <Plus size={18} />
                  Cargar partido
                </Button>

                {isReadOnly && (
                  <p className="text-center text-xs text-slate-500">
                    Solo administradores pueden cargar partidos.
                  </p>
                )}

                {matchesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                ) : matchList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                      Todavía no hay partidos
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Cargá un partido jugado o programá uno para jugar más tarde.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matchList.map((m) => (
                      <LeagueMatchCard
                        key={m.id}
                        match={m}
                        onClick={() => router.push(`/matches/${m.id}`)}
                        onLoadResult={
                          m.status === 'scheduled'
                            ? (match) => {
                                setSelectedScheduledMatch(match);
                                setShowMatchResultModal(true);
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <LeagueChallengesSection
                leagueId={leagueId}
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
            {settingsLoading ? (
              <SettingsTabSkeleton />
            ) : settingsError ? (
              <SettingsTabError onRetry={() => void refetchSettings()} />
            ) : (
              <LeagueSettingsPanel
                settings={settings}
                isReadOnly={isReadOnly}
                onSave={(s) => updateSettings.mutate(s)}
                isSaving={updateSettings.isPending}
              />
            )}
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

      <LeagueMatchModeSheet
        isOpen={showMatchModeSheet}
        onClose={() => setShowMatchModeSheet(false)}
        onPlayed={() => {
          setShowMatchModeSheet(false);
          setCreateMatchMode('played');
          setShowCreateMatchModal(true);
        }}
        onScheduled={() => {
          setShowMatchModeSheet(false);
          setCreateMatchMode('scheduled');
          setShowCreateMatchModal(true);
        }}
      />

      <LeagueMatchCreateModal
        isOpen={showCreateMatchModal}
        mode={createMatchMode}
        members={league.members ?? []}
        isPending={createLeagueMatch.isPending}
        onClose={() => {
          if (createLeagueMatch.isPending) return;
          setShowCreateMatchModal(false);
        }}
        onSubmit={(payload) => {
          createLeagueMatch.mutate(payload, {
            onSuccess: () => {
              setShowCreateMatchModal(false);
            },
          });
        }}
      />

      <LeagueMatchResultModal
        isOpen={showMatchResultModal}
        match={selectedScheduledMatch}
        isPending={captureMatchResult.isPending}
        onClose={() => {
          if (captureMatchResult.isPending) return;
          setShowMatchResultModal(false);
          setSelectedScheduledMatch(null);
        }}
        onSubmit={(payload) => {
          if (!selectedScheduledMatch) return;
          captureMatchResult.mutate(
            { matchId: selectedScheduledMatch.id, payload },
            {
              onSuccess: () => {
                setShowMatchResultModal(false);
                setSelectedScheduledMatch(null);
              },
            }
          );
        }}
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

function SettingsTabSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

function SettingsTabError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
      <p className="text-sm text-rose-700">No se pudieron cargar los ajustes de la liga.</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function LeagueNotFoundState() {
  const router = useRouter();

  return (
    <>
      <PublicTopBar title="Liga" backHref="/leagues" />
      <div className="px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-slate-900">Liga no encontrada</h1>
        <p className="mt-2 text-sm text-slate-600">
          El enlace es inválido o la liga no existe.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push('/leagues')}
        >
          Volver a Ligas
        </Button>
      </div>
    </>
  );
}


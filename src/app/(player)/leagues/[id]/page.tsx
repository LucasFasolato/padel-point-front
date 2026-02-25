'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Users, UserPlus, Calendar, Trophy, Info, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import {
  LeagueStatusBadge,
  StandingsTable,
  LeagueShareCard,
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
  LeagueActivityFeed,
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
  useEnableLeagueShare,
  usePublicLeagueStandings,
} from '@/hooks/use-leagues';
import { usePendingConfirmations } from '@/hooks/use-matches';
import { useLeagueActivitySocket } from '@/hooks/use-notification-socket';
import { useAuthStore } from '@/store/auth-store';
import { formatDateRange, getModeLabel } from '@/lib/league-utils';
import { getSingleParam, isUuid } from '@/lib/id-utils';
import type { LeagueMatch, LeagueMatchCreateMode, LeagueMemberRole } from '@/types/leagues';

const ROLE_LABELS: Record<LeagueMemberRole, string> = {
  member: 'Miembro',
  owner: 'Owner',
};

type LeagueDetailTab = 'tabla' | 'partidos' | 'actividad' | 'miembros' | 'ajustes';

function normalizeLeagueTab(rawTab: string | null | undefined): LeagueDetailTab {
  const tab = (rawTab ?? '').toLowerCase();

  if (tab === 'tabla' || tab === 'standings') return 'tabla';
  if (tab === 'partidos' || tab === 'matches') return 'partidos';
  if (tab === 'actividad' || tab === 'activity') return 'actividad';
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
  const authToken = useAuthStore((s) => s.token);
  const rawId = getSingleParam(params?.id);
  if (!isUuid(rawId)) {
    return <LeagueNotFoundState />;
  }

  const tabParam = searchParams.get('tab');
  const isShareMode = searchParams.get('share') === '1';
  const shareToken = searchParams.get('token');
  const justCreated = searchParams.get('created') === '1';

  if (isShareMode && !authToken) {
    return (
      <LeaguePublicShareView
        leagueId={rawId}
        token={shareToken ?? ''}
      />
    );
  }

  return <LeagueDetailContent leagueId={rawId} initialTabParam={tabParam} justCreated={justCreated} />;
}

interface LeagueDetailContentProps {
  leagueId: string;
  initialTabParam: string | null;
  justCreated?: boolean;
}

function LeagueDetailContent({ leagueId, initialTabParam, justCreated }: LeagueDetailContentProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const enableLeagueShare = useEnableLeagueShare(leagueId);
  const { data: pendingConfirmationsData } = usePendingConfirmations();
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
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeagueDetailTab>(() =>
    normalizeLeagueTab(initialTabParam)
  );

  // Subscribe to league realtime activity events while on this page
  useLeagueActivitySocket(leagueId);

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
  const canRecordMatchesRaw = (league as { canRecordMatches?: boolean }).canRecordMatches;
  const recordMatchesReasonRaw = (league as { reason?: string }).reason;
  const hasCanRecordMatchesFlag = typeof canRecordMatchesRaw === 'boolean';
  const canRecordMatches = hasCanRecordMatchesFlag ? canRecordMatchesRaw : !isUpcoming;
  const showRecordMatchesBlockedBanner = hasCanRecordMatchesFlag ? !canRecordMatches : isUpcoming;
  const recordMatchesBlockedMessage =
    typeof recordMatchesReasonRaw === 'string' && recordMatchesReasonRaw.trim().length > 0
      ? recordMatchesReasonRaw.trim()
      : isUpcoming
        ? 'La liga aún no está activa.'
        : 'Invita al menos 1 jugador más.';
  const matchList = Array.isArray(matches) ? matches : [];
  const standingsRows = standingsData?.rows ?? league.standings ?? [];
  const showStandingsLoading = standingsLoading && standingsRows.length === 0;

  // Determine user role from members list
  const currentMember = league.members?.find((m) => m.userId === user?.userId);
  const userRole = (currentMember?.role ?? 'member').toLowerCase() as LeagueMemberRole;
  const isReadOnly = userRole === 'member';

  const handleShareStandings = async () => {
    try {
      const resolvedUrl = await getOrCreateLeagueShareUrl({
        leagueId,
        leagueName: league.name,
        cachedUrl: shareUrl,
        enable: () => enableLeagueShare.mutateAsync(),
        onCache: setShareUrl,
      });

      const shareText = `Sumate a mi liga en PadelPoint: ${resolvedUrl}`;

      // 1. Web Share API (iOS/Android native sheet)
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: league.name,
            text: shareText,
            url: resolvedUrl,
          });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          // Fall through to WhatsApp
        }
      }

      // 2. WhatsApp deep link fallback
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('No pudimos generar el enlace para compartir.');
    }
  };

  const handleCopyShareLink = async () => {
    try {
      const resolvedUrl = await getOrCreateLeagueShareUrl({
        leagueId,
        leagueName: league.name,
        cachedUrl: shareUrl,
        enable: () => enableLeagueShare.mutateAsync(),
        onCache: setShareUrl,
      });

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedUrl);
        toast.success('Enlace copiado');
      } else {
        toast.error('No se pudo copiar el enlace.');
      }
    } catch {
      toast.error('No pudimos generar el enlace para compartir.');
    }
  };

  // Pending confirmations scoped to this league
  const leaguePendingConfirmations = (pendingConfirmationsData ?? []).filter(
    (m) => m.leagueId === leagueId
  );

  return (
    <>
      <PublicTopBar title={league.name} backHref="/leagues" />

      <div className="px-4 py-6 space-y-4">
        {/* Success banner – shown after league creation */}
        {justCreated && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-lg">🎉</span>
            <div>
              <p className="text-sm font-semibold text-emerald-900">¡Liga creada!</p>
              <p className="text-xs text-emerald-700">Invitá a tus amigos para empezar a jugar.</p>
            </div>
          </div>
        )}

        {/* Pending confirmations for this league */}
        {leaguePendingConfirmations.length > 0 && (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <p className="mb-2 text-sm font-bold text-amber-900">
              Resultados por confirmar ({leaguePendingConfirmations.length})
            </p>
            <div className="space-y-2">
              {leaguePendingConfirmations.map((match) => {
                const reporter =
                  match.challenge?.teamA?.p1?.displayName ??
                  match.teamA?.[0]?.displayName ??
                  'Un jugador';
                const sets = [
                  `${match.teamASet1}-${match.teamBSet1}`,
                  `${match.teamASet2}-${match.teamBSet2}`,
                  match.teamASet3 != null ? `${match.teamASet3}-${match.teamBSet3}` : null,
                ]
                  .filter(Boolean)
                  .join(', ');
                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {reporter} reportó un resultado
                      </p>
                      {sets && <p className="text-xs text-slate-500">{sets}</p>}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => router.push(`/matches/${match.id}`)}
                      className="shrink-0"
                    >
                      Confirmar
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {league.avatarUrl ? (
                <img
                  src={league.avatarUrl}
                  alt={league.name}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold ring-2 ring-white/30">
                  {league.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'}
                </div>
              )}
              <h1 className="text-xl font-bold leading-tight truncate">{league.name}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-[36px] border-white/30 bg-white/10 px-3 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => void handleShareStandings()}
                  disabled={enableLeagueShare.isPending}
                >
                  <Share2 size={14} />
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-[32px] border-white/30 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
                  onClick={() => void handleCopyShareLink()}
                  disabled={enableLeagueShare.isPending}
                >
                  Copiar link
                </Button>
              </div>
              <LeagueStatusBadge
                status={league.status}
                className="bg-white/20 text-white shrink-0"
              />
            </div>
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

        {showRecordMatchesBlockedBanner && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm text-blue-800">
              {recordMatchesBlockedMessage}
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
          <TabsList className="no-scrollbar grid w-full grid-cols-5 overflow-x-auto">
            <TabsTrigger value="tabla" className="text-xs">Tabla</TabsTrigger>
            <TabsTrigger value="partidos" className="text-xs">Partidos</TabsTrigger>
            <TabsTrigger value="actividad" className="text-xs">Actividad</TabsTrigger>
            <TabsTrigger value="miembros" className="text-xs">Miembros</TabsTrigger>
            <TabsTrigger value="ajustes" className="text-xs">Ajustes</TabsTrigger>
          </TabsList>

          {/* Tabla tab */}
          <TabsContent value="tabla">
            <div className="space-y-3">
              <LeagueShareCard
                leagueName={league.name}
                standings={standingsRows}
                movement={standingsData?.movement}
                computedAt={standingsData?.computedAt}
              />
              <StandingsTable
                standings={standingsRows}
                movement={standingsData?.movement}
                computedAt={standingsData?.computedAt}
                isLoading={showStandingsLoading}
                currentUserId={user?.userId}
              />
            </div>
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
                  onClick={() => setShowReportMethodSheet(true)}
                  disabled={isReadOnly || isFinished || !canRecordMatches}
                >
                  <Trophy size={18} />
                  Cargar resultado
                </Button>

                {isReadOnly && (
                  <p className="text-center text-xs text-slate-500">
                    Solo administradores pueden cargar partidos.
                  </p>
                )}
                {!isReadOnly && !isFinished && !canRecordMatches && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500">
                      Aún no podés cargar partidos en esta liga.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => setActiveTab('miembros')}
                    >
                      Ir a miembros
                    </Button>
                  </div>
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

          {/* Actividad tab */}
          <TabsContent value="actividad">
            <LeagueActivityFeed
              leagueId={leagueId}
              onLoadResult={isActive ? () => setShowReportMethodSheet(true) : undefined}
            />
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

async function getOrCreateLeagueShareUrl(params: {
  leagueId: string;
  leagueName: string;
  cachedUrl: string | null;
  enable: () => Promise<{ shareToken: string; shareUrlPath: string }>;
  onCache: (url: string) => void;
}): Promise<string> {
  if (params.cachedUrl) return params.cachedUrl;

  const response = await params.enable();
  const resolved = resolveShareUrl(response.shareUrlPath, params.leagueId, response.shareToken);
  params.onCache(resolved);
  return resolved;
}

function resolveShareUrl(shareUrlPath: string, leagueId: string, shareToken: string): string {
  const fallbackPath = `/public/leagues/${leagueId}/share?token=${encodeURIComponent(shareToken)}`;
  const rawPath = normalizeLeagueSharePath(shareUrlPath, leagueId, shareToken) || fallbackPath;
  if (typeof window === 'undefined') return rawPath;
  return new URL(rawPath, window.location.origin).toString();
}

function normalizeLeagueSharePath(
  rawPath: string,
  leagueId: string,
  shareToken: string
): string {
  if (!rawPath) return '';

  try {
    const parsed = new URL(rawPath, 'https://padelpoint.local');
    const token = parsed.searchParams.get('token') || shareToken;
    const isLegacyLeagueShare =
      parsed.pathname === `/leagues/${leagueId}` && parsed.searchParams.get('share') === '1';

    if (isLegacyLeagueShare) {
      return `/public/leagues/${leagueId}/share?token=${encodeURIComponent(token)}`;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return `/public/leagues/${leagueId}/share?token=${encodeURIComponent(shareToken)}`;
  }
}

function LeaguePublicShareView({ leagueId, token }: { leagueId: string; token: string }) {
  const router = useRouter();
  const isTokenMissing = !token || token.trim().length === 0;
  const { data, isLoading, error, refetch } = usePublicLeagueStandings(leagueId, token);

  if (isTokenMissing) {
    return (
      <>
        <PublicTopBar title="Tabla compartida" backHref="/leagues" />
        <div className="px-4 py-12">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
            <p className="text-sm font-medium text-rose-800">Enlace compartido inválido.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/leagues')}>
              Volver
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PublicTopBar title="Tabla compartida" backHref="/leagues" />
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PublicTopBar title="Tabla compartida" backHref="/leagues" />
        <div className="px-4 py-12">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
            <p className="text-sm font-medium text-rose-800">
              No pudimos abrir esta tabla compartida.
            </p>
            <p className="mt-1 text-xs text-rose-700">El enlace puede estar vencido o ser inválido.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicTopBar title="Tabla compartida" backHref="/leagues" />
      <div className="relative px-4 py-6 space-y-4">
        <div className="pointer-events-none absolute right-4 top-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-200">
          PADELPOINT
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">PadelPoint</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{data.leagueName}</h1>
          <p className="mt-1 text-sm text-slate-600">Vista compartida de la tabla de posiciones</p>
        </div>

        <LeagueShareCard
          leagueName={data.leagueName}
          standings={data.rows}
          movement={data.movement}
          computedAt={data.computedAt}
        />

        <StandingsTable
          standings={data.rows}
          movement={data.movement}
          computedAt={data.computedAt}
        />
      </div>
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

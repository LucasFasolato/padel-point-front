'use client';

import { useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  UserPlus,
  Calendar,
  Trophy,
  Info,
  Share2,
  Swords,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
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
  ReportManualModal,
  LeagueChallengesSection,
  LeagueIntentsPanel,
  LeagueMatchCard,
  LeagueMatchModeSheet,
  LeagueMatchCreateModal,
  LeagueMatchResultModal,
  RecentActivityStrip,
} from '@/app/components/leagues';
import { IntentComposerSheet } from '@/app/components/competitive/intent-composer-sheet';
import {
  useLeagueDetail,
  useLeagueStandings,
  useCreateInvites,
  useReportManual,
  useLeagueMatches,
  useUpdateMemberRole,
  useCreateLeagueMatch,
  useCaptureLeagueMatchResult,
  useEnableLeagueShare,
  usePublicLeagueStandings,
  useLeaguePendingConfirmations,
  useDeleteLeague,
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

type LeagueDetailTab = 'resumen' | 'tabla' | 'partidos' | 'miembros';

function normalizeLeagueTab(rawTab: string | null | undefined): LeagueDetailTab {
  const tab = (rawTab ?? '').toLowerCase();

  if (tab === 'resumen' || tab === 'summary') return 'resumen';
  if (tab === 'tabla' || tab === 'standings') return 'tabla';
  if (tab === 'partidos' || tab === 'matches') return 'partidos';
  if (tab === 'miembros' || tab === 'members') return 'miembros';

  return 'resumen';
}

function isForbiddenOrNotFound(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 403 || status === 404;
}

export default function LeagueDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAuthed = Boolean(user?.userId);
  const rawId = getSingleParam(params?.id);
  if (!isUuid(rawId)) {
    return <LeagueNotFoundState />;
  }

  const tabParam = searchParams.get('tab');
  const isShareMode = searchParams.get('share') === '1';
  const shareToken = searchParams.get('token');
  const justCreated = searchParams.get('created') === '1';

  if (isShareMode && !isAuthed) {
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
  const { data: leagueScopedConfirmations } = useLeaguePendingConfirmations(leagueId);
  const { data: allPendingConfirmations } = usePendingConfirmations();
  const { data: league, isLoading, error } = useLeagueDetail(leagueId);
  const { data: standingsData, isLoading: standingsLoading } = useLeagueStandings(leagueId);
  const inviteMutation = useCreateInvites(leagueId);
  const reportManual = useReportManual(leagueId);
  const createLeagueMatch = useCreateLeagueMatch(leagueId);
  const captureMatchResult = useCaptureLeagueMatchResult(leagueId);
  const { data: matches, isLoading: matchesLoading } = useLeagueMatches(leagueId);
  const updateMemberRole = useUpdateMemberRole(leagueId);
  const deleteLeague = useDeleteLeague();

  const [showInvite, setShowInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManualReport, setShowManualReport] = useState(false);
  const [showMatchModeSheet, setShowMatchModeSheet] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [createMatchMode, setCreateMatchMode] = useState<LeagueMatchCreateMode>('played');
  const [showMatchResultModal, setShowMatchResultModal] = useState(false);
  const [selectedScheduledMatch, setSelectedScheduledMatch] = useState<LeagueMatch | null>(null);
  const [showIntentComposer, setShowIntentComposer] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeagueDetailTab>(() =>
    normalizeLeagueTab(initialTabParam)
  );

  // Subscribe to league realtime activity events while on this page
  useLeagueActivitySocket(leagueId);

  useEffect(() => {
    setActiveTab(normalizeLeagueTab(initialTabParam));
  }, [initialTabParam]);

  // Scroll to hash anchor (#matches, #standings) after the active tab is rendered
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const t = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(t);
  }, [activeTab]);

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

  const needsMorePlayers =
    !canRecordMatches &&
    (recordMatchesBlockedMessage.toLowerCase().includes('jugador') ||
      recordMatchesBlockedMessage.toLowerCase().includes('miembro') ||
      recordMatchesBlockedMessage.toLowerCase().includes('invit'));

  const matchList = Array.isArray(matches) ? matches : [];
  const standingsRows = standingsData?.rows ?? league.standings ?? [];
  const showStandingsLoading = standingsLoading && standingsRows.length === 0;

  // Determine user role from members list
  const currentMember = league.members?.find((m) => m.userId === user?.userId);
  const userRole = (currentMember?.role ?? 'member').toLowerCase() as LeagueMemberRole;
  const isOwnerOrAdmin = userRole === 'owner';
  const isReadOnly = userRole === 'member';

  const handleShareStandings = async () => {
    try {
      const raw = await getOrCreateLeagueShareUrl({
        leagueId,
        leagueName: league.name,
        cachedUrl: shareUrl,
        enable: () => enableLeagueShare.mutateAsync(),
        onCache: setShareUrl,
      });
      const absoluteUrl = normalizeShareUrl(raw);

      const shareText = `Sumate a mi liga en PadelPoint: ${absoluteUrl}`;

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: league.name, text: shareText, url: absoluteUrl });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
        }
      }

      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        toast.error('No tenés permisos para compartir esta liga.');
      } else {
        toast.error('No pudimos generar el enlace para compartir.');
      }
    }
  };

  const handleCopyShareLink = async () => {
    try {
      const raw = await getOrCreateLeagueShareUrl({
        leagueId,
        leagueName: league.name,
        cachedUrl: shareUrl,
        enable: () => enableLeagueShare.mutateAsync(),
        onCache: setShareUrl,
      });
      const absoluteUrl = normalizeShareUrl(raw);

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absoluteUrl);
        toast.success('Enlace copiado');
      } else {
        toast.error('No se pudo copiar el enlace.');
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        toast.error('No tenés permisos para compartir esta liga.');
      } else {
        toast.error('No pudimos generar el enlace para compartir.');
      }
    }
  };

  // Pending confirmations scoped to this league.
  const leaguePendingConfirmations =
    leagueScopedConfirmations ??
    (allPendingConfirmations ?? []).filter((m) => m.leagueId === leagueId);

  return (
    <>
      <PublicTopBar title={league.name} backHref="/leagues" />

      <div className="px-4 py-4 space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="no-scrollbar grid w-full grid-cols-4 overflow-x-auto">
            <TabsTrigger value="resumen" className="text-xs">Resumen</TabsTrigger>
            <TabsTrigger value="tabla" className="text-xs">Tabla</TabsTrigger>
            <TabsTrigger value="partidos" className="text-xs">Partidos</TabsTrigger>
            <TabsTrigger value="miembros" className="text-xs">Miembros</TabsTrigger>
          </TabsList>

          {/* ── Resumen tab ─────────────────────────────────────────────────── */}
          <TabsContent value="resumen">
            <div className="space-y-4 pt-1">
              {/* Success banner – shown after league creation */}
              {justCreated && (
                <div className="flex items-start gap-3 rounded-2xl border border-[#0E7C66]/20 bg-[#0E7C66]/5 px-4 py-3">
                  <span className="text-lg">🎉</span>
                  <div>
                    <p className="text-sm font-semibold text-[#065F46]">¡Liga creada!</p>
                    <p className="text-xs text-[#0E7C66]/80">Invitá a tus amigos para empezar a jugar.</p>
                  </div>
                </div>
              )}

              {/* Hero card */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0E7C66] to-[#065F46] p-6 text-white shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {league.avatarUrl ? (
                      <img
                        src={league.avatarUrl}
                        alt={league.name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover ring-2 ring-white/25"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg font-bold ring-2 ring-white/20">
                        {league.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h1 className="text-xl font-bold leading-tight tracking-tight truncate">{league.name}</h1>
                      <p className="text-sm font-medium text-white/70 mt-0.5">
                        {getModeLabel(league.mode)}
                      </p>
                    </div>
                  </div>
                  <LeagueStatusBadge
                    status={league.status}
                    className="bg-white/20 text-white shrink-0 ml-2"
                  />
                </div>

                {/* Season label */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                  {isScheduled && formatDateRange(league.startDate, league.endDate) && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Temporada: {formatDateRange(league.startDate, league.endDate)}
                    </span>
                  )}
                  {isOpen && (
                    <span className="text-xs text-white/50">
                      Se actualiza con cada partido confirmado
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users size={14} />
                    {league.membersCount} jugadores
                  </span>
                </div>

                {/* Share row */}
                <div className="flex gap-2 mt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 min-h-[44px] border-white/25 bg-white/10 px-3 text-white hover:bg-white/20 hover:text-white"
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
                    className="flex-1 min-h-[44px] border-white/25 bg-white/10 px-3 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => void handleCopyShareLink()}
                    disabled={enableLeagueShare.isPending}
                  >
                    Copiar link
                  </Button>
                </div>
              </div>

              {/* canRecordMatches gating — premium banner */}
              {showRecordMatchesBlockedBanner && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-amber-900">
                        Partidos no disponibles aún
                      </p>
                      <p className="mt-0.5 text-sm text-amber-800">
                        {recordMatchesBlockedMessage}
                      </p>
                    </div>
                  </div>
                  {needsMorePlayers && (
                    <Button
                      type="button"
                      fullWidth
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-800 hover:border-amber-400 hover:bg-amber-100"
                      onClick={() => setActiveTab('miembros')}
                    >
                      <UserPlus size={15} />
                      Ir a Miembros e invitar
                    </Button>
                  )}
                </div>
              )}

              {isFinished && (
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-[#F7F8FA] px-4 py-3">
                  <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    Liga finalizada. No se pueden cargar más resultados.
                  </p>
                </div>
              )}

              {/* Quick actions row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Quiero jugar — always visible for active leagues */}
                {isActive && (
                  <button
                    type="button"
                    onClick={() => setShowIntentComposer(true)}
                    className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#0E7C66]/20 bg-[#0E7C66]/5 px-3 py-4 text-center transition-colors active:scale-[0.98]"
                  >
                    <Swords size={22} className="text-[#0E7C66]" />
                    <span className="text-xs font-bold text-[#0E7C66]">Quiero jugar</span>
                  </button>
                )}

                {/* Cargar resultado */}
                {isActive && (
                  <button
                    type="button"
                    onClick={() => setShowManualReport(true)}
                    disabled={!canRecordMatches}
                    className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trophy size={22} className="text-slate-700" />
                    <span className="text-xs font-bold text-slate-800">Cargar resultado</span>
                  </button>
                )}

                {/* Invitar — only for owner/admin */}
                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowInvite(true)}
                    className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm transition-colors active:scale-[0.98]"
                  >
                    <UserPlus size={22} className="text-slate-700" />
                    <span className="text-xs font-bold text-slate-800">Invitar</span>
                  </button>
                )}
              </div>

              {/* Pending confirmations preview — tappable shortcut to Partidos */}
              {leaguePendingConfirmations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('partidos')}
                  className="w-full rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-left transition-colors active:bg-amber-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-amber-700" />
                      <p className="text-sm font-bold text-amber-900">
                        {leaguePendingConfirmations.length}{' '}
                        {leaguePendingConfirmations.length === 1
                          ? 'resultado por confirmar'
                          : 'resultados por confirmar'}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-amber-600" />
                  </div>
                  <p className="mt-1 text-xs text-amber-700">Ir a Partidos para confirmar</p>
                </button>
              )}

              {/* Mini standings preview */}
              {standingsRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('tabla')}
                  className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition-colors active:bg-slate-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Top posiciones
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#0E7C66]">
                      Ver tabla <ChevronRight size={13} />
                    </span>
                  </div>
                  <div className="space-y-2">
                    {standingsRows.slice(0, 3).map((entry) => {
                      const isMe = entry.userId === user?.userId;
                      return (
                        <div key={entry.userId} className="flex items-center gap-3">
                          <span className="w-5 text-center text-sm font-bold text-slate-400">
                            {entry.position}
                          </span>
                          <span
                            className={`flex-1 truncate text-sm font-medium ${isMe ? 'text-[#0E7C66]' : 'text-slate-800'}`}
                          >
                            {entry.displayName || `Jugador ${entry.position}`}
                            {isMe && (
                              <span className="ml-1.5 rounded-full bg-[#0E7C66]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0E7C66]">
                                Vos
                              </span>
                            )}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {entry.points} <span className="text-xs font-normal text-slate-400">pts</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </button>
              )}

              {/* Recent activity strip — last 5 events, hidden when empty */}
              <RecentActivityStrip
                leagueId={leagueId}
                onNavigate={(url) => router.push(url)}
              />
            </div>
          </TabsContent>

          {/* ── Tabla tab ───────────────────────────────────────────────────── */}
          <TabsContent value="tabla">
            <div id="standings" className="space-y-3 pt-1">
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

          {/* ── Partidos tab ─────────────────────────────────────────────────── */}
          <TabsContent value="partidos">
            <div id="matches" className="space-y-4 pt-1">
              {/* Pending confirmations section */}
              {leaguePendingConfirmations.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
                  <p className="mb-3 text-sm font-bold text-amber-900">
                    Por confirmar ({leaguePendingConfirmations.length})
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
                          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white px-3 py-2.5 shadow-sm"
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
                            className="shrink-0 min-h-[44px]"
                          >
                            Ver y confirmar
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Record match CTA */}
              {isActive && (
                <Button
                  fullWidth
                  size="lg"
                  className="gap-2 shadow-sm min-h-[52px]"
                  onClick={() => setShowManualReport(true)}
                  disabled={isReadOnly || !canRecordMatches}
                >
                  <Trophy size={18} />
                  Cargar resultado
                </Button>
              )}

              {isActive && !isReadOnly && !canRecordMatches && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-[#F7F8FA] px-4 py-3">
                  <Info size={15} className="shrink-0 text-slate-400" />
                  <p className="text-sm text-slate-600">{recordMatchesBlockedMessage}</p>
                </div>
              )}

              {/* Matches list */}
              {matchesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : matchList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F7F8FA] px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-900">
                    Todavía no hay partidos
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Cargá un resultado para que aparezca acá.
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

              {/* Desafios section */}
              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Desafios</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Intents de esta liga, con activos primero.
                  </p>
                </div>

                <LeagueIntentsPanel leagueId={leagueId} />

                <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                    Historico (legacy)
                  </summary>
                  <div className="mt-3">
                    <LeagueChallengesSection
                      leagueId={leagueId}
                      members={league.members ?? []}
                      currentUserId={user?.userId}
                    />
                  </div>
                </details>
              </section>
            </div>
          </TabsContent>

          {/* ── Miembros tab ─────────────────────────────────────────────────── */}
          <TabsContent value="miembros">
            <div className="space-y-4 pt-1">
              {league.members && league.members.length > 0 ? (
                <div className="space-y-2">
                  {league.members.map((m) => {
                    const memberRole: LeagueMemberRole = m.role ?? 'member';
                    const canEditRole = isOwnerOrAdmin && m.userId !== user?.userId;

                    return (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt={m.displayName}
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0E7C66]/10 text-sm font-semibold text-[#0E7C66]">
                              {(m.displayName || 'J').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="truncate text-sm font-medium text-slate-900 block">
                              {m.displayName || 'Jugador'}
                            </span>
                            {m.userId === user?.userId && (
                              <span className="text-[11px] text-[#0E7C66] font-semibold">Vos</span>
                            )}
                          </div>
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
                            className="min-h-[44px] w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-[#0E7C66] focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/15"
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
                className="gap-2 min-h-[52px]"
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
                <p className="text-center text-xs text-slate-500">
                  Solo administradores pueden invitar o editar roles.
                </p>
              )}

              {/* Danger zone — only for upcoming leagues where user is owner and is the only member */}
              {isUpcoming && !isReadOnly && league.membersCount <= 1 && (
                <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 p-5">
                  <p className="mb-1 text-sm font-bold text-rose-900">Zona de peligro</p>
                  <p className="mb-3 text-xs text-rose-700">
                    Esta liga todavía no empezó y sos el único miembro. Podés eliminarla si querés.
                  </p>
                  {showDeleteConfirm ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-rose-900">
                        ¿Seguro que querés eliminar &quot;{league.name}&quot;? Esta acción no se puede deshacer.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleteLeague.isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-0"
                          loading={deleteLeague.isPending}
                          onClick={() => {
                            deleteLeague.mutate(leagueId, {
                              onSuccess: () => router.push('/leagues'),
                            });
                          }}
                        >
                          Eliminar liga
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-rose-300 text-rose-700 hover:border-rose-400 hover:bg-rose-100"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Eliminar liga
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Sheets & Modals ────────────────────────────────────────────────── */}

      <IntentComposerSheet
        isOpen={showIntentComposer}
        onClose={() => setShowIntentComposer(false)}
        leagueId={leagueId}
        leagueName={league.name}
      />

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

      <ReportManualModal
        isOpen={showManualReport}
        onClose={() => setShowManualReport(false)}
        onSubmit={(payload) => reportManual.mutateAsync(payload)}
        isPending={reportManual.isPending}
        members={league.members ?? []}
        currentUserId={user?.userId}
        onViewMatch={(matchId) => {
          setShowManualReport(false);
          router.push(`/matches/${matchId}`);
        }}
      />
    </>
  );
}

/**
 * Guarantees a share URL is absolute (https://…).
 */
export function normalizeShareUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === 'undefined') return url;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

async function getOrCreateLeagueShareUrl(params: {
  leagueId: string;
  leagueName: string;
  cachedUrl: string | null;
  enable: () => Promise<{ shareToken: string; shareUrlPath: string }>;
  onCache: (url: string) => void;
}): Promise<string> {
  if (params.cachedUrl) return params.cachedUrl;

  try {
    const { leagueService } = await import('@/services/league-service');
    const shareState = await leagueService.getLeagueShare(params.leagueId);
    if (shareState.enabled && shareState.shareToken && shareState.shareUrlPath) {
      const resolved = resolveShareUrl(shareState.shareUrlPath, params.leagueId, shareState.shareToken);
      params.onCache(resolved);
      return resolved;
    }
  } catch {
    // GET not supported or failed; fall through to enable
  }

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
    <div className="px-4 py-6 space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
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

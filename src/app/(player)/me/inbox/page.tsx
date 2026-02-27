'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  Bell,
  CheckCircle2,
  Swords,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Button } from '@/app/components/ui/button';
import { useInbox } from '@/hooks/use-inbox';
import { useChallengeActions } from '@/hooks/use-challenges';
import {
  useAcceptNotificationInvite,
  useDeclineNotificationInvite,
  useMarkRead,
} from '@/hooks/use-notifications';
import { NOTIFICATION_TYPES } from '@/types/notifications';
import { cn } from '@/lib/utils';
import type { InboxSectionState } from '@/hooks/use-inbox';
import type { MatchResult, Challenge } from '@/types/competitive';
import type { AppNotification } from '@/types/notifications';

// ── Tab definition ────────────────────────────────────────────────────────────

type TabId = 'partidos' | 'desafios' | 'invitaciones' | 'alertas';

const TABS: { id: TabId; label: string }[] = [
  { id: 'partidos', label: 'Partidos' },
  { id: 'desafios', label: 'Desafíos' },
  { id: 'invitaciones', label: 'Ligas' },
  { id: 'alertas', label: 'Alertas' },
];

// ── Alert icon config ─────────────────────────────────────────────────────────

function getAlertConfig(type: string): {
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
} {
  switch (type) {
    case NOTIFICATION_TYPES.ELO_UPDATED:
      return { Icon: Zap, iconBg: 'bg-emerald-50', iconColor: 'text-[#0E7C66]' };
    case NOTIFICATION_TYPES.LEAGUE_RANKING_MOVED:
      return { Icon: BarChart2, iconBg: 'bg-emerald-50', iconColor: 'text-[#0E7C66]' };
    case NOTIFICATION_TYPES.MATCH_CONFIRMED:
      return { Icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-[#0E7C66]' };
    case NOTIFICATION_TYPES.CHALLENGE_ACCEPTED:
      return { Icon: Trophy, iconBg: 'bg-emerald-50', iconColor: 'text-[#0E7C66]' };
    case NOTIFICATION_TYPES.MATCH_DISPUTED:
    case NOTIFICATION_TYPES.MATCH_RESOLVED:
      return { Icon: XCircle, iconBg: 'bg-rose-50', iconColor: 'text-rose-500' };
    case NOTIFICATION_TYPES.CHALLENGE_REJECTED:
      return { Icon: XCircle, iconBg: 'bg-slate-50', iconColor: 'text-slate-400' };
    default:
      return { Icon: Bell, iconBg: 'bg-slate-50', iconColor: 'text-slate-400' };
  }
}

// ── Shared: score string ──────────────────────────────────────────────────────

function buildScore(match: MatchResult): string {
  const s1a = match.teamASet1 ?? '—';
  const s1b = match.teamBSet1 ?? '—';
  const s2a = match.teamASet2 ?? '—';
  const s2b = match.teamBSet2 ?? '—';
  return [
    `${s1a}-${s1b}`,
    `${s2a}-${s2b}`,
    match.teamASet3 != null ? `${match.teamASet3}-${match.teamBSet3 ?? '—'}` : null,
  ]
    .filter(Boolean)
    .join(', ');
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-white px-4 py-4"
        >
          <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#F7F8FA] p-5 text-center">
      <p className="text-sm font-semibold text-slate-800">No pudimos cargar esta sección</p>
      <p className="mt-0.5 text-xs text-slate-500">Reintentá en unos segundos.</p>
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

function SectionEmptyState({
  Icon,
  title,
  subtitle,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F7F8FA] py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 px-6 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

/** Base row: icon chip + text block + optional CTA slot */
function InboxItemRow({
  iconBg,
  iconColor,
  Icon,
  title,
  subtitle,
  timeAgo,
  unread = false,
  children,
}: {
  iconBg: string;
  iconColor: string;
  Icon: LucideIcon;
  title: string;
  subtitle?: string | null;
  timeAgo: string;
  unread?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      {/* Icon chip */}
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          iconBg,
        )}
        aria-hidden
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-slate-900">
            {unread && (
              <span
                className="mr-1.5 inline-block h-2 w-2 translate-y-[-1px] rounded-full bg-[#0E7C66]"
                aria-label="No leída"
              />
            )}
            {title}
          </p>
          <time className="mt-px shrink-0 text-[10px] font-medium text-slate-400">
            {timeAgo}
          </time>
        </div>

        {subtitle && (
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>
        )}

        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

// ── Tab: Partidos (pending confirmations) ──────────────────────────────────────

function ConfirmationsTab({
  section,
  onConfirm,
}: {
  section: InboxSectionState<MatchResult>;
  onConfirm: (match: MatchResult) => void;
}) {
  if (section.isLoading) return <SectionSkeleton />;
  if (section.isError) return <SectionErrorCard onRetry={section.refetch} />;
  if (section.items.length === 0) {
    return (
      <SectionEmptyState
        Icon={CheckCircle2}
        title="Todo al día"
        subtitle="No tenés resultados pendientes de confirmar."
      />
    );
  }

  return (
    <div className="space-y-3">
      {section.items.map((match) => {
        const reporterName =
          match.challenge?.teamA?.p1?.displayName ??
          match.teamA?.[0]?.displayName ??
          'Rival';
        const score = buildScore(match);
        const timeAgo = formatDistanceToNow(new Date(match.createdAt), {
          addSuffix: true,
          locale: es,
        });

        return (
          <InboxItemRow
            key={match.id}
            Icon={CheckCircle2}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            title={`${reporterName} reportó un resultado`}
            subtitle={score || undefined}
            timeAgo={timeAgo}
          >
            <button
              type="button"
              onClick={() => onConfirm(match)}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#0E7C66] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B6B58] active:scale-[0.98]"
            >
              Confirmar resultado
            </button>
          </InboxItemRow>
        );
      })}
    </div>
  );
}

// ── Tab: Desafíos (challenge inbox) ───────────────────────────────────────────

function ChallengesTab({
  section,
  actingId,
  onAccept,
  onReject,
}: {
  section: InboxSectionState<Challenge>;
  actingId: string | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (section.isLoading) return <SectionSkeleton />;
  if (section.isError) return <SectionErrorCard onRetry={section.refetch} />;
  if (section.items.length === 0) {
    return (
      <SectionEmptyState
        Icon={Swords}
        title="Sin desafíos pendientes"
        subtitle="Desafiá a alguien desde Buscar partido para empezar."
      />
    );
  }

  return (
    <div className="space-y-3">
      {section.items.map((challenge) => {
        const challengerName =
          challenge.teamA?.p1?.displayName ?? 'Un jugador';
        const isActing = actingId === challenge.id;
        const timeAgo = formatDistanceToNow(new Date(challenge.createdAt), {
          addSuffix: true,
          locale: es,
        });

        return (
          <InboxItemRow
            key={challenge.id}
            Icon={Swords}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            title={challengerName}
            subtitle="Te desafió a un partido"
            timeAgo={timeAgo}
          >
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isActing}
                onClick={() => onReject(challenge.id)}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                disabled={isActing}
                onClick={() => onAccept(challenge.id)}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#0E7C66] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#0B6B58] disabled:opacity-50 active:scale-[0.98]"
              >
                {isActing ? 'Procesando…' : 'Aceptar'}
              </button>
            </div>
          </InboxItemRow>
        );
      })}
    </div>
  );
}

// ── Tab: Invitaciones (league invites) ────────────────────────────────────────

function InvitesTab({
  section,
  actedIds,
  onAccept,
  onDecline,
}: {
  section: InboxSectionState<AppNotification>;
  actedIds: Set<string>;
  onAccept: (notif: AppNotification) => void;
  onDecline: (notif: AppNotification) => void;
}) {
  if (section.isLoading) return <SectionSkeleton />;
  if (section.isError) return <SectionErrorCard onRetry={section.refetch} />;
  if (section.items.length === 0) {
    return (
      <SectionEmptyState
        Icon={Trophy}
        title="Sin invitaciones"
        subtitle="Cuando alguien te invite a una liga aparecerá aquí."
      />
    );
  }

  return (
    <div className="space-y-3">
      {section.items.map((notif) => {
        const hasActed = actedIds.has(notif.id);
        const inviteStatus = notif.actionMeta?.inviteStatus ?? notif.data?.inviteStatus;
        const isResolved = hasActed || (inviteStatus && inviteStatus !== 'pending');
        const leagueName = notif.actionMeta?.leagueName ?? notif.data?.leagueName as string | undefined;
        const inviterName = notif.actionMeta?.inviterName ?? notif.data?.inviterName as string | undefined;

        const subtitle = leagueName
          ? `Liga: ${leagueName}${inviterName ? ` · Invitado por ${inviterName}` : ''}`
          : notif.message || null;

        const timeAgo = formatDistanceToNow(new Date(notif.createdAt), {
          addSuffix: true,
          locale: es,
        });

        return (
          <InboxItemRow
            key={notif.id}
            Icon={Trophy}
            iconBg="bg-emerald-50"
            iconColor="text-[#0E7C66]"
            title={notif.title || 'Invitación a liga'}
            subtitle={subtitle}
            timeAgo={timeAgo}
            unread={!notif.read}
          >
            {isResolved ? (
              <p className="text-xs font-medium text-slate-400">Respondida</p>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onDecline(notif)}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => onAccept(notif)}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#0E7C66] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#0B6B58] active:scale-[0.98]"
                >
                  Aceptar
                </button>
              </div>
            )}
          </InboxItemRow>
        );
      })}
    </div>
  );
}

// ── Tab: Alertas (ELO, ranking, system notifications) ─────────────────────────

function AlertsTab({
  section,
  onClickAlert,
}: {
  section: InboxSectionState<AppNotification>;
  onClickAlert: (notif: AppNotification) => void;
}) {
  if (section.isLoading) return <SectionSkeleton />;
  if (section.isError) return <SectionErrorCard onRetry={section.refetch} />;
  if (section.items.length === 0) {
    return (
      <SectionEmptyState
        Icon={Bell}
        title="No tenés notificaciones todavía"
        subtitle="Los movimientos de ELO y ranking aparecerán aquí."
      />
    );
  }

  return (
    <div className="space-y-3">
      {section.items.map((notif) => {
        const { Icon, iconBg, iconColor } = getAlertConfig(notif.type);
        const timeAgo = formatDistanceToNow(new Date(notif.createdAt), {
          addSuffix: true,
          locale: es,
        });

        return (
          <InboxItemRow
            key={notif.id}
            Icon={Icon}
            iconBg={iconBg}
            iconColor={iconColor}
            title={notif.title || 'Notificación'}
            subtitle={notif.message || null}
            timeAgo={timeAgo}
            unread={!notif.read}
          >
            {notif.link && (
              <button
                type="button"
                onClick={() => onClickAlert(notif)}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[#0E7C66]/25 bg-[#0E7C66]/5 px-3 py-1.5 text-xs font-semibold text-[#0E7C66] transition-colors hover:bg-[#0E7C66]/10 active:bg-[#0E7C66]/15"
              >
                Ver →
              </button>
            )}
          </InboxItemRow>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('partidos');
  const [actingChallengeId, setActingChallengeId] = useState<string | null>(null);
  const [actedNotifIds, setActedNotifIds] = useState<Set<string>>(new Set());

  const inbox = useInbox();
  const { acceptDirect, rejectDirect } = useChallengeActions();
  const acceptInvite = useAcceptNotificationInvite();
  const declineInvite = useDeclineNotificationInvite();
  const markRead = useMarkRead();

  const tabCounts: Record<TabId, number> = {
    partidos: inbox.confirmations.items.length,
    desafios: inbox.challenges.items.length,
    invitaciones: inbox.invites.items.length,
    alertas: inbox.alerts.items.filter((n) => !n.read).length,
  };

  const handleAcceptChallenge = async (id: string) => {
    setActingChallengeId(id);
    try {
      await acceptDirect.mutateAsync(id);
    } finally {
      setActingChallengeId(null);
    }
  };

  const handleRejectChallenge = async (id: string) => {
    setActingChallengeId(id);
    try {
      await rejectDirect.mutateAsync(id);
    } finally {
      setActingChallengeId(null);
    }
  };

  const handleAcceptInvite = async (notif: AppNotification) => {
    const inviteId = notif.actionMeta?.inviteId ?? notif.data?.inviteId;
    if (!inviteId) return;
    setActedNotifIds((prev) => new Set(prev).add(notif.id));
    try {
      await acceptInvite.mutateAsync({ notificationId: notif.id, inviteId });
      router.push('/leagues');
    } catch {
      setActedNotifIds((prev) => {
        const next = new Set(prev);
        next.delete(notif.id);
        return next;
      });
    }
  };

  const handleDeclineInvite = async (notif: AppNotification) => {
    const inviteId = notif.actionMeta?.inviteId ?? notif.data?.inviteId;
    if (!inviteId) return;
    setActedNotifIds((prev) => new Set(prev).add(notif.id));
    try {
      await declineInvite.mutateAsync({ notificationId: notif.id, inviteId });
    } catch {
      setActedNotifIds((prev) => {
        const next = new Set(prev);
        next.delete(notif.id);
        return next;
      });
    }
  };

  const handleAlertClick = (notif: AppNotification) => {
    if (!notif.read) markRead.mutate(notif.id);
    if (notif.link) router.push(notif.link);
  };

  return (
    <>
      <PublicTopBar title="Bandeja" backHref="/competitive" />

      {/* Tab bar — sticky below the TopBar (top-14 = 3.5rem) */}
      <div className="sticky top-14 z-30 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-md">
          {TABS.map((tab) => {
            const count = tabCounts[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2 text-[13px] font-semibold transition-colors',
                  isActive ? 'text-[#0E7C66]' : 'text-slate-400 hover:text-slate-600',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                      isActive
                        ? 'bg-[#0E7C66] text-white'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#0E7C66]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-md px-4 py-4">
        {activeTab === 'partidos' && (
          <ConfirmationsTab
            section={inbox.confirmations}
            onConfirm={(match) => router.push(`/matches/${match.id}`)}
          />
        )}
        {activeTab === 'desafios' && (
          <ChallengesTab
            section={inbox.challenges}
            actingId={actingChallengeId}
            onAccept={handleAcceptChallenge}
            onReject={handleRejectChallenge}
          />
        )}
        {activeTab === 'invitaciones' && (
          <InvitesTab
            section={inbox.invites}
            actedIds={actedNotifIds}
            onAccept={handleAcceptInvite}
            onDecline={handleDeclineInvite}
          />
        )}
        {activeTab === 'alertas' && (
          <AlertsTab
            section={inbox.alerts}
            onClickAlert={handleAlertClick}
          />
        )}
      </div>
    </>
  );
}

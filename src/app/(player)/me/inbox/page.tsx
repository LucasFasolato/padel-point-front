'use client';

import { useRef, useState } from 'react';
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
import { useInbox } from '@/hooks/use-inbox';
import { useChallengeActions } from '@/hooks/use-challenges';
import {
  useAcceptNotificationInvite,
  useDeclineNotificationInvite,
  useMarkAllRead,
  useMarkRead,
} from '@/hooks/use-notifications';
import { NOTIFICATION_TYPES } from '@/types/notifications';
import { cn } from '@/lib/utils';
import type { InboxSectionState } from '@/hooks/use-inbox';
import type { UserIntent } from '@/types/competitive';
import type { AppNotification } from '@/types/notifications';

type TabId = 'desafios' | 'invitaciones' | 'alertas';

const TABS: { id: TabId; label: string }[] = [
  { id: 'desafios', label: 'Desafíos' },
  { id: 'invitaciones', label: 'Ligas' },
  { id: 'alertas', label: 'Alertas' },
];

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
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          iconBg
        )}
        aria-hidden
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug text-slate-900',
              unread ? 'font-bold' : 'font-semibold'
            )}
          >
            {unread && (
              <span
                className="mr-1.5 inline-block h-2 w-2 translate-y-[-1px] shrink-0 rounded-full bg-[#0E7C66]"
                aria-label="No leída"
              />
            )}
            {title}
          </p>
          <time className="mt-px shrink-0 text-[10px] font-medium text-slate-400">{timeAgo}</time>
        </div>

        {subtitle && <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>}

        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

function isRenderableIntent(intent: UserIntent): boolean {
  switch (intent.intentType) {
    case 'CONFIRM_RESULT':
      return intent.status === 'pending_confirm';
    case 'ACCEPT_CHALLENGE':
      return intent.status === 'pending' && !!intent.challengeId;
    default:
      return false;
  }
}

function IntentsTab({
  section,
  actingId,
  onConfirm,
  onAccept,
  onReject,
}: {
  section: InboxSectionState<UserIntent>;
  actingId: string | null;
  onConfirm: (matchId: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (section.isLoading) return <SectionSkeleton />;
  if (section.isError) return <SectionErrorCard onRetry={section.refetch} />;

  const renderable = section.items.filter(isRenderableIntent);
  if (renderable.length === 0) {
    return (
      <SectionEmptyState
        Icon={Swords}
        title="Sin desafíos pendientes"
        subtitle="Cuando tengas acciones pendientes de partidos aparecerán aquí."
      />
    );
  }

  return (
    <div className="space-y-3">
      {renderable.map((intent) => {
        const timeAgo = formatDistanceToNow(new Date(intent.createdAt), {
          addSuffix: true,
          locale: es,
        });

        if (intent.intentType === 'CONFIRM_RESULT') {
          return (
            <InboxItemRow
              key={intent.id}
              Icon={CheckCircle2}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              title={`${intent.actorName} reportó un resultado`}
              subtitle={intent.subtitle || undefined}
              timeAgo={timeAgo}
            >
              <button
                type="button"
                disabled={!intent.matchId}
                onClick={() => {
                  if (intent.matchId) onConfirm(intent.matchId);
                }}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#0E7C66] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B6B58] active:scale-[0.98] disabled:opacity-50"
              >
                Confirmar resultado
              </button>
            </InboxItemRow>
          );
        }

        if (!intent.challengeId) return null;

        const isActing = actingId === intent.challengeId;
        return (
          <InboxItemRow
            key={intent.id}
            Icon={Swords}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            title={intent.actorName}
            subtitle={intent.subtitle ?? 'Te desafió a un partido'}
            timeAgo={timeAgo}
          >
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isActing}
                onClick={() => onReject(intent.challengeId!)}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                disabled={isActing}
                onClick={() => onAccept(intent.challengeId!)}
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
        const leagueName =
          (notif.actionMeta?.leagueName as string | undefined) ??
          (notif.data?.leagueName as string | undefined);
        const inviterName =
          (notif.actionMeta?.inviterName as string | undefined) ??
          (notif.data?.inviterName as string | undefined);

        const subtitle = leagueName
          ? `Liga: ${leagueName}${inviterName ? ` - Invitado por ${inviterName}` : ''}`
          : (notif.message ?? null);

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

function AlertsTab({
  section,
  onClickAlert,
  onMarkAllRead,
  isMarkingAllRead,
}: {
  section: InboxSectionState<AppNotification>;
  onClickAlert: (notif: AppNotification) => void;
  onMarkAllRead: () => void;
  isMarkingAllRead: boolean;
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

  const hasUnread = section.items.some((n) => !n.read);

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={isMarkingAllRead}
            className="min-h-[44px] px-3 py-1.5 text-xs font-semibold text-[#0E7C66] transition-colors hover:text-[#0B6B58] disabled:opacity-50"
          >
            {isMarkingAllRead ? 'Marcando…' : 'Marcar todo como leído'}
          </button>
        </div>
      )}
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
                Ver {'>'}
              </button>
            )}
          </InboxItemRow>
        );
      })}
    </div>
  );
}

export default function InboxPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('desafios');
  const [actingChallengeId, setActingChallengeId] = useState<string | null>(null);
  const [actedNotifIds, setActedNotifIds] = useState<Set<string>>(new Set());
  const lastMarkAllReadAtRef = useRef(0);

  const inbox = useInbox();
  const { acceptDirect, rejectDirect } = useChallengeActions();
  const acceptInvite = useAcceptNotificationInvite();
  const declineInvite = useDeclineNotificationInvite();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const tabCounts: Record<TabId, number> = {
    desafios: inbox.intents.items.filter(isRenderableIntent).length,
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

  const handleMarkAllRead = () => {
    const now = Date.now();
    if (now - lastMarkAllReadAtRef.current < 500) return;
    lastMarkAllReadAtRef.current = now;
    markAllRead.mutate();
  };

  return (
    <>
      <PublicTopBar title="Bandeja" backHref="/competitive" />

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
                  isActive ? 'text-[#0E7C66]' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                      isActive ? 'bg-[#0E7C66] text-white' : 'bg-slate-100 text-slate-600'
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

      <div className="mx-auto max-w-md px-4 py-4">
        {activeTab === 'desafios' && (
          <IntentsTab
            section={inbox.intents}
            actingId={actingChallengeId}
            onConfirm={(matchId) => router.push(`/matches/${matchId}`)}
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
            onMarkAllRead={handleMarkAllRead}
            isMarkingAllRead={markAllRead.isPending}
          />
        )}
      </div>
    </>
  );
}

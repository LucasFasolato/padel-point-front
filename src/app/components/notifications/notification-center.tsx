'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useAcceptNotificationInvite,
  useDeclineNotificationInvite,
} from '@/hooks/use-notifications';
import { useNotificationSocketStatus } from '@/hooks/use-notification-socket';
import { groupByRecency, TIME_GROUP_LABELS } from '@/lib/notification-utils';
import { isUuid } from '@/lib/id-utils';
import { NotificationItem } from './notification-item';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import type { AppNotification } from '@/types/notifications';

function resolveInviteId(notification: AppNotification): string | null {
  const inviteId =
    notification.actionMeta?.inviteId ??
    notification.data?.inviteId ??
    notification.data?.inviteToken;
  return typeof inviteId === 'string' && inviteId.length > 0 ? inviteId : null;
}

function resolveLeagueId(notification: AppNotification): string | null {
  const leagueId = notification.actionMeta?.leagueId ?? notification.data?.leagueId;
  return typeof leagueId === 'string' && leagueId.length > 0 ? leagueId : null;
}

export function NotificationCenter() {
  const router = useRouter();
  const { data: notifications, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const wsConnected = useNotificationSocketStatus();
  const acceptInvite = useAcceptNotificationInvite();
  const declineInvite = useDeclineNotificationInvite();

  /** Track which notification is currently being acted on */
  const [actingNotificationId, setActingNotificationId] = useState<string | null>(null);
  const [actingAction, setActingAction] = useState<'accept' | 'decline' | null>(null);

  /** IDs of notifications already acted on — hides buttons even before cache refresh */
  const [actedIds, setActedIds] = useState<Set<string>>(() => new Set());

  const markActed = useCallback((notificationId: string) => {
    setActedIds((prev) => {
      if (prev.has(notificationId)) return prev;
      const next = new Set(prev);
      next.add(notificationId);
      return next;
    });
  }, []);

  const handleItemClick = useCallback(
    (notification: AppNotification) => {
      if (!notification.read) {
        markRead.mutate(notification.id);
      }
      if (notification.link) {
        router.push(notification.link);
      }
    },
    [markRead, router]
  );

  const handleAccept = useCallback(
    (notification: AppNotification) => {
      const inviteId = resolveInviteId(notification);
      if (!inviteId) return;

      setActingNotificationId(notification.id);
      setActingAction('accept');

      acceptInvite.mutate(
        { notificationId: notification.id, inviteId },
        {
          onSuccess: () => {
            markActed(notification.id);
            const leagueId = resolveLeagueId(notification);
            if (isUuid(leagueId)) {
              router.push(`/leagues/${leagueId}`);
            }
          },
          onSettled: () => {
            setActingNotificationId(null);
            setActingAction(null);
          },
        }
      );
    },
    [acceptInvite, markActed, router]
  );

  const handleDecline = useCallback(
    (notification: AppNotification) => {
      const inviteId = resolveInviteId(notification);
      if (!inviteId) return;

      setActingNotificationId(notification.id);
      setActingAction('decline');

      declineInvite.mutate(
        { notificationId: notification.id, inviteId },
        {
          onSuccess: () => {
            markActed(notification.id);
          },
          onSettled: () => {
            setActingNotificationId(null);
            setActingAction(null);
          },
        }
      );
    },
    [declineInvite, markActed]
  );

  // Defensive: ensure we always work with an array even if data is malformed
  const items = Array.isArray(notifications) ? notifications : [];
  const hasUnread = items.some((n) => !n.read);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-3 px-4 py-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <span className="text-2xl">!</span>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          No pudimos cargar tus notificaciones
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  // Empty
  if (items.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <span className="text-2xl">🔔</span>
        </div>
        <p className="font-semibold text-slate-900 text-sm">
          Sin notificaciones
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Cuando recibas desafíos o resultados, aparecen acá.
        </p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/leagues')}
          >
            Invitá amigos a una liga
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/competitive')}
          >
            Jugá un partido competitivo
          </Button>
        </div>
      </div>
    );
  }

  const groups = groupByRecency(items);

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* WS disconnected indicator */}
        {!wsConnected && (
          <span className="text-[11px] text-slate-400">
            Actualizando por consulta
          </span>
        )}
        <span />

        {/* Mark all read */}
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
          >
            Marcar todo como leído
          </button>
        )}
      </div>

      {/* Grouped list */}
      <div className="space-y-4 px-2 pb-6">
        {groups.map(({ group, items }) => (
          <div key={group}>
            <p className="px-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {TIME_GROUP_LABELS[group]}
            </p>
            <div className="space-y-1">
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleItemClick}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isActing={actingNotificationId === n.id}
                  actingAction={actingNotificationId === n.id ? actingAction : null}
                  acted={actedIds.has(n.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

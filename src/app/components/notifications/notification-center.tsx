'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications';
import { useNotificationSocketStatus } from '@/hooks/use-notification-socket';
import { groupByRecency, TIME_GROUP_LABELS } from '@/lib/notification-utils';
import { NotificationItem } from './notification-item';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import type { AppNotification } from '@/types/notifications';

export function NotificationCenter() {
  const router = useRouter();
  const { data: notifications, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const wsConnected = useNotificationSocketStatus();

  const handleItemClick = (notification: AppNotification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Defensive: ensure we always work with an array even if data is malformed
  const items = Array.isArray(notifications) ? notifications : [];
  const hasUnread = items.some((n) => !n.read);

  // Dev-only debug log
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isLoading && !isError) {
      // eslint-disable-next-line no-console
      console.log(
        `[notifications] loaded ${items.length} items` +
          (items.length > 0 ? `, first type: ${items[0].type}` : '')
      );
    }
  }, [items, isLoading, isError]);

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
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

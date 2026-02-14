'use client';

import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/notification-utils';
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
  normalizeNotificationType,
} from '@/types/notifications';
import { Button } from '@/app/components/ui/button';
import type { AppNotification } from '@/types/notifications';

interface NotificationItemProps {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void;
  /** Called when the user accepts a league invite */
  onAccept?: (notification: AppNotification) => void;
  /** Called when the user declines a league invite */
  onDecline?: (notification: AppNotification) => void;
  /** Whether an accept/decline action is in-flight */
  isActing?: boolean;
  /** Which action is currently loading: 'accept' | 'decline' */
  actingAction?: 'accept' | 'decline' | null;
  /** Whether this notification has already been acted on (hides buttons) */
  acted?: boolean;
}

function hasInviteAction(notification: AppNotification, acted: boolean): boolean {
  const type = normalizeNotificationType(notification.type);

  return (
    type === NOTIFICATION_TYPES.LEAGUE_INVITE_RECEIVED &&
    !!notification.actionMeta?.inviteId &&
    !notification.read &&
    !acted
  );
}

export function NotificationItem({
  notification,
  onClick,
  onAccept,
  onDecline,
  isActing = false,
  actingAction = null,
  acted = false,
}: NotificationItemProps) {
  const normalizedType = normalizeNotificationType(notification.type);
  const typeLabel = normalizedType ? NOTIFICATION_TYPE_LABELS[normalizedType] : 'Notificación';
  const showActions = hasInviteAction(notification, acted) && onAccept && onDecline;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(notification)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(notification);
        }
      }}
      className={cn(
        'flex w-full gap-3 rounded-xl px-4 py-3 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
        'min-h-[56px]',
        notification.read
          ? 'bg-white hover:bg-slate-50'
          : 'bg-emerald-50/50 hover:bg-emerald-50'
      )}
    >
      {/* Unread dot */}
      <div className="flex shrink-0 pt-1.5">
        <span
          className={cn(
            'block h-2 w-2 rounded-full',
            notification.read ? 'bg-transparent' : 'bg-emerald-500'
          )}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {typeLabel}
          </p>
          <span className="shrink-0 text-[11px] text-slate-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p
          className={cn(
            'mt-0.5 text-sm leading-snug',
            notification.read ? 'text-slate-600' : 'font-semibold text-slate-900'
          )}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
            {notification.message}
          </p>
        )}

        {/* Action buttons for league invites */}
        {showActions && (
          <div
            className="mt-2 flex gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              loading={isActing && actingAction === 'decline'}
              disabled={isActing}
              onClick={(e) => {
                e.stopPropagation();
                onDecline(notification);
              }}
            >
              Rechazar
            </Button>
            <Button
              size="sm"
              loading={isActing && actingAction === 'accept'}
              disabled={isActing}
              onClick={(e) => {
                e.stopPropagation();
                onAccept(notification);
              }}
            >
              Aceptar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

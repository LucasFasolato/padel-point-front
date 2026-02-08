'use client';

import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/notification-utils';
import { NOTIFICATION_TYPE_LABELS } from '@/types/notifications';
import type { AppNotification } from '@/types/notifications';

interface NotificationItemProps {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type] ?? 'Notificación';

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
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
      </div>
    </button>
  );
}

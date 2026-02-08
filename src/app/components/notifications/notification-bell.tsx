'use client';

import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ count, onClick, className }: NotificationBellProps) {
  const displayCount = count > 99 ? '99+' : count;
  const hasUnread = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hasUnread ? `${count} notificaciones sin leer` : 'Notificaciones'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl p-2 transition-colors',
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        'min-h-[44px] min-w-[44px]',
        className
      )}
    >
      <Bell size={20} />
      {hasUnread && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
          aria-hidden="true"
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}

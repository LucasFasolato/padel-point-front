import type { AppNotification } from '@/types/notifications';

export type TimeGroup = 'today' | 'this_week' | 'older';

export const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  today: 'Hoy',
  this_week: 'Esta semana',
  older: 'Anteriores',
};

/** Groups notifications by recency */
export function groupByRecency(
  notifications: AppNotification[]
): { group: TimeGroup; items: AppNotification[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

  const groups: Record<TimeGroup, AppNotification[]> = {
    today: [],
    this_week: [],
    older: [],
  };

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= todayStart) {
      groups.today.push(n);
    } else if (d >= weekStart) {
      groups.this_week.push(n);
    } else {
      groups.older.push(n);
    }
  }

  return (['today', 'this_week', 'older'] as TimeGroup[])
    .filter((g) => groups[g].length > 0)
    .map((g) => ({ group: g, items: groups[g] }));
}

/** Formats a notification timestamp as relative text */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  });
}

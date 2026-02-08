import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { League, LeagueStatus } from '@/types/leagues';

export const STATUS_LABELS: Record<LeagueStatus, string> = {
  active: 'Activa',
  upcoming: 'Próxima',
  finished: 'Finalizada',
};

export const STATUS_COLORS: Record<LeagueStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  upcoming: { bg: 'bg-blue-100', text: 'text-blue-800' },
  finished: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

/** Sort order for league status groups. */
const STATUS_ORDER: LeagueStatus[] = ['active', 'upcoming', 'finished'];

export interface LeagueGroup {
  status: LeagueStatus;
  label: string;
  items: League[];
}

/** Group leagues by status in display order: active → upcoming → finished. */
export function groupLeaguesByStatus(leagues: League[]): LeagueGroup[] {
  const map = new Map<LeagueStatus, League[]>();

  for (const league of leagues) {
    const list = map.get(league.status) ?? [];
    list.push(league);
    map.set(league.status, list);
  }

  return STATUS_ORDER.filter((s) => map.has(s)).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    items: map.get(status)!,
  }));
}

/** Format a date range for display, e.g. "15 ene – 28 feb 2026". */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameYear = start.getFullYear() === end.getFullYear();

  const startFmt = format(start, sameYear ? "d MMM" : "d MMM yyyy", { locale: es });
  const endFmt = format(end, "d MMM yyyy", { locale: es });

  return `${startFmt} – ${endFmt}`;
}

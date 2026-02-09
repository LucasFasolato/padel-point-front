import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { League, LeagueStatus, LeagueMode, LeagueMatchStatus } from '@/types/leagues';

const FALLBACK_LABEL = 'Desconocido';
const FALLBACK_COLORS = { bg: 'bg-slate-100', text: 'text-slate-600' };

const LABELS: Record<LeagueStatus, string> = {
  active: 'Activa',
  upcoming: 'Próxima',
  finished: 'Finalizada',
};

const COLORS: Record<LeagueStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  upcoming: { bg: 'bg-blue-100', text: 'text-blue-800' },
  finished: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

/** Maps backend status values (e.g. "draft") to our LeagueStatus union. */
const STATUS_ALIASES: Record<string, LeagueStatus> = {
  draft: 'upcoming',
};

/** Normalise any raw status string into a known LeagueStatus. */
export function normalizeLeagueStatus(raw: string): LeagueStatus {
  if (raw in LABELS) return raw as LeagueStatus;
  return STATUS_ALIASES[raw] ?? 'upcoming';
}

/** Get a human-friendly label. Never throws on unknown status. */
export function getStatusLabel(status: string): string {
  return LABELS[normalizeLeagueStatus(status)] ?? FALLBACK_LABEL;
}

/** Get badge colours. Never throws on unknown status. */
export function getStatusColors(status: string): { bg: string; text: string } {
  return COLORS[normalizeLeagueStatus(status)] ?? FALLBACK_COLORS;
}

// Keep backwards-compat exports used in tests
export const STATUS_LABELS = LABELS;
export const STATUS_COLORS = COLORS;

/** Sort order for league status groups. */
const STATUS_ORDER: LeagueStatus[] = ['active', 'upcoming', 'finished'];

export interface LeagueGroup {
  status: LeagueStatus;
  label: string;
  items: League[];
}

/** Group leagues by status in display order: active → upcoming → finished.
 *  Unknown statuses (e.g. "draft") are mapped before grouping. */
export function groupLeaguesByStatus(leagues: League[]): LeagueGroup[] {
  const map = new Map<LeagueStatus, League[]>();

  for (const league of leagues) {
    const normalised = normalizeLeagueStatus(league.status);
    const list = map.get(normalised) ?? [];
    list.push(league);
    map.set(normalised, list);
  }

  return STATUS_ORDER.filter((s) => map.has(s)).map((status) => ({
    status,
    label: LABELS[status],
    items: map.get(status)!,
  }));
}

// ---------------------------------------------------------------------------
// Mode helpers
// ---------------------------------------------------------------------------
const MODE_LABELS: Record<LeagueMode, string> = {
  open: 'Liga abierta',
  scheduled: 'Liga por temporada',
};

export function getModeLabel(mode?: LeagueMode): string {
  return mode ? MODE_LABELS[mode] ?? MODE_LABELS.open : MODE_LABELS.open;
}

// ---------------------------------------------------------------------------
// Match status labels and colors
// ---------------------------------------------------------------------------
const MATCH_STATUS_LABELS: Record<LeagueMatchStatus, string> = {
  pending_confirm: 'Pendiente',
  confirmed: 'Confirmado',
  disputed: 'Disputado',
  resolved: 'Resuelto',
};

const MATCH_STATUS_COLORS: Record<LeagueMatchStatus, { bg: string; text: string }> = {
  pending_confirm: { bg: 'bg-amber-100', text: 'text-amber-800' },
  confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  disputed: { bg: 'bg-rose-100', text: 'text-rose-800' },
  resolved: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

export function getMatchStatusLabel(status: string): string {
  return MATCH_STATUS_LABELS[status as LeagueMatchStatus] ?? 'Desconocido';
}

export function getMatchStatusColors(status: string): { bg: string; text: string } {
  return MATCH_STATUS_COLORS[status as LeagueMatchStatus] ?? FALLBACK_COLORS;
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

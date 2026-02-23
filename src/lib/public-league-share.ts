import type { PublicLeagueStandingsShareResponse, StandingEntry, StandingsMovementMap } from '@/types/leagues';

export interface PublicLeagueOgResponse {
  leagueName: string;
  rows: StandingEntry[];
  movement: StandingsMovementMap;
  computedAt?: string;
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }
  return baseUrl.replace(/\/$/, '');
}

function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  const url = new URL(`${getApiBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

function normalizeRows(raw: unknown): StandingEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const data = (item ?? {}) as Record<string, unknown>;
    return {
      userId: String(data.userId ?? `row-${index}`),
      displayName: String(data.displayName ?? data.name ?? 'Jugador'),
      position: Number(data.position ?? index + 1) || index + 1,
      points: Number(data.points ?? 0) || 0,
      wins: Number(data.wins ?? 0) || 0,
      losses: Number(data.losses ?? 0) || 0,
      draws: Number(data.draws ?? 0) || 0,
      setDiff:
        typeof data.setDiff === 'number'
          ? data.setDiff
          : typeof data.setDiff === 'string'
            ? Number(data.setDiff)
            : undefined,
      gameDiff:
        typeof data.gameDiff === 'number'
          ? data.gameDiff
          : typeof data.gameDiff === 'string'
            ? Number(data.gameDiff)
            : undefined,
    };
  });
}

function normalizeMovement(raw: unknown): StandingsMovementMap {
  if (!raw || typeof raw !== 'object') return {};
  const out: StandingsMovementMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(value);
    if (!Number.isNaN(n)) out[key] = n;
  }
  return out;
}

function normalizeSharePayload(raw: unknown): PublicLeagueStandingsShareResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const leagueName =
    typeof data.leagueName === 'string'
      ? data.leagueName
      : typeof data.name === 'string'
        ? data.name
        : typeof data.league === 'object' &&
            data.league &&
            typeof (data.league as Record<string, unknown>).name === 'string'
          ? String((data.league as Record<string, unknown>).name)
          : 'Liga';

  return {
    leagueName,
    rows: normalizeRows(data.rows ?? data.standings),
    movement: normalizeMovement(data.movement ?? data.movementMap),
    computedAt: typeof data.computedAt === 'string' ? data.computedAt : undefined,
  };
}

function normalizeOgPayload(raw: unknown): PublicLeagueOgResponse {
  const normalized = normalizeSharePayload(raw);
  return normalized;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchPublicLeagueStandingsShare(
  leagueId: string,
  token: string
): Promise<PublicLeagueStandingsShareResponse> {
  const url = buildUrl(`/public/leagues/${leagueId}/standings`, { token });
  const data = await fetchJson(url);
  return normalizeSharePayload(data);
}

export async function fetchPublicLeagueOg(
  leagueId: string,
  token: string
): Promise<PublicLeagueOgResponse> {
  const url = buildUrl(`/public/leagues/${leagueId}/og`, { token });
  const data = await fetchJson(url);
  return normalizeOgPayload(data);
}

export function formatShareComputedAt(value?: string): string {
  if (!value) return 'Actualizado recientemente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Actualizado recientemente';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

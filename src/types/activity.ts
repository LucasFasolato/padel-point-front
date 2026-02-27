/**
 * Personal activity feed types — GET /me/activity
 *
 * Canonical event types match the v1 backend contract.
 * All legacy/dot-notation/lowercase variants are aliased here so the
 * normalizer is the single place that deals with shape variance.
 */

// ── Canonical event types (v1 backend contract) ───────────────────────────────

export const ACTIVITY_EVENT_TYPES = {
  // ── Backend v1 canonical ───────────────────────────────────────────────────
  MATCH_CONFIRMED: 'MATCH_CONFIRMED',
  CHALLENGE_CREATED: 'CHALLENGE_CREATED',
  CHALLENGE_ACCEPTED: 'CHALLENGE_ACCEPTED',
  CHALLENGE_DECLINED: 'CHALLENGE_DECLINED',
  RANKING_SNAPSHOT_PUBLISHED: 'RANKING_SNAPSHOT_PUBLISHED',
  RANKING_MOVEMENT: 'RANKING_MOVEMENT',

  // ── Internal / legacy types still emitted by older pipelines ──────────────
  MATCH_REPORTED: 'MATCH_REPORTED',
  MATCH_DISPUTED: 'MATCH_DISPUTED',
  MATCH_RESOLVED: 'MATCH_RESOLVED',
  ELO_UPDATED: 'ELO_UPDATED',

  // ── Alias: legacy frontend canonical names → v1 backend names ─────────────
  CHALLENGE_RECEIVED: 'CHALLENGE_CREATED',       // front used RECEIVED, back uses CREATED
  CHALLENGE_REJECTED: 'CHALLENGE_DECLINED',      // front used REJECTED, back uses DECLINED
  LEAGUE_RANKING_MOVED: 'RANKING_MOVEMENT',      // old league-scoped name
  RANKING_SNAPSHOT: 'RANKING_SNAPSHOT_PUBLISHED', // old short name

  // ── Alias: dot-notation backend variants ──────────────────────────────────
  'challenge.received': 'CHALLENGE_CREATED',
  'challenge.rejected': 'CHALLENGE_DECLINED',
  'ranking.snapshot_published': 'RANKING_SNAPSHOT_PUBLISHED',
  'ranking.movement': 'RANKING_MOVEMENT',

  // ── Alias: lowercase/snake_case variants ──────────────────────────────────
  challenge_created: 'CHALLENGE_CREATED',
  challenge_received: 'CHALLENGE_CREATED',
  challenge_accepted: 'CHALLENGE_ACCEPTED',
  challenge_declined: 'CHALLENGE_DECLINED',
  challenge_rejected: 'CHALLENGE_DECLINED',
  match_confirmed: 'MATCH_CONFIRMED',
  match_reported: 'MATCH_REPORTED',
  elo_updated: 'ELO_UPDATED',
  league_ranking_moved: 'RANKING_MOVEMENT',
  ranking_snapshot: 'RANKING_SNAPSHOT_PUBLISHED',
  ranking_snapshot_published: 'RANKING_SNAPSHOT_PUBLISHED',
  ranking_movement: 'RANKING_MOVEMENT',
} as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[keyof typeof ACTIVITY_EVENT_TYPES];

/**
 * Sentinel returned for any type string not found in the map.
 * Callers must treat this as "skip rendering" — never throw on unknown types.
 */
export const UNKNOWN_EVENT_TYPE = 'UNKNOWN' as const;

/**
 * Normalises any legacy/lowercase/dot-notation variant to the canonical
 * UPPER_SNAKE_CASE form. Returns UNKNOWN_EVENT_TYPE for unrecognised strings
 * so callers can safely skip them without crashing.
 */
export function normalizeActivityEventType(raw: string): string {
  const key = raw as keyof typeof ACTIVITY_EVENT_TYPES;
  return ACTIVITY_EVENT_TYPES[key] ?? UNKNOWN_EVENT_TYPE;
}

// ── Wire types (raw from backend) ────────────────────────────────────────────

export interface RawActivityEvent {
  id: string;
  /** Canonical or legacy type string. Use normalizeActivityEventType() before display. */
  type: string;
  createdAt: string;
  /** Event-specific payload; shape depends on type. */
  data: Record<string, unknown>;
}

export interface MyActivityResponse {
  items: RawActivityEvent[];
  nextCursor: string | null;
}

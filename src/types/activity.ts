/**
 * Personal activity feed types — GET /me/activity
 *
 * Event types deliberately mirror NOTIFICATION_TYPES so backend can reuse
 * the same pipeline. Additional feed-only types are listed at the bottom.
 */

// ── Known event types ─────────────────────────────────────────────────────────

export const ACTIVITY_EVENT_TYPES = {
  // Challenge lifecycle
  CHALLENGE_RECEIVED: 'CHALLENGE_RECEIVED',
  CHALLENGE_ACCEPTED: 'CHALLENGE_ACCEPTED',
  CHALLENGE_REJECTED: 'CHALLENGE_REJECTED',
  // Match lifecycle
  MATCH_REPORTED: 'MATCH_REPORTED',
  MATCH_CONFIRMED: 'MATCH_CONFIRMED',
  MATCH_DISPUTED: 'MATCH_DISPUTED',
  MATCH_RESOLVED: 'MATCH_RESOLVED',
  // ELO / ranking
  ELO_UPDATED: 'ELO_UPDATED',
  LEAGUE_RANKING_MOVED: 'LEAGUE_RANKING_MOVED',
  RANKING_SNAPSHOT: 'RANKING_SNAPSHOT', // competitive ranking snapshot
  // Legacy lowercase aliases (backend may send either form)
  challenge_received: 'CHALLENGE_RECEIVED',
  challenge_accepted: 'CHALLENGE_ACCEPTED',
  challenge_rejected: 'CHALLENGE_REJECTED',
  match_reported: 'MATCH_REPORTED',
  match_confirmed: 'MATCH_CONFIRMED',
  elo_updated: 'ELO_UPDATED',
  league_ranking_moved: 'LEAGUE_RANKING_MOVED',
  ranking_snapshot: 'RANKING_SNAPSHOT',
} as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[keyof typeof ACTIVITY_EVENT_TYPES];

/** Normalises any legacy/lowercase variant to the canonical UPPER_SNAKE_CASE form. */
export function normalizeActivityEventType(raw: string): string {
  const key = raw as keyof typeof ACTIVITY_EVENT_TYPES;
  return ACTIVITY_EVENT_TYPES[key] ?? raw;
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

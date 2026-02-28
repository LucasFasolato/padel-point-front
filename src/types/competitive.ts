export type Category = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export enum ChallengeType {
  DIRECT = 'direct',
  OPEN = 'open',
}

export enum ChallengeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  READY = 'ready',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum MatchResultStatus {
  PENDING_CONFIRM = 'pending_confirm',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved',
}

export enum WinnerTeam {
  A = 'A',
  B = 'B',
}

export type MatchSource = 'RESERVATION' | 'MANUAL';
export type LeagueContextRole = 'member' | 'admin' | 'owner';

export interface CompetitiveProfile {
  userId: string;
  email: string;
  displayName: string;
  elo: number;
  winStreakCurrent?: number;
  winStreakBest?: number;
  last10?: ('W' | 'L' | 'D')[];
  eloDelta30d?: number;
  peakElo?: number;
  category: Category; // derivado de ELO en backend
  initialCategory: number | null;
  categoryLocked: boolean;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  updatedAt: string;
  createdAt: string;
}

export interface EloHistoryPoint {
  id: string;
  eloBefore: number;
  eloAfter: number;
  delta: number;
  reason:
    | 'init_category'
    | 'match_result'
    | 'admin_adjustment'
    | 'import'
    | (string & {});
  refId: string | null; // matchResultId
  createdAt: string;
}

export interface EloHistoryResponse {
  items: EloHistoryPoint[];
  nextCursor: string | null;
}

export interface EloHistoryQueryParams {
  limit?: number;
  cursor?: string;
}

export interface UserBasic {
  userId: string;
  email: string;
  displayName: string;
}

/** Match type for competitive vs friendly games. Sent to backend on creation. */
export type MatchType = 'COMPETITIVE' | 'FRIENDLY';

export interface Challenge {
  id: string;
  type: ChallengeType;
  status: ChallengeStatus;
  targetCategory: number | null;
  reservationId: string | null;
  message: string | null;
  /** COMPETITIVE = affects ranking; FRIENDLY = personal record only */
  matchType?: MatchType;
  createdAt: string;
  updatedAt: string;
  
  teamA: {
    p1: UserBasic;
    p2: UserBasic | null;
  };
  
  teamB: {
    p1: UserBasic | null;
    p2: UserBasic | null;
  };
  
  invitedOpponent: UserBasic | null;
  isReady: boolean;
}

export interface MatchResult {
  id: string;
  challengeId: string;
  leagueId?: string | null;
  playedAt: string;
  source?: MatchSource;
  /** COMPETITIVE = affects ranking; FRIENDLY = personal record only */
  matchType?: MatchType;
  /** Backend-denormalised flag: whether this match did/will impact ELO */
  impactRanking?: boolean;

  // Sets
  teamASet1: number;
  teamBSet1: number;
  teamASet2: number;
  teamBSet2: number;
  teamASet3: number | null;
  teamBSet3: number | null;
  
  winnerTeam: WinnerTeam;
  status: MatchResultStatus;
  
  reportedByUserId: string;
  confirmedByUserId: string | null;
  rejectionReason: string | null;
  eloApplied: boolean;
  leagueContextRole?: LeagueContextRole | null;
  teamA?: { userId: string; displayName: string }[];
  teamB?: { userId: string; displayName: string }[];
  
  createdAt: string;
  updatedAt: string;
  
  // Relación con challenge (para obtener participantes)
  challenge?: Challenge;
}

// Helper type para vista de match con contexto
export interface MatchView {
  id: string;
  challengeId: string;
  playedAt: string;
  score: string; // "6-4, 6-3"
  status: MatchResultStatus;
  winnerTeam: WinnerTeam;
  eloApplied: boolean;
  matchType?: MatchType;

  // Participantes (derivado de challenge)
  opponent: UserBasic;
  partner: UserBasic | null;

  // Resultado para mí
  isWin: boolean;
  eloChange: number | null;

  createdAt: string;
}

export interface OnboardingData {
  category: Category;
  primaryGoal: 'improve' | 'compete' | 'socialize';
  playingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'occasional';
  onboardingComplete: boolean;
  categoryLocked: boolean;
}

export interface RankingEntry {
  userId: string;
  email: string;
  displayName: string;
  position?: number;
  positionDelta?: number | null;
  elo: number;
  category: Category;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  updatedAt: string;
}

export interface RankingResponse {
  items: RankingEntry[];
  nextCursor: string | null;
  /** Present when backend returns page-based pagination instead of cursor-based. */
  meta?: { page: number; pageSize: number; total: number };
}

export interface RankingQueryParams {
  category?: Category;
  limit?: number;
  cursor?: string;
}

// ── Player Insights ───────────────────────────────────────────────────────────

export type InsightsTimeframe = 'LAST_30D' | 'CURRENT_SEASON';
export type InsightsMode = 'COMPETITIVE' | 'FRIENDLY' | 'ALL';

export interface PlayerInsights {
  timeframe: string;
  mode: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  /** Win rate as integer 0–100 */
  winRate: number;
  /** Net ELO change during the timeframe */
  eloDelta: number;
  /** Current consecutive streak length */
  streak: number;
  /** Direction of current streak, or null if no streak */
  streakType: 'W' | 'L' | 'D' | null;
  /** Populated when backend tracks ranking eligibility */
  neededForRanking?: {
    remaining: number;
    total: number;
  } | null;
}

// ── User Intents (normalised action items) ────────────────────────────────────

/**
 * CONFIRM_RESULT / ACCEPT_CHALLENGE — incoming intents needing action.
 * CREATED_INTENT — outgoing intent created by the user (shown optimistically).
 */
export type IntentType = 'CONFIRM_RESULT' | 'ACCEPT_CHALLENGE' | 'CREATED_INTENT';
export type IntentStatus = MatchResultStatus | ChallengeStatus | (string & {});

/**
 * Normalised "thing that needs my attention" — merges pending match
 * confirmations (CONFIRM_RESULT) and incoming challenge invites
 * (ACCEPT_CHALLENGE) into one renderable shape.
 *
 * Unknown intentType values are never rendered (guarded in the UI layer).
 */
export interface UserIntent {
  /** Stable React key — prefixed with 'match:' or 'challenge:' */
  id: string;
  intentType: IntentType | (string & {});
  /** Current status from source entity (match/challenge). */
  status: IntentStatus;
  /** Person who sent the confirmation / challenge */
  actorName: string;
  /** Secondary line: score string for confirmations, context for challenges */
  subtitle: string | null;
  createdAt: string;
  /** Optional league scope when the intent is tied to a league challenge/match. */
  leagueId?: string | null;
  /** Set only for CONFIRM_RESULT */
  matchId?: string;
  /** Set only for ACCEPT_CHALLENGE */
  challengeId?: string;
}

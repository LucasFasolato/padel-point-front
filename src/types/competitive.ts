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
}

export enum WinnerTeam {
  A = 'A',
  B = 'B',
}

export interface CompetitiveProfile {
  userId: string;
  email: string;
  displayName: string;
  elo: number;
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
  reason: 'init_category' | 'match_result';
  refId: string | null; // matchResultId
  createdAt: string;
}

export interface UserBasic {
  userId: string;
  email: string;
  displayName: string;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  status: ChallengeStatus;
  targetCategory: number | null;
  reservationId: string | null;
  message: string | null;
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
  playedAt: string;
  
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
  
  // Participantes (derivado de challenge)
  opponent: UserBasic;
  partner: UserBasic | null;
  
  // Resultado para mí
  isWin: boolean;
  eloChange: number | null;
  
  createdAt: string;
}

export interface RankingEntry {
  userId: string;
  email: string;
  displayName: string;
  elo: number;
  category: Category;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  updatedAt: string;
}
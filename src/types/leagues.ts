export type LeagueStatus = 'upcoming' | 'active' | 'finished';
export type LeagueMode = 'open' | 'scheduled';

export interface LeagueMember {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  role?: LeagueMemberRole;
  joinedAt: string;
}

export interface StandingEntry {
  userId: string;
  displayName: string;
  position: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
}

export type StandingsMovementMap = Record<string, number>;

export interface LeagueStandingsResponse {
  rows: StandingEntry[];
  movement: StandingsMovementMap;
  computedAt?: string;
}

export interface League {
  id: string;
  name: string;
  status: LeagueStatus;
  mode?: LeagueMode;
  startDate: string;
  endDate: string;
  creatorId: string;
  membersCount: number;
  members?: LeagueMember[];
  standings?: StandingEntry[];
}

export type TieBreaker = 'points' | 'wins' | 'set_difference' | 'game_difference';
export type LeagueMemberRole = 'member' | 'owner';

export interface LeagueSettings {
  scoring: { win: number; draw: number; loss: number };
  tieBreakers: TieBreaker[];
  includeSources: { reservation: boolean; manual: boolean };
}

export type LeagueMatchStatus =
  | 'pending_confirm'
  | 'confirmed'
  | 'disputed'
  | 'resolved';
export type LeagueMatchSource = 'RESERVATION' | 'MANUAL';

export interface LeagueMatch {
  id: string;
  playedAt: string;
  score: string;
  status: LeagueMatchStatus;
  source?: LeagueMatchSource;
  teamA: { displayName: string }[];
  teamB: { displayName: string }[];
}

export type LeagueChallengeScope = 'active' | 'history';

export interface LeagueChallengeParticipant {
  userId: string;
  displayName: string;
}

export interface LeagueChallenge {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  challenger: LeagueChallengeParticipant;
  opponent: LeagueChallengeParticipant;
  matchId?: string | null;
}

export interface CreateLeagueChallengePayload {
  opponentUserId: string;
  message?: string;
}

export interface CreateLeaguePayload {
  name: string;
  startDate: string;
  endDate: string;
}

export interface LeagueInvite {
  id: string;
  leagueId: string;
  leagueName: string;
  startDate: string;
  endDate: string;
  membersCount: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface InviteByTokenResponse {
  leagueName: string;
  startDate: string;
  endDate: string;
  membersCount: number;
  creatorName: string;
}

export interface ReportFromReservationPayload {
  reservationId: string;
  teamA1Id: string;
  teamA2Id: string;
  teamB1Id: string;
  teamB2Id: string;
  sets: { a: number; b: number }[];
  playedAt?: string;
}

export interface ReportManualPayload {
  teamA1Id: string;
  teamA2Id: string;
  teamB1Id: string;
  teamB2Id: string;
  sets: { a: number; b: number }[];
  playedAt?: string;
}

export interface ReportFromReservationResponse {
  matchId?: string;
}

/** Reservation eligible for league match reporting. */
export interface EligibleReservation {
  id: string;
  courtName: string;
  clubName: string;
  startAt: string;
  endAt: string;
}

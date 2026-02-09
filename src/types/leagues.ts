export type LeagueStatus = 'upcoming' | 'active' | 'finished';
export type LeagueMode = 'open' | 'scheduled';

export interface LeagueMember {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
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

export type LeagueMatchStatus =
  | 'pending_confirm'
  | 'confirmed'
  | 'disputed'
  | 'resolved';

export interface LeagueMatch {
  id: string;
  playedAt: string;
  score: string;
  status: LeagueMatchStatus;
  teamA: { displayName: string }[];
  teamB: { displayName: string }[];
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

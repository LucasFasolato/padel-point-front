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
  setDiff?: number;
  gameDiff?: number;
}

export type StandingsMovementMap = Record<string, number>;

export interface LeagueStandingsResponse {
  rows: StandingEntry[];
  movement: StandingsMovementMap;
  computedAt?: string;
}

export interface PublicLeagueStandingsShareResponse extends LeagueStandingsResponse {
  leagueName: string;
}

export interface LeagueShareEnableResponse {
  shareToken: string;
  shareUrlPath: string;
}

export interface LeagueShareDisableResponse {
  ok: boolean;
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
  | 'scheduled'
  | 'pending_confirm'
  | 'confirmed'
  | 'disputed'
  | 'resolved';
export type LeagueMatchSource = 'RESERVATION' | 'MANUAL';

export interface LeagueMatch {
  id: string;
  playedAt?: string;
  scheduledAt?: string | null;
  score?: string | null;
  status: LeagueMatchStatus;
  source?: LeagueMatchSource;
  teamA: { userId?: string; displayName: string }[];
  teamB: { userId?: string; displayName: string }[];
}

export type LeagueMatchCreateMode = 'played' | 'scheduled';

export interface LeagueMatchSet {
  a: number;
  b: number;
}

export interface CreateLeagueMatchPayload {
  mode: LeagueMatchCreateMode;
  teamA1Id: string;
  teamB1Id: string;
  teamA2Id?: string;
  teamB2Id?: string;
  sets?: LeagueMatchSet[];
  playedAt?: string;
  scheduledAt?: string;
}

export interface CaptureLeagueMatchResultPayload {
  sets: LeagueMatchSet[];
  playedAt?: string | Date;
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

export interface CreateMiniLeaguePayload {
  name: string;
  inviteEmails?: string[];
}

export interface CreateMiniLeagueResponse {
  leagueId: string;
  invitedExistingUsers: number;
  invitedByEmailOnly: number;
  skipped: number;
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

export interface LeagueInviteDispatchResult {
  inviteId?: string;
  email?: string;
  invitedUserId: string | null;
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

/** A single activity event in a league feed. */
export interface ActivityEventView {
  id: string;
  leagueId: string;
  type: string;
  actorId: string | null;
  actorName: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Paginated response from GET /leagues/:id/activity */
export interface ActivityResponse {
  items: ActivityEventView[];
  nextCursor: string | null;
}

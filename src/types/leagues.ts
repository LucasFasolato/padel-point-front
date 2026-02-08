export type LeagueStatus = 'upcoming' | 'active' | 'finished';

export interface LeagueMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
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
  startDate: string;
  endDate: string;
  creatorId: string;
  membersCount: number;
  members?: LeagueMember[];
  standings?: StandingEntry[];
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

import { usePendingConfirmations } from '@/hooks/use-matches';
import { useChallengesInbox } from '@/hooks/use-challenges';
import type { MatchResult, Challenge, UserIntent } from '@/types/competitive';

// ── Mappers ───────────────────────────────────────────────────────────────────

function matchToIntent(match: MatchResult): UserIntent {
  const actorName =
    match.challenge?.teamA?.p1?.displayName ??
    match.teamA?.[0]?.displayName ??
    'Rival';

  const s1a = match.teamASet1 ?? '—';
  const s1b = match.teamBSet1 ?? '—';
  const s2a = match.teamASet2 ?? '—';
  const s2b = match.teamBSet2 ?? '—';
  const score = [
    `${s1a}-${s1b}`,
    `${s2a}-${s2b}`,
    match.teamASet3 != null ? `${match.teamASet3}-${match.teamBSet3 ?? '—'}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    id: `match:${match.id}`,
    intentType: 'CONFIRM_RESULT',
    status: match.status,
    actorName,
    subtitle: score || null,
    createdAt: match.createdAt,
    matchId: match.id,
  };
}

function challengeToIntent(challenge: Challenge): UserIntent {
  return {
    id: `challenge:${challenge.id}`,
    intentType: 'ACCEPT_CHALLENGE',
    status: challenge.status,
    actorName: challenge.teamA?.p1?.displayName ?? 'Un jugador',
    subtitle: 'Te desafió a un partido',
    createdAt: challenge.createdAt,
    challengeId: challenge.id,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseIntentsResult {
  items: UserIntent[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Merges pending match confirmations and incoming challenge invites into a
 * unified list of UserIntent items sorted by recency.
 *
 * Reuses the same React Query cache keys as the competitive page — no extra
 * network calls when both hooks are mounted simultaneously.
 */
export function useIntents(): UseIntentsResult {
  const confirmationsQ = usePendingConfirmations();
  const challengesQ = useChallengesInbox();

  const confirmationIntents = (
    Array.isArray(confirmationsQ.data) ? confirmationsQ.data : []
  )
    .filter((m): m is MatchResult => Boolean(m?.id))
    .map(matchToIntent);

  const challengeIntents = (challengesQ.data ?? [])
    .filter((c) => c.status === 'pending')
    .map(challengeToIntent);

  const items = [...confirmationIntents, ...challengeIntents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    items,
    isLoading: confirmationsQ.isLoading || challengesQ.isLoading,
    // Only surface as error when both failed; partial success renders what we have
    isError: confirmationsQ.isError && challengesQ.isError,
    refetch: () => {
      confirmationsQ.refetch();
      challengesQ.refetch();
    },
  };
}

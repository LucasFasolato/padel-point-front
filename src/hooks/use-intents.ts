import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { usePendingConfirmations } from '@/hooks/use-matches';
import { useChallengesInbox } from '@/hooks/use-challenges';
import { intentsService } from '@/services/intents-service';
import type { IntentKind } from '@/services/intents-service';
import type { MatchResult, Challenge, UserIntent } from '@/types/competitive';

// ── Optimistic outgoing-intent cache key ──────────────────────────────────────
const OPTIMISTIC_KEY = ['intents', 'created-optimistic'] as const;

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

// ── Main hook ─────────────────────────────────────────────────────────────────

export interface UseIntentsResult {
  items: UserIntent[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Merges pending match confirmations, incoming challenge invites, and optimistically
 * created outgoing intents into a unified list sorted by recency.
 */
export function useIntents(): UseIntentsResult {
  const confirmationsQ = usePendingConfirmations();
  const challengesQ = useChallengesInbox();

  // Subscribe to optimistic outgoing intents written by useCreateIntent.
  // enabled:false means we never fetch; setQueryData from the mutation triggers re-renders.
  const { data: optimisticItems = [] } = useQuery<UserIntent[]>({
    queryKey: OPTIMISTIC_KEY,
    queryFn: () => [],
    enabled: false,
    staleTime: Infinity,
  });

  const confirmationIntents = (
    Array.isArray(confirmationsQ.data) ? confirmationsQ.data : []
  )
    .filter((m): m is MatchResult => Boolean(m?.id))
    .map(matchToIntent);

  const challengeIntents = (challengesQ.data ?? [])
    .filter((c) => c.status === 'pending')
    .map(challengeToIntent);

  const items = [...optimisticItems, ...confirmationIntents, ...challengeIntents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    items,
    isLoading: confirmationsQ.isLoading || challengesQ.isLoading,
    isError: confirmationsQ.isError && challengesQ.isError,
    refetch: () => {
      confirmationsQ.refetch();
      challengesQ.refetch();
    },
  };
}

// ── Create intent mutation ─────────────────────────────────────────────────────

export interface CreateIntentParams {
  type: IntentKind;
  matchType?: 'COMPETITIVE' | 'FRIENDLY';
  message?: string;
  expiresInHours?: number;
}

const INTENT_SUBTITLES: Record<IntentKind, string> = {
  DIRECT: 'Desafío directo',
  OPEN: 'Desafío abierto',
  FIND_PARTNER: 'Buscás compañero',
};

export function useCreateIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateIntentParams) => {
      switch (params.type) {
        case 'DIRECT':
          return intentsService.createDirect(params);
        case 'OPEN':
          return intentsService.createOpen(params);
        case 'FIND_PARTNER':
          return intentsService.createFindPartner(params);
      }
    },

    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: OPTIMISTIC_KEY });
      const snapshot = queryClient.getQueryData<UserIntent[]>(OPTIMISTIC_KEY);

      const optimisticId = `optimistic:${Date.now()}`;
      const optimisticIntent: UserIntent = {
        id: optimisticId,
        intentType: 'CREATED_INTENT',
        status: 'active',
        actorName: 'Vos',
        subtitle: INTENT_SUBTITLES[params.type],
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<UserIntent[]>(OPTIMISTIC_KEY, (old) => [
        optimisticIntent,
        ...(old ?? []),
      ]);

      return { snapshot, optimisticId };
    },

    onSuccess: (_data, _vars, context) => {
      toast.success('Desafío creado', { description: '¡Buscamos rival para vos!' });

      // Keep the optimistic item visible for a few seconds before real data loads
      setTimeout(() => {
        queryClient.setQueryData<UserIntent[]>(OPTIMISTIC_KEY, (old) =>
          (old ?? []).filter((item) => item.id !== context.optimisticId)
        );
      }, 4000);

      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },

    onError: (_err, _vars, context) => {
      // Always rollback the optimistic item; 409 is surfaced to the UI by the sheet
      queryClient.setQueryData(OPTIMISTIC_KEY, context?.snapshot ?? []);
    },
  });
}

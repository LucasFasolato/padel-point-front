'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchesService } from '@/services/matches-service';
import { challengesService } from '@/services/challenges-service';
import type { MatchView, Challenge, MatchResult } from '@/types/competitive';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import axios from 'axios';

function getDisputeErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 409) return 'Este resultado ya fue disputado.';
    if (status === 410) return 'El plazo para disputar este resultado expiró.';
    if (status === 403) return 'No tenés permiso para disputar este resultado.';
  }
  return 'Error al enviar la disputa. Intentá de nuevo.';
}

function getResolveErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return 'No ten\u00E9s permisos para resolver este resultado.';
  }
  return 'No se pudo resolver el resultado. Intent\u00E1 de nuevo.';
}

export function useMyMatches() {
  const user = useAuthStore((s) => s.user);
  const isAuthed = !!user?.userId;

  const { data: inbox } = useQuery({
    queryKey: ['challenges', 'inbox'],
    queryFn: () => challengesService.getInbox(),
    enabled: isAuthed,            // ✅ no pegar si no estás logueado
    retry: false,
  });

  const { data: outbox } = useQuery({
    queryKey: ['challenges', 'outbox'],
    queryFn: () => challengesService.getOutbox(),
    enabled: isAuthed,
    retry: false,
  });

  const allChallenges = [...(inbox || []), ...(outbox || [])];
  const challengesWithMatch = allChallenges.filter(
    (ch) => ch.status === 'ready' || ch.status === 'accepted'
  );

  const matchesQuery = useQuery({
    queryKey: ['matches', 'my-matches', challengesWithMatch.map((c) => c.id)],
    enabled: isAuthed && challengesWithMatch.length > 0,
    queryFn: async () => {
      const matches = await Promise.all(
        challengesWithMatch.map(async (challenge) => {
          const match = await matchesService.getByChallenge(challenge.id);
          if (!match) return null;
          return { match, challenge };
        })
      );
      return matches.filter(Boolean) as Array<{ match: MatchResult; challenge: Challenge }>;
    },
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const matchViews: MatchView[] = (matchesQuery.data || []).map(({ match, challenge }) => {
    const myUserId = user!.userId;

    const isTeamA =
      challenge.teamA.p1.userId === myUserId ||
      challenge.teamA.p2?.userId === myUserId;

    const myTeam = isTeamA ? challenge.teamA : challenge.teamB;
    const opponentTeam = isTeamA ? challenge.teamB : challenge.teamA;

    const opponent = opponentTeam.p1!;
    const partner = myTeam.p2;

    const isWin =
      (isTeamA && match.winnerTeam === 'A') ||
      (!isTeamA && match.winnerTeam === 'B');

    const sets = [
      `${match.teamASet1}-${match.teamBSet1}`,
      `${match.teamASet2}-${match.teamBSet2}`,
      match.teamASet3 !== null ? `${match.teamASet3}-${match.teamBSet3}` : null,
    ].filter(Boolean);

    return {
      id: match.id,
      challengeId: challenge.id,
      playedAt: match.playedAt,
      score: sets.join(', '),
      status: match.status,
      winnerTeam: match.winnerTeam,
      eloApplied: match.eloApplied,
      matchType: match.matchType ?? challenge.matchType,
      opponent,
      partner,
      isWin,
      eloChange: null,
      createdAt: match.createdAt,
    };
  });

  return {
    data: matchViews,
    isLoading: matchesQuery.isLoading,
    error: matchesQuery.error,
    isAuthed,
  };
}

/**
 * Fetches all matches for the current user via GET /matches/me.
 * Returns raw MatchResult[] sorted most-recent first.
 */
export function useMatchResultsList() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['matches', 'list'],
    queryFn: () => matchesService.getMyMatches(),
    enabled: !!user?.userId,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function usePendingConfirmations() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['matches', 'pending-confirmations'],
    queryFn: () => matchesService.getPendingConfirmations(),
    enabled: !!user?.userId,
    staleTime: 1000 * 30,
    // Allow 1 retry with exponential backoff; avoids spam on transient 500s
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
  });
}

export function useMatch(matchId: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['matches', matchId],
    queryFn: () => matchesService.getById(matchId),
    enabled: !!user?.userId && !!matchId,
    retry: false,
  });
}

export function useMatchActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    queryClient.invalidateQueries({ queryKey: ['competitive'] });
  };

  const reportMatch = useMutation({
    mutationFn: (params: {
      challengeId: string;
      sets: Array<{ a: number; b: number }>;
      playedAt?: string;
    }) => matchesService.reportMatch(params),
    onSuccess: () => {
      toast.success('Resultado reportado. Esperando confirmación del rival.');
      invalidate();
    },
    onError: () => toast.error('Error al reportar el resultado'),
  });

  const confirmMatch = useMutation({
    mutationFn: (matchId: string) => matchesService.confirmMatch(matchId),
    onSuccess: () => {
      toast.success('Resultado confirmado.');
      invalidate();
    },
    onError: () => toast.error('No se pudo confirmar el resultado.'),
  });

  const rejectMatch = useMutation({
    mutationFn: ({ matchId, reason }: { matchId: string; reason?: string }) =>
      matchesService.rejectMatch(matchId, reason),
    onSuccess: () => {
      toast.success('Resultado rechazado');
      invalidate();
    },
  });

  const disputeMatch = useMutation({
    mutationFn: (params: { matchId: string; reason: string; message?: string }) =>
      matchesService.disputeMatch(params.matchId, {
        reason: params.reason,
        message: params.message,
      }),
    onSuccess: () => {
      toast.success('Disputa enviada. El resultado está en revisión.');
      invalidate();
    },
    onError: (error: unknown) => {
      const msg = getDisputeErrorMessage(error);
      toast.error(msg);
    },
  });

  const resolveConfirmAsIs = useMutation({
    mutationFn: (matchId: string) => matchesService.resolveConfirmAsIs(matchId),
    onSuccess: () => {
      toast.success('Resultado confirmado por administración.');
      invalidate();
    },
    onError: (error: unknown) => {
      toast.error(getResolveErrorMessage(error));
    },
  });

  return { reportMatch, confirmMatch, rejectMatch, disputeMatch, resolveConfirmAsIs };
}

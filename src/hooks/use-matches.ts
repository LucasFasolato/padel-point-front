import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchesService } from '@/services/matches-service';
import { challengesService } from '@/services/challenges-service';
import type { MatchView, Challenge, MatchResult } from '@/types/competitive';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

/**
 * Hook para obtener MIS matches (derivados de challenges donde participo)
 * 
 * NOTA: Tu backend no tiene un endpoint directo para esto,
 * así que necesitamos:
 * 1. Obtener mis challenges (inbox + outbox)
 * 2. Para cada challenge READY, obtener su match
 * 3. Filtrar y mapear a MatchView
 */
export function useMyMatches() {
  const { user } = useAuth();
  const { data: inbox } = useQuery({
    queryKey: ['challenges', 'inbox'],
    queryFn: () => challengesService.getInbox(),
  });

  const { data: outbox } = useQuery({
    queryKey: ['challenges', 'outbox'],
    queryFn: () => challengesService.getOutbox(),
  });

  // Combinar y filtrar challenges con match
  const allChallenges = [...(inbox || []), ...(outbox || [])];
  const challengesWithMatch = allChallenges.filter(
    (ch) => ch.status === 'ready' || ch.status === 'accepted'
  );

  // Fetch matches para estos challenges
  const matchesQuery = useQuery({
    queryKey: ['matches', 'my-matches', challengesWithMatch.map(c => c.id)],
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
    enabled: challengesWithMatch.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Mapear a MatchView
  const matchViews: MatchView[] = (matchesQuery.data || []).map(({ match, challenge }) => {
    const isTeamA =
      challenge.teamA.p1.userId === user?.userId ||
      challenge.teamA.p2?.userId === user?.userId;

    const myTeam = isTeamA ? challenge.teamA : challenge.teamB;
    const opponentTeam = isTeamA ? challenge.teamB : challenge.teamA;

    const opponent = opponentTeam.p1!;
    const partner = myTeam.p2;

    const isWin =
      (isTeamA && match.winnerTeam === 'A') ||
      (!isTeamA && match.winnerTeam === 'B');

    // ELO change (lo obtenemos del history si existe)
    // Por ahora lo dejamos null, después podemos mejorarlo
    const eloChange = null;

    // Formatear score
    const sets = [
      `${match.teamASet1}-${match.teamBSet1}`,
      `${match.teamASet2}-${match.teamBSet2}`,
      match.teamASet3 !== null ? `${match.teamASet3}-${match.teamBSet3}` : null,
    ].filter(Boolean);
    const score = sets.join(', ');

    return {
      id: match.id,
      challengeId: challenge.id,
      playedAt: match.playedAt,
      score,
      status: match.status,
      winnerTeam: match.winnerTeam,
      eloApplied: match.eloApplied,
      opponent,
      partner,
      isWin,
      eloChange,
      createdAt: match.createdAt,
    };
  });

  return {
    data: matchViews,
    isLoading: matchesQuery.isLoading,
    error: matchesQuery.error,
  };
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['matches', matchId],
    queryFn: () => matchesService.getById(matchId),
    enabled: !!matchId,
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
    onError: () => {
      toast.error('Error al reportar el resultado');
    },
  });

  const confirmMatch = useMutation({
    mutationFn: (matchId: string) => matchesService.confirmMatch(matchId),
    onSuccess: () => {
      toast.success('Resultado confirmado. ELO actualizado!');
      invalidate();
    },
  });

  const rejectMatch = useMutation({
    mutationFn: ({ matchId, reason }: { matchId: string; reason?: string }) =>
      matchesService.rejectMatch(matchId, reason),
    onSuccess: () => {
      toast.success('Resultado rechazado');
      invalidate();
    },
  });

  return {
    reportMatch,
    confirmMatch,
    rejectMatch,
  };
}
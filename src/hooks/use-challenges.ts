import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { challengesService } from '@/services/challenges-service';
import type { Challenge } from '@/types/competitive';

export const CHALLENGE_QUERY_KEYS = {
  inboxRoot: ['challenges', 'inbox'] as const,
  inbox: (params?: { limit?: number }) =>
    ['challenges', 'inbox', { limit: params?.limit ?? null }] as const,
};

export function useChallengesInbox(limit?: number) {
  return useQuery({
    queryKey: CHALLENGE_QUERY_KEYS.inbox({ limit }),
    queryFn: async () => {
      const inbox = await challengesService.getInbox();
      return typeof limit === 'number' ? inbox.slice(0, limit) : inbox;
    },
    staleTime: 1000 * 60,
  });
}

function removeChallengeFromList(
  list: Challenge[] | undefined,
  challengeId: string
): Challenge[] | undefined {
  if (!Array.isArray(list)) return list;
  return list.filter((challenge) => challenge.id !== challengeId);
}

export function useChallenges() {
  const inbox = useChallengesInbox();

  const outbox = useQuery({
    queryKey: ['challenges', 'outbox'],
    queryFn: () => challengesService.getOutbox(),
    staleTime: 1000 * 60,
  });

  const openChallenges = useQuery({
    queryKey: ['challenges', 'open'],
    queryFn: () => challengesService.listOpen(),
    staleTime: 1000 * 30,
  });

  return { inbox, outbox, openChallenges };
}

export function useChallenge(id: string) {
  return useQuery({
    queryKey: ['challenges', id],
    queryFn: () => challengesService.getById(id),
    enabled: !!id,
  });
}

type InboxMutationContext = {
  snapshots: Array<[readonly unknown[], Challenge[] | undefined]>;
};

export function useChallengeActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
  };

  const onInboxActionMutate = async (challengeId: string): Promise<InboxMutationContext> => {
    await queryClient.cancelQueries({ queryKey: CHALLENGE_QUERY_KEYS.inboxRoot, exact: false });

    const snapshots = queryClient.getQueriesData<Challenge[]>({
      queryKey: CHALLENGE_QUERY_KEYS.inboxRoot,
      exact: false,
    });

    queryClient.setQueriesData<Challenge[]>(
      { queryKey: CHALLENGE_QUERY_KEYS.inboxRoot, exact: false },
      (old) => removeChallengeFromList(old, challengeId)
    );

    return { snapshots };
  };

  const rollbackInbox = (context?: InboxMutationContext) => {
    for (const [key, value] of context?.snapshots ?? []) {
      queryClient.setQueryData(key, value);
    }
  };

  const acceptDirect = useMutation({
    mutationFn: (id: string) => challengesService.acceptDirect(id),
    onMutate: (id) => onInboxActionMutate(id),
    onSuccess: () => {
      toast.success('¡Desafío aceptado!');
      invalidate();
    },
    onError: (error: Error, _id, context) => {
      rollbackInbox(context);
      toast.error(error.message || 'Error al aceptar el desafío');
    },
  });

  const rejectDirect = useMutation({
    mutationFn: (id: string) => challengesService.rejectDirect(id),
    onMutate: (id) => onInboxActionMutate(id),
    onSuccess: () => {
      toast.success('Desafío rechazado');
      invalidate();
    },
    onError: (error: Error, _id, context) => {
      rollbackInbox(context);
      toast.error(error.message || 'Error al rechazar el desafío');
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => challengesService.cancel(id),
    onSuccess: () => {
      toast.success('Desafío cancelado');
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cancelar el desafío');
    },
  });

  const acceptOpen = useMutation({
    mutationFn: ({ id, partnerUserId }: { id: string; partnerUserId?: string }) =>
      challengesService.acceptOpen(id, partnerUserId),
    onSuccess: () => {
      toast.success('¡Te uniste al desafío!');
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al unirse al desafío');
    },
  });

  return {
    acceptDirect,
    rejectDirect,
    cancel,
    acceptOpen,
  };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { challengesService } from '@/services/challenges-service';
import { toast } from 'sonner';

export function useChallenges() {
  const inbox = useQuery({
    queryKey: ['challenges', 'inbox'],
    queryFn: () => challengesService.getInbox(),
    staleTime: 1000 * 60,
  });

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

export function useChallengeActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
  };

  const acceptDirect = useMutation({
    mutationFn: (id: string) => challengesService.acceptDirect(id),
    onSuccess: () => {
      toast.success('¡Desafío aceptado!');
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al aceptar el desafío');
    },
  });

  const rejectDirect = useMutation({
    mutationFn: (id: string) => challengesService.rejectDirect(id),
    onSuccess: () => {
      toast.success('Desafío rechazado');
      invalidate();
    },
    onError: (error: Error) => {
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
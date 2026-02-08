import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leagueService } from '@/services/league-service';
import { toast } from 'sonner';

const KEYS = {
  list: ['leagues', 'list'] as const,
  detail: (id: string) => ['leagues', 'detail', id] as const,
  invite: (token: string) => ['leagues', 'invite', token] as const,
};

/** List all leagues the current user belongs to. */
export function useLeaguesList() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: () => leagueService.list(),
    staleTime: 1000 * 60 * 2,
  });
}

/** Fetch a single league with standings and members. */
export function useLeagueDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => leagueService.getById(id),
    enabled: !!id,
  });
}

/** Create a new league. */
export function useCreateLeague() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: leagueService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      toast.success('¡Liga creada exitosamente!');
    },
    onError: () => {
      toast.error('No se pudo crear la liga. Intentá de nuevo.');
    },
  });
}

/** Send invites by email to a league. */
export function useCreateInvites(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (emails: string[]) => leagueService.createInvites(leagueId, emails),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(leagueId) });
      toast.success('¡Invitaciones enviadas!');
    },
    onError: () => {
      toast.error('No se pudieron enviar las invitaciones.');
    },
  });
}

/** Fetch invite details by token (for the accept/decline screen). */
export function useInviteByToken(token: string) {
  return useQuery({
    queryKey: KEYS.invite(token),
    queryFn: () => leagueService.getInviteByToken(token),
    enabled: !!token,
    retry: false,
  });
}

/** Accept a league invite. */
export function useAcceptInvite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => leagueService.acceptInvite(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      toast.success('¡Te uniste a la liga!');
    },
    onError: () => {
      toast.error('No se pudo aceptar la invitación.');
    },
  });
}

/** Decline a league invite. */
export function useDeclineInvite() {
  return useMutation({
    mutationFn: (token: string) => leagueService.declineInvite(token),
    onSuccess: () => {
      toast.success('Invitación rechazada.');
    },
    onError: () => {
      toast.error('No se pudo rechazar la invitación.');
    },
  });
}

export const LEAGUE_QUERY_KEYS = KEYS;

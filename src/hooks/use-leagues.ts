import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leagueService } from '@/services/league-service';
import { toast } from 'sonner';
import type { ReportFromReservationPayload, LeagueSettings, LeagueMemberRole } from '@/types/leagues';
import axios from 'axios';

const KEYS = {
  list: ['leagues', 'list'] as const,
  detail: (id: string) => ['leagues', 'detail', id] as const,
  invite: (token: string) => ['leagues', 'invite', token] as const,
  eligibleReservations: (id: string) => ['leagues', 'eligible-reservations', id] as const,
  matches: (id: string) => ['leagues', 'matches', id] as const,
  settings: (id: string) => ['leagues', 'settings', id] as const,
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

/** Fetch matches linked to a league. */
export function useLeagueMatches(leagueId: string) {
  return useQuery({
    queryKey: KEYS.matches(leagueId),
    queryFn: () => leagueService.getMatches(leagueId),
    enabled: !!leagueId,
  });
}

/** Fetch reservations eligible for league match reporting. */
export function useEligibleReservations(leagueId: string) {
  return useQuery({
    queryKey: KEYS.eligibleReservations(leagueId),
    queryFn: () => leagueService.getEligibleReservations(leagueId),
    enabled: !!leagueId,
  });
}

const REPORT_ERROR_MESSAGES: Record<string, string> = {
  LEAGUE_FORBIDDEN: 'Solo miembros pueden cargar resultados.',
  RESERVATION_NOT_ELIGIBLE: 'La reserva aún no es válida para cargar resultado.',
  LEAGUE_MEMBERS_MISSING: 'Los jugadores deben pertenecer a la liga.',
  MATCH_ALREADY_REPORTED: 'Ese partido ya fue cargado para esta liga.',
};

/** Report a league match from a reservation. */
export function useReportFromReservation(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReportFromReservationPayload) =>
      leagueService.reportFromReservation(leagueId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(leagueId) });
      qc.invalidateQueries({ queryKey: KEYS.matches(leagueId) });
      toast.success('Resultado cargado. Falta confirmación del rival.');
    },
    onError: (err) => {
      let message = 'No se pudo cargar el resultado. Intentá de nuevo.';
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.code as string | undefined;
        if (code && REPORT_ERROR_MESSAGES[code]) {
          message = REPORT_ERROR_MESSAGES[code];
        }
      }
      toast.error(message);
    },
  });
}

/** Fetch league settings (scoring, tie-breakers, sources). */
export function useLeagueSettings(leagueId: string) {
  return useQuery({
    queryKey: KEYS.settings(leagueId),
    queryFn: () => leagueService.getSettings(leagueId),
    enabled: !!leagueId,
  });
}

/** Update league settings with cache invalidation. */
export function useUpdateLeagueSettings(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<LeagueSettings>) =>
      leagueService.updateSettings(leagueId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.settings(leagueId) });
      qc.invalidateQueries({ queryKey: KEYS.detail(leagueId) });
      toast.success('Reglas actualizadas. Tabla recalculada.');
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error('No tenés permisos para editar esta liga.');
      } else {
        toast.error('No se pudieron guardar los ajustes. Intentá de nuevo.');
      }
    },
  });
}

/** Update a member's role in the league. */
export function useUpdateMemberRole(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: LeagueMemberRole }) =>
      leagueService.updateMemberRole(leagueId, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(leagueId) });
      toast.success('Rol actualizado.');
    },
    onError: () => {
      toast.error('No se pudo actualizar el rol.');
    },
  });
}

export const LEAGUE_QUERY_KEYS = KEYS;

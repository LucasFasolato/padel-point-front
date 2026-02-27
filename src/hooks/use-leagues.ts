import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { leagueService } from '@/services/league-service';
import { toast } from 'sonner';
import { isUuid } from '@/lib/id-utils';
import { LeagueMatchResultPayloadError } from '@/lib/matches/build-league-match-result-payload';
import type {
  CreateMiniLeaguePayload,
  CreateMiniLeagueResponse,
  CreateLeagueMatchPayload,
  CaptureLeagueMatchResultPayload,
  ReportFromReservationPayload,
  ReportManualPayload,
  LeagueSettings,
  LeagueMemberRole,
  CreateLeagueChallengePayload,
  LeagueChallengeScope,
  LeagueInviteDispatchResult,
  ActivityResponse,
} from '@/types/leagues';
import axios from 'axios';

const KEYS = {
  list: ['leagues', 'list'] as const,
  detail: (id: string) => ['leagues', 'detail', id] as const,
  standings: (id: string) => ['leagues', 'standings', id] as const,
  challengesRoot: (id: string) => ['leagues', 'challenges', id] as const,
  challenges: (id: string, scope: LeagueChallengeScope) =>
    ['leagues', 'challenges', id, scope] as const,
  invite: (token: string) => ['leagues', 'invite', token] as const,
  eligibleReservations: (id: string) => ['leagues', 'eligible-reservations', id] as const,
  matches: (id: string) => ['leagues', 'matches', id] as const,
  settings: (id: string) => ['leagues', 'settings', id] as const,
  shareStandings: (id: string, token: string) => ['leagues', 'standings-share', id, token] as const,
  /** activity key includes limit so different page sizes never collide */
  activity: (id: string, limit: number) => ['leagues', 'activity', id, limit] as const,
  /** prefix-only key for setQueriesData predicates (matches any limit) */
  activityPrefix: (id: string) => ['leagues', 'activity', id] as const,
};

export const ACTIVITY_DEFAULT_LIMIT = 50;

/** De-duplicate an array of objects by id (keeps first occurrence). */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function useSafeQueryClient() {
  try {
    return useQueryClient();
  } catch {
    return null;
  }
}

/** List all leagues the current user belongs to. */
export function useLeaguesList() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: () => leagueService.list(),
    staleTime: 1000 * 60,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/** Fetch a single league with standings and members. */
export function useLeagueDetail(id: string) {
  const enabled = isUuid(id);
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => leagueService.getById(id),
    enabled,
  });
}

/** Fetch standings rows + movement map + computed timestamp. */
export function useLeagueStandings(id: string) {
  const enabled = isUuid(id);
  return useQuery({
    queryKey: KEYS.standings(id),
    queryFn: () => leagueService.getStandings(id),
    enabled,
  });
}

/** Fetch read-only public standings using a share token (works without auth). */
export function usePublicLeagueStandings(leagueId: string, token: string) {
  const enabled = isUuid(leagueId) && token.trim().length > 0;
  return useQuery({
    queryKey: KEYS.shareStandings(leagueId, token),
    queryFn: () => leagueService.getPublicStandingsByShareToken(leagueId, token),
    enabled,
    retry: false,
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

/** Enables tokenized standings sharing for a league. */
export function useEnableLeagueShare(leagueId: string) {
  return useMutation({
    mutationFn: () => leagueService.enableLeagueShare(leagueId),
  });
}

/** Disables tokenized standings sharing for a league. */
export function useDisableLeagueShare(leagueId: string) {
  return useMutation({
    mutationFn: () => leagueService.disableLeagueShare(leagueId),
  });
}

/** Send invites by email to a league. */
export function useCreateInvites(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (emails: string[]) => leagueService.createInvites(leagueId, emails),
    onSuccess: (results) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(leagueId) });
      toast.success(getInviteSuccessMessage(results));
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
    mutationFn: (inviteId: string) => leagueService.acceptInvite(inviteId),
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
    mutationFn: (inviteId: string) => leagueService.declineInvite(inviteId),
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
  const enabled = isUuid(leagueId);
  return useQuery({
    queryKey: KEYS.matches(leagueId),
    queryFn: () => leagueService.getMatches(leagueId),
    enabled,
  });
}

/** Create a league match (played/scheduled). */
export function useCreateLeagueMatch(leagueId: string) {
  const qc = useSafeQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLeagueMatchPayload) => leagueService.createMatch(leagueId, payload),
    onSuccess: () => {
      qc?.invalidateQueries({ queryKey: KEYS.matches(leagueId) });
      qc?.invalidateQueries({ queryKey: KEYS.standings(leagueId) });
      toast.success(LEAGUE_MATCH_CREATE_SUCCESS_MESSAGE);
    },
    onError: () => {
      toast.error('No se pudo cargar el partido. Intenta de nuevo.');
    },
  });
}

/** Capture a result for a scheduled league match. */
export function useCaptureLeagueMatchResult(leagueId: string) {
  const qc = useSafeQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      payload,
    }: {
      matchId: string;
      payload: CaptureLeagueMatchResultPayload;
    }) => leagueService.captureMatchResult(leagueId, matchId, payload),
    onSuccess: () => {
      qc?.invalidateQueries({ queryKey: KEYS.matches(leagueId) });
      qc?.invalidateQueries({ queryKey: KEYS.standings(leagueId) });
      toast.success(LEAGUE_MATCH_RESULT_SUCCESS_MESSAGE);
    },
    onError: (err) => {
      toast.error(getLeagueMatchResultErrorMessage(err));
    },
  });
}

/** Create a mini league with optional email invites. */
export function useCreateMiniLeague() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMiniLeaguePayload): Promise<CreateMiniLeagueResponse> =>
      leagueService.createMiniLeague(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
    },
  });
}

/** Fetch league challenges by scope (active/history). */
export function useLeagueChallenges(leagueId: string, scope: LeagueChallengeScope) {
  const enabled = isUuid(leagueId);
  return useQuery({
    queryKey: KEYS.challenges(leagueId, scope),
    queryFn: () => leagueService.getChallenges(leagueId, scope),
    enabled,
    staleTime: 1000 * 30,
  });
}

/** Fetch reservations eligible for league match reporting. */
export function useEligibleReservations(leagueId: string) {
  const enabled = isUuid(leagueId);
  return useQuery({
    queryKey: KEYS.eligibleReservations(leagueId),
    queryFn: () => leagueService.getEligibleReservations(leagueId),
    enabled,
  });
}

const REPORT_ERROR_MESSAGES: Record<string, string> = {
  LEAGUE_FORBIDDEN: 'Solo miembros pueden cargar resultados.',
  RESERVATION_NOT_ELIGIBLE: 'La reserva aún no es válida para cargar resultado.',
  LEAGUE_MEMBERS_MISSING: 'Los jugadores deben pertenecer a la liga.',
  MATCH_ALREADY_REPORTED: 'Ese partido ya fue cargado para esta liga.',
};
const LEAGUE_SETTINGS_FORBIDDEN_MESSAGE = 'No ten\u00E9s permisos para editar esta liga.';
const LEAGUE_REPORT_SUCCESS_MESSAGE = 'Resultado cargado. Falta confirmaci\u00F3n del rival.';
const LEAGUE_CHALLENGE_FORBIDDEN_MESSAGE = 'No ten\u00E9s permisos para desafiar en esta liga.';
const LEAGUE_MATCH_CREATE_SUCCESS_MESSAGE = 'Partido cargado.';
const LEAGUE_MATCH_RESULT_SUCCESS_MESSAGE = 'Resultado cargado.';
const LEAGUE_MATCH_RESULT_INVALID_PAYLOAD_MESSAGE =
  'Formato de resultado inválido. Volvé a cargar los sets.';
const INVITE_NOTIFICATION_MESSAGE = 'Invitación enviada. Le llegó una notificación.';
const INVITE_EMAIL_FALLBACK_MESSAGE =
  'Invitación enviada por email. La notificación aparecerá cuando el usuario cree su cuenta.';
const INVITE_MIXED_MESSAGE =
  'Invitaciones enviadas. Algunas llegaron como notificación y otras por email hasta que el usuario cree su cuenta.';

function getInviteSuccessMessage(results: LeagueInviteDispatchResult[]): string {
  if (!Array.isArray(results) || results.length === 0) {
    return '¡Invitaciones enviadas!';
  }

  const hasKnownUser = results.some(
    (result) => typeof result.invitedUserId === 'string' && result.invitedUserId.length > 0
  );
  const hasUnknownUser = results.some((result) => result.invitedUserId === null);

  if (hasKnownUser && hasUnknownUser) return INVITE_MIXED_MESSAGE;
  if (hasKnownUser) return INVITE_NOTIFICATION_MESSAGE;
  return INVITE_EMAIL_FALLBACK_MESSAGE;
}

function getLeagueMatchResultErrorMessage(err: unknown): string {
  if (err instanceof LeagueMatchResultPayloadError) {
    return LEAGUE_MATCH_RESULT_INVALID_PAYLOAD_MESSAGE;
  }
  if (axios.isAxiosError(err)) {
    const code = err.response?.data?.code as string | undefined;
    if (code === 'MATCH_RESULT_PAYLOAD_INVALID') {
      return LEAGUE_MATCH_RESULT_INVALID_PAYLOAD_MESSAGE;
    }
  }
  return 'No se pudo cargar el resultado. Intenta de nuevo.';
}

/** Report a league match from a reservation. */
export function useReportFromReservation(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReportFromReservationPayload) =>
      leagueService.reportFromReservation(leagueId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(leagueId) });
      qc.invalidateQueries({ queryKey: KEYS.matches(leagueId) });
      qc.invalidateQueries({ queryKey: KEYS.standings(leagueId) });
      toast.success(LEAGUE_REPORT_SUCCESS_MESSAGE);
    },
    onError: (err) => {
      let message = 'No se pudo cargar el resultado. Intenta de nuevo.';
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

/** Report a league match manually. */
export function useReportManual(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReportManualPayload) =>
      leagueService.reportManual(leagueId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(leagueId) });
      qc.invalidateQueries({ queryKey: KEYS.matches(leagueId) });
      qc.invalidateQueries({ queryKey: KEYS.standings(leagueId) });
      toast.success(LEAGUE_REPORT_SUCCESS_MESSAGE);
    },
    onError: (err) => {
      let message = 'No se pudo cargar el resultado. Intenta de nuevo.';
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

/** Create a new challenge in a league. */
export function useCreateLeagueChallenge(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLeagueChallengePayload) =>
      leagueService.createChallenge(leagueId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.challengesRoot(leagueId) });
      toast.success('Desafío enviado.');
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error(LEAGUE_CHALLENGE_FORBIDDEN_MESSAGE);
      } else {
        toast.error('No se pudo crear el desafío. Intenta de nuevo.');
      }
    },
  });
}

/** Accept a league challenge. */
export function useAcceptLeagueChallenge(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: string) => leagueService.acceptChallenge(challengeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.challengesRoot(leagueId) });
      toast.success('Desafío aceptado.');
    },
    onError: () => {
      toast.error('No se pudo aceptar el desafío.');
    },
  });
}

/** Decline a league challenge. */
export function useDeclineLeagueChallenge(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: string) => leagueService.declineChallenge(challengeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.challengesRoot(leagueId) });
      toast.success('Desafío rechazado.');
    },
    onError: () => {
      toast.error('No se pudo rechazar el desafío.');
    },
  });
}

/** Link a confirmed match to a challenge (optional flow). */
export function useLinkLeagueChallengeMatch(leagueId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, matchId }: { challengeId: string; matchId: string }) =>
      leagueService.linkChallengeMatch(challengeId, matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.challengesRoot(leagueId) });
      qc.invalidateQueries({ queryKey: KEYS.matches(leagueId) });
      toast.success('Desafío vinculado al partido.');
    },
    onError: () => {
      toast.error('No se pudo vincular el desafío.');
    },
  });
}

/** Fetch league settings (scoring, tie-breakers, sources). */
export function useLeagueSettings(leagueId: string) {
  const enabled = isUuid(leagueId);
  return useQuery({
    queryKey: KEYS.settings(leagueId),
    queryFn: () => leagueService.getSettings(leagueId),
    enabled,
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
      qc.invalidateQueries({ queryKey: KEYS.standings(leagueId) });
      toast.success('Reglas actualizadas. Tabla recalculada.');
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error(LEAGUE_SETTINGS_FORBIDDEN_MESSAGE);
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
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error(LEAGUE_SETTINGS_FORBIDDEN_MESSAGE);
      } else {
        toast.error('No se pudo actualizar el rol.');
      }
    },
  });
}

/** Paginated activity feed for a league. Uses cursor-based infinite query. */
export function useLeagueActivity(leagueId: string, limit = ACTIVITY_DEFAULT_LIMIT) {
  const enabled = isUuid(leagueId);
  return useInfiniteQuery({
    queryKey: KEYS.activity(leagueId, limit),
    queryFn: ({ pageParam }) =>
      leagueService.getActivity(leagueId, {
        limit,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 1000 * 30,
    select: (data: InfiniteData<ActivityResponse>) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: dedupeById(data.pages.flatMap((p) => p.items)),
    }),
  });
}

/** Pending match confirmations scoped to a specific league.
 * Falls back gracefully when the endpoint is not yet available (404/500). */
export function useLeaguePendingConfirmations(leagueId: string) {
  const enabled = isUuid(leagueId);
  return useQuery({
    queryKey: ['leagues', 'pending-confirmations', leagueId] as const,
    queryFn: () => leagueService.getLeaguePendingConfirmations(leagueId),
    enabled,
    staleTime: 1000 * 30,
    retry: false,
  });
}

/** Delete a league (upcoming + only member). Shows 409 error gracefully. */
export function useDeleteLeague() {
  const qc = useSafeQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => leagueService.deleteLeague(leagueId),
    onSuccess: () => {
      qc?.invalidateQueries({ queryKey: KEYS.list });
      toast.success('Liga eliminada.');
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error('No podés eliminar una liga con más miembros.');
      } else {
        toast.error('No se pudo eliminar la liga. Intentá de nuevo.');
      }
    },
  });
}

export const LEAGUE_QUERY_KEYS = KEYS;

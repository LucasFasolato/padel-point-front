import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationService } from '@/services/notification-service';
import { leagueService } from '@/services/league-service';
import type { AppNotification } from '@/types/notifications';

const KEYS = {
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread-count'] as const,
};

const DEFAULT_NOTIFICATION_LIMIT = 50;

type NotificationListSnapshots = Array<[readonly unknown[], AppNotification[] | undefined]>;
type NotificationMutationContext = {
  prevLists: NotificationListSnapshots;
  prevCount: number | undefined;
};

function countUnread(items: AppNotification[]): number {
  return items.reduce((acc, item) => (item.read ? acc : acc + 1), 0);
}

function getNotificationListSnapshots(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.getQueriesData<AppNotification[]>({
    queryKey: KEYS.list,
    exact: false,
  });
}

function rollbackNotificationLists(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: NotificationListSnapshots
) {
  for (const [key, value] of snapshots) {
    queryClient.setQueryData(key, value);
  }
}

function markNotificationAsReadInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
): boolean {
  let changed = false;

  queryClient.setQueriesData<AppNotification[]>(
    { queryKey: KEYS.list, exact: false },
    (old) => {
      if (!Array.isArray(old)) return old;

      let localChange = false;
      const next = old.map((item) => {
        if (item.id === id && !item.read) {
          localChange = true;
          changed = true;
          return { ...item, read: true };
        }
        return item;
      });

      return localChange ? next : old;
    }
  );

  return changed;
}

function markAllNotificationsAsReadInLists(
  queryClient: ReturnType<typeof useQueryClient>
): boolean {
  let changed = false;

  queryClient.setQueriesData<AppNotification[]>(
    { queryKey: KEYS.list, exact: false },
    (old) => {
      if (!Array.isArray(old)) return old;
      if (!old.some((item) => !item.read)) return old;

      changed = true;
      return old.map((item) => (item.read ? item : { ...item, read: true }));
    }
  );

  return changed;
}

export function useNotifications(limit: number = 50) {
  return useQuery({
    queryKey: [...KEYS.list, limit],
    queryFn: () => notificationService.list(limit),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUnreadCount(options?: { enabled?: boolean; limit?: number }) {
  const queryClient = useQueryClient();
  const limit = options?.limit ?? DEFAULT_NOTIFICATION_LIMIT;

  return useQuery({
    queryKey: KEYS.unread,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const exactList = queryClient.getQueryData<AppNotification[]>([...KEYS.list, limit]);
      if (Array.isArray(exactList)) {
        return countUnread(exactList);
      }

      const cachedList = queryClient
        .getQueriesData<AppNotification[]>({ queryKey: KEYS.list, exact: false })
        .find(([, value]) => Array.isArray(value))?.[1];
      if (Array.isArray(cachedList)) {
        return countUnread(cachedList);
      }

      const fetched = await queryClient.fetchQuery({
        queryKey: [...KEYS.list, limit],
        queryFn: () => notificationService.list(limit),
        staleTime: 1000 * 60 * 2,
      });

      return countUnread(Array.isArray(fetched) ? fetched : []);
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // polling fallback: every 60s
    placeholderData: 0,
    retry: 1, // fail fast — badge is non-critical, must never block navigation
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: KEYS.list });
      await queryClient.cancelQueries({ queryKey: KEYS.unread });

      const prevLists = getNotificationListSnapshots(queryClient);
      const prevCount = queryClient.getQueryData<number>(KEYS.unread);
      const changed = markNotificationAsReadInLists(queryClient, id);

      if (changed && typeof prevCount === 'number' && prevCount > 0) {
        queryClient.setQueryData<number>(KEYS.unread, prevCount - 1);
      }

      return { prevLists, prevCount } satisfies NotificationMutationContext;
    },
    onError: (_err, _id, context) => {
      if (context?.prevLists) {
        rollbackNotificationLists(queryClient, context.prevLists);
      }
      if (typeof context?.prevCount === 'number') {
        queryClient.setQueryData(KEYS.unread, context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list });
      queryClient.invalidateQueries({ queryKey: KEYS.unread });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: KEYS.list });
      await queryClient.cancelQueries({ queryKey: KEYS.unread });

      const prevLists = getNotificationListSnapshots(queryClient);
      const prevCount = queryClient.getQueryData<number>(KEYS.unread);
      const changed = markAllNotificationsAsReadInLists(queryClient);

      if (changed) {
        queryClient.setQueryData<number>(KEYS.unread, 0);
      }

      return { prevLists, prevCount } satisfies NotificationMutationContext;
    },
    onError: (_err, _vars, context) => {
      if (context?.prevLists) {
        rollbackNotificationLists(queryClient, context.prevLists);
      }
      if (typeof context?.prevCount === 'number') {
        queryClient.setQueryData(KEYS.unread, context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list });
      queryClient.invalidateQueries({ queryKey: KEYS.unread });
    },
  });
}

interface InviteActionParams {
  notificationId: string;
  inviteId: string;
}

/**
 * Accept a league invite from a notification.
 * Optimistically marks as read, invalidates caches, shows toast.
 */
export function useAcceptNotificationInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteId }: InviteActionParams) => {
      await leagueService.acceptInvite(inviteId);
    },
    onMutate: async ({ notificationId }) => {
      await queryClient.cancelQueries({ queryKey: KEYS.list });
      await queryClient.cancelQueries({ queryKey: KEYS.unread });

      const prevLists = getNotificationListSnapshots(queryClient);
      const prevCount = queryClient.getQueryData<number>(KEYS.unread);
      const changed = markNotificationAsReadInLists(queryClient, notificationId);

      if (changed && typeof prevCount === 'number' && prevCount > 0) {
        queryClient.setQueryData<number>(KEYS.unread, prevCount - 1);
      }

      return { prevLists, prevCount } satisfies NotificationMutationContext;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list });
      queryClient.invalidateQueries({ queryKey: KEYS.unread });
      queryClient.invalidateQueries({ queryKey: ['leagues', 'list'] });
      toast.success('¡Te uniste a la liga!');
    },
    onError: (_err, _vars, context) => {
      if (context?.prevLists) {
        rollbackNotificationLists(queryClient, context.prevLists);
      }
      if (typeof context?.prevCount === 'number') {
        queryClient.setQueryData(KEYS.unread, context.prevCount);
      }
      toast.error('No se pudo aceptar la invitación.');
    },
  });
}

/**
 * Decline a league invite from a notification.
 * Optimistically marks as read, invalidates caches, shows toast.
 */
export function useDeclineNotificationInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteId }: InviteActionParams) => {
      await leagueService.declineInvite(inviteId);
    },
    onMutate: async ({ notificationId }) => {
      await queryClient.cancelQueries({ queryKey: KEYS.list });
      await queryClient.cancelQueries({ queryKey: KEYS.unread });

      const prevLists = getNotificationListSnapshots(queryClient);
      const prevCount = queryClient.getQueryData<number>(KEYS.unread);
      const changed = markNotificationAsReadInLists(queryClient, notificationId);

      if (changed && typeof prevCount === 'number' && prevCount > 0) {
        queryClient.setQueryData<number>(KEYS.unread, prevCount - 1);
      }

      return { prevLists, prevCount } satisfies NotificationMutationContext;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list });
      queryClient.invalidateQueries({ queryKey: KEYS.unread });
      toast.success('Invitación rechazada.');
    },
    onError: (_err, _vars, context) => {
      if (context?.prevLists) {
        rollbackNotificationLists(queryClient, context.prevLists);
      }
      if (typeof context?.prevCount === 'number') {
        queryClient.setQueryData(KEYS.unread, context.prevCount);
      }
      toast.error('No se pudo rechazar la invitación.');
    },
  });
}

/** Exported keys for external cache manipulation (e.g. realtime handler) */
export const NOTIFICATION_QUERY_KEYS = KEYS;

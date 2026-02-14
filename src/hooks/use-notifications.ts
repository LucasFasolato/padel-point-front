import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationService } from '@/services/notification-service';
import { leagueService } from '@/services/league-service';
import type { AppNotification } from '@/types/notifications';

const KEYS = {
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread-count'] as const,
};

export function useNotifications(limit: number = 50) {
  return useQuery({
    queryKey: [...KEYS.list, limit],
    queryFn: () => notificationService.list(limit),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.unread,
    queryFn: () => notificationService.getUnreadCount(),
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
      // Optimistic: mark item as read in list cache
      await queryClient.cancelQueries({ queryKey: KEYS.list });
      await queryClient.cancelQueries({ queryKey: KEYS.unread });

      const prevList = queryClient.getQueryData<AppNotification[]>([...KEYS.list, 50]);
      const prevCount = queryClient.getQueryData<number>(KEYS.unread);

      if (Array.isArray(prevList)) {
        queryClient.setQueryData<AppNotification[]>(
          [...KEYS.list, 50],
          prevList.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
      if (typeof prevCount === 'number' && prevCount > 0) {
        queryClient.setQueryData<number>(KEYS.unread, prevCount - 1);
      }

      return { prevList, prevCount };
    },
    onError: (_err, _id, context) => {
      // Rollback
      if (Array.isArray(context?.prevList)) {
        queryClient.setQueryData([...KEYS.list, 50], context.prevList);
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

      const prevList = queryClient.getQueryData<AppNotification[]>([...KEYS.list, 50]);
      const prevCount = queryClient.getQueryData<number>(KEYS.unread);

      if (Array.isArray(prevList)) {
        queryClient.setQueryData<AppNotification[]>(
          [...KEYS.list, 50],
          prevList.map((n) => ({ ...n, read: true }))
        );
      }
      queryClient.setQueryData<number>(KEYS.unread, 0);

      return { prevList, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (Array.isArray(context?.prevList)) {
        queryClient.setQueryData([...KEYS.list, 50], context.prevList);
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
      // Optimistically mark as read + decrement count
      await queryClient.cancelQueries({ queryKey: KEYS.list });
      await queryClient.cancelQueries({ queryKey: KEYS.unread });

      const prevList = queryClient.getQueryData<AppNotification[]>([...KEYS.list, 50]);
      const prevCount = queryClient.getQueryData<number>(KEYS.unread);

      if (Array.isArray(prevList)) {
        queryClient.setQueryData<AppNotification[]>(
          [...KEYS.list, 50],
          prevList.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
      if (typeof prevCount === 'number' && prevCount > 0) {
        queryClient.setQueryData<number>(KEYS.unread, prevCount - 1);
      }

      return { prevList, prevCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list });
      queryClient.invalidateQueries({ queryKey: KEYS.unread });
      queryClient.invalidateQueries({ queryKey: ['leagues', 'list'] });
      toast.success('¡Te uniste a la liga!');
    },
    onError: (_err, _vars, context) => {
      // Rollback optimistic update
      if (Array.isArray(context?.prevList)) {
        queryClient.setQueryData([...KEYS.list, 50], context.prevList);
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

      const prevList = queryClient.getQueryData<AppNotification[]>([...KEYS.list, 50]);
      const prevCount = queryClient.getQueryData<number>(KEYS.unread);

      if (Array.isArray(prevList)) {
        queryClient.setQueryData<AppNotification[]>(
          [...KEYS.list, 50],
          prevList.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
      if (typeof prevCount === 'number' && prevCount > 0) {
        queryClient.setQueryData<number>(KEYS.unread, prevCount - 1);
      }

      return { prevList, prevCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list });
      queryClient.invalidateQueries({ queryKey: KEYS.unread });
      toast.success('Invitación rechazada.');
    },
    onError: (_err, _vars, context) => {
      if (Array.isArray(context?.prevList)) {
        queryClient.setQueryData([...KEYS.list, 50], context.prevList);
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

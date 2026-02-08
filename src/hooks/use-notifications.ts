import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification-service';
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

      if (prevList) {
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
      if (context?.prevList) {
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

      if (prevList) {
        queryClient.setQueryData<AppNotification[]>(
          [...KEYS.list, 50],
          prevList.map((n) => ({ ...n, read: true }))
        );
      }
      queryClient.setQueryData<number>(KEYS.unread, 0);

      return { prevList, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevList) {
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

/** Exported keys for external cache manipulation (e.g. realtime handler) */
export const NOTIFICATION_QUERY_KEYS = KEYS;

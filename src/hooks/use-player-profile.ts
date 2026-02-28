import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PlayerService, type UpdateMyPlayerProfilePayload } from '@/services/player-service';

export type AccountProfile = {
  userId?: string;
  displayName?: string | null;
  phone?: string | null;
  email: string;
};

export type UpdateAccountProfilePayload = {
  displayName?: string | null;
  phone?: string | null;
};

export const MY_ACCOUNT_PROFILE_QUERY_KEY = ['me', 'profile'] as const;

export const MY_PLAYER_PROFILE_QUERY_KEY = ['players', 'me', 'profile'] as const;

export function useMyPlayerProfile() {
  return useQuery({
    queryKey: MY_PLAYER_PROFILE_QUERY_KEY,
    queryFn: () => PlayerService.getMyPlayerProfile(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateMyPlayerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMyPlayerProfilePayload) => PlayerService.updateMyPlayerProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(MY_PLAYER_PROFILE_QUERY_KEY, data);
    },
  });
}

export function useMyAccountProfile() {
  return useQuery<AccountProfile>({
    queryKey: MY_ACCOUNT_PROFILE_QUERY_KEY,
    queryFn: () => api.get<AccountProfile>('/me/profile').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateMyAccountProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAccountProfilePayload) =>
      api.patch<AccountProfile>('/me/profile', payload).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(MY_ACCOUNT_PROFILE_QUERY_KEY, data);
    },
  });
}

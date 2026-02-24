import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayerService, type UpdateMyPlayerProfilePayload } from '@/services/player-service';

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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { intentsService } from '@/services/intents-service';
import type { IntentKind } from '@/services/intents-service';
import { sortIntentsByRecency } from '@/lib/intents';
import type { UserIntent } from '@/types/competitive';

const OPTIMISTIC_KEY = ['intents', 'created-optimistic'] as const;
const INTENTS_ROOT_KEY = ['intents', 'me'] as const;

export interface UseIntentsOptions {
  leagueId?: string;
}

export interface UseIntentsResult {
  items: UserIntent[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useIntents(options: UseIntentsOptions = {}): UseIntentsResult {
  const leagueId = options.leagueId?.trim() || undefined;

  const intentsQ = useQuery({
    queryKey: [...INTENTS_ROOT_KEY, { leagueId: leagueId ?? null }],
    queryFn: () => intentsService.list({ leagueId }),
    staleTime: 1000 * 30,
  });

  const { data: optimisticItems = [] } = useQuery<UserIntent[]>({
    queryKey: OPTIMISTIC_KEY,
    queryFn: () => [],
    enabled: false,
    staleTime: Infinity,
  });

  const scopedOptimistic = optimisticItems.filter((intent) =>
    leagueId ? intent.leagueId === leagueId : true
  );

  // Server-side filtering is attempted via query params; this is a fallback.
  const scopedServerItems = (intentsQ.data ?? []).filter((intent) =>
    leagueId ? intent.leagueId === leagueId : true
  );

  const items = [...scopedOptimistic, ...scopedServerItems].sort(sortIntentsByRecency);

  return {
    items,
    isLoading: intentsQ.isLoading,
    isError: intentsQ.isError,
    refetch: () => {
      void intentsQ.refetch();
    },
  };
}

export interface CreateIntentParams {
  type: IntentKind;
  matchType?: 'COMPETITIVE' | 'FRIENDLY';
  message?: string;
  expiresInHours?: number;
  leagueId?: string;
}

const INTENT_SUBTITLES: Record<IntentKind, string> = {
  DIRECT: 'Desafio directo',
  OPEN: 'Desafio abierto',
  FIND_PARTNER: 'Buscas companero',
};

export function useCreateIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateIntentParams) => {
      const base = { matchType: params.matchType, message: params.message, leagueId: params.leagueId };
      switch (params.type) {
        case 'DIRECT':
          return intentsService.createDirect(base);
        case 'OPEN':
          return intentsService.createOpen({ ...base, expiresInHours: params.expiresInHours });
        case 'FIND_PARTNER':
          return intentsService.createFindPartner({ ...base, expiresInHours: params.expiresInHours });
      }
    },

    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: OPTIMISTIC_KEY });
      const snapshot = queryClient.getQueryData<UserIntent[]>(OPTIMISTIC_KEY);

      const optimisticId = `optimistic:${Date.now()}`;
      const optimisticIntent: UserIntent = {
        id: optimisticId,
        intentType: 'CREATED_INTENT',
        status: 'active',
        actorName: 'Vos',
        subtitle: INTENT_SUBTITLES[params.type],
        createdAt: new Date().toISOString(),
        leagueId: params.leagueId ?? null,
      };

      queryClient.setQueryData<UserIntent[]>(OPTIMISTIC_KEY, (old) => [
        optimisticIntent,
        ...(old ?? []),
      ]);

      return { snapshot, optimisticId };
    },

    onSuccess: (_data, _vars, context) => {
      toast.success('Desafio creado', { description: 'Buscamos rival para vos' });

      setTimeout(() => {
        queryClient.setQueryData<UserIntent[]>(OPTIMISTIC_KEY, (old) =>
          (old ?? []).filter((item) => item.id !== context?.optimisticId)
        );
      }, 4000);

      queryClient.invalidateQueries({ queryKey: ['intents'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(OPTIMISTIC_KEY, context?.snapshot ?? []);
    },
  });
}


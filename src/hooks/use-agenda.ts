'use client';

import { useState, useCallback } from 'react';
import { AvailabilityService } from '@/services/availability-service';
import type { AgendaResponse, BlockSlotPayload } from '@/types/availability';

type UseAgendaState = {
  data: AgendaResponse | null;
  loading: boolean;
  error: string | null;
};

export function useAgenda(clubId: string | undefined) {
  const [state, setState] = useState<UseAgendaState>({
    data: null,
    loading: false,
    error: null,
  });

  const [blocking, setBlocking] = useState(false);

  const fetchAgenda = useCallback(
    async (date: string) => {
      if (!clubId) {
        setState({ data: null, loading: false, error: 'Club no seleccionado' });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await AvailabilityService.getAgenda(clubId, date, 'full');
        setState({ data, loading: false, error: null });
      } catch (err: unknown) {
        const status =
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;

        let error = 'Error al cargar la agenda';
        if (status === 401) error = 'Sesión expirada';
        if (status === 403) error = 'Sin permisos para ver la agenda';
        if (status === 404) error = 'Club no encontrado';

        setState({ data: null, loading: false, error });
      }
    },
    [clubId]
  );

  const blockSlot = useCallback(
    async (payload: BlockSlotPayload) => {
      if (!clubId) return { ok: false, error: 'Club no seleccionado' };

      setBlocking(true);
      try {
        const result = await AvailabilityService.blockSlot(clubId, payload);
        return { ok: true, overrideId: result.overrideId };
      } catch (err: unknown) {
        const message =
          typeof err === 'object' && err !== null && 'response' in err
            ? ((err as { response?: { data?: { message?: string } } }).response
                ?.data?.message ?? 'Error al bloquear el slot')
            : 'Error al bloquear el slot';
        return { ok: false, error: message };
      } finally {
        setBlocking(false);
      }
    },
    [clubId]
  );

  const unblockSlot = useCallback(
    async (overrideId: string) => {
      if (!clubId) return { ok: false, error: 'Club no seleccionado' };

      setBlocking(true);
      try {
        await AvailabilityService.updateBlock(clubId, overrideId, {
          blocked: false,
        });
        return { ok: true };
      } catch {
        return { ok: false, error: 'Error al desbloquear el slot' };
      } finally {
        setBlocking(false);
      }
    },
    [clubId]
  );

  return {
    ...state,
    fetchAgenda,
    blockSlot,
    unblockSlot,
    blocking,
  };
}
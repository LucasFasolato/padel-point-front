'use client';

import { useState, useCallback } from 'react';
import { AvailabilityService } from '@/services/availability-service';
import type {
  AvailabilityRule,
  CreateRulePayload,
  BulkCreateRulesPayload,
} from '@/types/availability';

type UseRulesState = {
  rules: AvailabilityRule[];
  loading: boolean;
  error: string | null;
};

export function useAvailabilityRules() {
  const [state, setState] = useState<UseRulesState>({
    rules: [],
    loading: false,
    error: null,
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRules = useCallback(async (courtId: string) => {
    if (!courtId) {
      setState({ rules: [], loading: false, error: 'Cancha no seleccionada' });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const rules = await AvailabilityService.getRulesByCourt(courtId);
      setState({ rules, loading: false, error: null });
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      let error = 'Error al cargar las reglas';
      if (status === 401) error = 'Sesión expirada';
      if (status === 403) error = 'Sin permisos';

      setState({ rules: [], loading: false, error });
    }
  }, []);

  const createRule = useCallback(async (payload: CreateRulePayload) => {
    setSaving(true);
    try {
      const newRule = await AvailabilityService.createRule(payload);
      setState((prev) => ({
        ...prev,
        rules: [...prev.rules, newRule],
      }));
      return { ok: true, rule: newRule };
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? 'Error al crear la regla')
          : 'Error al crear la regla';
      return { ok: false, error: message };
    } finally {
      setSaving(false);
    }
  }, []);

  const createRulesBulk = useCallback(async (payload: BulkCreateRulesPayload) => {
    setSaving(true);
    try {
      const result = await AvailabilityService.createRulesBulk(payload);
      setState((prev) => ({
        ...prev,
        rules: [...prev.rules, ...result.rules],
      }));
      return { ok: true, created: result.created };
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? 'Error al crear las reglas')
          : 'Error al crear las reglas';
      return { ok: false, error: message };
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteRule = useCallback(async (ruleId: string) => {
    setDeleting(ruleId);
    try {
      await AvailabilityService.deleteRule(ruleId);
      setState((prev) => ({
        ...prev,
        rules: prev.rules.filter((r) => r.id !== ruleId),
      }));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error al eliminar la regla' };
    } finally {
      setDeleting(null);
    }
  }, []);

  return {
    ...state,
    fetchRules,
    createRule,
    createRulesBulk,
    deleteRule,
    saving,
    deleting,
  };
}
import api from '@/lib/api';
import type {
  AgendaResponse,
  AvailabilityRule,
  CreateRulePayload,
  BulkCreateRulesPayload,
  BlockSlotPayload,
} from '@/types/availability';

export const AvailabilityService = {
  // ==========================================================================
  // AGENDA (Daily view)
  // ==========================================================================

  /**
   * Get daily agenda for a club
   * @param clubId - Club UUID
   * @param date - Date in YYYY-MM-DD format
   * @param mode - 'full' for detailed statuses, 'simple' for grouped
   */
  getAgenda: async (
    clubId: string,
    date: string,
    mode: 'full' | 'simple' = 'full'
  ): Promise<AgendaResponse> => {
    const { data } = await api.get<AgendaResponse>(`/clubs/${clubId}/agenda`, {
      params: { date, mode },
    });
    return data;
  },

  /**
   * Block a slot in the agenda
   */
  blockSlot: async (
    clubId: string,
    payload: BlockSlotPayload
  ): Promise<{ ok: boolean; overrideId: string }> => {
    const { data } = await api.post(`/clubs/${clubId}/agenda/block`, payload);
    return data;
  },

  /**
   * Update an existing block
   */
  updateBlock: async (
    clubId: string,
    overrideId: string,
    payload: { blocked: boolean; reason?: string }
  ): Promise<{ ok: boolean; overrideId: string; blocked: boolean }> => {
    const { data } = await api.patch(
      `/clubs/${clubId}/agenda/blocks/${overrideId}`,
      payload
    );
    return data;
  },

  // ==========================================================================
  // RULES (Weekly configuration)
  // ==========================================================================

  /**
   * Get all rules for a court
   */
  getRulesByCourt: async (courtId: string): Promise<AvailabilityRule[]> => {
    const { data } = await api.get<AvailabilityRule[]>(
      `/availability/rules/court/${courtId}`
    );
    return data;
  },

  /**
   * Create a single rule
   */
  createRule: async (payload: CreateRulePayload): Promise<AvailabilityRule> => {
    const { data } = await api.post<AvailabilityRule>(
      '/availability/rules',
      payload
    );
    return data;
  },

  /**
   * Create rules in bulk (multiple days at once)
   */
  createRulesBulk: async (
    payload: BulkCreateRulesPayload
  ): Promise<{ created: number; rules: AvailabilityRule[] }> => {
    const { data } = await api.post('/availability/rules/bulk', payload);
    return data;
  },

  /**
   * Delete a rule
   */
  deleteRule: async (ruleId: string): Promise<void> => {
    await api.delete(`/availability/rules/${ruleId}`);
  },

  // ==========================================================================
  // OVERRIDES (Specific date blocks)
  // ==========================================================================

  /**
   * Create an override (block/unblock specific date)
   */
  createOverride: async (payload: {
    courtId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    bloqueado?: boolean;
    motivo?: string;
  }): Promise<{ id: string }> => {
    const { data } = await api.post('/availability/overrides', payload);
    return data;
  },

  /**
   * Delete an override
   */
  deleteOverride: async (overrideId: string): Promise<void> => {
    await api.delete(`/availability/overrides/${overrideId}`);
  },
};
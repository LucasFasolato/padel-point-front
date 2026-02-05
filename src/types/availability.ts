// =============================================================================
// AVAILABILITY TYPES
// =============================================================================

export type AgendaSlotStatus = 'free' | 'blocked' | 'hold' | 'confirmed' | 'occupied';

export type AgendaSlot = {
  startAt: string;
  endAt: string;
  status: AgendaSlotStatus;
  reservationId?: string;
  customerName?: string;
  customerPhone?: string;
  blockReason?: string;
};

export type AgendaCourt = {
  courtId: string;
  name: string;
  slots: AgendaSlot[];
};

export type AgendaResponse = {
  date: string;
  clubId: string;
  courts: AgendaCourt[];
};

export type AvailabilityRule = {
  id: string;
  courtId: string;
  courtNombre?: string;
  diaSemana: number; // 0=domingo ... 6=sábado
  horaInicio: string; // HH:MM
  horaFin: string; // HH:MM
  slotMinutos: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateRulePayload = {
  courtId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  slotMinutos: number;
  activo?: boolean;
};

export type BulkCreateRulesPayload = {
  courtId: string;
  diasSemana: number[];
  horaInicio: string;
  horaFin: string;
  slotMinutos: number;
  activo?: boolean;
};

export type CreateOverridePayload = {
  courtId: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string;
  horaFin: string;
  bloqueado?: boolean;
  motivo?: string;
};

export type BlockSlotPayload = {
  courtId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  reason?: string;
  blocked?: boolean;
};

// Day of week helpers
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
] as const;

export const getDayLabel = (day: number): string => {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? '';
};

export const getDayShort = (day: number): string => {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.short ?? '';
};
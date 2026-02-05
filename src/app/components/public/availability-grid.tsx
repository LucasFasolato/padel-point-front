'use client';

import { motion } from 'framer-motion';
import type { AvailabilitySlot } from '@/types';
import { cn } from '@/lib/utils';
import { Lock, Clock, AlertTriangle, Timer } from 'lucide-react';

interface AvailabilityGridProps {
  slots: AvailabilitySlot[];
  loading: boolean;
  onSelect: (slot: AvailabilitySlot) => void;
  price?: number;

  // ✅ mejoras UX
  selectedSlot?: AvailabilitySlot | null;
  holdState?: 'idle' | 'creating' | 'held' | 'error';
  secondsLeft?: number; // opcional (si querés mostrar timer en el slot)
}

type SlotStatus = 'available' | 'reserved' | 'blocked';

function hourToNumber(hhmm: string) {
  const [h] = hhmm.split(':').map(Number);
  return Number.isFinite(h) ? h : 0;
}

function getPeriod(hhmm: string): 'mañana' | 'tarde' | 'noche' {
  const h = hourToNumber(hhmm);
  if (h < 12) return 'mañana';
  if (h < 18) return 'tarde';
  return 'noche';
}

function getStatus(slot: AvailabilitySlot): SlotStatus {
  if (!slot.ocupado) return 'available';
  if (slot.motivoBloqueo) return 'blocked';
  return 'reserved';
}

function getTooltip(slot: AvailabilitySlot): string {
  if (!slot.ocupado) return `Disponible ${slot.horaInicio}–${slot.horaFin}`;
  if (slot.motivoBloqueo) return `Bloqueado: ${slot.motivoBloqueo}`;
  return 'Reservado';
}

function sortSlots(slots: AvailabilitySlot[]) {
  return [...slots].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

function slotSignature(s: AvailabilitySlot) {
  return `${s.courtId}|${s.fecha}|${s.horaInicio}|${s.horaFin}`;
}

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AvailabilityGrid({
  slots,
  loading,
  onSelect,
  price = 32000,
  selectedSlot = null,
  holdState = 'idle',
  secondsLeft,
}: AvailabilityGridProps) {
  // 1) Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  // 2) Empty state
  if (!slots || slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
        <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
          <Clock className="text-slate-400" size={24} />
        </div>
        <p className="font-medium text-slate-900">No hay turnos disponibles</p>
        <p className="text-sm text-slate-500">Probá cambiando la fecha.</p>
      </div>
    );
  }

  const sorted = sortSlots(slots);

  // 3) Dedup por firma (mismo horario exacto)
  const seen = new Set<string>();
  const unique: AvailabilitySlot[] = [];
  for (const s of sorted) {
    const sig = slotSignature(s);
    if (seen.has(sig)) continue;
    seen.add(sig);
    unique.push(s);
  }

  // 4) Group
  const groups: Record<'mañana' | 'tarde' | 'noche', AvailabilitySlot[]> = {
    mañana: [],
    tarde: [],
    noche: [],
  };
  for (const s of unique) {
    groups[getPeriod(s.horaInicio)].push(s);
  }

  const sections: Array<{ key: 'mañana' | 'tarde' | 'noche'; label: string }> = [
    { key: 'mañana', label: 'Mañana' },
    { key: 'tarde', label: 'Tarde' },
    { key: 'noche', label: 'Noche' },
  ];

  return (
    <div className="space-y-6">
      {sections.map((sec) => {
        const secSlots = groups[sec.key];
        if (secSlots.length === 0) return null;

        return (
          <div key={sec.key}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {sec.label}
              </p>

              <div className="hidden items-center gap-3 text-[11px] text-slate-400 sm:flex">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500/70" /> Disponible
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-300" /> Ocupado
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {secSlots.map((slot, idx) => {
                const status = getStatus(slot);
                const locked = status !== 'available';
                const tooltip = getTooltip(slot);

                const isSelected =
                  holdState === 'held' &&
                  selectedSlot != null &&
                  slotSignature(slot) === slotSignature(selectedSlot);

                const subLabel =
                  isSelected
                    ? 'Retenido'
                    : status === 'available'
                    ? `$ ${price.toLocaleString()}`
                    : status === 'blocked'
                    ? 'Bloqueado'
                    : 'Reservado';

                // key 100% estable: la firma sola debería ser única post-dedup
                const key = slotSignature(slot);

                return (
                  <motion.button
                    key={key}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                    onClick={() => !locked && onSelect(slot)}
                    disabled={locked}
                    title={tooltip}
                    aria-label={tooltip}
                    className={cn(
                      'group relative flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all duration-200',

                      // ✅ Selected hold slot
                      isSelected &&
                        'border-blue-500 bg-blue-50 shadow-sm',

                      // normal locked / available
                      !isSelected &&
                        (locked
                          ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-80'
                          : 'border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:border-blue-500 hover:shadow-md active:scale-95 active:shadow-sm')
                    )}
                  >
                    {/* top-right tiny dot */}
                    {!locked && !isSelected && (
                      <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200 backdrop-blur">
                        <Timer size={12} />
                        {typeof secondsLeft === 'number'
                          ? formatMMSS(Math.max(0, secondsLeft))
                          : 'Retenido'}
                      </div>
                    )}

                    {/* Time */}
                    <span
                      className={cn(
                        'text-lg font-bold tracking-tight',
                        locked ? 'text-slate-400' : 'text-slate-700 group-hover:text-blue-600',
                        isSelected && 'text-blue-700'
                      )}
                    >
                      {slot.horaInicio}
                    </span>

                    {/* Subtext */}
                    <span className="mt-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider">
                      {locked ? (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Lock size={10} />
                          {subLabel}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'transition-colors',
                            isSelected
                              ? 'text-blue-700'
                              : 'text-slate-500 group-hover:text-blue-500'
                          )}
                        >
                          {subLabel}
                        </span>
                      )}
                    </span>

                    {/* Block hint */}
                    {status === 'blocked' && slot.motivoBloqueo && (
                      <div className="absolute left-2 top-2 hidden items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500 backdrop-blur sm:flex">
                        <AlertTriangle size={10} />
                        Bloq.
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

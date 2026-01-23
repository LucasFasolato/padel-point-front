'use client';

import { motion } from 'framer-motion';
import { AvailabilitySlot } from '@/types';
import { cn } from '@/lib/utils';
import { Lock, Clock, AlertTriangle } from 'lucide-react';

interface AvailabilityGridProps {
  slots: AvailabilitySlot[];
  loading: boolean;
  onSelect: (slot: AvailabilitySlot) => void;
  price?: number;
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
  // orden simple por horaInicio (HH:mm lexicográfico funciona)
  return [...slots].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

export function AvailabilityGrid({
  slots,
  loading,
  onSelect,
  price = 32000,
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

  // 3) Group by period (mañana/tarde/noche)
  const sorted = sortSlots(slots);

  // elimina slots idénticos (mismo horario)
  const seen = new Set<string>();
  const unique: AvailabilitySlot[] = [];

  for (const s of sorted) {
    const signature = `${s.courtId}|${s.fecha}|${s.horaInicio}|${s.horaFin}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    unique.push(s);
  }
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

              {/* Micro-leyenda opcional */}
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

                const subLabel =
                  status === 'available'
                    ? `$ ${price.toLocaleString()}`
                    : status === 'blocked'
                    ? 'Bloqueado'
                    : 'Reservado';

                const keyBase = `${slot.courtId}-${slot.fecha}-${slot.horaInicio}-${slot.horaFin}`;
                const key = `${keyBase}-${slot.ruleId ?? 'r'}-${idx}`;

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

                      locked
                        ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-80'
                        : 'border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:border-blue-500 hover:shadow-md active:scale-95 active:shadow-sm'
                    )}
                  >
                    {/* Time */}
                    <span
                      className={cn(
                        'text-lg font-bold tracking-tight',
                        locked
                          ? 'text-slate-400'
                          : 'text-slate-700 group-hover:text-blue-600'
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
                        <span className="text-slate-500 transition-colors group-hover:text-blue-500">
                          {subLabel}
                        </span>
                      )}
                    </span>

                    {/* Indicator */}
                    {!locked && (
                      <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}

                    {/* Block reason hint (tiny) */}
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

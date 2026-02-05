'use client';

import { motion } from 'framer-motion';
import type { AvailabilitySlot } from '@/types';
import { cn } from '@/lib/utils';
import { Lock, Clock, AlertTriangle, Timer, Check } from 'lucide-react';

interface AvailabilityGridProps {
  slots: AvailabilitySlot[];
  loading: boolean;
  onSelect: (slot: AvailabilitySlot) => void;
  price?: number;
  selectedSlot?: AvailabilitySlot | null;
  holdState?: 'idle' | 'creating' | 'held' | 'error';
  secondsLeft?: number;
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

function formatPrice(price: number) {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${price.toLocaleString('es-AR')}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export function AvailabilityGrid({
  slots,
  loading,
  onSelect,
  price = 32000,
  selectedSlot = null,
  holdState = 'idle',
  secondsLeft,
}: AvailabilityGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-xl border border-slate-100 bg-slate-50"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (!slots || slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-14 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <Clock className="text-slate-300" size={26} />
        </div>
        <p className="font-semibold text-slate-900">Sin turnos disponibles</p>
        <p className="mt-1 text-sm text-slate-500">Probá seleccionando otra fecha.</p>
      </div>
    );
  }

  const sorted = sortSlots(slots);

  // Dedup
  const seen = new Set<string>();
  const unique: AvailabilitySlot[] = [];
  for (const s of sorted) {
    const sig = slotSignature(s);
    if (seen.has(sig)) continue;
    seen.add(sig);
    unique.push(s);
  }

  // Group by period
  const groups: Record<'mañana' | 'tarde' | 'noche', AvailabilitySlot[]> = {
    mañana: [],
    tarde: [],
    noche: [],
  };
  for (const s of unique) {
    groups[getPeriod(s.horaInicio)].push(s);
  }

  const sections: Array<{ key: 'mañana' | 'tarde' | 'noche'; label: string; icon: string }> = [
    { key: 'mañana', label: 'Mañana', icon: '🌅' },
    { key: 'tarde', label: 'Tarde', icon: '☀️' },
    { key: 'noche', label: 'Noche', icon: '🌙' },
  ];

  return (
    <div className="space-y-5">
      {sections.map((sec) => {
        const secSlots = groups[sec.key];
        if (secSlots.length === 0) return null;

        return (
          <div key={sec.key}>
            {/* Section Header */}
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{sec.icon}</span>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {sec.label}
                </p>
              </div>

              {/* Legend (desktop only) */}
              <div className="hidden items-center gap-4 text-[10px] text-slate-400 sm:flex">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Disponible
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  Ocupado
                </span>
              </div>
            </div>

            {/* Slots Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5"
            >
              {secSlots.map((slot) => {
                const status = getStatus(slot);
                const locked = status !== 'available';
                const tooltip = getTooltip(slot);

                const isSelected =
                  selectedSlot != null && slotSignature(slot) === slotSignature(selectedSlot);

                const isHeld = holdState === 'held' && isSelected;

                const subLabel = isHeld
                  ? 'Retenido'
                  : status === 'available'
                  ? formatPrice(price)
                  : status === 'blocked'
                  ? 'Bloqueado'
                  : 'Reservado';

                const key = slotSignature(slot);

                return (
                  <motion.button
                    key={key}
                    variants={itemVariants}
                    onClick={() => !locked && onSelect(slot)}
                    disabled={locked}
                    title={tooltip}
                    aria-label={tooltip}
                    whileHover={!locked ? { y: -2, scale: 1.02 } : {}}
                    whileTap={!locked ? { scale: 0.98 } : {}}
                    className={cn(
                      'group relative flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all duration-200',

                      // Held state
                      isHeld &&
                        'border-blue-400 bg-blue-50 shadow-md shadow-blue-500/10 ring-2 ring-blue-400/30',

                      // Selected (not held yet)
                      isSelected &&
                        !isHeld &&
                        'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20',

                      // Locked
                      !isSelected &&
                        locked &&
                        'cursor-not-allowed border-slate-100 bg-slate-50/80 opacity-60',

                      // Available
                      !isSelected &&
                        !locked &&
                        'border-slate-200 bg-white shadow-sm hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/5'
                    )}
                  >
                    {/* Availability indicator dot */}
                    {!locked && !isSelected && (
                      <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-70 transition-all group-hover:scale-125 group-hover:opacity-100" />
                    )}

                    {/* Held badge with timer */}
                    {isHeld && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg"
                      >
                        <Timer size={10} />
                        {typeof secondsLeft === 'number' ? formatMMSS(Math.max(0, secondsLeft)) : '✓'}
                      </motion.div>
                    )}

                    {/* Selected check (before hold) */}
                    {isSelected && !isHeld && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg"
                      >
                        <Check size={12} strokeWidth={3} />
                      </motion.div>
                    )}

                    {/* Time */}
                    <span
                      className={cn(
                        'text-lg font-bold tracking-tight transition-colors',
                        isHeld && 'text-blue-700',
                        isSelected && !isHeld && 'text-blue-600',
                        !isSelected && locked && 'text-slate-400',
                        !isSelected && !locked && 'text-slate-700 group-hover:text-emerald-600'
                      )}
                    >
                      {slot.horaInicio}
                    </span>

                    {/* Subtext */}
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider">
                      {locked ? (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Lock size={9} />
                          {subLabel}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'transition-colors',
                            isHeld && 'font-semibold text-blue-600',
                            isSelected && !isHeld && 'text-blue-500',
                            !isSelected && 'text-slate-500 group-hover:text-emerald-500'
                          )}
                        >
                          {subLabel}
                        </span>
                      )}
                    </span>

                    {/* Block reason hint (desktop) */}
                    {status === 'blocked' && slot.motivoBloqueo && (
                      <div className="absolute left-1.5 top-1.5 hidden items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-semibold text-amber-600 ring-1 ring-amber-200/50 sm:flex">
                        <AlertTriangle size={8} />
                        Bloq.
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
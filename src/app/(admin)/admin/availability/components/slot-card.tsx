'use client';

import { format, parseISO } from 'date-fns';
import { Clock, User, Phone, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AgendaSlot, AgendaSlotStatus } from '@/types/availability';
import { cn } from '@/lib/utils';

type SlotCardProps = {
  slot: AgendaSlot;
  onBlock?: () => void;
  onViewReservation?: (reservationId: string) => void;
  compact?: boolean;
};

type StatusCfg = {
  container: string;
  badge: string;
  icon: typeof Clock;
  label: string;
  iconColor: string;
};

const STATUS_CONFIG: Record<AgendaSlotStatus, StatusCfg> = {
  free: {
    container: 'bg-success/10 ring-1 ring-success/20 hover:bg-success/15',
    badge: 'bg-success/10 text-success ring-1 ring-success/20',
    icon: Clock,
    label: 'Disponible',
    iconColor: 'text-success',
  },
  blocked: {
    container: 'bg-surface2 ring-1 ring-border',
    badge: 'bg-surface2 text-textMuted ring-1 ring-border',
    icon: Lock,
    label: 'Bloqueado',
    iconColor: 'text-textMuted',
  },
  hold: {
    container: 'bg-warning/10 ring-1 ring-warning/20 hover:bg-warning/15',
    badge: 'bg-warning/10 text-warning ring-1 ring-warning/20',
    icon: AlertCircle,
    label: 'En espera',
    iconColor: 'text-warning',
  },
  confirmed: {
    container: 'bg-primary/10 ring-1 ring-primary/20 hover:bg-primary/15',
    badge: 'bg-primary/10 text-primary ring-1 ring-primary/20',
    icon: CheckCircle2,
    label: 'Confirmada',
    iconColor: 'text-primary',
  },
  occupied: {
    container: 'bg-primary/10 ring-1 ring-primary/20 hover:bg-primary/15',
    badge: 'bg-primary/10 text-primary ring-1 ring-primary/20',
    icon: CheckCircle2,
    label: 'Ocupado',
    iconColor: 'text-primary',
  },
};

function buildTitle(slot: AgendaSlot, start: string, end: string, label: string) {
  const extra: string[] = [];
  if (slot.customerName) extra.push(`Cliente: ${slot.customerName}`);
  if (slot.blockReason) extra.push(`Motivo: ${slot.blockReason}`);
  return `${start} - ${end}: ${label}${extra.length ? ` • ${extra.join(' • ')}` : ''}`;
}

export function SlotCard({ slot, onBlock, onViewReservation, compact }: SlotCardProps) {
  const config = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.free;
  const Icon = config.icon;

  const startTime = format(parseISO(slot.startAt), 'HH:mm');
  const endTime = format(parseISO(slot.endAt), 'HH:mm');

  const canBlock = slot.status === 'free' && typeof onBlock === 'function';
  const canView = !!slot.reservationId && typeof onViewReservation === 'function';
  const isClickable = canBlock || canView;

  const title = buildTitle(slot, startTime, endTime, config.label);

  const handleClick = () => {
    if (canBlock) onBlock?.();
    else if (canView) onViewReservation?.(slot.reservationId!);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={!isClickable}
        title={title}
        aria-label={title}
        className={cn(
          'group w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold transition',
          config.container,
          isClickable ? 'cursor-pointer' : 'cursor-default opacity-70',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-text">{startTime}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', config.badge)}>
            {config.label}
          </span>
        </div>

        {canBlock && (
          <p className="mt-1 hidden text-[10px] font-bold uppercase tracking-wider text-textMuted group-hover:block">
            Bloquear
          </p>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      title={title}
      aria-label={title}
      className={cn(
        'group w-full rounded-xl p-3 text-left transition',
        config.container,
        isClickable ? 'cursor-pointer' : 'cursor-default opacity-80',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface ring-1 ring-border">
            <Icon size={16} className={cn(config.iconColor)} />
          </div>

          <div>
            <p className="text-sm font-extrabold text-text">
              {startTime} - {endTime}
            </p>
            <p className="text-xs text-textMuted">{config.label}</p>
          </div>
        </div>

        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', config.badge)}>
          {config.label}
        </span>
      </div>

      {slot.customerName && (
        <div className="mt-1 flex items-center gap-2 text-sm text-text">
          <User size={14} className="text-textMuted" />
          <span className="font-medium">{slot.customerName}</span>
        </div>
      )}

      {slot.customerPhone && (
        <div className="mt-1 flex items-center gap-2 text-xs text-textMuted">
          <Phone size={12} />
          <span>{slot.customerPhone}</span>
        </div>
      )}

      {slot.blockReason && (
        <div className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs text-textMuted ring-1 ring-border">
          <span className="font-semibold text-text">Motivo:</span> {slot.blockReason}
        </div>
      )}

      {canBlock && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-[11px] font-bold text-textMuted ring-1 ring-border transition-colors group-hover:text-text">
          <Lock size={12} className="text-textMuted" />
          Bloquear este horario
        </div>
      )}

      {!canBlock && canView && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-[11px] font-bold text-textMuted ring-1 ring-border transition-colors group-hover:text-text">
          Ver reserva
        </div>
      )}
    </button>
  );
}

export function SlotCardSkeleton() {
  return (
    <div className="w-full rounded-xl border border-border bg-surface2 p-3 animate-pulse">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="h-4 w-24 rounded bg-border/60" />
        <div className="h-4 w-16 rounded-full bg-border/60" />
      </div>
      <div className="mt-2 h-3 w-32 rounded bg-border/60" />
      <div className="mt-2 h-3 w-24 rounded bg-border/60" />
    </div>
  );
}

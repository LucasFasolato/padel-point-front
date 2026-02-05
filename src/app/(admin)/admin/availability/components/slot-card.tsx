'use client';

import { format, parseISO } from 'date-fns';
import {
  Clock,
  User,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { AgendaSlot, AgendaSlotStatus } from '@/types/availability';

type SlotCardProps = {
  slot: AgendaSlot;
  onBlock?: () => void;
  onViewReservation?: (reservationId: string) => void;
  compact?: boolean;
};

const STATUS_CONFIG: Record<
  AgendaSlotStatus,
  {
    bg: string;
    border: string;
    text: string;
    icon: typeof Clock;
    label: string;
  }
> = {
  free: {
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: Clock,
    label: 'Disponible',
  },
  blocked: {
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-500',
    icon: Lock,
    label: 'Bloqueado',
  },
  hold: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    icon: AlertCircle,
    label: 'En espera',
  },
  confirmed: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    icon: CheckCircle2,
    label: 'Confirmada',
  },
  occupied: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    icon: CheckCircle2,
    label: 'Ocupado',
  },
};

export function SlotCard({ slot, onBlock, onViewReservation, compact }: SlotCardProps) {
  const config = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.free;
  const Icon = config.icon;

  const startTime = format(parseISO(slot.startAt), 'HH:mm');
  const endTime = format(parseISO(slot.endAt), 'HH:mm');

  const handleClick = () => {
    if (slot.status === 'free' && onBlock) {
      onBlock();
    } else if (slot.reservationId && onViewReservation) {
      onViewReservation(slot.reservationId);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`
          w-full px-2 py-1.5 rounded-lg border text-xs font-medium
          transition-all cursor-pointer
          ${config.bg} ${config.border} ${config.text}
        `}
        title={`${startTime} - ${endTime}: ${config.label}${slot.customerName ? ` (${slot.customerName})` : ''}${slot.blockReason ? ` - ${slot.blockReason}` : ''}`}
      >
        <span className="font-bold">{startTime}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        w-full p-3 rounded-xl border text-left
        transition-all cursor-pointer
        ${config.bg} ${config.border}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={config.text} />
          <span className={`text-sm font-bold ${config.text}`}>
            {startTime} - {endTime}
          </span>
        </div>
        <span
          className={`
            text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full
            ${config.bg} ${config.text} border ${config.border}
          `}
        >
          {config.label}
        </span>
      </div>

      {slot.customerName && (
        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
          <User size={14} />
          <span>{slot.customerName}</span>
        </div>
      )}

      {slot.customerPhone && (
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <Phone size={12} />
          <span>{slot.customerPhone}</span>
        </div>
      )}

      {slot.blockReason && (
        <div className="mt-2 text-xs text-slate-500 italic">
          {slot.blockReason}
        </div>
      )}
    </button>
  );
}

export function SlotCardSkeleton() {
  return (
    <div className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-4 w-16 bg-slate-200 rounded-full" />
      </div>
      <div className="h-3 w-32 bg-slate-200 rounded mt-2" />
    </div>
  );
}
import { MapPin, Calendar, Clock, CreditCard } from 'lucide-react';

interface BookingSummaryProps {
  resumen: {
    club: string;
    court: string;
    dateLabelShort: string;
    start: string;
    end: string;
    precio: number;
  } | null;
}

export function BookingSummary({ resumen }: BookingSummaryProps) {
  if (!resumen) {
    return (
      <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-100">
        <p className="text-sm text-slate-500">Elegí un horario para continuar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 ring-1 ring-slate-200/80">
      {/* Club & Court */}
      <div className="border-b border-slate-200/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-slate-400" />
          <div>
            <p className="text-sm font-bold text-slate-900">{resumen.club}</p>
            <p className="text-xs text-slate-500">{resumen.court}</p>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 divide-x divide-slate-200/60">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50">
            <Calendar size={14} className="text-slate-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-400">Día</p>
            <p className="text-sm font-semibold capitalize text-slate-900">
              {resumen.dateLabelShort}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50">
            <Clock size={14} className="text-slate-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-400">Horario</p>
            <p className="text-sm font-semibold text-slate-900">
              {resumen.start} – {resumen.end}
            </p>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between border-t border-slate-200/60 bg-white/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Total a pagar</span>
        </div>
        <p className="text-lg font-extrabold text-slate-900">
          ${resumen.precio.toLocaleString('es-AR')}
        </p>
      </div>
    </div>
  );
}

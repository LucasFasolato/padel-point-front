'use client';

import { Trash2, Loader2, Clock, Calendar } from 'lucide-react';
import type { AvailabilityRule } from '@/types/availability';
import { getDayLabel } from '@/types/availability';
import { cn } from '@/lib/utils';

type RulesTableProps = {
  rules: AvailabilityRule[];
  loading: boolean;
  onDelete: (ruleId: string) => void;
  deleting: string | null;
};

export function RulesTable({ rules, loading, onDelete, deleting }: RulesTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface2 ring-1 ring-border">
            <Calendar size={28} className="text-textMuted" />
          </div>
          <p className="font-semibold text-text">No hay horarios configurados</p>
          <p className="mt-1 text-sm text-textMuted">
            Agregá reglas para definir cuándo está disponible esta cancha.
          </p>
        </div>
      </div>
    );
  }

  // Group rules by day
  const rulesByDay = rules.reduce((acc, rule) => {
    const day = rule.diaSemana;
    if (!acc[day]) acc[day] = [];
    acc[day].push(rule);
    return acc;
  }, {} as Record<number, AvailabilityRule[]>);

  // Sort days starting from Monday (1) to Sunday (0)
  const sortedDays = Object.keys(rulesByDay)
    .map(Number)
    .sort((a, b) => {
      const aOrder = a === 0 ? 7 : a;
      const bOrder = b === 0 ? 7 : b;
      return aOrder - bOrder;
    });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface2/70">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-textMuted">
                Día
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-textMuted">
                Horario
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-textMuted">
                Duración
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-textMuted">
                Estado
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-textMuted">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {sortedDays.map((day) =>
              rulesByDay[day]
                .slice()
                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                .map((rule, idx) => (
                  <tr
                    key={rule.id}
                    className="transition-colors hover:bg-surface2/40"
                  >
                    {/* Día: solo la primera fila del grupo */}
                    <td className="px-6 py-4 align-top">
                      {idx === 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 ring-1 ring-border">
                            <Calendar size={16} className="text-primary" />
                          </div>
                          <span className="font-bold text-text">{getDayLabel(day)}</span>
                        </div>
                      ) : (
                        <span className="sr-only">{getDayLabel(day)}</span>
                      )}
                    </td>

                    {/* Horario */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-textMuted" />
                        <span className="font-medium text-text">
                          {rule.horaInicio} - {rule.horaFin}
                        </span>
                      </div>
                    </td>

                    {/* Duración */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-textMuted">
                        {rule.slotMinutos} min
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ring-1',
                          rule.activo
                            ? 'bg-success/10 text-success ring-success/20'
                            : 'bg-surface2 text-textMuted ring-border'
                        )}
                      >
                        {rule.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDelete(rule.id)}
                        disabled={deleting === rule.id}
                        className={cn(
                          'rounded-lg p-2 text-textMuted transition-colors',
                          'hover:bg-danger/10 hover:text-danger',
                          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg',
                          'disabled:opacity-50'
                        )}
                        title="Eliminar regla"
                        aria-label="Eliminar regla"
                      >
                        {deleting === rule.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

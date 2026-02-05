'use client';

import { Trash2, Loader2, Clock, Calendar } from 'lucide-react';
import type { AvailabilityRule } from '@/types/availability';
import { getDayLabel } from '@/types/availability';

type RulesTableProps = {
  rules: AvailabilityRule[];
  loading: boolean;
  onDelete: (ruleId: string) => void;
  deleting: string | null;
};

export function RulesTable({ rules, loading, onDelete, deleting }: RulesTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Calendar size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No hay horarios configurados</p>
          <p className="text-sm text-slate-400 mt-1">
            Agregá reglas para definir cuándo está disponible esta cancha
          </p>
        </div>
      </div>
    );
  }

  // Group rules by day
  const rulesByDay = rules.reduce(
    (acc, rule) => {
      const day = rule.diaSemana;
      if (!acc[day]) acc[day] = [];
      acc[day].push(rule);
      return acc;
    },
    {} as Record<number, AvailabilityRule[]>
  );

  // Sort days starting from Monday (1) to Sunday (0)
  const sortedDays = Object.keys(rulesByDay)
    .map(Number)
    .sort((a, b) => {
      // Monday = 1, ..., Saturday = 6, Sunday = 0
      const aOrder = a === 0 ? 7 : a;
      const bOrder = b === 0 ? 7 : b;
      return aOrder - bOrder;
    });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                Día
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                Horario
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                Duración
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                Estado
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedDays.map((day) =>
              rulesByDay[day]
                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                .map((rule, idx) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {idx === 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Calendar size={16} className="text-blue-600" />
                          </div>
                          <span className="font-bold text-slate-900">
                            {getDayLabel(day)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {rule.horaInicio} - {rule.horaFin}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {rule.slotMinutos} min
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                          rule.activo
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {rule.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDelete(rule.id)}
                        disabled={deleting === rule.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Eliminar regla"
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
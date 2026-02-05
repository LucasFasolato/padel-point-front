'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import { useClubStore } from '@/store/club-store';
import { useCourtStore } from '@/store/court-store';
import { useAuthStore } from '@/store/auth-store';
import { useAvailabilityRules } from '@/hooks/use-availability-rules';
import { RulesTable } from '../components/rules-table';
import { RuleFormModal } from '../components/rule-form-modal';

export default function AvailabilityRulesPage() {
  const { user } = useAuthStore();
  const { activeClub } = useClubStore();
  const { courts, fetchCourts } = useCourtStore();

  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    rules,
    loading,
    error,
    fetchRules,
    createRulesBulk,
    deleteRule,
    saving,
    deleting,
  } = useAvailabilityRules();

  // Fetch courts on mount
  useEffect(() => {
    if (activeClub?.id) {
      fetchCourts(activeClub.id);
    }
  }, [activeClub?.id, fetchCourts]);

  // Auto-select first court
  useEffect(() => {
    if (courts.length > 0 && !selectedCourtId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCourtId(courts[0].id);
    }
  }, [courts, selectedCourtId]);

  // Fetch rules when court changes
  useEffect(() => {
    if (selectedCourtId) {
      fetchRules(selectedCourtId);
    }
  }, [selectedCourtId, fetchRules]);

  const handleCreateRules = useCallback(
    async (data: {
      courtId: string;
      diasSemana: number[];
      horaInicio: string;
      horaFin: string;
      slotMinutos: number;
    }) => {
      const result = await createRulesBulk({
        courtId: data.courtId,
        diasSemana: data.diasSemana,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        slotMinutos: data.slotMinutos,
        activo: true,
      });

      if (result.ok) {
        // Refetch to get updated list
        fetchRules(data.courtId);
      }

      return result;
    },
    [createRulesBulk, fetchRules]
  );

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      if (!confirm('¿Estás seguro de eliminar esta regla?')) return;

      const result = await deleteRule(ruleId);
      if (!result.ok) {
        alert(result.error ?? 'Error al eliminar');
      }
    },
    [deleteRule]
  );

  // Permission check
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <AlertTriangle size={48} className="mb-4 opacity-50" />
        <p className="text-sm">No tenés permisos para ver esta sección.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Volver
        </Link>
      </div>
    );
  }

  // No club selected
  if (!activeClub) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <Calendar size={48} className="mb-4 opacity-50" />
        <p>Seleccioná un club primero.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Ir al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/availability"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Configuración de Horarios
            </h1>
            <p className="text-slate-500">
              Define los horarios disponibles para cada cancha
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={courts.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Agregar horarios
        </button>
      </div>

      {/* Court selector */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Cancha:</label>
        {courts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Cargando canchas...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courts.map((court) => (
              <button
                key={court.id}
                onClick={() => setSelectedCourtId(court.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCourtId === court.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {court.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Rules table */}
      {selectedCourtId && (
        <RulesTable
          rules={rules}
          loading={loading}
          onDelete={handleDeleteRule}
          deleting={deleting}
        />
      )}

      {/* No courts message */}
      {courts.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Calendar size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No hay canchas configuradas</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              Primero necesitás crear canchas para configurar sus horarios
            </p>
            <Link
              href="/admin/courts"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Ir a Canchas
            </Link>
          </div>
        </div>
      )}

      {/* Modal */}
      <RuleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRules}
        courts={courts}
        selectedCourtId={selectedCourtId}
        saving={saving}
      />
    </div>
  );
}
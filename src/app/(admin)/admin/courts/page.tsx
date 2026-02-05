'use client';

import React, { useEffect, useState } from 'react';
import { useClubStore } from '@/store/club-store';
import { useCourtStore } from '@/store/court-store';
import { Plus, Pencil, Trash2, Map, DollarSign, Layers, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Court } from '@/types';
import CourtModal from '@/app/components/admin/court-modal';
import api from '@/lib/api';

export default function CourtsPage() {
  const { activeClub } = useClubStore();
  const { courts, fetchCourts, removeCourt } = useCourtStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  useEffect(() => {
    if (activeClub) {
      fetchCourts(activeClub.id);
    }
  }, [activeClub, fetchCourts]);

  const handleDelete = async (courtId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cancha? Se borrarán sus reservas futuras.')) return;
    try {
      await api.delete(`/courts/${courtId}`);
      removeCourt(courtId);
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la cancha');
    }
  };

  const handleOpenModal = (court?: Court) => {
    setEditingCourt(court || null);
    setIsModalOpen(true);
  };

  if (!activeClub) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <Map size={48} className="mb-4 opacity-50" />
        <p>Selecciona un club en el Overview para gestionar sus canchas.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Gestión de Canchas</h1>
          <p className="text-textMuted">Administra las pistas de {activeClub.nombre}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-600 active:scale-95"
        >
          <Plus size={18} />
          Nueva Cancha
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courts.map((court) => (
          <div
            key={court.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            
            {/* Cabecera visual (Imagen o Placeholder) */}
            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-surface2">
                {/* Si tuvieras fotos reales, irían aquí. Por ahora un placeholder lindo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-50 opacity-50" />
                <Layers className="relative z-10 text-slate-300" size={48} />
                
                {/* Botones de acción flotantes */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button 
                        onClick={() => handleOpenModal(court)}
                        className="rounded-lg bg-surface/90 p-2 text-textMuted shadow-sm backdrop-blur-sm hover:text-brand-600"
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    <button 
                        onClick={() => handleDelete(court.id)}
                        className="rounded-lg bg-surface/90 p-2 text-textMuted shadow-sm backdrop-blur-sm hover:text-danger"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-5">
              <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-bold text-text">{court.nombre}</h3>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      court.activa
                        ? 'bg-success/10 text-success'
                        : 'bg-surface2 text-textMuted'
                    }`}
                  >
                    {court.activa ? 'Activa' : 'Inactiva'}
                  </span>
              </div>
              
              <div className="mb-4 flex items-center gap-2 text-sm text-textMuted">
                <span className="font-medium text-text">Superficie:</span> {court.superficie}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs font-medium uppercase text-textMuted">Precio Hora</span>
                <div className="flex items-center gap-1 text-lg font-bold text-text">
                    {formatCurrency(Number(court.precioPorHora))}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Tarjeta para agregar (Empty State si no hay canchas) */}
        {courts.length === 0 && (
            <button 
                onClick={() => handleOpenModal()}
                className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface2 text-textMuted transition-colors hover:border-brand-400 hover:text-brand-600"
            >
                <Plus size={48} className="mb-2 opacity-50" />
                <span className="font-medium">Crear primera cancha</span>
            </button>
        )}
      </div>

      {/* Modal Reutilizable */}
      <CourtModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        courtToEdit={editingCourt}
        clubId={activeClub.id}
      />
    </div>
  );
}

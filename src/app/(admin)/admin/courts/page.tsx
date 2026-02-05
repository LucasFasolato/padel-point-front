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
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <Map size={48} className="mb-4 opacity-50" />
        <p>Selecciona un club en el Overview para gestionar sus canchas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Canchas</h1>
          <p className="text-slate-500">Administra las pistas de {activeClub.nombre}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} />
          Nueva Cancha
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courts.map((court) => (
          <div key={court.id} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            
            {/* Cabecera visual (Imagen o Placeholder) */}
            <div className="h-40 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                {/* Si tuvieras fotos reales, irían aquí. Por ahora un placeholder lindo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-50 opacity-50" />
                <Layers className="text-slate-300 relative z-10" size={48} />
                
                {/* Botones de acción flotantes */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => handleOpenModal(court)}
                        className="p-2 bg-white/90 rounded-lg text-slate-700 hover:text-blue-600 shadow-sm backdrop-blur-sm"
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    <button 
                        onClick={() => handleDelete(court.id)}
                        className="p-2 bg-white/90 rounded-lg text-slate-700 hover:text-red-600 shadow-sm backdrop-blur-sm"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">{court.nombre}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${court.activa ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {court.activa ? 'Activa' : 'Inactiva'}
                  </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <span className="font-medium text-slate-700">Superficie:</span> {court.superficie}
              </div>

              <div className="mt-2 border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium uppercase">Precio Hora</span>
                <div className="flex items-center gap-1 font-bold text-slate-900 text-lg">
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
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 h-full min-h-[300px] text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
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
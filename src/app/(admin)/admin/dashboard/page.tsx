'use client';

import React, { useEffect, useState } from 'react';
import { useClubStore } from '@/store/club-store';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, Plus, MapPin, ArrowRight, LayoutDashboard, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/app/components/ui/modal';
import api from '@/lib/api';
import { Club } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { clubs, activeClub, fetchMyClubs, setActiveClub, loading } = useClubStore();
  
  // Estado para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClub, setNewClub] = useState({ nombre: '', direccion: '', email: '', telefono: '' });

  useEffect(() => {
    fetchMyClubs();
  }, [fetchMyClubs]);

  const handleSelectClub = (club: Club) => {
    setActiveClub(club);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
        await api.post('/clubs', newClub); // Asegúrate que tu endpoint sea POST /clubs
        await fetchMyClubs(); // Recargar lista
        setIsModalOpen(false); // Cerrar modal
        setNewClub({ nombre: '', direccion: '', email: '', telefono: '' }); // Limpiar form
    } catch (error) {
        console.error(error);
        alert('Error al crear el club.');
    } finally {
        setIsCreating(false);
    }
  };

  if (loading && clubs.length === 0) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hola, {user?.email?.split('@')[0]}</h1>
          <p className="text-slate-500">Selecciona el club que quieres gestionar.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Plus size={18} /> Nuevo Club
        </button>
      </div>

      {/* Banner Club Activo */}
      {activeClub && (
        <div className="mb-10 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-xl ring-1 ring-slate-900/5">
          <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
               <div className="flex items-center gap-2 mb-2">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                   <p className="text-xs font-bold uppercase tracking-wider text-green-400">Club Activo</p>
               </div>
               <h2 className="text-3xl font-bold tracking-tight">{activeClub.nombre}</h2>
               <div className="mt-4 flex flex-col gap-2 text-slate-300">
                    <p className="flex items-center gap-2"><MapPin size={16}/> {activeClub.direccion}</p>
                    <p className="flex items-center gap-2 text-sm opacity-70"><Mail size={14}/> {activeClub.email}</p>
               </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <LayoutDashboard size={40} className="text-blue-400"/>
            </div>
          </div>
        </div>
      )}

      <h3 className="mb-4 text-lg font-bold text-slate-900">Mis Clubes</h3>
      
      {/* Grid de Clubes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <button
            key={club.id}
            onClick={() => handleSelectClub(club)}
            className={`group relative flex flex-col items-start rounded-2xl border p-6 text-left transition-all hover:shadow-xl hover:-translate-y-1 ${
              activeClub?.id === club.id ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600' : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="mb-4 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <LayoutDashboard size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">{club.nombre}</h3>
            <p className="mt-1 text-sm text-slate-500 line-clamp-1">{club.direccion}</p>
            
            <div className="mt-6 w-full flex justify-between items-center border-t border-slate-200/50 pt-4">
               <span className={`text-xs font-bold uppercase ${activeClub?.id === club.id ? 'text-blue-600' : 'text-slate-400'}`}>
                   {activeClub?.id === club.id ? 'Gestionando' : 'Entrar'}
               </span>
               <ArrowRight size={16} className={`text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all ${activeClub?.id === club.id ? 'text-blue-600' : ''}`} />
            </div>
          </button>
        ))}
      </div>

      {/* --- MODAL DE CREACIÓN --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Club">
        <form onSubmit={handleCreateClub} className="space-y-4">
            <div>
                <label className="text-sm font-medium text-slate-700">Nombre del Club</label>
                <input required className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Padel Center" 
                    value={newClub.nombre} onChange={e => setNewClub({...newClub, nombre: e.target.value})}
                />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-700">Dirección</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                    <input required className="w-full rounded-xl border border-slate-300 p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Calle 123" 
                        value={newClub.direccion} onChange={e => setNewClub({...newClub, direccion: e.target.value})}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input type="email" required className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="contacto@club.com" 
                        value={newClub.email} onChange={e => setNewClub({...newClub, email: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">Teléfono</label>
                    <input type="tel" required className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="+54 9..." 
                        value={newClub.telefono} onChange={e => setNewClub({...newClub, telefono: e.target.value})}
                    />
                </div>
            </div>
            
            <button disabled={isCreating} type="submit" className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-blue-600 transition-colors disabled:opacity-70 mt-4 flex justify-center">
                {isCreating ? <Loader2 className="animate-spin"/> : 'Crear Club'}
            </button>
        </form>
      </Modal>
    </div>
  );
}
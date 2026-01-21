'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Club, Court } from '@/types';
import { Save, Building2, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import ImageUploader from '@/app/components/ImageUploader';

export default function SettingsPage() {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Schedule Generator State
  const [scheduleForm, setScheduleForm] = useState({
    diasSemana: [1, 2, 3, 4, 5, 6, 0], // All days (0 = Sunday)
    horaInicio: '09:00',
    horaFin: '23:00',
    slotMinutos: 90 // Default padel slot
  });
  const [generatingRules, setGeneratingRules] = useState(false);

  // 1. Fetch Club Data
  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await api.get('/clubs');
        if (res.data.length > 0) {
          setClub(res.data[0]); // Assumes single club management for MVP
        }
      } catch (error) {
        console.error("Error loading club", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, []);

  // 2. Save Club Details
  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    setSaving(true);
    setMessage(null);

    try {
      await api.patch(`/clubs/${club.id}`, {
        nombre: club.nombre,
        direccion: club.direccion,
        telefono: club.telefono,
        email: club.email,
        activo: club.activo
      });
      setMessage({ type: 'success', text: 'Información del club actualizada.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar los cambios.' });
    } finally {
      setSaving(false);
    }
  };

  // 3. Generate Availability Rules (The Engine)
  const handleApplySchedule = async () => {
    if (!club) return;
    // Confirmation
    if (!window.confirm("Esto generará horarios para TODAS tus canchas activas. ¿Continuar?")) return;
    
    setGeneratingRules(true);
    try {
        // A. Get all courts first
        const courtsRes = await api.get(`/courts/by-club/${club.id}`);
        const courts: Court[] = courtsRes.data;

        if (courts.length === 0) {
            alert("No tienes canchas creadas. Crea canchas primero.");
            return;
        }

        // B. Loop and create rules for each court
        // In a real prod app, you might want a backend endpoint that does this in bulk for all courts.
        // For this MVP, we iterate here to use the existing POST /availability endpoint.
        let createdCount = 0;

        for (const court of courts) {
            await api.post(`/availability`, {
                courtId: court.id,
                diasSemana: scheduleForm.diasSemana, // [1,2,3...]
                horaInicio: scheduleForm.horaInicio,
                horaFin: scheduleForm.horaFin,
                slotMinutos: scheduleForm.slotMinutos,
                activo: true
            });
            createdCount++;
        }

        setMessage({ type: 'success', text: `¡Listo! Horarios generados para ${createdCount} canchas.` });

    } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Error al generar horarios. Puede que ya existan reglas duplicadas.' });
    } finally {
        setGeneratingRules(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center text-slate-400">Cargando configuración...</div>;
  if (!club) return <div className="p-8 text-center">No se encontró el club.</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Gestiona la identidad de tu club y los horarios de apertura.</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-xl p-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
            {message.text}
        </div>
      )}

      {/* 1. Club Identity Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-full bg-blue-50 p-2 text-blue-600"><Building2 size={20} /></div>
            <h2 className="text-lg font-bold text-slate-800">Identidad del Club</h2>
        </div>

        <form onSubmit={handleSaveClub} className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del Club</label>
                <input 
                    required
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-100"
                    value={club.nombre}
                    onChange={e => setClub({...club, nombre: e.target.value})}
                />
            </div>
            
            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Dirección</label>
                <input 
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-100"
                    value={club.direccion}
                    onChange={e => setClub({...club, direccion: e.target.value})}
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono (WhatsApp)</label>
                <input 
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-100"
                    value={club.telefono}
                    onChange={e => setClub({...club, telefono: e.target.value})}
                />
            </div>

            {/* Media Uploaders */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                 <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Logo del Club</label>
                    <div className="h-32 w-32">
                        <ImageUploader 
                            ownerId={club.id} 
                            kind="CLUB_LOGO"
                            className="rounded-full" // Circular style for logo
                            onUploadComplete={() => setMessage({ type: 'success', text: 'Logo actualizado' })}
                        />
                    </div>
                 </div>
                 <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Portada (Cover)</label>
                    <div className="h-32 w-full">
                        <ImageUploader 
                            ownerId={club.id} 
                            kind="CLUB_COVER"
                            onUploadComplete={() => setMessage({ type: 'success', text: 'Portada actualizada' })}
                        />
                    </div>
                 </div>
            </div>

            <div className="md:col-span-2 flex justify-end pt-4">
                <button 
                    type="submit" 
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-70"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Guardar Cambios</>}
                </button>
            </div>
        </form>
      </div>

      {/* 2. Availability Generator Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-full bg-amber-50 p-2 text-amber-600"><Clock size={20} /></div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">Horarios de Apertura</h2>
                <p className="text-xs text-slate-500">Genera automáticamente los turnos para todas tus canchas.</p>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
             <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Hora Apertura</label>
                <input 
                    type="time"
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-amber-100"
                    value={scheduleForm.horaInicio}
                    onChange={e => setScheduleForm({...scheduleForm, horaInicio: e.target.value})}
                />
             </div>
             <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Hora Cierre</label>
                <input 
                    type="time"
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-amber-100"
                    value={scheduleForm.horaFin}
                    onChange={e => setScheduleForm({...scheduleForm, horaFin: e.target.value})}
                />
             </div>
             <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Duración Turno</label>
                <select 
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-amber-100 bg-white"
                    value={scheduleForm.slotMinutos}
                    onChange={e => setScheduleForm({...scheduleForm, slotMinutos: Number(e.target.value)})}
                >
                    <option value={60}>60 Minutos</option>
                    <option value={90}>90 Minutos</option>
                    <option value={120}>120 Minutos</option>
                </select>
             </div>
        </div>

        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 border border-amber-100">
            <p className="font-bold flex items-center gap-2"><AlertCircle size={16}/> Importante:</p>
            <p className="mt-1 opacity-90">
                Al hacer clic en &apos;Aplicar&apos;, se crearán reglas de disponibilidad para <strong>todas las canchas activas</strong> desde las {scheduleForm.horaInicio} hasta las {scheduleForm.horaFin}.
            </p>
        </div>

        <div className="mt-6 flex justify-end">
            <button 
                onClick={handleApplySchedule}
                disabled={generatingRules}
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-100 px-6 py-3 font-bold text-amber-900 transition-all hover:bg-amber-200 active:scale-95 disabled:opacity-70"
            >
                {generatingRules ? <Loader2 className="animate-spin" /> : "Aplicar Horarios a Todo el Club"}
            </button>
        </div>
      </div>

    </div>
  );
}
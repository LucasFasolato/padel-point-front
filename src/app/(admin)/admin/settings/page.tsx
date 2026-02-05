'use client';

import React, { useEffect, useState } from 'react';
import { useClubStore } from '@/store/club-store';
import { Save, MapPin, Phone, Mail, Building, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { MediaService } from '@/lib/media-service';
import MediaUploader from '@/app/components/admin/media-uploader';
import { MediaKind, MediaOwnerType, type MediaAsset } from '@/types';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

export default function SettingsPage() {
  const { activeClub, setActiveClub, fetchMyClubs } = useClubStore();
  const [loading, setLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [logoAssets, setLogoAssets] = useState<MediaAsset[]>([]);
  const [coverAssets, setCoverAssets] = useState<MediaAsset[]>([]);
  
  // Estado local del formulario
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
  });

  // Cargar datos del club activo al formulario
  useEffect(() => {
    if (activeClub) {
      setForm({
        nombre: activeClub.nombre,
        direccion: activeClub.direccion,
        telefono: activeClub.telefono || '',
        email: activeClub.email || '',
      });
    }
  }, [activeClub]);

  useEffect(() => {
    if (!activeClub?.id) {
      setLogoAssets([]);
      setCoverAssets([]);
      return;
    }

    const fetchMedia = async () => {
      setMediaLoading(true);
      try {
        const [logo, cover] = await Promise.all([
          MediaService.listAuth({
            ownerType: MediaOwnerType.CLUB,
            ownerId: activeClub.id,
            kind: MediaKind.CLUB_LOGO,
          }),
          MediaService.listAuth({
            ownerType: MediaOwnerType.CLUB,
            ownerId: activeClub.id,
            kind: MediaKind.CLUB_COVER,
          }),
        ]);
        setLogoAssets(logo);
        setCoverAssets(cover);
      } catch {
        setLogoAssets([]);
        setCoverAssets([]);
      } finally {
        setMediaLoading(false);
      }
    };

    fetchMedia();
  }, [activeClub?.id]);

  const refreshMedia = async () => {
    if (!activeClub?.id) return;
    setMediaLoading(true);
    try {
      const [logo, cover] = await Promise.all([
        MediaService.listAuth({
          ownerType: MediaOwnerType.CLUB,
          ownerId: activeClub.id,
          kind: MediaKind.CLUB_LOGO,
        }),
        MediaService.listAuth({
          ownerType: MediaOwnerType.CLUB,
          ownerId: activeClub.id,
          kind: MediaKind.CLUB_COVER,
        }),
      ]);
      setLogoAssets(logo);
      setCoverAssets(cover);
    } catch {
      setLogoAssets([]);
      setCoverAssets([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClub) return;
    
    setLoading(true);
    try {
      // Usamos el endpoint nuevo que creamos en el backend
      const res = await api.patch(`/clubs/${activeClub.id}/details`, form);
      
      // Actualizamos el estado global y recargamos la lista
      setActiveClub(res.data); 
      await fetchMyClubs();
      
      alert('Cambios guardados correctamente');
    } catch (error) {
      console.error(error);
      alert('Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  if (!activeClub) return (
    <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <Building size={48} className="mb-4 opacity-50"/>
        <p>Seleccion? un club en el Overview para configurarlo y gestionar im?genes.</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configuración del Club</h1>
        <p className="text-slate-500">Edita la información pública de {activeClub.nombre}</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Tarjeta de Información General */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Building size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Información General</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Nombre del Club"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={e => setForm({...form, nombre: e.target.value})}
                />

                <Input
                    label="Dirección"
                    type="text"
                    required
                    value={form.direccion}
                    onChange={e => setForm({...form, direccion: e.target.value})}
                />

                <Input
                    label="Teléfono"
                    type="tel"
                    value={form.telefono}
                    onChange={e => setForm({...form, telefono: e.target.value})}
                />

                <Input
                    label="Email de Contacto"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                />
            </div>

            <div className="pt-4 flex justify-end">
                <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={loading}
                >
                    {!loading && <Save size={20} />}
                    Guardar Cambios
                </Button>
            </div>
          </form>
        </div>

        {/* Im?genes del Club */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Building size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Im?genes del club</h2>
              <p className="text-sm text-slate-500">Logo y portada visibles en el perfil p?blico.</p>
            </div>
          </div>

          {!activeClub?.id ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Seleccion? un club para gestionar im?genes.
            </div>
          ) : mediaLoading ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Cargando im?genes...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MediaUploader
                ownerType={MediaOwnerType.CLUB}
                ownerId={activeClub.id}
                kind={MediaKind.CLUB_LOGO}
                mode="single"
                title="Logo"
                existingAssets={logoAssets}
                onChanged={refreshMedia}
              />
              <MediaUploader
                ownerType={MediaOwnerType.CLUB}
                ownerId={activeClub.id}
                kind={MediaKind.CLUB_COVER}
                mode="single"
                title="Portada"
                existingAssets={coverAssets}
                onChanged={refreshMedia}
              />
            </div>
          )}
        </div>

        {/* Zona de Peligro (Placeholder Visual) */}
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8">
            <div className="flex items-start gap-4">
                <div className="rounded-full bg-red-100 p-2 text-red-600">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-red-900">Zona de Peligro</h3>
                    <p className="mt-1 text-sm text-red-700/80">
                        Si eliminas el club, se borrarán todas las canchas, reservas y el historial de miembros. Esta acción no se puede deshacer.
                    </p>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => alert('Para eliminar un club, contacta a soporte por ahora.')}
                        className="mt-4"
                    >
                        Eliminar Club
                    </Button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
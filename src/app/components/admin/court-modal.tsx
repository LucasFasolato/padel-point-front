'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Court } from '@/types';
import { useCourtStore } from '@/store/court-store';
import api from '@/lib/api';
import { MediaService } from '@/lib/media-service';
import MediaUploader from '@/app/components/admin/media-uploader';
import { MediaKind, MediaOwnerType, type MediaAsset } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courtToEdit: Court | null;
  clubId: string;
}

export default function CourtModal({ isOpen, onClose, courtToEdit, clubId }: Props) {
  const { addCourt, updateCourt } = useCourtStore();
  const [loading, setLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [primaryAssets, setPrimaryAssets] = useState<MediaAsset[]>([]);
  const [galleryAssets, setGalleryAssets] = useState<MediaAsset[]>([]);
  
  const [form, setForm] = useState({
    nombre: '',
    superficie: 'Sintetico',
    precioPorHora: 0,
    activa: true
  });

  // Reset form when opening/closing or changing edit mode
  useEffect(() => {
    if (courtToEdit) {
      setForm({
        nombre: courtToEdit.nombre,
        superficie: courtToEdit.superficie,
        precioPorHora: Number(courtToEdit.precioPorHora),
        activa: courtToEdit.activa
      });
    } else {
      setForm({
        nombre: '',
        superficie: 'Sintetico',
        precioPorHora: 0,
        activa: true
      });
    }
  }, [courtToEdit, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPrimaryAssets([]);
      setGalleryAssets([]);
      setMediaError(null);
      setMediaLoading(false);
      return;
    }

    if (!courtToEdit?.id) {
      setPrimaryAssets([]);
      setGalleryAssets([]);
      setMediaError(null);
      return;
    }

    const fetchMedia = async () => {
      setMediaLoading(true);
      setMediaError(null);
      try {
        const [primary, gallery] = await Promise.all([
          MediaService.listAuth({
            ownerType: MediaOwnerType.COURT,
            ownerId: courtToEdit.id,
            kind: MediaKind.COURT_PRIMARY,
          }),
          MediaService.listAuth({
            ownerType: MediaOwnerType.COURT,
            ownerId: courtToEdit.id,
            kind: MediaKind.COURT_GALLERY,
          }),
        ]);
        setPrimaryAssets(primary);
        setGalleryAssets(gallery);
      } catch {
        setPrimaryAssets([]);
        setGalleryAssets([]);
        setMediaError('No pudimos cargar las imágenes.');
      } finally {
        setMediaLoading(false);
      }
    };

    fetchMedia();
  }, [isOpen, courtToEdit?.id]);

  const refreshMedia = async () => {
    if (!courtToEdit?.id) return;
    setMediaLoading(true);
    setMediaError(null);
    try {
      const [primary, gallery] = await Promise.all([
        MediaService.listAuth({
          ownerType: MediaOwnerType.COURT,
          ownerId: courtToEdit.id,
          kind: MediaKind.COURT_PRIMARY,
        }),
        MediaService.listAuth({
          ownerType: MediaOwnerType.COURT,
          ownerId: courtToEdit.id,
          kind: MediaKind.COURT_GALLERY,
        }),
      ]);
      setPrimaryAssets(primary);
      setGalleryAssets(gallery);
    } catch {
      setPrimaryAssets([]);
      setGalleryAssets([]);
      setMediaError('No pudimos cargar las imágenes.');
    } finally {
      setMediaLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (courtToEdit) {
        // Update
        const res = await api.patch(`/courts/${courtToEdit.id}`, form);
        updateCourt(res.data);
      } else {
        // Create
        const res = await api.post('/courts', { ...form, clubId });
        addCourt(res.data);
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al guardar la cancha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl animate-fade-in outline-none">
          
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-xl font-bold text-slate-900">
              {courtToEdit ? 'Editar Cancha' : 'Nueva Cancha'}
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
              <X size={24} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
              <input 
                required
                type="text" 
                value={form.nombre}
                onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="Ej: Cancha 1"
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Superficie</label>
              <select 
                value={form.superficie}
                onChange={e => setForm({...form, superficie: e.target.value})}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="Sintetico">Sintético</option>
                <option value="Cemento">Cemento</option>
                <option value="Cesped">Césped</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Precio por Hora</label>
              <input 
                required
                type="number" 
                min="0"
                value={form.precioPorHora}
                onChange={e => setForm({...form, precioPorHora: Number(e.target.value)})}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-3 py-2">
                <input 
                    type="checkbox" 
                    id="active"
                    checked={form.activa}
                    onChange={e => setForm({...form, activa: e.target.checked})}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700">Cancha Activa (Visible al público)</label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Guardar'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Imágenes de la cancha</h3>
              <p className="text-xs text-slate-500">
                Cargá una imagen principal y una galería opcional.
              </p>
            </div>

            {!courtToEdit?.id ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                Guardá la cancha para poder cargar imágenes.
              </div>
            ) : mediaLoading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                Cargando imágenes...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {mediaError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    {mediaError}
                    <button
                      type="button"
                      onClick={refreshMedia}
                      className="ml-3 font-semibold text-amber-800 underline"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
                <MediaUploader
                  ownerType={MediaOwnerType.COURT}
                  ownerId={courtToEdit.id}
                  kind={MediaKind.COURT_PRIMARY}
                  mode="single"
                  title="Imagen principal"
                  existingAssets={primaryAssets}
                  onChanged={refreshMedia}
                />
                <MediaUploader
                  ownerType={MediaOwnerType.COURT}
                  ownerId={courtToEdit.id}
                  kind={MediaKind.COURT_GALLERY}
                  mode="multi"
                  title="Galería"
                  existingAssets={galleryAssets}
                  onChanged={refreshMedia}
                />
              </div>
            )}
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

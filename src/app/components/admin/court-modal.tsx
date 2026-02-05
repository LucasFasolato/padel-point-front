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
        const res = await api.patch(`/courts/${courtToEdit.id}`, form);
        updateCourt(res.data);
      } else {
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

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-border animate-fade-in outline-none">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-xl font-bold text-text">
              {courtToEdit ? 'Editar Cancha' : 'Nueva Cancha'}
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-2 text-textMuted hover:bg-surface2 hover:text-text focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-textMuted">Nombre</label>
              <input
                required
                type="text"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Cancha 1"
                className="w-full rounded-xl border border-border bg-surface p-3 text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-textMuted">Superficie</label>
              <select
                value={form.superficie}
                onChange={e => setForm({ ...form, superficie: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface p-3 text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
              >
                <option value="Sintetico">Sintético</option>
                <option value="Cemento">Cemento</option>
                <option value="Cesped">Césped</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-textMuted">Precio por Hora</label>
              <input
                required
                type="number"
                min="0"
                value={form.precioPorHora}
                onChange={e => setForm({ ...form, precioPorHora: Number(e.target.value) })}
                className="w-full rounded-xl border border-border bg-surface p-3 text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="active"
                checked={form.activa}
                onChange={e => setForm({ ...form, activa: e.target.checked })}
                className="h-5 w-5 rounded border-border accent-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
              />
              <label htmlFor="active" className="text-sm font-medium text-text">
                Cancha Activa <span className="text-textMuted">(Visible al público)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Guardar'}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-text">Imágenes de la cancha</h3>
              <p className="text-xs text-textMuted">
                Cargá una imagen principal y una galería opcional.
              </p>
            </div>

            {!courtToEdit?.id ? (
              <div className="rounded-xl border border-dashed border-border bg-surface2 px-4 py-6 text-center text-xs text-textMuted">
                Guardá la cancha para poder cargar imágenes.
              </div>
            ) : mediaLoading ? (
              <div className="rounded-xl border border-dashed border-border bg-surface2 px-4 py-6 text-center text-xs text-textMuted">
                Cargando imágenes...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {mediaError && (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
                    {mediaError}
                    <button
                      type="button"
                      onClick={refreshMedia}
                      className="ml-3 font-semibold text-text underline"
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

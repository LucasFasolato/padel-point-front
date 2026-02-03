'use client';

import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toastManager } from '@/lib/toast';
import { cloudinaryUploadSigned, MediaService } from '@/lib/media-service';
import type { MediaAsset, MediaKind, MediaOwnerType } from '@/types';

type UploadStatus = {
  id: string;
  name: string;
  status: 'uploading' | 'success' | 'error';
};

type MediaUploaderProps = {
  ownerType: MediaOwnerType;
  ownerId: string;
  kind: MediaKind;
  mode: 'single' | 'multi';
  title: string;
  existingAssets: MediaAsset[];
  onChanged: () => void;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const getFileError = (file: File) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Formato no permitido. Usá JPG, PNG o WEBP.';
  }
  if (file.size > MAX_BYTES) {
    return 'El archivo supera 5MB.';
  }
  return null;
};

const getAssetUrl = (asset: MediaAsset) => asset.secureUrl || asset.url;

export default function MediaUploader({
  ownerType,
  ownerId,
  kind,
  mode,
  title,
  existingAssets,
  onChanged,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState<UploadStatus[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const assets = useMemo(() => {
    if (mode === 'single') return existingAssets.slice(0, 1);
    return existingAssets;
  }, [existingAssets, mode]);

  const pushQueue = (status: UploadStatus) => {
    setQueue((prev) => [...prev, status]);
  };

  const updateQueue = (id: string, status: UploadStatus['status']) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !ownerId) return;

    const fileArray = Array.from(files);
    const invalid = fileArray.find((file) => getFileError(file));
    if (invalid) {
      toastManager.error(getFileError(invalid) ?? 'Archivo inválido.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    const idempotencyKey = `media-upload-${ownerType}-${ownerId}-${kind}`;

    for (const file of fileArray) {
      const entryId = `${file.name}-${file.size}-${Date.now()}`;
      pushQueue({ id: entryId, name: file.name, status: 'uploading' });
      try {
        const signature = await MediaService.getSignature({
          ownerType,
          ownerId,
          kind,
          fileNameHint: mode === 'multi' ? file.name : undefined,
        });

        const uploadResult = await cloudinaryUploadSigned(file, signature);

        await MediaService.register({
          ownerType,
          ownerId,
          kind,
          publicId: uploadResult.public_id,
          url: uploadResult.url,
          secureUrl: uploadResult.secure_url,
          bytes: uploadResult.bytes,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
        });

        updateQueue(entryId, 'success');
        toastManager.success('Imagen actualizada', { idempotencyKey });
        onChanged();
      } catch (error) {
        const message =
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: string }).message || '')
            : '';
        toastManager.error(message || 'No pudimos subir la imagen. Reintentá.');
        updateQueue(entryId, 'error');
      }
    }

    if (inputRef.current) inputRef.current.value = '';
    setUploading(false);
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await MediaService.remove(asset.id);
      toastManager.success('Imagen eliminada');
      onChanged();
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: string }).message || '')
          : '';
      toastManager.error(message || 'No pudimos eliminar la imagen.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            {mode === 'single' ? 'Subí una imagen.' : 'Subí varias imágenes.'}
          </p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? 'Subiendo...' : 'Subir'}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={mode === 'multi'}
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {assets.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
          No hay imágenes todavía.
        </div>
      )}

      {assets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200"
            >
              <img
                src={getAssetUrl(asset)}
                alt={title}
                className="h-28 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(asset)}
                className="absolute right-2 top-2 rounded-lg bg-white/90 p-1 text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {queue.length > 0 && (
        <div className="mt-4 space-y-2 text-xs text-slate-500">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <span className="truncate">{item.name}</span>
              <span className="font-medium">
                {item.status === 'uploading' && 'Subiendo...'}
                {item.status === 'success' && 'Listo'}
                {item.status === 'error' && 'Error'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

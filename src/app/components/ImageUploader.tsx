'use client';

import React, { useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUploadComplete: (url: string, secureUrl: string) => void;
  ownerId: string;
  kind: 'COURT_PRIMARY' | 'CLUB_LOGO' | 'CLUB_COVER';
  className?: string;
  currentImage?: string;
}

export default function ImageUploader({
  onUploadComplete,
  ownerId,
  kind,
  className,
  currentImage,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1) Signature
      const signRes = await api.post('/media/cloudinary/signature', {
        ownerType: kind.includes('COURT') ? 'COURT' : 'CLUB',
        ownerId,
        kind,
      });

      const { signature, timestamp, apiKey, cloudName, folder } = signRes.data;

      // 2) Upload directo Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      const data = await cloudinaryRes.json();
      if (!cloudinaryRes.ok) throw new Error(data.error?.message || 'Upload failed');

      // 3) Register
      await api.post('/media/register', {
        ownerType: kind.includes('COURT') ? 'COURT' : 'CLUB',
        ownerId,
        kind,
        publicId: data.public_id,
        url: data.url,
        secureUrl: data.secure_url,
        bytes: data.bytes,
        format: data.format,
        width: data.width,
        height: data.height,
      });

      setPreview(data.secure_url);
      onUploadComplete(data.url, data.secure_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image. Check backend configuration.');
    } finally {
      setUploading(false);
      // si querés, podrías resetear el input value desde un ref (no crítico)
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-surface2 transition-colors',
        'hover:bg-surface2/70',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-bg',
        className
      )}
    >
      {preview ? (
        <div className="group relative h-full w-full">
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />

          <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPreview(null);
              }}
              className={cn(
                'rounded-full bg-surface/90 p-2 text-text shadow-lg ring-1 ring-border backdrop-blur',
                'hover:text-danger',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg'
              )}
              aria-label="Quitar imagen"
              title="Quitar imagen"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center">
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-xs font-semibold text-textMuted">Subiendo...</p>
            </div>
          ) : (
            <>
              <div className="mb-2 rounded-full bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-text">Subir imagen</p>
              <p className="text-xs text-textMuted">JPG, PNG o WEBP (Max 5MB)</p>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}

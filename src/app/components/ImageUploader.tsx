'use client';

import React, { useState } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUploadComplete: (url: string, secureUrl: string) => void;
  ownerId: string; // The Club or Court UUID
  kind: 'COURT_PRIMARY' | 'CLUB_LOGO' | 'CLUB_COVER';
  className?: string;
  currentImage?: string;
}

export default function ImageUploader({ onUploadComplete, ownerId, kind, className, currentImage }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get Signature from Backend [cite: 885]
      // We send the ID so the backend generates the correct folder path
      const signRes = await api.post('/media/cloudinary/signature', {
        ownerType: kind.includes('COURT') ? 'COURT' : 'CLUB',
        ownerId: ownerId,
        kind: kind,
      });

      const { signature, timestamp, apiKey, cloudName, folder } = signRes.data;

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await cloudinaryRes.json();

      if (!cloudinaryRes.ok) throw new Error(data.error?.message || 'Upload failed');

      // 3. Register asset in Backend [cite: 903]
      await api.post('/media/register', {
        ownerType: kind.includes('COURT') ? 'COURT' : 'CLUB',
        ownerId: ownerId,
        kind: kind,
        publicId: data.public_id,
        url: data.url,
        secureUrl: data.secure_url,
        bytes: data.bytes,
        format: data.format,
        width: data.width,
        height: data.height
      });

      setPreview(data.secure_url);
      onUploadComplete(data.url, data.secure_url);

    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image. Check backend configuration.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100", className)}>
      {preview ? (
        <div className="relative h-full w-full group">
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button 
                onClick={(e) => { e.preventDefault(); setPreview(null); }}
                className="rounded-full bg-white p-2 text-slate-900 shadow-lg hover:bg-red-50 hover:text-red-600"
            >
                <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center">
          {uploading ? (
            <Loader2 className="animate-spin text-blue-500" size={32} />
          ) : (
            <>
              <div className="mb-2 rounded-full bg-blue-50 p-3 text-blue-600">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Subir Imagen</p>
              <p className="text-xs text-slate-400">JPG, PNG (Max 5MB)</p>
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
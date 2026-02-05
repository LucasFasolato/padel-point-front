'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { toastManager } from '@/lib/toast';
import { MediaKind, MediaOwnerType } from '@/types';
import { cloudinaryUploadSigned, MediaService } from '@/lib/media-service';
import { useAuthStore } from '@/store/auth-store';

type ProfileResponse = {
  userId?: string;
  displayName?: string | null;
  phone?: string | null;
  email: string;
};

type FieldErrors = {
  displayName?: string;
  phone?: string;
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

function ProfileSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="h-24 w-24 rounded-full bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 rounded bg-slate-100 animate-pulse" />
          <div className="h-4 w-36 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
      <div className="mt-8 grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="mt-6 h-10 w-36 rounded-full bg-slate-100 animate-pulse" />
    </div>
  );
}

export default function ProfilePage() {
  const { token, user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState({ displayName: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const userId = profile?.userId || user?.userId || '';

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    const originalDisplay = profile.displayName ?? '';
    const originalPhone = profile.phone ?? '';
    return form.displayName.trim() !== originalDisplay || form.phone.trim() !== originalPhone;
  }, [form.displayName, form.phone, profile]);

  const initials = useMemo(() => {
    const name = form.displayName || profile?.displayName || user?.email || '';
    const letter = name.trim().charAt(0).toUpperCase();
    return letter || 'P';
  }, [form.displayName, profile?.displayName, user?.email]);

  const loadProfile = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setSessionExpired(false);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await api.get<ProfileResponse>('/me/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      const data = res.data;
      setProfile(data);
      setForm({
        displayName: data.displayName ?? '',
        phone: data.phone ?? '',
      });

      const avatarOwnerId = data.userId || user?.userId;
      if (avatarOwnerId) {
        try {
          const avatar = await MediaService.getUserAvatar(avatarOwnerId);
          setAvatarUrl(avatar?.secureUrl || avatar?.url || null);
        } catch {
          setAvatarUrl(null);
        }
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setSessionExpired(true);
          logout();
          return;
        }
      }
      setError('No pudimos cargar tu perfil. Intentá nuevamente.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const parseFieldErrors = (message: string) => {
    const next: FieldErrors = {};
    const lowered = message.toLowerCase();
    if (lowered.includes('display') || lowered.includes('nombre')) {
      next.displayName = message;
    }
    if (lowered.includes('phone') || lowered.includes('tel')) {
      next.phone = message;
    }
    return next;
  };

  const handleSave = async () => {
    if (!token || saving) return;
    setSaving(true);
    setFieldErrors({});

    try {
      const payload = {
        displayName: form.displayName.trim() || null,
        phone: form.phone.trim() || null,
      };
      const res = await api.patch<ProfileResponse>('/me/profile', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updated = res.data;
      setProfile(updated);
      setForm({
        displayName: updated.displayName ?? '',
        phone: updated.phone ?? '',
      });
      toastManager.success('Perfil actualizado.', {
        idempotencyKey: 'profile-save-success',
      });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: unknown } } }).response;
        const status = response?.status;
        const messageValue = response?.data?.message;
        const message = Array.isArray(messageValue)
          ? messageValue.join(', ')
          : typeof messageValue === 'string'
          ? messageValue
          : 'No pudimos guardar los cambios.';

        if (status === 401) {
          setSessionExpired(true);
          logout();
          return;
        }
        if (status === 400) {
          const errors = parseFieldErrors(message);
          if (errors.displayName || errors.phone) {
            setFieldErrors(errors);
            return;
          }
        }
      }

      toastManager.error('No pudimos guardar los cambios. Intentá nuevamente.', {
        idempotencyKey: 'profile-save-error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!userId) return;
    const errorMessage = getFileError(file);
    if (errorMessage) {
      setAvatarError(errorMessage);
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const signature = await MediaService.getSignature({
        ownerType: MediaOwnerType.USER,
        ownerId: userId,
        kind: MediaKind.USER_AVATAR,
        fileNameHint: file.name,
      });

      const uploadResult = await cloudinaryUploadSigned(file, signature);

      await MediaService.register({
        ownerType: MediaOwnerType.USER,
        ownerId: userId,
        kind: MediaKind.USER_AVATAR,
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        bytes: uploadResult.bytes,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
      });

      const avatar = await MediaService.getUserAvatar(userId);
      setAvatarUrl(avatar?.secureUrl || avatar?.url || null);
      toastManager.success('Avatar actualizado.', { idempotencyKey: 'profile-avatar-success' });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err) {
        const status = (err as { status?: number }).status;
        if (status === 401) {
          setSessionExpired(true);
          logout();
          return;
        }
      }
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: string }).message || '')
          : '';
      setAvatarError(message || 'No pudimos subir la imagen. Reintentá.');
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (token) {
      loadProfile();
    } else {
      setProfile(null);
      setForm({ displayName: '', phone: '' });
      setAvatarUrl(null);
      setError(null);
      setSessionExpired(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
          <p className="mt-2 text-slate-500">Actualizá tus datos para acelerar futuras reservas.</p>
        </div>

        {!token ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Iniciá sesión para ver tu perfil.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                Volver al inicio
              </Link>
            </div>
          </div>
        ) : sessionExpired ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Sesión expirada.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">{error}</p>
            <button
              type="button"
              onClick={loadProfile}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500">
                        {initials}
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-xs font-semibold text-slate-600">
                        Subiendo...
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Foto de perfil</h2>
                    <p className="text-sm text-slate-500">
                      Subí una imagen clara para identificar tu cuenta.
                    </p>
                    {avatarError && (
                      <p className="mt-2 text-xs text-red-500">{avatarError}</p>
                    )}
                  </div>
                </div>
                <label className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  {avatarUploading ? 'Subiendo...' : 'Cambiar avatar'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={avatarUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleAvatarUpload(file);
                      e.currentTarget.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nombre visible
                  </label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {fieldErrors.displayName && (
                    <p className="mt-2 text-xs text-red-500">{fieldErrors.displayName}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ej: 11 2345 6789"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-2 text-xs text-red-500">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={profile?.email ?? ''}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                {!hasChanges && (
                  <span className="text-xs text-slate-400">
                    No hay cambios pendientes.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

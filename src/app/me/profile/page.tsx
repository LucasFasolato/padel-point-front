'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { LogOut, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import { toastManager } from '@/lib/toast';
import { MediaKind, MediaOwnerType } from '@/types';
import { cloudinaryUploadSigned, MediaService } from '@/services/media-service';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/hooks/use-logout';
import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Button } from '@/app/components/ui/button';

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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/10 px-4 py-3">
      <span className="text-xl font-bold text-white">{value}</span>
      <span className="mt-0.5 text-xs font-medium text-emerald-100">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { token, user, logout } = useAuthStore();
  const handleLogout = useLogout();
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
  const [editOpen, setEditOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const userId = profile?.userId || user?.userId || '';

  const { data: competitiveProfile } = useCompetitiveProfile();

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      form.displayName.trim() !== (profile.displayName ?? '') ||
      form.phone.trim() !== (profile.phone ?? '')
    );
  }, [form.displayName, form.phone, profile]);

  const initials = useMemo(() => {
    const name = form.displayName || profile?.displayName || user?.email || '';
    return name.trim().charAt(0).toUpperCase() || 'P';
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
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      const data = res.data;
      setProfile(data);
      setForm({ displayName: data.displayName ?? '', phone: data.phone ?? '' });

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
        if (status === 401) { setSessionExpired(true); logout(); return; }
      }
      setError('No pudimos cargar tu perfil. Intentá nuevamente.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const parseFieldErrors = (message: string) => {
    const next: FieldErrors = {};
    const lowered = message.toLowerCase();
    if (lowered.includes('display') || lowered.includes('nombre')) next.displayName = message;
    if (lowered.includes('phone') || lowered.includes('tel')) next.phone = message;
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
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = res.data;
      setProfile(updated);
      setForm({ displayName: updated.displayName ?? '', phone: updated.phone ?? '' });
      toastManager.success('Perfil actualizado.', { idempotencyKey: 'profile-save-success' });
      setEditOpen(false);
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

        if (status === 401) { setSessionExpired(true); logout(); return; }
        if (status === 400) {
          const errors = parseFieldErrors(message);
          if (errors.displayName || errors.phone) { setFieldErrors(errors); return; }
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
    if (errorMessage) { setAvatarError(errorMessage); return; }

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
      toastManager.success('Foto actualizada.', { idempotencyKey: 'profile-avatar-success' });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err) {
        const status = (err as { status?: number }).status;
        if (status === 401) { setSessionExpired(true); logout(); return; }
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

  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

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

  const displayName = form.displayName || profile?.displayName || user?.email || 'Jugador';

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopBar title="Mi cuenta" backHref="/" />

      {!token ? (
        <div className="px-4 py-16 text-center">
          <p className="text-slate-500">Iniciá sesión para ver tu perfil.</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white"
            >
              Iniciar sesión
            </Link>
            <Link href="/" className="text-sm text-slate-500">Volver al inicio</Link>
          </div>
        </div>
      ) : sessionExpired ? (
        <div className="px-4 py-16 text-center">
          <p className="text-slate-500">Sesión expirada.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      ) : loading ? (
        <div className="space-y-4 px-4 py-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="px-4 py-16 text-center">
          <p className="text-slate-500">{error}</p>
          <Button onClick={loadProfile} className="mt-4">Reintentar</Button>
        </div>
      ) : (
        <div className="space-y-4 px-4 py-4 pb-24">
          {/* Hero card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 shadow-lg">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-white/30"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-2 ring-white/30">
                    {initials}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white shadow-md">
                  <Camera size={14} className="text-slate-700" />
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
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] font-bold text-white">
                    ...
                  </div>
                )}
              </div>

              {/* Name + category */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-lg font-bold text-white">{displayName}</p>
                <p className="text-sm text-emerald-100">{profile?.email}</p>
                {competitiveProfile?.category && (
                  <div className="mt-2">
                    <CategoryBadge category={competitiveProfile.category} size="sm" className="bg-white/20 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats */}
            {competitiveProfile && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <StatCard label="ELO" value={competitiveProfile.elo} />
                <StatCard label="Partidos" value={competitiveProfile.matchesPlayed} />
                <StatCard label="Racha" value={competitiveProfile.winStreakCurrent ?? 0} />
              </div>
            )}

            {avatarError && (
              <p className="mt-2 rounded-lg bg-rose-500/30 px-3 py-2 text-xs text-white">{avatarError}</p>
            )}
          </div>

          {/* Edit profile accordion */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setEditOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4"
            >
              <span className="text-sm font-semibold text-slate-900">Editar perfil</span>
              {editOpen ? (
                <ChevronUp size={18} className="text-slate-400" />
              ) : (
                <ChevronDown size={18} className="text-slate-400" />
              )}
            </button>

            {editOpen && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nombre visible</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  {fieldErrors.displayName && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.displayName}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ej: 11 2345 6789"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={profile?.email ?? ''}
                    readOnly
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-400"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="w-full"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

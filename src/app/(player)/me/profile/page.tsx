'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Camera,
  ChevronDown,
  LogOut,
  MapPin,
  User,
  Swords,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toastManager } from '@/lib/toast';
import { ARGENTINA_PROVINCES } from '@/lib/argentina-provinces';
import type { ArgentinaProvince } from '@/lib/argentina-provinces';
import { AR_TOP_CITIES } from '@/lib/ar-top-cities';
import { cloudinaryUploadSigned, MediaService } from '@/services/media-service';
import { MediaKind, MediaOwnerType } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/hooks/use-logout';
import {
  useMyAccountProfile,
  useUpdateMyAccountProfile,
  useMyPlayerProfile,
  useUpdateMyPlayerProfile,
} from '@/hooks/use-player-profile';
import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import type { UpdateMyPlayerProfilePayload } from '@/services/player-service';

// ─── Types ────────────────────────────────────────────────────────────────────

type Side = 'DRIVE' | 'REVES' | 'BALANCED';

type FormValues = {
  displayName: string;
  phone: string;
  province: string;
  city: string;
  side: Side;
};

const DEFAULT_FORM: FormValues = {
  displayName: '',
  phone: '',
  province: '',
  city: '',
  side: 'BALANCED',
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#0E7C66]">
        {icon}
      </div>
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
    </div>
  );
}

// ─── Segmented control: Drive / Revés / Sin preferencia ──────────────────────

const SIDE_OPTIONS: { value: Side; label: string }[] = [
  { value: 'DRIVE', label: 'Drive' },
  { value: 'REVES', label: 'Revés' },
  { value: 'BALANCED', label: 'Sin pref.' },
];

function SegmentedControl({
  value,
  onChange,
}: {
  value: Side;
  onChange: (v: Side) => void;
}) {
  return (
    <div
      role="group"
      className="flex rounded-xl border border-slate-200 bg-slate-50 p-1"
    >
      {SIDE_OPTIONS.map(({ value: opt, label }) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
            value === opt
              ? 'bg-white text-[#0E7C66] shadow-sm ring-1 ring-slate-100'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Province select ──────────────────────────────────────────────────────────

function ProvinceSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Provincia
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-9 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Seleccioná tu provincia</option>
          {ARGENTINA_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfilePage() {
  const { user } = useAuthStore();
  const handleLogout = useLogout();

  const {
    data: accountProfile,
    isLoading: accountLoading,
    isError: accountError,
    refetch: refetchAccount,
  } = useMyAccountProfile();

  const { data: playerProfile, isLoading: playerLoading } = useMyPlayerProfile();
  const { data: competitiveProfile } = useCompetitiveProfile();

  const { mutateAsync: updateAccount, isPending: savingAccount } =
    useUpdateMyAccountProfile();
  const { mutateAsync: updatePlayer, isPending: savingPlayer } =
    useUpdateMyPlayerProfile();

  const saving = savingAccount || savingPlayer;

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [savedForm, setSavedForm] = useState<FormValues>(DEFAULT_FORM);
  const [initialized, setInitialized] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  // Initialize form once both queries resolve
  useEffect(() => {
    if (initialized || !accountProfile || !playerProfile) return;

    const tags = playerProfile.playStyleTags ?? [];
    const side: Side = tags.includes('right-side')
      ? 'DRIVE'
      : tags.includes('left-side')
        ? 'REVES'
        : 'BALANCED';

    const values: FormValues = {
      displayName: accountProfile.displayName ?? '',
      phone: accountProfile.phone ?? '',
      province: playerProfile.location?.province ?? '',
      city: playerProfile.location?.city ?? '',
      side,
    };

    setForm(values);
    setSavedForm(values);
    setInitialized(true);
  }, [initialized, accountProfile, playerProfile]);

  // Load avatar
  const userId = accountProfile?.userId ?? user?.userId;
  useEffect(() => {
    if (!userId) return;
    MediaService.getUserAvatar(userId)
      .then((a) => setAvatarUrl(a?.secureUrl ?? a?.url ?? null))
      .catch(() => setAvatarUrl(null));
  }, [userId]);

  // Dirty detection
  const isDirty = useMemo(
    () =>
      form.displayName !== savedForm.displayName ||
      form.phone !== savedForm.phone ||
      form.province !== savedForm.province ||
      form.city !== savedForm.city ||
      form.side !== savedForm.side,
    [form, savedForm],
  );

  const setField = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    [],
  );

  const handleProvinceChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, province: value, city: '' }));
  }, []);

  // Avatar upload
  const handleAvatarUpload = useCallback(
    async (file: File) => {
      if (!userId) return;
      if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        setAvatarError('Formato no permitido. Usá JPG, PNG o WEBP.');
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        setAvatarError('El archivo supera 5MB.');
        return;
      }

      setAvatarUploading(true);
      setAvatarError(null);

      try {
        const sig = await MediaService.getSignature({
          ownerType: MediaOwnerType.USER,
          ownerId: userId,
          kind: MediaKind.USER_AVATAR,
          fileNameHint: file.name,
        });
        const result = await cloudinaryUploadSigned(file, sig);
        await MediaService.register({
          ownerType: MediaOwnerType.USER,
          ownerId: userId,
          kind: MediaKind.USER_AVATAR,
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          bytes: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
        });
        const avatar = await MediaService.getUserAvatar(userId);
        setAvatarUrl(avatar?.secureUrl ?? avatar?.url ?? null);
        toastManager.success('Foto actualizada.', {
          idempotencyKey: 'profile-avatar-success',
        });
      } catch {
        setAvatarError('No pudimos subir la imagen. Reintentá.');
      } finally {
        setAvatarUploading(false);
      }
    },
    [userId],
  );

  // Save — only PATCHes changed sections
  const handleSave = useCallback(async () => {
    if (!isDirty || saving) return;

    if (!form.displayName.trim()) {
      setFieldErrors({ displayName: 'El nombre es requerido' });
      return;
    }

    setFieldErrors({});
    const tasks: Promise<unknown>[] = [];

    // Identity: only if displayName or phone changed
    const identityDirty =
      form.displayName.trim() !== savedForm.displayName.trim() ||
      form.phone.trim() !== savedForm.phone.trim();

    if (identityDirty) {
      tasks.push(
        updateAccount({
          displayName: form.displayName.trim() || null,
          phone: form.phone.trim() || null,
        }),
      );
    }

    // Player profile: location and/or side
    const locationDirty =
      form.province !== savedForm.province || form.city !== savedForm.city;
    const sideDirty = form.side !== savedForm.side;

    if (locationDirty || sideDirty) {
      const payload: UpdateMyPlayerProfilePayload = {};

      if (locationDirty) {
        payload.location = {
          country: 'Argentina',
          province: form.province || null,
          city: form.city.trim() || null,
        };
      }

      if (sideDirty) {
        const existing = playerProfile?.playStyleTags ?? [];
        const others = existing.filter(
          (t) => t !== 'right-side' && t !== 'left-side',
        );
        const sideTag =
          form.side === 'DRIVE'
            ? (['right-side'] as const)
            : form.side === 'REVES'
              ? (['left-side'] as const)
              : ([] as const);
        payload.playStyleTags = [
          ...others,
          ...sideTag,
        ] as UpdateMyPlayerProfilePayload['playStyleTags'];
      }

      tasks.push(updatePlayer(payload));
    }

    try {
      await Promise.all(tasks);
      setSavedForm({ ...form });
      toastManager.success('Perfil actualizado.', {
        idempotencyKey: 'profile-save-success',
      });
    } catch (err: unknown) {
      const res = (err as { response?: { status?: number; data?: { message?: unknown } } })
        ?.response;
      if (res?.status === 400 || res?.status === 422) {
        const raw = res.data?.message;
        const msg = Array.isArray(raw)
          ? raw.join(', ')
          : typeof raw === 'string'
            ? raw
            : '';
        const lower = msg.toLowerCase();
        if (lower.includes('display') || lower.includes('nombre')) {
          setFieldErrors({ displayName: msg });
          return;
        }
        if (lower.includes('city') || lower.includes('ciudad')) {
          setFieldErrors({ city: msg });
          return;
        }
        if (msg) {
          toastManager.error(msg, { idempotencyKey: 'profile-save-error' });
          return;
        }
      }
      toastManager.error('No pudimos guardar los cambios. Intentá nuevamente.', {
        idempotencyKey: 'profile-save-error',
      });
    }
  }, [isDirty, saving, form, savedForm, updateAccount, updatePlayer, playerProfile]);

  const loading = accountLoading || playerLoading;
  const initials = (
    form.displayName ||
    accountProfile?.email ||
    user?.email ||
    'P'
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  const suggestions = form.province
    ? (AR_TOP_CITIES[form.province as ArgentinaProvince] ?? [])
    : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-36">
      <PublicTopBar title="Mi perfil" backHref="/me" />

      {/* ── Loading ── */}
      {loading ? (
        <div className="space-y-4 px-4 py-6">
          <div className="flex justify-center py-2">
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : accountError ? (
        /* ── Error ── */
        <div className="mx-4 mt-8 flex flex-col items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-8 text-center">
          <AlertTriangle size={28} className="text-rose-400" />
          <div>
            <p className="text-sm font-semibold text-rose-700">
              No pudimos cargar tu perfil
            </p>
            <p className="mt-0.5 text-xs text-rose-500">
              Revisá tu conexión e intentá de nuevo.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetchAccount()}>
            Reintentar
          </Button>
        </div>
      ) : (
        /* ── Main content ── */
        <div className="space-y-4 px-4 py-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0E7C66] to-[#065F46] text-2xl font-bold text-white ring-4 ring-white shadow-md">
                  {initials}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-100 bg-white shadow-md">
                <Camera size={13} className="text-slate-700" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={avatarUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleAvatarUpload(file);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="hidden"
                />
              </label>
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] font-bold text-white">
                  …
                </div>
              )}
            </div>
            {avatarError && (
              <p className="text-xs text-rose-500">{avatarError}</p>
            )}
          </div>

          {/* ── A) Identidad ── */}
          <Card padding="lg">
            <SectionHeader icon={<User size={14} />} title="Identidad" />
            <div className="space-y-4">
              <Input
                label="Nombre visible"
                required
                placeholder="Tu nombre"
                value={form.displayName}
                onChange={(e) => setField('displayName', e.target.value)}
                error={fieldErrors.displayName}
              />
              <Input
                label="Teléfono"
                type="tel"
                placeholder="Ej: 11 2345 6789"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={accountProfile?.email ?? ''}
                readOnly
                disabled
                hint="El email no se puede modificar"
              />
            </div>
          </Card>

          {/* ── B) Ubicación ── */}
          <Card padding="lg">
            <SectionHeader icon={<MapPin size={14} />} title="Ubicación" />
            <div className="space-y-4">
              <ProvinceSelect
                value={form.province}
                onChange={handleProvinceChange}
              />

              <div>
                <Input
                  label="Ciudad"
                  placeholder="Ej: Palermo, CABA"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  error={fieldErrors.city}
                />
                {suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setField('city', s)}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                          form.city === s
                            ? 'border-[#0E7C66] bg-[#0E7C66] text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-[#0E7C66]/40 hover:text-[#0E7C66]',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin size={12} className="shrink-0 text-[#0E7C66]" />
                Esto define tus rankings locales
              </p>
            </div>
          </Card>

          {/* ── C) Juego ── */}
          <Card padding="lg">
            <SectionHeader icon={<Swords size={14} />} title="Juego" />
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Posición preferida
                </label>
                <SegmentedControl
                  value={form.side}
                  onChange={(v) => setField('side', v)}
                />
              </div>

              {competitiveProfile?.category != null && (
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Categoría ELO
                    </p>
                    <p className="text-xs text-slate-400">
                      Derivada de tu ELO automáticamente
                    </p>
                  </div>
                  <CategoryBadge
                    category={competitiveProfile.category}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* ── D) Cuenta ── */}
          <Card padding="none">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </Card>
        </div>
      )}

      {/* ── Sticky save bar (sits above BottomNav) ── */}
      {!loading && !accountError && (
        <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md bg-white/95 shadow-[0_-1px_0_0_theme(colors.slate.200)] backdrop-blur-sm">
          <div className="px-4 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] pt-3">
            <Button fullWidth onClick={() => void handleSave()} disabled={!isDirty} loading={saving}>
              Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

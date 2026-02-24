'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useMyPlayerProfile, useUpdateMyPlayerProfile } from '@/hooks/use-player-profile';
import type {
  MyPlayerProfileResponse,
  UpdateMyPlayerProfilePayload,
} from '@/services/player-service';

const MAX_PLAY_STYLE_TAGS = 10;
const MAX_BIO_LENGTH = 280;

const PLAY_STYLE_TAG_OPTIONS = [
  'Defensivo',
  'Ofensivo',
  'Control',
  'Potencia',
  'Volea',
  'Globo',
  'Consistente',
  'Agresivo',
  'Tactico',
  'Comunicador',
  'Drive',
  'Reves',
] as const;

type PlayerProfileFormState = {
  playStyleTags: string[];
  bio: string;
  lookingForRival: boolean;
  lookingForPartner: boolean;
  city: string;
  province: string;
  country: string;
};

type FormErrors = Partial<Record<'playStyleTags' | 'bio', string>>;

function toFormState(profile?: MyPlayerProfileResponse): PlayerProfileFormState {
  return {
    playStyleTags: profile?.playStyleTags ?? [],
    bio: profile?.bio ?? '',
    lookingForRival: Boolean(profile?.lookingFor?.rival),
    lookingForPartner: Boolean(profile?.lookingFor?.partner),
    city: profile?.location?.city ?? '',
    province: profile?.location?.province ?? '',
    country: profile?.location?.country ?? '',
  };
}

function toPayload(form: PlayerProfileFormState): UpdateMyPlayerProfilePayload {
  return {
    playStyleTags: Array.from(new Set(form.playStyleTags)).slice(0, MAX_PLAY_STYLE_TAGS),
    bio: form.bio.trim() ? form.bio.trim() : null,
    lookingFor: {
      rival: form.lookingForRival,
      partner: form.lookingForPartner,
    },
    location: {
      city: form.city.trim() ? form.city.trim() : null,
      province: form.province.trim() ? form.province.trim() : null,
      country: form.country.trim() ? form.country.trim() : null,
    },
  };
}

function validateForm(form: PlayerProfileFormState): FormErrors {
  const errors: FormErrors = {};

  if (form.playStyleTags.length > MAX_PLAY_STYLE_TAGS) {
    errors.playStyleTags = `Podes seleccionar hasta ${MAX_PLAY_STYLE_TAGS} tags.`;
  }

  if (form.bio.trim().length > MAX_BIO_LENGTH) {
    errors.bio = `La bio no puede superar ${MAX_BIO_LENGTH} caracteres.`;
  }

  return errors;
}

export function PlayerProfileEditor() {
  const router = useRouter();
  const profileQuery = useMyPlayerProfile();
  const updateMutation = useUpdateMyPlayerProfile();

  const [form, setForm] = useState<PlayerProfileFormState>(() => toFormState());
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (profileQuery.data) {
      setForm(toFormState(profileQuery.data));
      setErrors({});
    }
  }, [profileQuery.data]);

  const originalPayload = useMemo(
    () => (profileQuery.data ? toPayload(toFormState(profileQuery.data)) : null),
    [profileQuery.data],
  );
  const nextPayload = useMemo(() => toPayload(form), [form]);
  const hasChanges = originalPayload ? JSON.stringify(originalPayload) !== JSON.stringify(nextPayload) : false;

  const toggleTag = (tag: string) => {
    setErrors((prev) => ({ ...prev, playStyleTags: undefined }));
    setForm((prev) => {
      const selected = prev.playStyleTags.includes(tag);
      if (selected) {
        return { ...prev, playStyleTags: prev.playStyleTags.filter((item) => item !== tag) };
      }
      if (prev.playStyleTags.length >= MAX_PLAY_STYLE_TAGS) {
        setErrors((current) => ({
          ...current,
          playStyleTags: `Podes seleccionar hasta ${MAX_PLAY_STYLE_TAGS} tags.`,
        }));
        return prev;
      }
      return { ...prev, playStyleTags: [...prev.playStyleTags, tag] };
    });
  };

  const handleSave = async () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await updateMutation.mutateAsync(nextPayload);
      toast.success('Perfil de jugador actualizado.');
    } catch {
      toast.error('No se pudo guardar el perfil de jugador.');
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="h-10 animate-pulse rounded bg-slate-100" />
          <div className="h-32 animate-pulse rounded bg-slate-100" />
          <div className="h-10 w-40 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">No pudimos cargar tu perfil de jugador.</p>
          <button
            type="button"
            onClick={() => profileQuery.refetch()}
            className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Volver
        </button>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Perfil de jugador</h1>
            <p className="mt-2 text-sm text-slate-500">
              Completa tu estilo, bio y ubicacion para encontrar mejores partidos.
            </p>
          </div>

          <div className="space-y-8">
            <section aria-labelledby="play-style-tags">
              <div className="flex items-center justify-between gap-3">
                <h2 id="play-style-tags" className="text-sm font-semibold text-slate-900">
                  Tags de juego
                </h2>
                <span className="text-xs text-slate-500">
                  {form.playStyleTags.length}/{MAX_PLAY_STYLE_TAGS}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {PLAY_STYLE_TAG_OPTIONS.map((tag) => {
                  const selected = form.playStyleTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleTag(tag)}
                      className={[
                        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                      ].join(' ')}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {errors.playStyleTags ? (
                <p className="mt-2 text-xs text-rose-600">{errors.playStyleTags}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Selecciona hasta {MAX_PLAY_STYLE_TAGS} tags que describan tu juego.
                </p>
              )}
            </section>

            <section>
              <label htmlFor="player-bio" className="block text-sm font-semibold text-slate-900">
                Bio corta
              </label>
              <textarea
                id="player-bio"
                rows={4}
                value={form.bio}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, bio: event.target.value }));
                  setErrors((prev) => ({ ...prev, bio: undefined }));
                }}
                placeholder="Conta como te gusta jugar, horarios, nivel o lo que estas buscando."
                className="mt-3 w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                {errors.bio ? (
                  <p className="text-xs text-rose-600">{errors.bio}</p>
                ) : (
                  <p className="text-xs text-slate-500">Maximo {MAX_BIO_LENGTH} caracteres.</p>
                )}
                <span className="text-xs text-slate-400">{form.bio.length}/{MAX_BIO_LENGTH}</span>
              </div>
            </section>

            <section aria-labelledby="looking-for">
              <h2 id="looking-for" className="text-sm font-semibold text-slate-900">
                Busco rival / companero
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.lookingForRival}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, lookingForRival: event.target.checked }))
                    }
                  />
                  Busco rival
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.lookingForPartner}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, lookingForPartner: event.target.checked }))
                    }
                  />
                  Busco companero
                </label>
              </div>
            </section>

            <section aria-labelledby="location">
              <h2 id="location" className="text-sm font-semibold text-slate-900">
                Ubicacion
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <label className="block text-sm text-slate-700">
                  <span className="mb-1 block">Ciudad</span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  <span className="mb-1 block">Provincia</span>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, province: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  <span className="mb-1 block">Pais</span>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending || !hasChanges}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              {!hasChanges ? (
                <span className="text-xs text-slate-400">No hay cambios pendientes.</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerProfileEditor;

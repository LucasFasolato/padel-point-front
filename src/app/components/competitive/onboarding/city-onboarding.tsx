'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Loader2, MapPin } from 'lucide-react';
import axios from 'axios';
import { PlayerService } from '@/services/player-service';
import { ARGENTINA_PROVINCES } from '@/lib/argentina-provinces';
import type { ArgentinaProvince } from '@/lib/argentina-provinces';
import { AR_TOP_CITIES } from '@/lib/ar-top-cities';
import { toastManager } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Position = 'DRIVE' | 'REVES';

const POSITIONS: { value: Position; label: string; sub: string }[] = [
  { value: 'DRIVE', label: 'Drive', sub: 'Lado derecho' },
  { value: 'REVES', label: 'Revés', sub: 'Lado izquierdo' },
];

export function CityOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = province !== '' && city.trim() !== '' && position !== null;

  const suggestions = province
    ? (AR_TOP_CITIES[province as ArgentinaProvince] ?? [])
    : [];

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setCity(''); // reset city when province changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError('');

    try {
      await PlayerService.updateMyPlayerProfile({
        location: {
          country: 'Argentina',
          province,
          city: city.trim(),
        },
        playStyleTags: position === 'DRIVE' ? ['right-side'] : ['left-side'],
      });

      // Invalidate competitive profile so the guard re-evaluates on next load
      await queryClient.invalidateQueries({ queryKey: ['competitive', 'profile'] });

      router.replace('/competitive');
    } catch (err: unknown) {
      let msg = 'No pudimos guardar tus datos. Intentá nuevamente.';
      if (axios.isAxiosError(err)) {
        const backendMsg = err.response?.data?.message;
        if (typeof backendMsg === 'string' && backendMsg) {
          msg = backendMsg;
        }
      }
      setError(msg);
      toastManager.error(msg, { idempotencyKey: 'city-onboarding-error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col px-5 pb-6 pt-10">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E7C66]/10 text-[#0E7C66]">
          <MapPin className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">¿Dónde jugás?</h1>
        <p className="mt-1.5 max-w-[30ch] text-sm leading-relaxed text-slate-500">
          Sin ciudad no podés usar competitivo. Completá estos datos para empezar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
        {/* Province */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Provincia
          </label>
          <div className="relative">
            <select
              required
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 pr-9 text-sm text-slate-900 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
            >
              <option value="" disabled>
                Seleccioná tu provincia
              </option>
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

        {/* City */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ciudad
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Palermo, CABA"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
          />

          {/* City suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCity(s)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                    city === s
                      ? 'border-[#0E7C66] bg-[#0E7C66] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#0E7C66]/40 hover:text-[#0E7C66]'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preferred position */}
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Posición preferida
          </label>
          <div className="grid grid-cols-2 gap-3">
            {POSITIONS.map(({ value, label, sub }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPosition(value)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border-2 px-4 py-4 transition-all',
                  position === value
                    ? 'border-[#0E7C66] bg-[#0E7C66]/5 text-[#0E7C66]'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                )}
              >
                <span className="text-base font-bold">{label}</span>
                <span
                  className={cn(
                    'mt-0.5 text-[11px] font-medium',
                    position === value ? 'text-[#0E7C66]/70' : 'text-slate-500'
                  )}
                >
                  {sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit — pinned to bottom */}
        <div className="mt-auto pt-2">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0E7C66] text-sm font-semibold text-white transition-all hover:bg-[#0A6657] hover:shadow-md active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Empezar'}
          </button>
        </div>
      </form>
    </div>
  );
}

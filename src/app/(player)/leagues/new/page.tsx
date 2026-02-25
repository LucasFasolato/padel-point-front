'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useCreateLeague, useCreateMiniLeague } from '@/hooks/use-leagues';

export default function NewLeaguePage() {
  const router = useRouter();
  const createLeague = useCreateLeague();
  const createMiniLeague = useCreateMiniLeague();

  const [name, setName] = useState('');
  const [isPermanent, setIsPermanent] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];
  const isPending = createLeague.isPending || createMiniLeague.isPending;

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!name.trim()) {
      next.name = 'El nombre es obligatorio.';
    } else if (name.trim().length < 3) {
      next.name = 'Mínimo 3 caracteres.';
    }

    if (!isPermanent) {
      if (!startDate) {
        next.startDate = 'Elegí una fecha de inicio.';
      } else if (startDate < today) {
        next.startDate = 'La fecha debe ser hoy o posterior.';
      }
      if (!endDate) {
        next.endDate = 'Elegí una fecha de fin.';
      } else if (startDate && endDate <= startDate) {
        next.endDate = 'Debe ser posterior al inicio.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isPermanent) {
      createMiniLeague.mutate(
        { name: name.trim() },
        {
          onSuccess: (result) => {
            router.push(`/leagues/${result.leagueId}?created=1`);
          },
        }
      );
    } else {
      createLeague.mutate(
        { name: name.trim(), startDate, endDate },
        {
          onSuccess: (league) => {
            router.push(`/leagues/${league.id}?created=1`);
          },
        }
      );
    }
  };

  return (
    <>
      <PublicTopBar title="Nueva liga" backHref="/leagues" />

      <div className="px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Crear liga</h1>
          <p className="mt-1 text-sm text-slate-500">
            Competí con tu grupo de amigos en una liga privada.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <Input
            label="Nombre de la liga"
            required
            placeholder="Ej: Liga de los jueves"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
          />

          {/* Permanent toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Liga permanente</p>
              <p className="text-xs text-slate-500">Sin fecha de fin, siempre activa</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPermanent}
              onClick={() => {
                setIsPermanent((v) => !v);
                setErrors({});
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isPermanent ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  isPermanent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Date fields – progressive disclosure */}
          {!isPermanent && (
            <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-700">
                Definí el período de la temporada
              </p>

              <Input
                label="Fecha de inicio"
                required
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: '' }));
                }}
                error={errors.startDate}
              />

              <Input
                label="Fecha de fin"
                required
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: '' }));
                }}
                error={errors.endDate}
              />
            </div>
          )}

          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-900">
              <span className="font-semibold">Consejo:</span> Después de crear la liga
              vas a poder invitar a tus amigos.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              loading={isPending}
            >
              Crear liga
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useCreateLeague } from '@/hooks/use-leagues';

export default function NewLeaguePage() {
  const router = useRouter();
  const { mutate, isPending } = useCreateLeague();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!name.trim()) {
      next.name = 'El nombre es obligatorio';
    } else if (name.trim().length < 3) {
      next.name = 'Mínimo 3 caracteres';
    }

    if (!startDate) {
      next.startDate = 'Elegí una fecha de inicio';
    } else if (startDate < today) {
      next.startDate = 'La fecha debe ser hoy o posterior';
    }

    if (!endDate) {
      next.endDate = 'Elegí una fecha de fin';
    } else if (startDate && endDate <= startDate) {
      next.endDate = 'Debe ser posterior a la fecha de inicio';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    mutate(
      { name: name.trim(), startDate, endDate },
      {
        onSuccess: (league) => {
          router.push(`/leagues/${league.id}`);
        },
      },
    );
  };

  return (
    <>
      <PublicTopBar title="Nueva liga" backHref="/leagues" />

      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Crear liga</h1>
          <p className="mt-1 text-sm text-slate-600">
            Organizá una competencia privada con tu grupo de amigos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Tip:</span> Después de crear la liga
              vas a poder invitar a tus amigos por email.
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

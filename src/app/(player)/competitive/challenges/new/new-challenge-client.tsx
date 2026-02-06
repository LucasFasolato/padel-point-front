'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { challengesService } from '@/services/challenges-service';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { toast } from 'sonner';
import { CATEGORY_LABELS } from '@/lib/competitive-utils';

type ChallengeType = 'direct' | 'open';
type ApiErrorBody = { message?: string };

export default function NewChallengeClient() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ ahora está bajo Suspense (page.tsx)
  const queryClient = useQueryClient();

  const defaultType = (searchParams.get('type') as ChallengeType) || 'direct';
  const defaultOpponentId = searchParams.get('opponentId') || '';

  const [type, setType] = useState<ChallengeType>(
    defaultType === 'open' || defaultType === 'direct' ? defaultType : 'direct'
  );
  const [opponentUserId, setOpponentUserId] = useState(defaultOpponentId);
  const [partnerUserId, setPartnerUserId] = useState('');
  const [targetCategory, setTargetCategory] = useState<number>(6);
  const [message, setMessage] = useState('');

  const createDirectMutation = useMutation({
    mutationFn: challengesService.createDirect,
    onSuccess: () => {
      toast.success('¡Desafío enviado!');
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      router.push('/competitive/challenges');
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      toast.error(
        error.response?.data?.message || error.message || 'Error al crear el desafío'
      );
    },
  });

  const createOpenMutation = useMutation({
    mutationFn: challengesService.createOpen,
    onSuccess: () => {
      toast.success('¡Desafío abierto creado!');
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      router.push('/competitive/challenges');
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      toast.error(
        error.response?.data?.message || error.message || 'Error al crear el desafío'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'direct') {
      if (!opponentUserId.trim()) {
        toast.error('Ingresá el ID del rival');
        return;
      }

      createDirectMutation.mutate({
        opponentUserId: opponentUserId.trim(),
        partnerUserId: partnerUserId.trim() || undefined,
        message: message.trim() || undefined,
      });
    } else {
      createOpenMutation.mutate({
        targetCategory,
        partnerUserId: partnerUserId.trim() || undefined,
        message: message.trim() || undefined,
      });
    }
  };

  const isLoading = createDirectMutation.isPending || createOpenMutation.isPending;

  return (
    <>
      <PublicTopBar title="Nuevo desafío" backHref="/competitive/challenges" />

      <div className="container mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de desafío */}
          <div>
            <Label className="mb-3 block text-base font-semibold">Tipo de desafío</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as ChallengeType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct" className="cursor-pointer font-normal">
                  Directo (desafío a un jugador específico)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open" id="open" />
                <Label htmlFor="open" className="cursor-pointer font-normal">
                  Abierto (busco rival de mi categoría)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* DIRECT: Rival */}
          {type === 'direct' && (
            <div>
              <Label htmlFor="opponent">
                ID del rival <span className="text-red-500">*</span>
              </Label>
              <Input
                id="opponent"
                value={opponentUserId}
                onChange={(e) => setOpponentUserId(e.target.value)}
                placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-slate-500">
                Pedile su ID al jugador que querés desafiar
              </p>
            </div>
          )}

          {/* OPEN: Categoría objetivo */}
          {type === 'open' && (
            <div>
              <Label htmlFor="category">
                Categoría objetivo <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                value={targetCategory}
                onChange={(e) => setTargetCategory(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                disabled={isLoading}
              >
                {[8, 7, 6, 5, 4, 3, 2, 1].map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Partner */}
          <div>
            <Label htmlFor="partner">ID de tu compañero (opcional)</Label>
            <Input
              id="partner"
              value={partnerUserId}
              onChange={(e) => setPartnerUserId(e.target.value)}
              placeholder="Dejalo vacío para jugar solo"
              disabled={isLoading}
            />
          </div>

          {/* Mensaje */}
          <div>
            <Label htmlFor="message">Mensaje (opcional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dale, te espero en la cancha!"
              maxLength={280}
              disabled={isLoading}
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {message.length}/280
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar desafío'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

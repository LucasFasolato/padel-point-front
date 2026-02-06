'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Users, MessageSquare } from 'lucide-react';

import { challengesService } from '@/services/challenges-service';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { PlayerSearch } from '@/app/components/competitive/player-search';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CATEGORY_LABELS } from '@/lib/competitive-utils';

type ChallengeType = 'direct' | 'open';
type ApiErrorBody = { message?: string };

interface Player {
  userId: string;
  email: string;
  displayName: string;
}

interface Reservation {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  court?: {
    nombre?: string;
    club?: {
      nombre?: string;
      direccion?: string;
    };
  };
}

export default function NewChallengeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const defaultType = (searchParams.get('type') as ChallengeType) || 'direct';
  const reservationIdParam = searchParams.get('reservationId') || '';

  const [type, setType] = useState<ChallengeType>(defaultType);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [partner, setPartner] = useState<Player | null>(null);
  const [reservationId, setReservationId] = useState(reservationIdParam);
  const [targetCategory, setTargetCategory] = useState<number>(6);
  const [message, setMessage] = useState('');

  // Fetch mis reservas confirmadas
  const { data: reservations } = useQuery<Reservation[]>({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<Reservation[]>('/reservations/mine');
      return data.filter((r) => r.status === 'confirmed');
    },
  });

  const createDirectMutation = useMutation({
    mutationFn: challengesService.createDirect,
    onSuccess: () => {
      toast.success('🎾 ¡Desafío enviado!', {
        description: 'Te avisaremos cuando lo acepten',
      });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      router.push('/competitive/challenges');
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      toast.error(error.response?.data?.message || 'Error al enviar el desafío');
    },
  });

  const createOpenMutation = useMutation({
    mutationFn: challengesService.createOpen,
    onSuccess: () => {
      toast.success('🌟 ¡Desafío abierto creado!', {
        description: 'Esperá a que alguien lo acepte',
      });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      router.push('/competitive/challenges');
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      toast.error(error.response?.data?.message || 'Error al crear el desafío');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'direct') {
      if (!opponent) {
        toast.error('Seleccioná un rival');
        return;
      }

      createDirectMutation.mutate({
        opponentUserId: opponent.userId,
        partnerUserId: partner?.userId,
        reservationId: reservationId || undefined,
        message: message.trim() || undefined,
      });
    } else {
      createOpenMutation.mutate({
        targetCategory,
        partnerUserId: partner?.userId,
        reservationId: reservationId || undefined,
        message: message.trim() || undefined,
      });
    }
  };

  const isLoading = createDirectMutation.isPending || createOpenMutation.isPending;
  const selectedReservation = reservations?.find((r) => r.id === reservationId);

  return (
    <>
      <PublicTopBar title="Nuevo desafío" backHref="/competitive/challenges" />

      <div className="container mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de desafío */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <Label className="mb-4 block text-lg font-bold">¿A quién querés desafiar?</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as ChallengeType)}>
              <div className="space-y-3">
                <label
                  htmlFor="direct"
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                    type === 'direct'
                      ? 'border-blue-500 bg-white shadow-md'
                      : 'border-transparent bg-white/50'
                  }`}
                >
                  <RadioGroupItem value="direct" id="direct" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">🎯 Desafío directo</div>
                    <div className="text-sm text-slate-600">
                      Elegí un rival específico para jugar
                    </div>
                  </div>
                </label>

                <label
                  htmlFor="open"
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                    type === 'open'
                      ? 'border-blue-500 bg-white shadow-md'
                      : 'border-transparent bg-white/50'
                  }`}
                >
                  <RadioGroupItem value="open" id="open" className="mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">🌟 Desafío abierto</div>
                    <div className="text-sm text-slate-600">
                      Publicá el desafío y esperá que alguien lo acepte
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* DIRECT: Buscar rival */}
          {type === 'direct' && (
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Users size={18} />
                <span>
                  Rival <span className="text-red-500">*</span>
                </span>
              </Label>
              <PlayerSearch
                onSelect={(player) => setOpponent(player.userId ? player : null)}
                selectedPlayerId={opponent?.userId}
                placeholder="Buscar por nombre o email..."
                exclude={[partner?.userId].filter(Boolean) as string[]}
              />
              <p className="mt-2 text-sm text-slate-500">
                💡 Tip: Buscá por el nombre o email del jugador
              </p>
            </div>
          )}

          {/* OPEN: Categoría */}
          {type === 'open' && (
            <div>
              <Label htmlFor="category" className="mb-2 flex items-center gap-2">
                <span>🎯 Categoría objetivo</span>
              </Label>
              <select
                id="category"
                value={targetCategory}
                onChange={(e) => setTargetCategory(Number(e.target.value))}
                className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 font-semibold transition-colors focus:border-blue-500 focus:outline-none"
                disabled={isLoading}
              >
                {[8, 7, 6, 5, 4, 3, 2, 1].map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-slate-500">
                Se publicará para jugadores de esta categoría
              </p>
            </div>
          )}

          {/* Compañero (opcional) */}
          <div>
            <Label className="mb-2 flex items-center gap-2">
              <Users size={18} />
              <span>Tu compañero (opcional)</span>
            </Label>
            <PlayerSearch
              onSelect={(player) => setPartner(player.userId ? player : null)}
              selectedPlayerId={partner?.userId}
              placeholder="¿Querés jugar en pareja?"
              exclude={[opponent?.userId].filter(Boolean) as string[]}
            />
            {!partner && (
              <p className="mt-2 text-sm text-slate-500">Dejalo vacío si vas a jugar solo</p>
            )}
          </div>

          {/* Reserva asociada */}
          {reservations && reservations.length > 0 && (
            <div>
              <Label htmlFor="reservation" className="mb-2 flex items-center gap-2">
                <Calendar size={18} />
                <span>Reserva asociada (opcional)</span>
              </Label>
              <select
                id="reservation"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 transition-colors focus:border-blue-500 focus:outline-none"
                disabled={isLoading}
              >
                <option value="">Sin reserva</option>
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.court?.club?.nombre} -{' '}
                    {format(new Date(r.startAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </option>
                ))}
              </select>
              {selectedReservation && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={16} className="mt-0.5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-blue-900">
                        {selectedReservation.court?.club?.nombre}
                      </div>
                      <div className="text-blue-700">
                        {format(
                          new Date(selectedReservation.startAt),
                          "EEEE d 'de' MMMM 'a las' HH:mm",
                          { locale: es }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mensaje */}
          <div>
            <Label htmlFor="message" className="mb-2 flex items-center gap-2">
              <MessageSquare size={18} />
              <span>Mensaje (opcional)</span>
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ej: Dale, te espero en la cancha! 💪"
              maxLength={280}
              disabled={isLoading}
              className="min-h-[100px]"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">Agregá un mensaje amistoso para el rival</span>
              <span
                className={`font-mono ${message.length > 250 ? 'text-orange-600' : 'text-slate-400'}`}
              >
                {message.length}/280
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="flex-1" loading={isLoading}>
              {isLoading ? 'Enviando...' : '🎾 Enviar desafío'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
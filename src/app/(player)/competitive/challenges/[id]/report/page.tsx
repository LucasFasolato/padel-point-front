'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChallenge } from '@/hooks/use-challenges';
import { useMatchActions } from '@/hooks/use-matches';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface ReportMatchPageProps {
  params: {
    id: string;
  };
}

export default function ReportMatchPage({ params }: ReportMatchPageProps) {
  const router = useRouter();
  const { data: challenge, isLoading } = useChallenge(params.id);
  const { reportMatch } = useMatchActions();

  const [set1A, setSet1A] = useState(6);
  const [set1B, setSet1B] = useState(4);
  const [set2A, setSet2A] = useState(6);
  const [set2B, setSet2B] = useState(3);
  const [set3A, setSet3A] = useState<number | ''>('');
  const [set3B, setSet3B] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!challenge) return;

    const sets = [
      { a: set1A, b: set1B },
      { a: set2A, b: set2B },
    ];

    if (set3A !== '' && set3B !== '') {
      sets.push({ a: Number(set3A), b: Number(set3B) });
    }

    reportMatch.mutate(
      {
        challengeId: params.id,
        sets,
      },
      {
        onSuccess: () => {
          router.push('/competitive/challenges');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <>
        <PublicTopBar title="Reportar resultado" backHref="/competitive/challenges" />
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </>
    );
  }

  if (!challenge || (challenge.status !== 'ready' && challenge.status !== 'accepted')) {
    return (
      <>
        <PublicTopBar title="Reportar resultado" backHref="/competitive/challenges" />
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-slate-600">Este desafío no está listo para reportar resultado</p>
          <Button className="mt-4" onClick={() => router.push('/competitive/challenges')}>
            Volver a desafíos
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicTopBar title="Reportar resultado" backHref="/competitive/challenges" />

      <div className="container mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-6">
          <div className="mb-2 flex items-center gap-2 text-emerald-700">
            <Trophy size={20} />
            <span className="text-sm font-semibold">Partido completado</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">¿Cómo fue el resultado?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ingresá el resultado de cada set. El rival deberá confirmar el resultado.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Set 1 */}
          <div>
            <Label className="mb-3 block text-base font-semibold">
              Set 1 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="set1a" className="mb-2 block text-sm">
                  Equipo A
                </Label>
                <Input
                  id="set1a"
                  type="number"
                  min={0}
                  max={7}
                  value={set1A}
                  onChange={(e) => setSet1A(Number(e.target.value))}
                  required
                  className="text-center text-lg font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="set1b" className="mb-2 block text-sm">
                  Equipo B
                </Label>
                <Input
                  id="set1b"
                  type="number"
                  min={0}
                  max={7}
                  value={set1B}
                  onChange={(e) => setSet1B(Number(e.target.value))}
                  required
                  className="text-center text-lg font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Set 2 */}
          <div>
            <Label className="mb-3 block text-base font-semibold">
              Set 2 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="set2a" className="mb-2 block text-sm">
                  Equipo A
                </Label>
                <Input
                  id="set2a"
                  type="number"
                  min={0}
                  max={7}
                  value={set2A}
                  onChange={(e) => setSet2A(Number(e.target.value))}
                  required
                  className="text-center text-lg font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="set2b" className="mb-2 block text-sm">
                  Equipo B
                </Label>
                <Input
                  id="set2b"
                  type="number"
                  min={0}
                  max={7}
                  value={set2B}
                  onChange={(e) => setSet2B(Number(e.target.value))}
                  required
                  className="text-center text-lg font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Set 3 (opcional) */}
          <div>
            <Label className="mb-3 block text-base font-semibold">
              Set 3 (opcional)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="set3a" className="mb-2 block text-sm">
                  Equipo A
                </Label>
                <Input
                  id="set3a"
                  type="number"
                  min={0}
                  max={7}
                  value={set3A}
                  onChange={(e) =>
                    setSet3A(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="text-center text-lg font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="set3b" className="mb-2 block text-sm">
                  Equipo B
                </Label>
                <Input
                  id="set3b"
                  type="number"
                  min={0}
                  max={7}
                  value={set3B}
                  onChange={(e) =>
                    setSet3B(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="text-center text-lg font-semibold"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Dejalo vacío si el partido se definió en 2 sets
            </p>
          </div>

          {/* ELO impact notice */}
          {challenge.matchType === 'FRIENDLY' ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Partido amistoso:</span> El resultado quedará
                registrado pero{' '}
                <span className="font-semibold">no impactará el ELO</span> de ningún jugador.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#0E7C66]/5 px-4 py-3">
              <p className="text-sm text-[#0E7C66]">
                <span className="font-semibold">Partido competitivo:</span> Una vez confirmado,
                este resultado{' '}
                <span className="font-semibold">impactará tu ELO</span>.
              </p>
            </div>
          )}
          <div className="rounded-xl bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-800">
              El rival recibirá una notificación para confirmar el resultado.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => router.back()}
              disabled={reportMatch.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 gap-2"
              loading={reportMatch.isPending}
            >
              <Trophy size={18} />
              {reportMatch.isPending ? 'Reportando...' : 'Reportar resultado'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
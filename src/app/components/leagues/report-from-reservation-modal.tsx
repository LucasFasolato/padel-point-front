'use client';

import { useState, useMemo } from 'react';
import { Trophy, ArrowRight, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import Modal from '@/app/components/ui/modal';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Skeleton } from '@/app/components/ui/skeleton';
import type { LeagueMember, EligibleReservation, ReportFromReservationPayload } from '@/types/leagues';

type Step = 'reservation' | 'participants' | 'score';

interface ReportFromReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReportFromReservationPayload) => void;
  isPending?: boolean;
  members: LeagueMember[];
  reservations: EligibleReservation[];
  reservationsLoading?: boolean;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function ReportFromReservationModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  members,
  reservations,
  reservationsLoading,
}: ReportFromReservationModalProps) {
  const [step, setStep] = useState<Step>('reservation');

  // Step 1: Reservation
  const [selectedReservation, setSelectedReservation] = useState<string>('');

  // Step 2: Participants
  const [teamA1, setTeamA1] = useState('');
  const [teamA2, setTeamA2] = useState('');
  const [teamB1, setTeamB1] = useState('');
  const [teamB2, setTeamB2] = useState('');

  // Step 3: Sets
  const [sets, setSets] = useState<{ a: number | ''; b: number | '' }[]>([
    { a: '', b: '' },
    { a: '', b: '' },
  ]);

  const selectedPlayerIds = useMemo(
    () => [teamA1, teamA2, teamB1, teamB2].filter(Boolean),
    [teamA1, teamA2, teamB1, teamB2]
  );

  const participantsValid =
    teamA1 !== '' &&
    teamA2 !== '' &&
    teamB1 !== '' &&
    teamB2 !== '' &&
    new Set(selectedPlayerIds).size === 4;

  const setsValid = sets.length >= 1 && sets.every((s) => s.a !== '' && s.b !== '');

  const handleReset = () => {
    setStep('reservation');
    setSelectedReservation('');
    setTeamA1('');
    setTeamA2('');
    setTeamB1('');
    setTeamB2('');
    setSets([{ a: '', b: '' }, { a: '', b: '' }]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedReservation || !participantsValid || !setsValid) return;

    const payload: ReportFromReservationPayload = {
      reservationId: selectedReservation,
      teamA1Id: teamA1,
      teamA2Id: teamA2,
      teamB1Id: teamB1,
      teamB2Id: teamB2,
      sets: sets.map((s) => ({ a: Number(s.a), b: Number(s.b) })),
    };
    onSubmit(payload);
  };

  const addSet = () => {
    if (sets.length < 3) {
      setSets([...sets, { a: '', b: '' }]);
    }
  };

  const removeLastSet = () => {
    if (sets.length > 1) {
      setSets(sets.slice(0, -1));
    }
  };

  const updateSet = (idx: number, team: 'a' | 'b', value: string) => {
    const next = [...sets];
    next[idx] = { ...next[idx], [team]: value === '' ? '' : Math.min(7, Math.max(0, Number(value))) };
    setSets(next);
  };

  const availableMembers = (excludeIds: string[]) =>
    members.filter((m) => !excludeIds.includes(m.userId));

  const renderStepTitle = () => {
    if (step === 'reservation') return 'Elegí la reserva';
    if (step === 'participants') return 'Elegí los jugadores';
    return 'Cargá el resultado';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={renderStepTitle()}>
      <div className="space-y-4">
        {/* Step 1: Reservation selection */}
        {step === 'reservation' && (
          <>
            {reservationsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">
                  No hay reservas elegibles en los últimos 30 días.
                </p>
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {reservations.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReservation(r.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      selectedReservation === r.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {r.courtName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {r.clubName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDateTime(r.startAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={() => setStep('participants')}
              disabled={!selectedReservation}
              className="gap-2"
            >
              Siguiente
              <ArrowRight size={16} />
            </Button>
          </>
        )}

        {/* Step 2: Participants */}
        {step === 'participants' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* Team A */}
              <div>
                <p className="mb-2 text-sm font-semibold text-emerald-700">Equipo A</p>
                <div className="space-y-2">
                  <PlayerSelect
                    label="Jugador 1"
                    value={teamA1}
                    onChange={setTeamA1}
                    members={availableMembers([teamA2, teamB1, teamB2])}
                    id="teamA1"
                  />
                  <PlayerSelect
                    label="Jugador 2"
                    value={teamA2}
                    onChange={setTeamA2}
                    members={availableMembers([teamA1, teamB1, teamB2])}
                    id="teamA2"
                  />
                </div>
              </div>

              {/* Team B */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Equipo B</p>
                <div className="space-y-2">
                  <PlayerSelect
                    label="Jugador 1"
                    value={teamB1}
                    onChange={setTeamB1}
                    members={availableMembers([teamA1, teamA2, teamB2])}
                    id="teamB1"
                  />
                  <PlayerSelect
                    label="Jugador 2"
                    value={teamB2}
                    onChange={setTeamB2}
                    members={availableMembers([teamA1, teamA2, teamB1])}
                    id="teamB2"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                onClick={() => setStep('reservation')}
              >
                <ArrowLeft size={16} />
                Atrás
              </Button>
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={() => setStep('score')}
                disabled={!participantsValid}
              >
                Siguiente
                <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Score */}
        {step === 'score' && (
          <>
            <div className="space-y-4">
              {sets.map((set, idx) => (
                <div key={idx}>
                  <p className="mb-2 text-sm font-semibold">
                    Set {idx + 1} {idx < 2 && <span className="text-rose-500">*</span>}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`set${idx}a`} className="mb-1 block text-xs text-slate-500">
                        Equipo A
                      </label>
                      <Input
                        id={`set${idx}a`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        value={set.a}
                        onChange={(e) => updateSet(idx, 'a', e.target.value)}
                        className="text-center text-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label htmlFor={`set${idx}b`} className="mb-1 block text-xs text-slate-500">
                        Equipo B
                      </label>
                      <Input
                        id={`set${idx}b`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={7}
                        value={set.b}
                        onChange={(e) => updateSet(idx, 'b', e.target.value)}
                        className="text-center text-lg font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                {sets.length < 3 && (
                  <button
                    type="button"
                    onClick={addSet}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    + Agregar set
                  </button>
                )}
                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={removeLastSet}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Quitar último set
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                onClick={() => setStep('participants')}
                disabled={isPending}
              >
                <ArrowLeft size={16} />
                Atrás
              </Button>
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleSubmit}
                loading={isPending}
                disabled={!setsValid}
              >
                <Trophy size={16} />
                Cargar resultado
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------------
// Player select dropdown
// -------------------------------------------------------------------
interface PlayerSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  members: LeagueMember[];
  id: string;
}

function PlayerSelect({ label, value, onChange, members, id }: PlayerSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="">{label}</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

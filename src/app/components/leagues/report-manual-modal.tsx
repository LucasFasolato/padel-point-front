'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import Modal from '@/app/components/ui/modal';
import { Button } from '@/app/components/ui/button';
import type { LeagueMember, ReportManualPayload } from '@/types/leagues';

type Step = 'players' | 'sets' | 'review';

interface ReportManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReportManualPayload) => void;
  isPending?: boolean;
  members: LeagueMember[];
}

export function ReportManualModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  members,
}: ReportManualModalProps) {
  const [step, setStep] = useState<Step>('players');
  const [teamA1, setTeamA1] = useState('');
  const [teamA2, setTeamA2] = useState('');
  const [teamB1, setTeamB1] = useState('');
  const [teamB2, setTeamB2] = useState('');
  const [sets, setSets] = useState<Array<{ a: number | ''; b: number | '' }>>([
    { a: '', b: '' },
    { a: '', b: '' },
  ]);

  const selectedPlayerIds = useMemo(
    () => [teamA1, teamA2, teamB1, teamB2].filter(Boolean),
    [teamA1, teamA2, teamB1, teamB2]
  );

  const playersValid =
    teamA1 !== '' &&
    teamA2 !== '' &&
    teamB1 !== '' &&
    teamB2 !== '' &&
    new Set(selectedPlayerIds).size === 4;

  const setsValid = sets.length >= 1 && sets.length <= 3 && sets.every((s) => s.a !== '' && s.b !== '');

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.userId, m.displayName || 'Jugador'));
    return map;
  }, [members]);

  const resetState = () => {
    setStep('players');
    setTeamA1('');
    setTeamA2('');
    setTeamB1('');
    setTeamB2('');
    setSets([{ a: '', b: '' }, { a: '', b: '' }]);
  };

  const handleClose = () => {
    if (isPending) return;
    resetState();
    onClose();
  };

  const availableMembers = (excludeIds: string[]) =>
    members.filter((m) => !excludeIds.includes(m.userId));

  const updateSet = (idx: number, team: 'a' | 'b', value: string) => {
    const next = [...sets];
    next[idx] = {
      ...next[idx],
      [team]: value === '' ? '' : Math.min(7, Math.max(0, Number(value))),
    };
    setSets(next);
  };

  const addSet = () => {
    if (sets.length >= 3) return;
    setSets([...sets, { a: '', b: '' }]);
  };

  const removeLastSet = () => {
    if (sets.length <= 1) return;
    setSets(sets.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!playersValid || !setsValid || isPending) return;
    onSubmit({
      teamA1Id: teamA1,
      teamA2Id: teamA2,
      teamB1Id: teamB1,
      teamB2Id: teamB2,
      sets: sets.map((set) => ({ a: Number(set.a), b: Number(set.b) })),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cargar resultado manual">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className={step === 'players' ? 'text-emerald-600' : ''}>1. Jugadores</span>
          <span>|</span>
          <span className={step === 'sets' ? 'text-emerald-600' : ''}>2. Sets</span>
          <span>|</span>
          <span className={step === 'review' ? 'text-emerald-600' : ''}>3. Revisar</span>
        </div>

        {step === 'players' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-700">Equipo A</p>
                <MemberSelect
                  id="manual-teamA1"
                  label="Jugador 1"
                  value={teamA1}
                  onChange={setTeamA1}
                  members={availableMembers([teamA2, teamB1, teamB2])}
                />
                <MemberSelect
                  id="manual-teamA2"
                  label="Jugador 2"
                  value={teamA2}
                  onChange={setTeamA2}
                  members={availableMembers([teamA1, teamB1, teamB2])}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Equipo B</p>
                <MemberSelect
                  id="manual-teamB1"
                  label="Jugador 1"
                  value={teamB1}
                  onChange={setTeamB1}
                  members={availableMembers([teamA1, teamA2, teamB2])}
                />
                <MemberSelect
                  id="manual-teamB2"
                  label="Jugador 2"
                  value={teamB2}
                  onChange={setTeamB2}
                  members={availableMembers([teamA1, teamA2, teamB1])}
                />
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={() => setStep('sets')}
              disabled={!playersValid}
              className="gap-2"
            >
              Siguiente
              <ArrowRight size={16} />
            </Button>
          </>
        )}

        {step === 'sets' && (
          <>
            <div className="space-y-3">
              {sets.map((set, idx) => (
                <div key={idx}>
                  <p className="mb-1.5 text-sm font-semibold text-slate-700">Set {idx + 1}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`manual-set-${idx}-a`} className="mb-1 block text-xs text-slate-500">
                        Equipo A
                      </label>
                      <input
                        id={`manual-set-${idx}-a`}
                        type="number"
                        min={0}
                        max={7}
                        value={set.a}
                        onChange={(e) => updateSet(idx, 'a', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-lg font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label htmlFor={`manual-set-${idx}-b`} className="mb-1 block text-xs text-slate-500">
                        Equipo B
                      </label>
                      <input
                        id={`manual-set-${idx}-b`}
                        type="number"
                        min={0}
                        max={7}
                        value={set.b}
                        onChange={(e) => updateSet(idx, 'b', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-lg font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              {sets.length < 3 && (
                <button type="button" className="text-emerald-600 hover:text-emerald-700" onClick={addSet}>
                  + Agregar set
                </button>
              )}
              {sets.length > 1 && (
                <button type="button" className="text-slate-400 hover:text-slate-600" onClick={removeLastSet}>
                  Quitar ultimo set
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={() => setStep('players')}>
                <ArrowLeft size={16} />
                Atras
              </Button>
              <Button size="lg" className="flex-1 gap-2" onClick={() => setStep('review')} disabled={!setsValid}>
                Revisar
                <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Equipo A</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {memberNameById.get(teamA1) || 'Jugador'} / {memberNameById.get(teamA2) || 'Jugador'}
              </p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Equipo B</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {memberNameById.get(teamB1) || 'Jugador'} / {memberNameById.get(teamB2) || 'Jugador'}
              </p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Sets</p>
              <div className="mt-1 space-y-1">
                {sets.map((set, idx) => (
                  <p key={idx} className="text-sm font-medium text-slate-700">
                    Set {idx + 1}: {set.a}-{set.b}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={() => setStep('sets')} disabled={isPending}>
                <ArrowLeft size={16} />
                Atras
              </Button>
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleSubmit}
                loading={isPending}
                disabled={!playersValid || !setsValid}
              >
                <Trophy size={16} />
                Enviar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

interface MemberSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  members: LeagueMember[];
}

function MemberSelect({ id, label, value, onChange, members }: MemberSelectProps) {
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
            {m.displayName || 'Jugador'}
          </option>
        ))}
      </select>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/app/components/ui/modal';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import type {
  CreateLeagueMatchPayload,
  LeagueMatchCreateMode,
  LeagueMember,
} from '@/types/leagues';

interface LeagueMatchCreateModalProps {
  isOpen: boolean;
  mode: LeagueMatchCreateMode;
  members: LeagueMember[];
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLeagueMatchPayload) => void;
}

type SetDraft = { a: number | ''; b: number | '' };

export function LeagueMatchCreateModal({
  isOpen,
  mode,
  members,
  isPending,
  onClose,
  onSubmit,
}: LeagueMatchCreateModalProps) {
  const [search, setSearch] = useState('');
  const [teamA1, setTeamA1] = useState('');
  const [teamA2, setTeamA2] = useState('');
  const [teamB1, setTeamB1] = useState('');
  const [teamB2, setTeamB2] = useState('');
  const [playedAt, setPlayedAt] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sets, setSets] = useState<SetDraft[]>([
    { a: '', b: '' },
    { a: '', b: '' },
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setTeamA1('');
    setTeamA2('');
    setTeamB1('');
    setTeamB2('');
    setPlayedAt('');
    setScheduledAt('');
    setSets([{ a: '', b: '' }, { a: '', b: '' }]);
    setError('');
  }, [isOpen, mode]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.userId, m.displayName || 'Jugador'));
    return map;
  }, [members]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) =>
      (member.displayName || 'Jugador').toLowerCase().includes(query)
    );
  }, [members, search]);

  const selectedIds = [teamA1, teamA2, teamB1, teamB2].filter(Boolean);
  const teammatesValid = (teamA2 && teamB2) || (!teamA2 && !teamB2);
  const playersValid =
    Boolean(teamA1) &&
    Boolean(teamB1) &&
    teammatesValid &&
    new Set(selectedIds).size === selectedIds.length;

  const filledSets = sets
    .filter((set) => set.a !== '' && set.b !== '')
    .map((set) => ({ a: Number(set.a), b: Number(set.b) }));
  const setsValid = mode === 'scheduled' || filledSets.length > 0;

  const canSubmit = playersValid && setsValid && !isPending;

  const getAvailableMembers = (excludeIds: string[], currentValue: string) => {
    const base = filteredMembers.filter(
      (member) => !excludeIds.includes(member.userId) || member.userId === currentValue
    );
    if (!currentValue) return base;
    const selectedMember = members.find((member) => member.userId === currentValue);
    if (!selectedMember) return base;
    if (base.some((member) => member.userId === selectedMember.userId)) return base;
    return [selectedMember, ...base];
  };

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
    setSets((prev) => [...prev, { a: '', b: '' }]);
  };

  const removeSet = () => {
    if (sets.length <= 1) return;
    setSets((prev) => prev.slice(0, -1));
  };

  const toIsoOrUndefined = (value: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
  };

  const handleSubmit = () => {
    if (!playersValid) {
      setError('Seleccioná jugadores válidos. Para 2v2 completá ambos compañeros.');
      return;
    }

    if (!setsValid) {
      setError('Ingresá al menos un set para un partido ya jugado.');
      return;
    }

    setError('');

    onSubmit({
      mode,
      teamA1Id: teamA1,
      teamB1Id: teamB1,
      teamA2Id: teamA2 || undefined,
      teamB2Id: teamB2 || undefined,
      sets: mode === 'played' ? filledSets : undefined,
      playedAt: mode === 'played' ? toIsoOrUndefined(playedAt) : undefined,
      scheduledAt: mode === 'scheduled' ? toIsoOrUndefined(scheduledAt) : undefined,
    });
  };

  const title = mode === 'played' ? 'Partido ya jugado' : 'Partido por jugar';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <Input
          label="Buscar jugador"
          placeholder="Escribí un nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isPending}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-700">Equipo A</p>
            <MemberSelect
              id="create-match-team-a-1"
              label="Jugador 1"
              value={teamA1}
              onChange={setTeamA1}
              members={getAvailableMembers([teamA2, teamB1, teamB2].filter(Boolean), teamA1)}
              disabled={isPending}
            />
            <MemberSelect
              id="create-match-team-a-2"
              label="Compañero (opcional)"
              value={teamA2}
              onChange={setTeamA2}
              members={getAvailableMembers([teamA1, teamB1, teamB2].filter(Boolean), teamA2)}
              allowEmpty
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Equipo B</p>
            <MemberSelect
              id="create-match-team-b-1"
              label="Jugador 1"
              value={teamB1}
              onChange={setTeamB1}
              members={getAvailableMembers([teamA1, teamA2, teamB2].filter(Boolean), teamB1)}
              disabled={isPending}
            />
            <MemberSelect
              id="create-match-team-b-2"
              label="Compañero (opcional)"
              value={teamB2}
              onChange={setTeamB2}
              members={getAvailableMembers([teamA1, teamA2, teamB1].filter(Boolean), teamB2)}
              allowEmpty
              disabled={isPending}
            />
          </div>
        </div>

        {mode === 'played' ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Resultado (sets)</p>
            {sets.map((set, idx) => (
              <div key={idx}>
                <p className="mb-1 text-xs font-medium text-slate-500">Set {idx + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={set.a}
                    onChange={(e) => updateSet(idx, 'a', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-base font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="A"
                    disabled={isPending}
                  />
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={set.b}
                    onChange={(e) => updateSet(idx, 'b', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-base font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="B"
                    disabled={isPending}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3 text-xs font-semibold">
              {sets.length < 3 && (
                <button
                  type="button"
                  className="text-emerald-600 hover:text-emerald-700"
                  onClick={addSet}
                  disabled={isPending}
                >
                  + Agregar set
                </button>
              )}
              {sets.length > 1 && (
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={removeSet}
                  disabled={isPending}
                >
                  Quitar último set
                </button>
              )}
            </div>

            <Input
              type="datetime-local"
              label="Fecha/hora jugado (opcional)"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
              disabled={isPending}
            />
          </div>
        ) : (
          <Input
            type="datetime-local"
            label="Fecha/hora programada (opcional)"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={isPending}
          />
        )}

        {!playersValid && (
          <p className="text-xs text-slate-500">
            {teamA2 || teamB2
              ? 'Para 2v2 seleccioná compañero en ambos equipos.'
              : 'Seleccioná al menos un jugador por equipo.'}
          </p>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="button" size="lg" className="flex-1" onClick={handleSubmit} loading={isPending} disabled={!canSubmit}>
            Guardar partido
          </Button>
        </div>

        {(teamA1 || teamB1) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p>
              Equipo A: {teamA1 ? memberNameById.get(teamA1) || 'Jugador' : '—'}
              {teamA2 ? ` / ${memberNameById.get(teamA2) || 'Jugador'}` : ''}
            </p>
            <p className="mt-1">
              Equipo B: {teamB1 ? memberNameById.get(teamB1) || 'Jugador' : '—'}
              {teamB2 ? ` / ${memberNameById.get(teamB2) || 'Jugador'}` : ''}
            </p>
          </div>
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
  allowEmpty?: boolean;
  disabled?: boolean;
}

function MemberSelect({
  id,
  label,
  value,
  onChange,
  members,
  allowEmpty,
  disabled,
}: MemberSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
      >
        <option value="">{allowEmpty ? label : `${label} *`}</option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.displayName || 'Jugador'}
          </option>
        ))}
      </select>
    </div>
  );
}

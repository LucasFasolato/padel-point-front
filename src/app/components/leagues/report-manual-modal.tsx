'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Trophy, UserRound, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Skeleton } from '@/app/components/ui/skeleton';
import type { LeagueMember, ReportManualPayload, ReportManualResponse } from '@/types/leagues';

type Step = 'players' | 'score' | 'confirm' | 'success';
type SetScore = { a: number | ''; b: number | '' };

interface ReportManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReportManualPayload) => Promise<ReportManualResponse | void>;
  isPending?: boolean;
  members: LeagueMember[];
  currentUserId?: string;
  onViewMatch?: (matchId: string) => void;
}

function toInt(value: string): number | '' {
  if (value.trim() === '') return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  return Math.max(0, Math.min(7, Math.trunc(parsed)));
}

function isValidSetScore(a: number, b: number): boolean {
  if (a === b) return false;
  const winner = Math.max(a, b);
  const loser = Math.min(a, b);
  if (winner === 6 && loser <= 4) return true;
  if (winner === 7 && (loser === 5 || loser === 6)) return true;
  return false;
}

function getScoreValidation(sets: SetScore[]): string | null {
  if (sets.length < 2 || sets.length > 3) return 'Debes cargar 2 o 3 sets.';

  let winsA = 0;
  let winsB = 0;

  for (let i = 0; i < sets.length; i += 1) {
    const set = sets[i];
    if (set.a === '' || set.b === '') {
      return `Completa el set ${i + 1}.`;
    }
    const a = Number(set.a);
    const b = Number(set.b);
    if (!isValidSetScore(a, b)) {
      return `Set ${i + 1} invalido. Usa marcadores validos (6-0 a 6-4, 7-5 o 7-6).`;
    }
    if (a > b) winsA += 1;
    else winsB += 1;
  }

  if (winsA < 2 && winsB < 2) {
    return 'El partido debe tener un ganador de al menos 2 sets.';
  }

  return null;
}

function extractBackendMessage(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const response = (err as { response?: { data?: { message?: unknown } } }).response;
  const message = response?.data?.message;
  if (typeof message === 'string' && message.trim().length > 0) return message.trim();
  if (Array.isArray(message)) {
    const first = message.find((item) => typeof item === 'string' && item.trim().length > 0);
    if (typeof first === 'string') return first.trim();
  }
  return null;
}

function isPendingConfirmation(result?: ReportManualResponse | void): boolean {
  if (!result) return false;
  const status = String(result.status ?? result.match?.status ?? '').toLowerCase();
  return status.includes('pending_confirm') || status.includes('pending-confirm') || status.includes('pending');
}

function getSubmittedMatchId(result?: ReportManualResponse | void): string | null {
  if (!result) return null;
  if (typeof result.matchId === 'string' && result.matchId.length > 0) return result.matchId;
  if (typeof result.match?.id === 'string' && result.match.id.length > 0) return result.match.id;
  return null;
}

export function ReportManualModal({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
  members,
  currentUserId,
  onViewMatch,
}: ReportManualModalProps) {
  const [step, setStep] = useState<Step>('players');
  const [opponentId, setOpponentId] = useState('');
  const [playDoubles, setPlayDoubles] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  const [opponentPartnerId, setOpponentPartnerId] = useState('');
  const [sets, setSets] = useState<SetScore[]>([
    { a: '', b: '' },
    { a: '', b: '' },
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedMatchId, setSubmittedMatchId] = useState<string | null>(null);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => {
      map.set(member.userId, member.displayName || 'Jugador');
    });
    return map;
  }, [members]);

  const me = currentUserId ? members.find((member) => member.userId === currentUserId) : undefined;
  const currentPlayerName = me?.displayName || 'Vos';

  const selectableMembers = useMemo(
    () => members.filter((member) => member.userId !== currentUserId),
    [members, currentUserId]
  );
  const doublesSupported = selectableMembers.length >= 3;

  const playersError = useMemo(() => {
    if (!currentUserId) return 'No pudimos identificar tu usuario.';
    if (!opponentId) return 'Selecciona un rival.';

    if (!playDoubles) return null;

    if (!partnerId) return 'Selecciona tu companero para dobles.';
    if (!opponentPartnerId) return 'Selecciona el companero rival.';

    const picks = [currentUserId, opponentId, partnerId, opponentPartnerId];
    if (new Set(picks).size !== picks.length) {
      return 'Cada jugador debe ser distinto.';
    }
    return null;
  }, [currentUserId, opponentId, playDoubles, partnerId, opponentPartnerId]);

  const scoreError = useMemo(() => getScoreValidation(sets), [sets]);

  const resetState = () => {
    setStep('players');
    setOpponentId('');
    setPlayDoubles(false);
    setPartnerId('');
    setOpponentPartnerId('');
    setSets([{ a: '', b: '' }, { a: '', b: '' }]);
    setSubmitError(null);
    setSubmittedMatchId(null);
  };

  const closeAndReset = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const availablePartners = selectableMembers.filter((member) => member.userId !== opponentId);
  const availableOpponentPartners = selectableMembers.filter(
    (member) => member.userId !== opponentId && member.userId !== partnerId
  );
  const availableOpponents = selectableMembers.filter(
    (member) => member.userId !== partnerId && member.userId !== opponentPartnerId
  );

  const updateSet = (index: number, team: 'a' | 'b', value: string) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [team]: toInt(value) };
      return next;
    });
  };

  const addThirdSet = () => {
    if (sets.length === 2) setSets((prev) => [...prev, { a: '', b: '' }]);
  };

  const removeThirdSet = () => {
    if (sets.length === 3) setSets((prev) => prev.slice(0, 2));
  };

  const handleClose = () => {
    if (isPending) return;
    closeAndReset();
  };

  const handleSubmit = async () => {
    if (playersError || scoreError || !currentUserId) return;
    setSubmitError(null);

    const payload: ReportManualPayload = {
      teamA1Id: currentUserId,
      teamB1Id: opponentId,
      ...(playDoubles ? { teamA2Id: partnerId, teamB2Id: opponentPartnerId } : {}),
      sets: sets.map((set) => ({ a: Number(set.a), b: Number(set.b) })),
    };

    try {
      const result = await onSubmit(payload);
      const matchId = getSubmittedMatchId(result);
      setSubmittedMatchId(matchId);

      if (isPendingConfirmation(result)) {
        setStep('success');
        return;
      }

      if (matchId && onViewMatch) {
        resetState();
        onViewMatch(matchId);
        return;
      }

      closeAndReset();
    } catch (err) {
      setSubmitError(extractBackendMessage(err) ?? 'No se pudo cargar el resultado. Intenta de nuevo.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar wizard de resultado"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cargar resultado</h3>
            <p className="text-xs text-slate-500">
              {step === 'players' && 'Paso 1 de 3: Jugadores'}
              {step === 'score' && 'Paso 2 de 3: Score'}
              {step === 'confirm' && 'Paso 3 de 3: Confirmar'}
              {step === 'success' && 'Resultado enviado'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto px-5 pb-6">
          {step === 'players' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vos</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{currentPlayerName}</p>
              </div>

              <SelectField
                id="manual-opponent"
                label="Rival"
                value={opponentId}
                onChange={setOpponentId}
                options={availableOpponents}
                placeholder="Selecciona rival"
              />

              <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-slate-200 px-4 py-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-[#0E7C66] focus:ring-[#0E7C66]"
                  checked={playDoubles}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setPlayDoubles(nextValue);
                    if (!nextValue) {
                      setPartnerId('');
                      setOpponentPartnerId('');
                    }
                  }}
                  disabled={!doublesSupported}
                />
                <span className="text-sm font-medium text-slate-800">Jugar dobles</span>
                {!doublesSupported && (
                  <span className="text-xs text-slate-500">No hay jugadores suficientes</span>
                )}
              </label>

              {playDoubles && (
                <div className="space-y-3">
                  <SelectField
                    id="manual-partner"
                    label="Tu companero (opcional en ligas dobles)"
                    value={partnerId}
                    onChange={setPartnerId}
                    options={availablePartners}
                    placeholder="Selecciona companero"
                  />
                  <SelectField
                    id="manual-opponent-partner"
                    label="Companero rival"
                    value={opponentPartnerId}
                    onChange={setOpponentPartnerId}
                    options={availableOpponentPartners}
                    placeholder="Selecciona companero rival"
                  />
                </div>
              )}

              {playersError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {playersError}
                </div>
              )}

              <Button
                type="button"
                fullWidth
                className="min-h-[44px] rounded-2xl"
                disabled={Boolean(playersError)}
                onClick={() => setStep('score')}
              >
                Siguiente
                <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {step === 'score' && (
            <div className="space-y-4">
              {sets.map((set, index) => (
                <div key={`set-${index}`} className="rounded-2xl border border-slate-100 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-900">Set {index + 1}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id={`set-a-${index}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={7}
                      value={set.a}
                      onChange={(event) => updateSet(index, 'a', event.target.value)}
                      className="min-h-[44px] rounded-2xl text-center text-lg font-semibold"
                      label="Equipo A"
                    />
                    <Input
                      id={`set-b-${index}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={7}
                      value={set.b}
                      onChange={(event) => updateSet(index, 'b', event.target.value)}
                      className="min-h-[44px] rounded-2xl text-center text-lg font-semibold"
                      label="Equipo B"
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3 text-xs font-semibold">
                {sets.length === 2 ? (
                  <button
                    type="button"
                    className="min-h-[44px] rounded-2xl px-2 text-[#0E7C66]"
                    onClick={addThirdSet}
                  >
                    + Agregar tercer set
                  </button>
                ) : (
                  <button
                    type="button"
                    className="min-h-[44px] rounded-2xl px-2 text-slate-500"
                    onClick={removeThirdSet}
                  >
                    Quitar tercer set
                  </button>
                )}
              </div>

              {scoreError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {scoreError}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] flex-1 rounded-2xl"
                  onClick={() => setStep('players')}
                >
                  <ArrowLeft size={16} />
                  Atras
                </Button>
                <Button
                  type="button"
                  className="min-h-[44px] flex-1 rounded-2xl"
                  disabled={Boolean(scoreError)}
                  onClick={() => setStep('confirm')}
                >
                  Revisar
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              {isPending ? (
                <div className="space-y-2 rounded-2xl border border-slate-100 p-4">
                  <Skeleton className="h-4 w-32 rounded-xl" />
                  <Skeleton className="h-8 w-full rounded-xl" />
                  <Skeleton className="h-8 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resumen
                  </p>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs text-slate-500">Equipo A</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {currentPlayerName}
                      {playDoubles && partnerId ? ` + ${memberNameById.get(partnerId) ?? 'Jugador'}` : ''}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs text-slate-500">Equipo B</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {memberNameById.get(opponentId) ?? 'Jugador'}
                      {playDoubles && opponentPartnerId
                        ? ` + ${memberNameById.get(opponentPartnerId) ?? 'Jugador'}`
                        : ''}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs text-slate-500">Score</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {sets.map((set, index) => (
                        <span
                          key={`summary-set-${index}`}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                        >
                          Set {index + 1}: {set.a}-{set.b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {submitError}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] flex-1 rounded-2xl"
                  disabled={isPending}
                  onClick={() => setStep('score')}
                >
                  <ArrowLeft size={16} />
                  Atras
                </Button>
                <Button
                  type="button"
                  className="min-h-[44px] flex-1 rounded-2xl"
                  loading={isPending}
                  disabled={isPending}
                  onClick={() => void handleSubmit()}
                >
                  <Trophy size={16} />
                  Enviar resultado
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-700" />
                  <p className="text-sm font-bold text-emerald-900">Pendiente de confirmación</p>
                </div>
                <p className="mt-1 text-sm text-emerald-800">
                  El rival recibira una notificacion para confirmar este resultado.
                </p>
              </div>

              <div className="flex gap-2">
                {submittedMatchId && onViewMatch && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] flex-1 rounded-2xl"
                    onClick={() => onViewMatch(submittedMatchId)}
                  >
                    <UserRound size={16} />
                    Ver partido
                  </Button>
                )}
                <Button
                  type="button"
                  className="min-h-[44px] flex-1 rounded-2xl"
                  onClick={closeAndReset}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: LeagueMember[];
  placeholder: string;
}

function SelectField({ id, label, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#0E7C66] focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/15"
      >
        <option value="">{placeholder}</option>
        {options.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.displayName || 'Jugador'}
          </option>
        ))}
      </select>
    </div>
  );
}

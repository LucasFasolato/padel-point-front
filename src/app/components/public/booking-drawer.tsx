'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  X,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { toastManager } from '@/lib/toast';
import { useHoldCountdown } from '@/hooks/use-hold-countdown';
import { PlayerService } from '@/services/player-service';
import { useBookingStore } from '@/store/booking-store';
import { useAuthStore } from '@/store/auth-store';
import type { AvailabilitySlot, CreateHoldRequest } from '@/types';
import api from '@/lib/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Alert } from '@/app/components/ui/alert';

type SelectedSlotRef = {
  courtId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

type PlayerProfile = {
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
};

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildIsoForDayAndTime(day: Date, hhmm: string) {
  const [hh, mm] = hhmm.split(':').map((n) => Number(n));
  const dt = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
  return dt.toISOString();
}

// Animation variants
import type { Variants } from 'framer-motion';

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const drawerVariants: Variants = {
  hidden: { y: '100%', opacity: 0.5 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 30, stiffness: 400 },
  },
  exit: {
    y: '100%',
    opacity: 0.5,
    transition: { duration: 0.2 },
  },
};

const desktopVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 350 },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export function BookingDrawer() {
  const router = useRouter();
  const {
    isDrawerOpen,
    closeDrawer,
    club,
    court,
    selectedDate,
    selectedSlot,
    availabilityByCourt,
    hold,
    holdState,
    holdError,
    setHoldCreating,
    setHoldSuccess,
    setHoldError,
    setSelectedSlot,
    setAvailabilityForCourt,
  } = useBookingStore();

  const { token: authToken } = useAuthStore();

  // Profile state
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profilePrefilled, setProfilePrefilled] = useState(false);
  const profileAbortRef = useRef<AbortController | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  // Refs
  const holdAbortRef = useRef<AbortController | null>(null);
  const holdSuccessToastIdRef = useRef<string | number | null>(null);
  const holdSuccessToastKeyRef = useRef<string | null>(null);
  const expireToastKeyRef = useRef<string | null>(null);
  const hasExpiredRef = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const didRestoreRef = useRef(false);
  const didFetchRestoreRef = useRef(false);
  const didPrefillRef = useRef(false);

  const resetLocalState = () => {
    setNombre('');
    setEmail('');
    setTelefono('');
    setIsOpeningCheckout(false);
    setProfilePrefilled(false);
    didPrefillRef.current = false;
    if (holdSuccessToastIdRef.current) {
      toastManager.dismiss(holdSuccessToastIdRef.current);
      holdSuccessToastIdRef.current = null;
    }
    if (holdAbortRef.current) {
      holdAbortRef.current.abort();
      holdAbortRef.current = null;
    }
  };

  const getHoldErrorMessage = (err: unknown) => {
    const fallback = 'No pudimos reservar. Probá otro horario.';
    if (typeof err === 'object' && err !== null) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      if (!response) return 'No pudimos conectar. Revisá tu internet e intentá de nuevo.';
      if (response.status === 409) return 'Ese horario ya no está disponible. Elegí otro.';
      if (response.status === 410) return 'La reserva expiró. Volvé a intentarlo.';
      const serverMessage = response.data?.message;
      if (serverMessage && /expir/i.test(serverMessage)) return 'La reserva expiró. Volvé a intentarlo.';
    }
    return fallback;
  };

  const resumen = useMemo(() => {
    if (!club || !court || !selectedSlot) return null;
    return {
      club: club.nombre,
      court: court.nombre,
      dateLabel: format(selectedDate, "EEEE d 'de' MMMM", { locale: es }),
      dateLabelShort: format(selectedDate, 'EEE dd/MM', { locale: es }),
      start: selectedSlot.horaInicio,
      end: selectedSlot.horaFin,
      precio: court.precioPorHora,
    };
  }, [club, court, selectedDate, selectedSlot]);

  // Fetch profile when drawer opens
  useEffect(() => {
    if (!isDrawerOpen || !authToken) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    if (profileAbortRef.current) profileAbortRef.current.abort();
    profileAbortRef.current = new AbortController();

    const fetchProfile = async () => {
      try {
        const res = await api.get<PlayerProfile>('/me/profile', {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: profileAbortRef.current?.signal,
        });
        setProfile(res.data ?? null);
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => {
      if (profileAbortRef.current) profileAbortRef.current.abort();
    };
  }, [isDrawerOpen, authToken]);

  // Prefill form
  useEffect(() => {
    if (!isDrawerOpen || !profile || didPrefillRef.current) return;
    if (holdState === 'held') return;

    let didPrefill = false;
    if (profile.displayName && !nombre.trim()) {
      setNombre(profile.displayName);
      didPrefill = true;
    }
    if (profile.email && !email.trim()) {
      setEmail(profile.email);
      didPrefill = true;
    }
    if (profile.phone && !telefono.trim()) {
      setTelefono(profile.phone);
      didPrefill = true;
    }
    if (didPrefill) {
      setProfilePrefilled(true);
      didPrefillRef.current = true;
    }
  }, [isDrawerOpen, profile, nombre, email, telefono, holdState]);

  // ESC + scroll lock
  useEffect(() => {
    if (!isDrawerOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') closeDrawer();
      if (ev.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!active) return;
        if (ev.shiftKey && active === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && active === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isDrawerOpen, closeDrawer]);

  // Toast keys
  useEffect(() => {
    if (isDrawerOpen) {
      expireToastKeyRef.current = `hold-expired-${Date.now()}`;
      holdSuccessToastKeyRef.current = `hold-success-${Date.now()}`;
      holdSuccessToastIdRef.current = null;
      hasExpiredRef.current = false;
      didPrefillRef.current = false;
    }
  }, [isDrawerOpen]);

  // Reset on close
  useEffect(() => {
    if (!isDrawerOpen) resetLocalState();
  }, [isDrawerOpen]);

  // Save slot to session
  useEffect(() => {
    if (!isDrawerOpen || !court || !selectedSlot) return;
    try {
      const slotRef: SelectedSlotRef = {
        courtId: selectedSlot.courtId,
        fecha: selectedSlot.fecha,
        horaInicio: selectedSlot.horaInicio,
        horaFin: selectedSlot.horaFin,
      };
      sessionStorage.setItem('pp:last-slot', JSON.stringify(slotRef));
    } catch {}
  }, [isDrawerOpen, selectedSlot, court]);

  // Restore slot
  useEffect(() => {
    if (!isDrawerOpen || selectedSlot || !court) return;
    if (didRestoreRef.current) return;

    const restoreFromList = (slots: AvailabilitySlot[]) => {
      const raw = sessionStorage.getItem('pp:last-slot');
      if (!raw) return false;
      const parsed = JSON.parse(raw) as SelectedSlotRef;
      const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');

      if (!parsed || parsed.courtId !== court.id || parsed.fecha !== selectedDateKey) return false;

      const found = slots.find(
        (slot) =>
          slot.courtId === parsed.courtId &&
          slot.fecha === parsed.fecha &&
          slot.horaInicio === parsed.horaInicio &&
          slot.horaFin === parsed.horaFin
      );

      if (found) {
        setSelectedSlot(found);
        return true;
      }
      return false;
    };

    const slotsInMemory = availabilityByCourt[court.id] ?? [];
    if (slotsInMemory.length > 0) {
      if (restoreFromList(slotsInMemory)) didRestoreRef.current = true;
      return;
    }

    if (didFetchRestoreRef.current) return;
    didFetchRestoreRef.current = true;

    let cancelled = false;
    const fetchAndRestore = async () => {
      try {
        const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
        const slots = await PlayerService.getAvailability(court.id, selectedDateKey);
        if (cancelled) return;
        setAvailabilityForCourt(court.id, slots);
        if (restoreFromList(slots)) didRestoreRef.current = true;
      } catch {}
    };

    fetchAndRestore();
    return () => { cancelled = true; };
  }, [isDrawerOpen, selectedSlot, court, selectedDate, availabilityByCourt, setSelectedSlot, setAvailabilityForCourt]);

  // Cleanup
  useEffect(() => () => resetLocalState(), []);

  // Countdown
  const countdownEnabled = isDrawerOpen && holdState === 'held';
  const { timeLeftSec, expired } = useHoldCountdown({
    expiresAtIso: hold?.expiresAt ?? null,
    serverNowIso: hold?.serverNow ?? null,
    enabled: countdownEnabled,
    onExpire: () => {
      if (!isDrawerOpen || hasExpiredRef.current) return;
      hasExpiredRef.current = true;
      if (holdSuccessToastIdRef.current) {
        toastManager.dismiss(holdSuccessToastIdRef.current);
        holdSuccessToastIdRef.current = null;
      }
      if (holdAbortRef.current) {
        holdAbortRef.current.abort();
        holdAbortRef.current = null;
      }
      toastManager.error('La reserva expiró. Volvé a intentarlo.', {
        idempotencyKey: expireToastKeyRef.current ?? 'hold-expired',
      });
    },
  });

  const secondsLeft = timeLeftSec ?? 0;
  const isExpired = countdownEnabled && expired;
  const canGoCheckout = holdState === 'held' && !!hold?.id && !!hold?.checkoutToken && !isExpired;
  const formKey = useMemo(() => {
    if (!selectedSlot || !court) return 'empty';
    return `${court.id}-${selectedSlot.fecha}-${selectedSlot.horaInicio}-${selectedSlot.horaFin}`;
  }, [selectedSlot, court]);

  const nombreOk = nombre.trim().length >= 2;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isCreatingHold = holdState === 'creating';
  const canSubmit = !!resumen && !isCreatingHold && holdState !== 'held' && nombreOk && emailOk;

  const onCreateHold = async () => {
    if (!resumen || !court || !selectedSlot) return;

    setHoldCreating();
    setIsOpeningCheckout(false);
    if (holdAbortRef.current) holdAbortRef.current.abort();
    const controller = new AbortController();
    holdAbortRef.current = controller;

    try {
      const payload: CreateHoldRequest = {
        courtId: court.id,
        startAt: buildIsoForDayAndTime(selectedDate, selectedSlot.horaInicio),
        endAt: buildIsoForDayAndTime(selectedDate, selectedSlot.horaFin),
        clienteNombre: nombre.trim(),
        clienteEmail: email.trim() || undefined,
        clienteTelefono: telefono.trim() || undefined,
        precio: resumen.precio,
      };

      const res = await PlayerService.createHold(payload, controller.signal);
      setHoldSuccess(res);
      router.push(`/checkout/${res.id}?token=${encodeURIComponent(res.checkoutToken)}`);

      if (!hasExpiredRef.current) {
        const toastId = toastManager.success('Turno retenido por 10 minutos.', {
          idempotencyKey: holdSuccessToastKeyRef.current ?? 'hold-success',
        });
        holdSuccessToastIdRef.current = toastId ?? null;
      }
    } catch (err: unknown) {
      const canceled =
        controller.signal.aborted ||
        (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'ERR_CANCELED');
      if (canceled) return;
      const message = getHoldErrorMessage(err);
      setHoldError(message);
    } finally {
      if (holdAbortRef.current === controller) holdAbortRef.current = null;
    }
  };

  const onGoCheckout = () => {
    if (isExpired) {
      toastManager.error('El hold expiró. Elegí otro horario.', { idempotencyKey: 'hold-expired-cta' });
      return;
    }
    if (!hold?.id || !hold.checkoutToken) return;
    setIsOpeningCheckout(true);
    router.push(`/checkout/${hold.id}?token=${encodeURIComponent(hold.checkoutToken)}`);
  };

  // Use desktop on md+
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Panel Container */}
          <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-4">
            <motion.div
              ref={panelRef}
              variants={isDesktop ? desktopVariants : drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-drawer-title"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full bg-white shadow-2xl',
                'rounded-t-3xl md:rounded-2xl',
                'md:max-w-2xl',
                'max-h-[92vh] md:max-h-[85vh]',
                'flex flex-col',
                'ring-1 ring-black/5'
              )}
            >
              {/* Grab Handle (mobile) */}
              <div className="flex justify-center pt-3 md:hidden">
                <div className="h-1 w-10 rounded-full bg-slate-200" />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 pb-4 pt-4 md:px-6 md:pt-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                    Reserva
                  </p>
                  <h3 id="booking-drawer-title" className="mt-1 text-xl font-bold text-slate-900">
                    Confirmá tu turno
                  </h3>
                </div>
                <motion.button
                  ref={closeButtonRef}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeDrawer}
                  className="mt-1 rounded-full p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto px-5 py-5 md:px-6">
                <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                  {/* LEFT: Summary */}
                  <div className="space-y-4">
                    {/* Booking Card */}
                    {resumen ? (
                      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 ring-1 ring-slate-200/80">
                        {/* Club & Court */}
                        <div className="border-b border-slate-200/60 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{resumen.club}</p>
                              <p className="text-xs text-slate-500">{resumen.court}</p>
                            </div>
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 divide-x divide-slate-200/60">
                          <div className="flex items-center gap-2.5 px-4 py-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50">
                              <Calendar size={14} className="text-slate-500" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase text-slate-400">Día</p>
                              <p className="text-sm font-semibold capitalize text-slate-900">
                                {resumen.dateLabelShort}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 px-4 py-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50">
                              <Clock size={14} className="text-slate-500" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase text-slate-400">Horario</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {resumen.start} – {resumen.end}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between border-t border-slate-200/60 bg-white/50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CreditCard size={14} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">Total a pagar</span>
                          </div>
                          <p className="text-lg font-extrabold text-slate-900">
                            ${resumen.precio.toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-100">
                        <p className="text-sm text-slate-500">Elegí un horario para continuar.</p>
                      </div>
                    )}

                    {/* Status Cards */}
                    <AnimatePresence mode="wait">
                      {/* Expired */}
                      {isExpired && (
                        <motion.div
                          key="expired"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
                              <AlertTriangle className="text-rose-600" size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-rose-900">El turno expiró</p>
                              <p className="mt-0.5 text-sm text-rose-700/80">
                                Elegí otro horario para continuar.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Hold Active */}
                      {holdState === 'held' && hold && !isExpired && (
                        <motion.div
                          key="held"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                                <CheckCircle2 className="text-emerald-600" size={18} />
                              </div>
                              <div>
                                <p className="font-semibold text-emerald-900">Turno retenido</p>
                                <p className="mt-0.5 text-sm text-emerald-700/80">
                                  Completá el pago antes de que expire.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-mono text-sm font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                              <Timer size={14} />
                              {formatMMSS(secondsLeft)}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Error */}
                      {holdState === 'error' && holdError && (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                              <AlertTriangle className="text-amber-600" size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-amber-900">No se pudo reservar</p>
                              <p className="mt-0.5 text-sm text-amber-700/80">{holdError}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* RIGHT: Form */}
                  <div key={formKey} className="space-y-4">
                    {/* Profile Loading / Prefilled indicators */}
                    <AnimatePresence mode="wait">
                      {profileLoading && (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600"
                        >
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Cargando tus datos...
                        </motion.div>
                      )}
                      {profilePrefilled && !profileLoading && (
                        <motion.div
                          key="prefilled"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 ring-1 ring-emerald-100"
                        >
                          <User size={14} />
                          Completamos tus datos. Podés editarlos si querés.
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Name */}
                    <Input
                      label="Nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Lucas"
                      disabled={isCreatingHold}
                      error={!nombreOk && nombre.trim() ? 'Mínimo 2 caracteres.' : undefined}
                      required
                    />

                    {/* Email */}
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      disabled={isCreatingHold}
                      error={email.trim() && !emailOk ? 'Ingresá un email válido.' : undefined}
                      hint={!email.trim() ? 'Te enviaremos la confirmación.' : undefined}
                      required
                    />

                    {/* Phone */}
                    <Input
                      label="Teléfono (opcional)"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+54 9 341..."
                      disabled={isCreatingHold}
                    />

                    {/* Login hint */}
                    {!authToken && (
                      <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-xs text-slate-500">
                          <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            Iniciá sesión
                          </button>{' '}
                          para completar tus datos automáticamente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 md:px-6">
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Primary CTA */}
                  {holdState !== 'held' ? (
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      disabled={!canSubmit}
                      loading={isCreatingHold}
                      onClick={onCreateHold}
                    >
                      {!isCreatingHold && <Lock size={15} />}
                      {isCreatingHold ? 'Reservando...' : 'Retener turno (10 min)'}
                    </Button>
                  ) : isExpired ? (
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      onClick={closeDrawer}
                    >
                      Elegir otro horario
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={onGoCheckout}
                      disabled={isOpeningCheckout}
                      loading={isOpeningCheckout}
                    >
                      {isOpeningCheckout ? 'Abriendo...' : 'Continuar al pago'}
                    </Button>
                  )}

                  {/* Cancel */}
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={closeDrawer}
                  >
                    Cancelar
                  </Button>
                </div>

                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Al retener, el turno queda bloqueado temporalmente para vos.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
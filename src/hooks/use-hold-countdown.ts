'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Args = {
  expiresAtIso: string | null;
  serverNowIso: string | null; // ✅ clave: tiempo del servidor/DB
  enabled: boolean;
};

export function useHoldCountdown({ expiresAtIso, serverNowIso, enabled }: Args) {
  // Tick para re-render (evita setState dentro del body del effect)
  const [tick, setTick] = useState(0);

  // Anclas para “server time corriendo” según el reloj del cliente
  const anchorClientMsRef = useRef<number>(0);
  const anchorServerMsRef = useRef<number>(0);

  // Cuando habilita o cambian timestamps => reseteo de anclas
  useEffect(() => {
    if (!enabled || !expiresAtIso || !serverNowIso) return;

    anchorClientMsRef.current = Date.now();
    anchorServerMsRef.current = new Date(serverNowIso).getTime();
  }, [enabled, expiresAtIso, serverNowIso]);

  // Interval: setState SOLO en callback (buena práctica)
  useEffect(() => {
    if (!enabled || !expiresAtIso || !serverNowIso) return;

    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % 1_000_000);
    }, 1000);

    return () => window.clearInterval(id);
  }, [enabled, expiresAtIso, serverNowIso]);

  const ready = Boolean(enabled && expiresAtIso && serverNowIso);

  const timeLeftSec = useMemo(() => {
    if (!ready) return null;

    const expMs = new Date(expiresAtIso!).getTime();

    // “ahora” basado en serverNow + delta del reloj del cliente
    const nowMs =
      // eslint-disable-next-line react-hooks/purity
      anchorServerMsRef.current + (Date.now() - anchorClientMsRef.current);

    const diffSec = Math.floor((expMs - nowMs) / 1000);
    return Math.max(0, diffSec);
  }, [ready, expiresAtIso, tick]);

  const mmss = useMemo(() => {
    const t = timeLeftSec ?? 0;
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [timeLeftSec]);

  // ✅ Solo puede expirar si está ready
  const expired = ready && timeLeftSec === 0;

  return { mmss, expired, ready, timeLeftSec };
}

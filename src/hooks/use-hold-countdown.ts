'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type HoldCountdownState = {
  timeLeftSec: number | null; // null = aún no calculado (evita "agotado" instantáneo)
  mmss: string;
  expired: boolean;
};

function mmssFromSeconds(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Countdown robusto basado en "server time":
 * - `serverNowIso` viene del backend y refleja DB now() (source of truth)
 * - `expiresAtIso` viene del backend (DB now + HOLD_MINUTES)
 * - Estimamos "server now" con: serverNowAtFetch + (Date.now() - receivedAtClient)
 *
 * Esto evita clock-skew del cliente.
 */
export function useHoldCountdown(
  expiresAtIso: string | null,
  serverNowIso: string | null,
  enabled: boolean,
): HoldCountdownState {
  const timerRef = useRef<number | null>(null);

  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);

  // Guardamos puntos de anclaje para estimar serverNow mientras pasa el tiempo
  const anchorRef = useRef<{
    expiresMs: number;
    serverNowMs: number;
    receivedAtClientMs: number;
  } | null>(null);

  useEffect(() => {
    // Cleanup helper
    const clear = () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };

    // Reset when disabled / missing data
    if (!enabled || !expiresAtIso || !serverNowIso) {
      anchorRef.current = null;
      clear();
      // ✅ Evitamos setState sync en el primer render: lo deferimos a microtask
      queueMicrotask(() => setTimeLeftSec(null));
      return;
    }

    const expiresMs = Date.parse(expiresAtIso);
    const serverNowMs = Date.parse(serverNowIso);

    if (!Number.isFinite(expiresMs) || !Number.isFinite(serverNowMs)) {
      anchorRef.current = null;
      clear();
      queueMicrotask(() => setTimeLeftSec(0));
      return;
    }

    // Anchor: “en el momento que recibimos el payload”
    anchorRef.current = {
      expiresMs,
      serverNowMs,
      receivedAtClientMs: Date.now(),
    };

    const tick = () => {
      const a = anchorRef.current;
      if (!a) return;

      // Server now estimado
      const serverNowEstimatedMs =
        a.serverNowMs + (Date.now() - a.receivedAtClientMs);

      const diffSec = Math.max(
        0,
        Math.floor((a.expiresMs - serverNowEstimatedMs) / 1000),
      );

      setTimeLeftSec(diffSec);
    };

    // Primer tick inmediato
    tick();

    clear();
    timerRef.current = window.setInterval(tick, 1000);

    return () => clear();
  }, [enabled, expiresAtIso, serverNowIso]);

  const expired = enabled && timeLeftSec !== null && timeLeftSec <= 0;

  const mmss = useMemo(() => {
    if (!enabled) return '--:--';
    if (timeLeftSec === null) return '--:--';
    return mmssFromSeconds(timeLeftSec);
  }, [enabled, timeLeftSec]);

  return { timeLeftSec, mmss, expired };
}

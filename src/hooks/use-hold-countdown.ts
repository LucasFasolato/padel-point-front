import { useEffect, useMemo, useRef, useState } from 'react';

type HoldCountdown = {
  timeLeftSec: number | null;
  mmss: string | null;
  expired: boolean;
};

function mmssFromSeconds(timeLeft: number) {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useHoldCountdown(expiresAtIso: string | null | undefined, enabled: boolean): HoldCountdown {
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // reset when not enabled / no expiresAt
    if (!enabled || !expiresAtIso) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeftSec(null);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    const endMs = new Date(expiresAtIso).getTime();
    if (!Number.isFinite(endMs)) {
      // invalid date
      setTimeLeftSec(0);
      return;
    }

    const tick = () => {
      const diff = Math.floor((endMs - Date.now()) / 1000);
      setTimeLeftSec(diff > 0 ? diff : 0);
    };

    tick();
    timerRef.current = window.setInterval(tick, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [expiresAtIso, enabled]);

  const expired = enabled && timeLeftSec !== null && timeLeftSec <= 0;

  const mmss = useMemo(() => {
    if (timeLeftSec === null) return null;
    return mmssFromSeconds(timeLeftSec);
  }, [timeLeftSec]);

  return { timeLeftSec, mmss, expired };
}

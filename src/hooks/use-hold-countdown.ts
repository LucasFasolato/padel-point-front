import { useEffect, useMemo, useRef, useState } from 'react';

type CountdownResult = {
  secondsLeft: number | null;
  mmss: string;
  expired: boolean;
};

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useHoldCountdown(
  expiresAtIso: string | null,
  serverNowIso: string | null,
  enabled: boolean
): CountdownResult {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const expired = secondsLeft !== null && secondsLeft <= 0;

  useEffect(() => {
    // reset
    if (!enabled || !expiresAtIso || !serverNowIso) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsLeft(null);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const expiresAt = new Date(expiresAtIso).getTime();
    let serverNow = new Date(serverNowIso).getTime();

    const tick = () => {
      const diff = Math.floor((expiresAt - serverNow) / 1000);
      setSecondsLeft(diff);
      serverNow += 1000;
    };

    tick(); // initial
    timerRef.current = window.setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [expiresAtIso, serverNowIso, enabled]);

  return {
    secondsLeft,
    mmss: secondsLeft !== null ? formatMMSS(Math.max(0, secondsLeft)) : '--:--',
    expired,
  };
}

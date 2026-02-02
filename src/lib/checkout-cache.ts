import type { CheckoutReservation } from '@/types';

const PREFIX = 'pp:reservation:';
const FALLBACK_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 días (alineado con receipt)

type CacheEntry = {
  v: 1;
  savedAt: number;
  ttlMs: number;
  data: CheckoutReservation;
};

export function cacheKey(id: string) {
  return `${PREFIX}${id}`;
}

export function saveReservationCache(id: string, data: CheckoutReservation, ttlMs = FALLBACK_TTL_MS) {
  try {
    const entry: CacheEntry = { v: 1, savedAt: Date.now(), ttlMs, data };
    localStorage.setItem(cacheKey(id), JSON.stringify(entry));
  } catch {
    // storage puede fallar (quota/incógnito). No rompemos el flujo.
  }
}

export function readReservationCache(id: string): CheckoutReservation | null {
  try {
    const raw = localStorage.getItem(cacheKey(id));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEntry;

    if (!parsed || parsed.v !== 1 || !parsed.data) return null;
    const expiresAt = parsed.savedAt + (parsed.ttlMs ?? FALLBACK_TTL_MS);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(cacheKey(id));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

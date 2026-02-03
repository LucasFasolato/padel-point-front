import { toast } from 'sonner';

type ToastLevel = 'success' | 'error' | 'info';

type ToastOptions = {
  idempotencyKey?: string;
  ttlMs?: number;
};

const defaultTtlMs = 3000;
const toastKeyMap = new Map<string, number>();

const cleanupKeys = (now: number, ttlMs: number) => {
  for (const [key, ts] of toastKeyMap.entries()) {
    if (now - ts > ttlMs * 2) {
      toastKeyMap.delete(key);
    }
  }
};

const showToast = (level: ToastLevel, message: string, options?: ToastOptions) => {
  const idempotencyKey = options?.idempotencyKey;
  const ttlMs = options?.ttlMs ?? defaultTtlMs;
  const now = Date.now();

  if (idempotencyKey) {
    const lastShown = toastKeyMap.get(idempotencyKey);
    if (typeof lastShown === 'number' && now - lastShown < ttlMs) {
      return;
    }
    toastKeyMap.set(idempotencyKey, now);
    cleanupKeys(now, ttlMs);
  }

  if (level === 'success') toast.success(message);
  if (level === 'error') toast.error(message);
  if (level === 'info') toast.message(message);
};

export const toastManager = {
  success: (message: string, options?: ToastOptions) =>
    showToast('success', message, options),
  error: (message: string, options?: ToastOptions) =>
    showToast('error', message, options),
  info: (message: string, options?: ToastOptions) =>
    showToast('info', message, options),
};

export const showSuccessToast = (message: string) =>
  toastManager.success(message);

export const showErrorToast = (message: string) =>
  toastManager.error(message);

export const showMessageToast = (message: string) =>
  toastManager.info(message);

'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pp-theme';

/** Reads from localStorage — returns 'light' in SSR context. */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * useTheme — lightweight dark/light mode toggle.
 * Persists preference to localStorage and applies `dark` class to <html>.
 * Designed as a "premium" optional feature — not required on every screen.
 */
export function useTheme() {
  // Lazy initializer reads localStorage on client; falls back to 'light' on SSR.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Keep the <html> dark class in sync whenever theme changes (including on mount).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return { theme, toggle, isDark: theme === 'dark' };
}

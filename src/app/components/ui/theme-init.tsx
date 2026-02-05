'use client';

import { useEffect } from 'react';

export function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem('theme'); // 'dark' | 'light' | null
    if (saved === 'dark') document.documentElement.classList.add('dark');
    if (saved === 'light') document.documentElement.classList.remove('dark');
  }, []);

  return null;
}

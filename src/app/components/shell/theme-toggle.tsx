'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

/**
 * ThemeToggle — premium dark/light mode switch.
 *
 * Drop into TopBar's `actions` slot or any corner of a page.
 * Uses useTheme() which persists to localStorage and toggles `dark` on <html>.
 *
 * @example
 * ```tsx
 * <TopBar title="Perfil" actions={<ThemeToggle />} />
 * ```
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-xl',
        'text-slate-500 transition-colors',
        'hover:bg-slate-100 hover:text-slate-900',
        'active:bg-slate-200',
        'focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/20',
        className
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

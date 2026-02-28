'use client';

import { useCallback, useEffect } from 'react';
import { Minimize2, Trophy, TrendingUp, Wind, Zap } from 'lucide-react';
import {
  usePreferencesStore,
  type NotificationPrefs,
  type UiPrefs,
} from '@/store/preferences-store';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Card } from '@/app/components/ui/card';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

// ─── Toggle ─────────────────────────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]/40 focus-visible:ring-offset-2',
        checked ? 'bg-[#0E7C66]' : 'bg-slate-200'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// ─── Setting row ─────────────────────────────────────────────────────────────

function SettingRow({
  id,
  icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>}
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </label>
  );
}

// ─── Backend sync (fire-and-forget) ─────────────────────────────────────────
// Tries to persist settings to /players/me/profile.settings.
// Silently no-ops if the backend doesn't support the field yet.

async function syncToBackend(prefs: { notifications: NotificationPrefs; ui: UiPrefs }) {
  try {
    await api.patch('/players/me/profile', { settings: prefs });
  } catch {
    // Backend doesn't support `settings` yet — localStorage is source of truth.
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const { notifications, ui, setNotification, setUi } = usePreferencesStore();

  // Apply HTML-level side-effects whenever UI prefs change.
  // `reduce-motion` and `compact` classes can be targeted by CSS / Tailwind plugins.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('reduce-motion', ui.reducedMotion);
    html.classList.toggle('compact', ui.compactMode);
  }, [ui.reducedMotion, ui.compactMode]);

  const handleNotification = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      setNotification(key, value);
      const next = { ...notifications, [key]: value };
      void syncToBackend({ notifications: next, ui });
    },
    [notifications, ui, setNotification]
  );

  const handleUi = useCallback(
    (key: keyof UiPrefs, value: boolean) => {
      setUi(key, value);
      const next = { ...ui, [key]: value };
      void syncToBackend({ notifications, ui: next });
    },
    [notifications, ui, setUi]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopBar title="Preferencias" backHref="/me" />

      <div className="space-y-4 px-4 py-4 pb-24">
        {/* ── Notificaciones ───────────────────────────────────────────────── */}
        <Card padding="md" as="section">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Notificaciones
          </p>
          <div className="-mx-4 divide-y divide-slate-50">
            <SettingRow
              id="notif-activity"
              icon={<TrendingUp size={16} className="text-slate-500" />}
              title="Actividad y ranking"
              subtitle="Movimientos de ELO y cambios en tu posición"
              checked={notifications.activity}
              onChange={(v) => handleNotification('activity', v)}
            />
            <SettingRow
              id="notif-challenges"
              icon={<Zap size={16} className="text-slate-500" />}
              title="Desafíos"
              subtitle="Nuevos desafíos y confirmaciones de partidos"
              checked={notifications.challenges}
              onChange={(v) => handleNotification('challenges', v)}
            />
            <SettingRow
              id="notif-leagues"
              icon={<Trophy size={16} className="text-slate-500" />}
              title="Ligas"
              subtitle="Resultados, standings y actividad de liga"
              checked={notifications.leagues}
              onChange={(v) => handleNotification('leagues', v)}
            />
          </div>
        </Card>

        {/* ── Interfaz ─────────────────────────────────────────────────────── */}
        <Card padding="md" as="section">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Interfaz
          </p>
          <div className="-mx-4 divide-y divide-slate-50">
            <SettingRow
              id="ui-reduce-motion"
              icon={<Wind size={16} className="text-slate-500" />}
              title="Reducir movimiento"
              subtitle="Minimiza animaciones y transiciones"
              checked={ui.reducedMotion}
              onChange={(v) => handleUi('reducedMotion', v)}
            />
            <SettingRow
              id="ui-compact"
              icon={<Minimize2 size={16} className="text-slate-500" />}
              title="Modo compacto"
              subtitle="Reduce el espaciado entre elementos"
              checked={ui.compactMode}
              onChange={(v) => handleUi('compactMode', v)}
            />
          </div>
        </Card>

        <p className="px-1 text-center text-xs text-slate-400">
          Las preferencias se guardan en este dispositivo.
        </p>
      </div>
    </div>
  );
}

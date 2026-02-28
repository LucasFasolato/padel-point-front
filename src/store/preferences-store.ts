import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationPrefs {
  /** Actividad y ranking — ELO movements, ranking changes */
  activity: boolean;
  /** Desafíos — incoming challenges, match confirmations */
  challenges: boolean;
  /** Ligas — standings, match results, league activity */
  leagues: boolean;
}

export interface UiPrefs {
  /** Adds `reduce-motion` class to <html> to minimise animations */
  reducedMotion: boolean;
  /** Adds `compact` class to <html> for tighter spacing */
  compactMode: boolean;
}

interface PreferencesState {
  notifications: NotificationPrefs;
  ui: UiPrefs;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;
  setUi: (key: keyof UiPrefs, value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      notifications: {
        activity: true,
        challenges: true,
        leagues: true,
      },
      ui: {
        reducedMotion: false,
        compactMode: false,
      },
      setNotification: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),
      setUi: (key, value) =>
        set((s) => ({ ui: { ...s.ui, [key]: value } })),
    }),
    { name: 'pp-preferences' }
  )
);

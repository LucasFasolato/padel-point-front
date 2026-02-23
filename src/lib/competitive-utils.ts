import type { Category } from '@/types/competitive';

/**
 * Mapeo de categorías (1-8) a labels humanizados
 */
export const CATEGORY_LABELS: Record<Category, string> = {
  8: '8va',
  7: '7ma',
  6: '6ta',
  5: '5ta',
  4: '4ta',
  3: '3ra',
  2: '2da',
  1: '1ra',
};

/**
 * Colores Tailwind por categoría
 */
export const CATEGORY_COLORS: Record<Category, string> = {
  1: 'bg-purple-600 text-white',
  2: 'bg-purple-500 text-white',
  3: 'bg-blue-600 text-white',
  4: 'bg-blue-500 text-white',
  5: 'bg-green-500 text-white',
  6: 'bg-yellow-500 text-gray-900',
  7: 'bg-orange-500 text-white',
  8: 'bg-gray-500 text-white',
};

/**
 * Formatea cambio de ELO con signo
 */
export function formatEloChange(change: number): string {
  return change > 0 ? `+${change}` : `${change}`;
}

/**
 * Copy para racha
 */
export function getStreakCopy(wins: number, losses: number): {
  text: string;
  emoji: string;
} {
  const streak = wins - losses;
  
  if (streak >= 3) return { text: `${streak} victorias`, emoji: '🔥' };
  if (streak >= 1) return { text: `${streak} victoria${streak > 1 ? 's' : ''}`, emoji: '✅' };
  if (streak <= -3) return { text: `${Math.abs(streak)} derrotas`, emoji: '❄️' };
  
  return { text: 'Sin racha', emoji: '' };
}

/**
 * Calcula win rate en %
 */
export function getWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

const ELO_HISTORY_REASON_LABELS: Record<string, string> = {
  match_result: 'Resultado de partido',
  init_category: 'Asignación de categoría',
  admin_adjustment: 'Ajuste manual',
  import: 'Importación',
  unknown: 'Actualización',
};

export function getEloHistoryReasonLabel(reason: string | null | undefined): string {
  if (!reason) return ELO_HISTORY_REASON_LABELS.unknown;
  return ELO_HISTORY_REASON_LABELS[reason] ?? ELO_HISTORY_REASON_LABELS.unknown;
}

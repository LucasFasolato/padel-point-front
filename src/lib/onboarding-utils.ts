import type { Category } from '@/types/competitive';
import type { PlayerGoal, PlayFrequency } from '@/store/onboarding-store';

export const TOTAL_STEPS = 4;

export interface CategoryOption {
  value: Category;
  label: string;
  description: string;
  example: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: 8,
    label: '8va - Estoy empezando',
    description: 'Recién conociendo las reglas y la cancha',
    example: 'Ej: jugaste pocas veces o solo con amigos',
  },
  {
    value: 7,
    label: '7ma - Nivel inicial',
    description: 'Conocés lo básico pero todavía estás encontrando tu juego',
    example: 'Ej: jugás hace unos meses, peloteo tranquilo',
  },
  {
    value: 6,
    label: '6ta - Nivel intermedio bajo',
    description: 'Manejás bien las jugadas básicas, empezás a armar puntos',
    example: 'Ej: vas a la pared, sacás con dirección',
  },
  {
    value: 5,
    label: '5ta - Nivel intermedio',
    description: 'Buen control de pelotas, jugás con estrategia',
    example: 'Ej: bajada de pared, volea firme, buen saque',
  },
  {
    value: 4,
    label: '4ta - Intermedio avanzado',
    description: 'Jugás partidos tácticos, buena pegada y lectura del juego',
    example: 'Ej: viboreás, smash controlado, ganás puntos en la red',
  },
  {
    value: 3,
    label: '3ra - Nivel avanzado',
    description: 'Dominio técnico alto, jugás torneos regularmente',
    example: 'Ej: bajada de pared con efecto, buena bandeja',
  },
  {
    value: 2,
    label: '2da - Muy avanzado',
    description: 'Nivel de torneo competitivo, técnica sólida y consistente',
    example: 'Ej: competís en ligas locales, ganás con frecuencia',
  },
  {
    value: 1,
    label: '1ra - Nivel élite',
    description: 'Máximo nivel amateur, consistencia y potencia',
    example: 'Ej: jugás torneos de alto nivel, federado o similar',
  },
];

export interface GoalOption {
  value: PlayerGoal;
  label: string;
  description: string;
  icon: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'improve',
    label: 'Mejorar mi juego',
    description: 'Quiero medir mi progreso y subir de nivel',
    icon: '📈',
  },
  {
    value: 'compete',
    label: 'Competir y ganar',
    description: 'Quiero desafiar jugadores y escalar en el ranking',
    icon: '🏆',
  },
  {
    value: 'socialize',
    label: 'Conocer gente y jugar',
    description: 'Quiero encontrar jugadores de mi nivel para pasarla bien',
    icon: '🤝',
  },
];

export interface FrequencyOption {
  value: PlayFrequency;
  label: string;
  description: string;
}

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    value: '1-2',
    label: '1–2 veces por semana',
    description: 'Cuando puedo, sin presión',
  },
  {
    value: '3-4',
    label: '3–4 veces por semana',
    description: 'Juego seguido, me gusta la rutina',
  },
  {
    value: '5+',
    label: '5+ veces por semana',
    description: 'Vivo en la cancha',
  },
];

/** Validates that a step can advance */
export function canAdvanceFromStep(
  step: number,
  state: { category: Category | null; goal: PlayerGoal | null; frequency: PlayFrequency | null }
): boolean {
  switch (step) {
    case 0: // Welcome - always can advance
      return true;
    case 1: // Category
      return state.category !== null;
    case 2: // Goal + Frequency
      return state.goal !== null && state.frequency !== null;
    case 3: // Confirmation - final step
      return state.category !== null && state.goal !== null && state.frequency !== null;
    default:
      return false;
  }
}

/** Returns label for a category value */
export function getCategoryLabel(category: Category): string {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? `Categoría ${category}`;
}

/** Returns label for a goal value */
export function getGoalLabel(goal: PlayerGoal): string {
  return GOAL_OPTIONS.find((g) => g.value === goal)?.label ?? goal;
}

/** Returns label for a frequency value */
export function getFrequencyLabel(frequency: PlayFrequency): string {
  return FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? frequency;
}

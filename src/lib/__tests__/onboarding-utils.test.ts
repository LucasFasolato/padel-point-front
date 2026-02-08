import { describe, expect, it } from 'vitest';
import {
  canAdvanceFromStep,
  getCategoryLabel,
  getGoalLabel,
  getFrequencyLabel,
  CATEGORY_OPTIONS,
  GOAL_OPTIONS,
  FREQUENCY_OPTIONS,
  TOTAL_STEPS,
} from '../onboarding-utils';

describe('onboarding-utils', () => {
  describe('canAdvanceFromStep', () => {
    const emptyState = { category: null, goal: null, frequency: null };

    it('step 0 (welcome) always allows advance', () => {
      expect(canAdvanceFromStep(0, emptyState)).toBe(true);
    });

    it('step 1 requires category selection', () => {
      expect(canAdvanceFromStep(1, emptyState)).toBe(false);
      expect(canAdvanceFromStep(1, { ...emptyState, category: 5 })).toBe(true);
    });

    it('step 2 requires both goal and frequency', () => {
      expect(canAdvanceFromStep(2, emptyState)).toBe(false);
      expect(canAdvanceFromStep(2, { ...emptyState, goal: 'improve' })).toBe(false);
      expect(canAdvanceFromStep(2, { ...emptyState, frequency: 'weekly' })).toBe(false);
      expect(
        canAdvanceFromStep(2, { ...emptyState, goal: 'compete', frequency: 'biweekly' })
      ).toBe(true);
    });

    it('step 3 (confirm) requires all fields', () => {
      expect(canAdvanceFromStep(3, emptyState)).toBe(false);
      expect(
        canAdvanceFromStep(3, { category: 4, goal: 'socialize', frequency: 'daily' })
      ).toBe(true);
    });

    it('invalid step returns false', () => {
      expect(canAdvanceFromStep(99, emptyState)).toBe(false);
      expect(canAdvanceFromStep(-1, emptyState)).toBe(false);
    });
  });

  describe('label helpers', () => {
    it('getCategoryLabel returns correct label for all categories', () => {
      for (const opt of CATEGORY_OPTIONS) {
        expect(getCategoryLabel(opt.value)).toBe(opt.label);
      }
    });

    it('getCategoryLabel returns fallback for unknown category', () => {
      // @ts-expect-error testing invalid input
      expect(getCategoryLabel(99)).toBe('Categoría 99');
    });

    it('getGoalLabel returns correct label', () => {
      expect(getGoalLabel('improve')).toBe('Mejorar mi juego');
      expect(getGoalLabel('compete')).toBe('Competir y ganar');
      expect(getGoalLabel('socialize')).toBe('Conocer gente y jugar');
    });

    it('getFrequencyLabel returns correct label', () => {
      expect(getFrequencyLabel('daily')).toBe('Todos los días');
      expect(getFrequencyLabel('weekly')).toBe('3–4 veces por semana');
      expect(getFrequencyLabel('biweekly')).toBe('1–2 veces por semana');
      expect(getFrequencyLabel('monthly')).toBe('Algunas veces al mes');
      expect(getFrequencyLabel('occasional')).toBe('De vez en cuando');
    });
  });

  describe('options completeness', () => {
    it('has 8 category options covering all categories', () => {
      expect(CATEGORY_OPTIONS).toHaveLength(8);
      const values = CATEGORY_OPTIONS.map((o) => o.value).sort();
      expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('has 3 goal options', () => {
      expect(GOAL_OPTIONS).toHaveLength(3);
    });

    it('has 5 frequency options', () => {
      expect(FREQUENCY_OPTIONS).toHaveLength(5);
    });

    it('TOTAL_STEPS is 4', () => {
      expect(TOTAL_STEPS).toBe(4);
    });
  });
});

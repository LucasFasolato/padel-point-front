import { describe, expect, it } from 'vitest';
import { getEloHistoryReasonLabel } from '../competitive-utils';

describe('getEloHistoryReasonLabel', () => {
  it('maps known reasons to friendly labels', () => {
    expect(getEloHistoryReasonLabel('match_result')).toBe('Resultado de partido');
    expect(getEloHistoryReasonLabel('init_category')).toBe('Asignación de categoría');
    expect(getEloHistoryReasonLabel('admin_adjustment')).toBe('Ajuste manual');
    expect(getEloHistoryReasonLabel('import')).toBe('Importación');
  });

  it('falls back to Actualización for unknown reasons', () => {
    expect(getEloHistoryReasonLabel('something_new')).toBe('Actualización');
    expect(getEloHistoryReasonLabel(undefined)).toBe('Actualización');
    expect(getEloHistoryReasonLabel(null)).toBe('Actualización');
  });
});

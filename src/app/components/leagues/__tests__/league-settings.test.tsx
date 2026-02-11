import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LeagueSettingsPanel } from '../league-settings';
import type { LeagueSettings } from '@/types/leagues';

const DEFAULT_SETTINGS: LeagueSettings = {
  scoring: { win: 3, draw: 1, loss: 0 },
  tieBreakers: ['points', 'wins', 'set_difference', 'game_difference'],
  includeSources: { reservation: true, manual: true },
};

const defaultProps = {
  settings: DEFAULT_SETTINGS,
  isReadOnly: false,
  onSave: vi.fn(),
  isSaving: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LeagueSettingsPanel', () => {
  it('renders scoring inputs with default values', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    expect(screen.getByLabelText('Victoria')).toHaveValue(3);
    expect(screen.getByLabelText('Empate')).toHaveValue(1);
    expect(screen.getByLabelText('Derrota')).toHaveValue(0);
    expect(screen.getByText('Default 3–1–0')).toBeInTheDocument();
  });

  it('renders tie-breaker list in order', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    expect(screen.getByText('1. Puntos')).toBeInTheDocument();
    expect(screen.getByText('2. Victorias')).toBeInTheDocument();
    expect(screen.getByText('3. Diferencia de sets')).toBeInTheDocument();
    expect(screen.getByText('4. Diferencia de games')).toBeInTheDocument();
    expect(
      screen.getByText('Se usa para desempatar cuando hay igualdad de puntos')
    ).toBeInTheDocument();
  });

  it('renders source toggles checked by default', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    expect(screen.getByText('Partidos cargados desde reserva')).toBeInTheDocument();
    expect(screen.getByText('Partidos cargados manualmente')).toBeInTheDocument();
  });

  it('shows validation error when win < draw', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Victoria'), { target: { value: '0' } });
    expect(screen.getByText('Victoria ≥ Empate ≥ Derrota.')).toBeInTheDocument();
  });

  it('disables save button when no changes', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    expect(screen.getByText('Guardar ajustes')).toBeDisabled();
  });

  it('enables save button after valid change', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Victoria'), { target: { value: '5' } });
    expect(screen.getByText('Guardar ajustes')).not.toBeDisabled();
  });

  it('calls onSave with correct payload', () => {
    const onSave = vi.fn();
    render(<LeagueSettingsPanel {...defaultProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Victoria'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Guardar ajustes'));

    expect(onSave).toHaveBeenCalledWith({
      scoring: { win: 5, draw: 1, loss: 0 },
      tieBreakers: ['points', 'wins', 'set_difference', 'game_difference'],
      includeSources: { reservation: true, manual: true },
    });
  });

  it('renders read-only state with lock message for MEMBER', () => {
    render(<LeagueSettingsPanel {...defaultProps} isReadOnly />);
    expect(
      screen.getByText('Solo administradores pueden editar las reglas.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Victoria')).toBeDisabled();
    expect(screen.getByLabelText('Empate')).toBeDisabled();
    expect(screen.getByLabelText('Derrota')).toBeDisabled();
    expect(screen.queryByText('Guardar ajustes')).not.toBeInTheDocument();
  });

  it('hides up/down buttons in read-only mode', () => {
    render(<LeagueSettingsPanel {...defaultProps} isReadOnly />);
    expect(screen.queryByLabelText('Subir Puntos')).not.toBeInTheDocument();
  });

  it('moves tie-breaker up when clicking up arrow', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    // Move "Victorias" (index 1) up
    fireEvent.click(screen.getByLabelText('Subir Victorias'));
    expect(screen.getByText('1. Victorias')).toBeInTheDocument();
    expect(screen.getByText('2. Puntos')).toBeInTheDocument();
  });

  it('moves tie-breaker down when clicking down arrow', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    // Move "Puntos" (index 0) down
    fireEvent.click(screen.getByLabelText('Bajar Puntos'));
    expect(screen.getByText('1. Victorias')).toBeInTheDocument();
    expect(screen.getByText('2. Puntos')).toBeInTheDocument();
  });

  it('toggles source checkbox', () => {
    render(<LeagueSettingsPanel {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Toggle manual off
    fireEvent.click(checkboxes[1]);
    // Save should be enabled now since there's a change
    expect(screen.getByText('Guardar ajustes')).not.toBeDisabled();
  });
});

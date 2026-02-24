import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyPlayerProfileResponse } from '@/services/player-service';

const mockBack = vi.fn();
const mockUseMyPlayerProfile = vi.fn();
const mockUseUpdateMyPlayerProfile = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('@/hooks/use-player-profile', () => ({
  useMyPlayerProfile: () => mockUseMyPlayerProfile(),
  useUpdateMyPlayerProfile: () => mockUseUpdateMyPlayerProfile(),
}));

import PlayerProfileEditor from '../player-profile-editor';

function makeProfile(overrides: Partial<MyPlayerProfileResponse> = {}): MyPlayerProfileResponse {
  return {
    playStyleTags: ['Control', 'Volea'],
    bio: 'Juego por la tarde',
    lookingFor: { rival: true, partner: false },
    location: { city: 'Cordoba', province: 'Cordoba', country: 'Argentina' },
    updatedAt: '2026-02-24T12:00:00Z',
    ...overrides,
  };
}

describe('PlayerProfileEditor', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseMyPlayerProfile.mockReturnValue({
      data: makeProfile(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseUpdateMyPlayerProfile.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    mutateAsync.mockResolvedValue(makeProfile());
  });

  it('renders existing values from profile', () => {
    render(<PlayerProfileEditor />);

    expect(screen.getByRole('heading', { name: 'Perfil de jugador' })).toBeInTheDocument();
    expect(screen.getByLabelText('Bio corta')).toHaveValue('Juego por la tarde');
    expect(screen.getByLabelText('Ciudad')).toHaveValue('Cordoba');
    expect(screen.getByLabelText('Provincia')).toHaveValue('Cordoba');
    expect(screen.getByLabelText('Pais')).toHaveValue('Argentina');
    expect(screen.getByRole('button', { name: 'Control' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('saves updates and shows success toast', async () => {
    render(<PlayerProfileEditor />);

    fireEvent.change(screen.getByLabelText('Bio corta'), {
      target: { value: 'Juego por la noche y fines de semana' },
    });
    fireEvent.click(screen.getByLabelText('Busco companero'));
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Rosario' } });
    fireEvent.change(screen.getByLabelText('Provincia'), { target: { value: 'Santa Fe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tactico' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        playStyleTags: ['Control', 'Volea', 'Tactico'],
        bio: 'Juego por la noche y fines de semana',
        lookingFor: { rival: true, partner: true },
        location: { city: 'Rosario', province: 'Santa Fe', country: 'Argentina' },
      });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('Perfil de jugador actualizado.');
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('shows validation errors and prevents save', async () => {
    mockUseMyPlayerProfile.mockReturnValue({
      data: makeProfile({
        playStyleTags: [
          'Defensivo',
          'Ofensivo',
          'Control',
          'Potencia',
          'Volea',
          'Globo',
          'Consistente',
          'Agresivo',
          'Tactico',
          'Comunicador',
        ],
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PlayerProfileEditor />);

    fireEvent.click(screen.getByRole('button', { name: 'Drive' }));
    expect(screen.getByText('Podes seleccionar hasta 10 tags.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Bio corta'), {
      target: { value: 'x'.repeat(281) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('La bio no puede superar 280 caracteres.')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    await waitFor(() => expect(mockToastError).not.toHaveBeenCalled());
  });
});

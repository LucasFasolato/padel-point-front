import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InviteModal } from '../invite-modal';

describe('InviteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders the modal with title', () => {
    render(<InviteModal {...defaultProps} />);
    expect(screen.getByText('Invitar jugadores')).toBeInTheDocument();
  });

  it('disables submit when no emails added', () => {
    render(<InviteModal {...defaultProps} />);
    const submitBtn = screen.getByText('Enviar invitaciones');
    expect(submitBtn).toBeDisabled();
  });

  it('shows error for invalid email', () => {
    render(<InviteModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('email@ejemplo.com');

    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar email' })); // Plus button

    expect(screen.getByText('Ingresá un email válido')).toBeInTheDocument();
  });

  it('adds valid email as chip', () => {
    render(<InviteModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('email@ejemplo.com');

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar email' })); // Plus button

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('1 invitación')).toBeInTheDocument();
  });

  it('prevents duplicate emails', () => {
    render(<InviteModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('email@ejemplo.com');
    const addBtn = screen.getByRole('button', { name: 'Agregar email' });

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(addBtn);

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(addBtn);

    expect(screen.getByText('Este email ya fue agregado')).toBeInTheDocument();
  });
});

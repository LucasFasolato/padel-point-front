import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationBell } from '../notification-bell';

describe('NotificationBell', () => {
  it('renders without badge when count is 0', () => {
    render(<NotificationBell count={0} onClick={vi.fn()} />);
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders badge with count when > 0', () => {
    render(<NotificationBell count={5} onClick={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('5 notificaciones sin leer')).toBeInTheDocument();
  });

  it('caps display at 99+', () => {
    render(<NotificationBell count={150} onClick={vi.fn()} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<NotificationBell count={3} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has accessible button role', () => {
    render(<NotificationBell count={0} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

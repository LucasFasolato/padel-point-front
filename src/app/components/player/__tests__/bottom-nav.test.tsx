import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/competitive',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { BottomNav } from '../bottom-nav';

describe('BottomNav', () => {
  it('renders 4 navigation tabs', () => {
    render(<BottomNav />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();
    expect(screen.getByText('Ligas')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('Inicio links to /competitive', () => {
    render(<BottomNav />);
    expect(screen.getByText('Inicio').closest('a')).toHaveAttribute('href', '/competitive');
  });

  it('Ranking links to /ranking', () => {
    render(<BottomNav />);
    expect(screen.getByText('Ranking').closest('a')).toHaveAttribute('href', '/ranking');
  });

  it('Ligas links to /leagues', () => {
    render(<BottomNav />);
    expect(screen.getByText('Ligas').closest('a')).toHaveAttribute('href', '/leagues');
  });

  it('Perfil links to /me/profile', () => {
    render(<BottomNav />);
    expect(screen.getByText('Perfil').closest('a')).toHaveAttribute('href', '/me/profile');
  });

  it('marks the active tab with aria-current="page"', () => {
    // usePathname is mocked to return '/competitive'
    render(<BottomNav />);
    const inicioLink = screen.getByText('Inicio').closest('a');
    expect(inicioLink).toHaveAttribute('aria-current', 'page');
  });

  it('inactive tabs do not have aria-current', () => {
    render(<BottomNav />);
    expect(screen.getByText('Ranking').closest('a')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Ligas').closest('a')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Perfil').closest('a')).not.toHaveAttribute('aria-current');
  });
});

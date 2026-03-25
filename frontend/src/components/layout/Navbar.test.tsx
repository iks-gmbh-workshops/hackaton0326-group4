import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('Navbar', () => {
  it('does not render when there is no authenticated user', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithProviders(<Navbar />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders the main navigation links for authenticated users', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Miller',
        createdAt: '2026-03-25T10:00:00Z',
      },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: 'DrumDiBum' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute('href', '/groups');
    expect(screen.getByRole('link', { name: 'Activities' })).toHaveAttribute('href', '/activities');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  });

  it('logs out and navigates back to login', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);

    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Miller',
        createdAt: '2026-03-25T10:00:00Z',
      },
      loading: false,
      login: vi.fn(),
      logout,
      refreshUser: vi.fn(),
    });

    const { user } = renderWithProviders(
      <>
        <Navbar />
        <Routes>
          <Route path="/groups" element={<div>Groups Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </>,
      { route: '/groups' },
    );

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

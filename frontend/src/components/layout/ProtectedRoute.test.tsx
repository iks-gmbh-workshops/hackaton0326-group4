import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is initializing', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithProviders(
      <Routes>
        <Route
          path="/protected"
          element={(
            <ProtectedRoute>
              <div>Secret Content</div>
            </ProtectedRoute>
          )}
        />
      </Routes>,
      { route: '/protected' },
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to the login page', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithProviders(
      <Routes>
        <Route
          path="/protected"
          element={(
            <ProtectedRoute>
              <div>Secret Content</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: '/protected' },
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
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

    renderWithProviders(
      <Routes>
        <Route
          path="/protected"
          element={(
            <ProtectedRoute>
              <div>Secret Content</div>
            </ProtectedRoute>
          )}
        />
      </Routes>,
      { route: '/protected' },
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});

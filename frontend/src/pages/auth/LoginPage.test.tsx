import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { LoginPage } from '@/pages/auth/LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('LoginPage', () => {
  it('validates required inputs before submitting', async () => {
    const login = vi.fn();

    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { route: '/login' },
    );

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Please enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('logs in and honors the redirect query parameter', async () => {
    const login = vi.fn().mockResolvedValue(undefined);

    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activities" element={<div>Activities Page</div>} />
      </Routes>,
      { route: '/login?redirect=/activities' },
    );

    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('alex@example.com', 'StrongPassword123!');
    });
    expect(screen.getByText('Activities Page')).toBeInTheDocument();
  });

  it('shows an error when login fails', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { route: '/login' },
    );

    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'WrongPassword');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });
});

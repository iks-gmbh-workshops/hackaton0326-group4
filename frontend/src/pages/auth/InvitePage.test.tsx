import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { InvitePage } from '@/pages/auth/InvitePage';
import { invitationsApi } from '@/api/invitations';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/api/invitations', () => ({
  invitationsApi: {
    accept: vi.fn(),
  },
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedAccept = vi.mocked(invitationsApi.accept);

describe('InvitePage', () => {
  it('shows login and register links when the user is not authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithProviders(
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
      </Routes>,
      { route: '/invite/token-123' },
    );

    expect(screen.getByText(/You need to be logged in/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login?redirect=/invite/token-123',
    );
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
      'href',
      '/register?redirect=/invite/token-123',
    );
  });

  it('accepts an invitation for an authenticated user and can navigate to groups', async () => {
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
    mockedAccept.mockResolvedValue({} as AxiosResponse);

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/groups" element={<div>Groups Page</div>} />
      </Routes>,
      { route: '/invite/token-123' },
    );

    await user.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => {
      expect(mockedAccept).toHaveBeenCalledWith('token-123');
    });
    expect(await screen.findByText(/Invitation accepted!/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to Groups' }));

    expect(screen.getByText('Groups Page')).toBeInTheDocument();
  });

  it('shows an API error and allows retrying', async () => {
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
    mockedAccept.mockRejectedValue({
      response: {
        data: {
          message: 'Invitation expired',
        },
      },
    });

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
      </Routes>,
      { route: '/invite/token-123' },
    );

    await user.click(screen.getByRole('button', { name: 'Accept' }));

    expect(await screen.findByText('Invitation expired')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.queryByText('Invitation expired')).not.toBeInTheDocument();
  });
});

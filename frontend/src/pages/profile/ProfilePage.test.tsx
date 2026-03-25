import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import { AuthProvider } from '@/hooks/useAuth';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { usersApi } from '@/api/users';
import { authApi } from '@/api/auth';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/api/users', () => ({
  usersApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedGetProfile = vi.mocked(usersApi.getProfile);
const mockedDeleteAccount = vi.mocked(usersApi.deleteAccount);
const mockedLogout = vi.mocked(authApi.logout);

describe('ProfilePage', () => {
  it('redirects to login after account deletion even when logout fails', async () => {
    mockedGetProfile
      .mockResolvedValueOnce({
        data: {
          id: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          createdAt: '2025-01-01T00:00:00Z',
        },
      })
      .mockRejectedValueOnce(new Error('User not found'));
    mockedDeleteAccount.mockResolvedValue(undefined);
    mockedLogout.mockRejectedValue(new Error('Logout failed'));

    const { user } = renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>,
      { route: '/profile' },
    );

    expect(await screen.findByDisplayValue('alex@example.com')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Delete Account' })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete Account' }));

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedDeleteAccount).toHaveBeenCalledTimes(1);
      expect(mockedLogout).toHaveBeenCalledTimes(1);
      expect(mockedGetProfile).toHaveBeenCalledTimes(2);
    });
  });
});

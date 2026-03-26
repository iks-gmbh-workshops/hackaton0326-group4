import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { TermsOfServicePage } from '@/pages/auth/TermsOfServicePage';
import { authApi } from '@/api/auth';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/api/auth', () => ({
  authApi: {
    register: vi.fn(),
  },
}));

const mockedRegister = vi.mocked(authApi.register);

describe('RegisterPage', () => {
  it('links the terms of service from the checkbox copy', () => {
    renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>,
      { route: '/register' },
    );

    expect(screen.getByLabelText(/I accept the terms of service/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'terms of service' })).toHaveAttribute('href', '/terms-of-service');
    expect(screen.getByRole('link', { name: 'terms of service' })).toHaveAttribute('target', '_blank');
  });

  it('does not count umlauts as special characters in the password rule', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>,
      { route: '/register' },
    );

    await user.type(screen.getByLabelText('First name'), 'Alex');
    await user.type(screen.getByLabelText('Last name'), 'Miller');
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'Abcdefgö12');
    await user.click(screen.getByLabelText(/I accept the terms of service/i));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Must contain at least one special character')).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('renders the terms of service page', () => {
    renderWithProviders(
      <Routes>
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      </Routes>,
      { route: '/terms-of-service' },
    );

    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to registration' })).toHaveAttribute('href', '/register');
  });
});

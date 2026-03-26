import { beforeEach, describe, expect, it, vi } from 'vitest';
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

beforeEach(() => {
  mockedRegister.mockReset();
});

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

  it('marks the password criteria badges as fulfilled when the password becomes valid', async () => {
    const { user, container } = renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>,
      { route: '/register' },
    );

    const lengthBadge = container.querySelector('[data-criterion="length"]') as HTMLElement;
    const lowercaseBadge = container.querySelector('[data-criterion="lowercase"]') as HTMLElement;
    const uppercaseBadge = container.querySelector('[data-criterion="uppercase"]') as HTMLElement;
    const digitBadge = container.querySelector('[data-criterion="digit"]') as HTMLElement;
    const specialBadge = container.querySelector('[data-criterion="special"]') as HTMLElement;

    expect(lengthBadge).toHaveAttribute('data-fulfilled', 'false');
    expect(lowercaseBadge).toHaveAttribute('data-fulfilled', 'false');
    expect(uppercaseBadge).toHaveAttribute('data-fulfilled', 'false');
    expect(digitBadge).toHaveAttribute('data-fulfilled', 'false');
    expect(specialBadge).toHaveAttribute('data-fulfilled', 'false');

    await user.type(screen.getByLabelText('Password'), 'Abcdefg!12');

    expect(lengthBadge).toHaveAttribute('data-fulfilled', 'true');
    expect(lowercaseBadge).toHaveAttribute('data-fulfilled', 'true');
    expect(uppercaseBadge).toHaveAttribute('data-fulfilled', 'true');
    expect(digitBadge).toHaveAttribute('data-fulfilled', 'true');
    expect(specialBadge).toHaveAttribute('data-fulfilled', 'true');
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
    await user.type(screen.getByLabelText('Password'), 'Abcdefg\u00f612');
    await user.type(screen.getByLabelText('Confirm password'), 'Abcdefg\u00f612');
    await user.click(screen.getByLabelText(/I accept the terms of service/i));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Must contain at least one special character')).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('requires the password confirmation to match before submitting', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>,
      { route: '/register' },
    );

    await user.type(screen.getByLabelText('First name'), 'Alex');
    await user.type(screen.getByLabelText('Last name'), 'Miller');
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'Abcdefg!12');
    await user.type(screen.getByLabelText('Confirm password'), 'Abcdefg!34');
    await user.click(screen.getByLabelText(/I accept the terms of service/i));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
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

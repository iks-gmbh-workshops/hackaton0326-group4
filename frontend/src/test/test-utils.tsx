import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', queryClient = createTestQueryClient(), ...options }: ExtendedRenderOptions = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  return {
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

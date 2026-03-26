import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { CreateGroupPage } from '@/pages/groups/CreateGroupPage';
import { groupsApi } from '@/api/groups';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/api/groups', () => ({
  groupsApi: {
    create: vi.fn(),
  },
}));

const mockedCreate = vi.mocked(groupsApi.create);

describe('CreateGroupPage', () => {
  it('creates a group and navigates to its detail page', async () => {
    mockedCreate.mockResolvedValue({
      data: {
        id: 42,
        name: 'Choir',
        description: 'Weekly rehearsal',
        createdByEmail: 'alex@example.com',
        createdAt: '2026-03-25T10:00:00Z',
        memberCount: 1,
      },
    } as AxiosResponse);

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/groups/new" element={<CreateGroupPage />} />
        <Route path="/groups/:groupId" element={<div>Group Detail Page</div>} />
      </Routes>,
      { route: '/groups/new' },
    );

    await user.type(screen.getByLabelText('Group name'), 'Choir');
    await user.type(screen.getByLabelText('Description (optional)'), 'Weekly rehearsal');
    await user.click(screen.getByRole('button', { name: 'Create Group' }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({
        name: 'Choir',
        description: 'Weekly rehearsal',
      });
    });
    expect(await screen.findByText('Group Detail Page')).toBeInTheDocument();
  });

  it('shows a submission error when group creation fails', async () => {
    mockedCreate.mockRejectedValue(new Error('Request failed'));

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/groups/new" element={<CreateGroupPage />} />
      </Routes>,
      { route: '/groups/new' },
    );

    await user.type(screen.getByLabelText('Group name'), 'Choir');
    await user.click(screen.getByRole('button', { name: 'Create Group' }));

    expect(await screen.findByText('Failed to create group')).toBeInTheDocument();
  });
});

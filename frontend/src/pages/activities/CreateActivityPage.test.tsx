import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { CreateActivityPage } from '@/pages/activities/CreateActivityPage';
import { activitiesApi } from '@/api/activities';
import { groupsApi } from '@/api/groups';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/api/groups', () => ({
  groupsApi: {
    getMyGroups: vi.fn(),
  },
}));

vi.mock('@/api/activities', () => ({
  activitiesApi: {
    create: vi.fn(),
  },
}));

const mockedGetMyGroups = vi.mocked(groupsApi.getMyGroups);
const mockedCreate = vi.mocked(activitiesApi.create);

describe('CreateActivityPage', () => {
  it('preselects the group from the query string and creates an activity', async () => {
    mockedGetMyGroups.mockResolvedValue({
      data: [
        {
          id: 3,
          name: 'Band',
          description: null,
          createdByEmail: 'owner@example.com',
          createdAt: '2026-03-25T10:00:00Z',
          memberCount: 3,
        },
        {
          id: 7,
          name: 'Choir',
          description: null,
          createdByEmail: 'owner@example.com',
          createdAt: '2026-03-25T10:00:00Z',
          memberCount: 5,
        },
      ],
    } as AxiosResponse);
    mockedCreate.mockResolvedValue({
      data: {
        id: 77,
        title: 'Rehearsal',
        description: 'Bring sheet music',
        groupId: 7,
        groupName: 'Choir',
        createdByEmail: 'owner@example.com',
        scheduledAt: '2026-04-05T16:30:00.000Z',
        createdAt: '2026-03-25T10:00:00Z',
      },
    } as AxiosResponse);

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/activities/new" element={<CreateActivityPage />} />
        <Route path="/activities/:activityId" element={<div>Activity Detail Page</div>} />
      </Routes>,
      { route: '/activities/new?groupId=7' },
    );

    expect(await screen.findByRole('option', { name: 'Choir' })).toBeInTheDocument();
    expect(screen.getByLabelText('Group')).toHaveValue('7');

    await user.type(screen.getByLabelText('Title'), 'Rehearsal');
    await user.type(screen.getByLabelText('Description (optional)'), 'Bring sheet music');
    await user.type(screen.getByLabelText('Date & Time'), '2026-04-05T18:30');
    await user.click(screen.getByRole('button', { name: 'Create Activity' }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({
        title: 'Rehearsal',
        description: 'Bring sheet music',
        groupId: 7,
        scheduledAt: new Date('2026-04-05T18:30').toISOString(),
      });
    });
    expect(await screen.findByText('Activity Detail Page')).toBeInTheDocument();
  });

  it('shows a submission error when activity creation fails', async () => {
    mockedGetMyGroups.mockResolvedValue({
      data: [
        {
          id: 7,
          name: 'Choir',
          description: null,
          createdByEmail: 'owner@example.com',
          createdAt: '2026-03-25T10:00:00Z',
          memberCount: 5,
        },
      ],
    } as AxiosResponse);
    mockedCreate.mockRejectedValue(new Error('Request failed'));

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/activities/new" element={<CreateActivityPage />} />
      </Routes>,
      { route: '/activities/new' },
    );

    await screen.findByRole('option', { name: 'Choir' });
    await user.selectOptions(screen.getByLabelText('Group'), '7');
    await user.type(screen.getByLabelText('Title'), 'Rehearsal');
    await user.type(screen.getByLabelText('Date & Time'), '2026-04-05T18:30');
    await user.click(screen.getByRole('button', { name: 'Create Activity' }));

    expect(await screen.findByText('Failed to create activity')).toBeInTheDocument();
  });
});

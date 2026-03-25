import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { ActivityListPage } from '@/pages/activities/ActivityListPage';
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
    getUpcoming: vi.fn(),
  },
}));

const mockedGetMyGroups = vi.mocked(groupsApi.getMyGroups);
const mockedGetUpcoming = vi.mocked(activitiesApi.getUpcoming);

describe('ActivityListPage', () => {
  it('shows an empty state when there are no group activities', async () => {
    mockedGetMyGroups.mockResolvedValue({
      data: [],
    } as AxiosResponse);

    renderWithProviders(
      <Routes>
        <Route path="/activities" element={<ActivityListPage />} />
      </Routes>,
      { route: '/activities' },
    );

    expect(await screen.findByText('No upcoming activities across your groups.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create Activity' })).toHaveAttribute('href', '/activities/new');
    expect(mockedGetUpcoming).not.toHaveBeenCalled();
  });

  it('loads and sorts activities across groups', async () => {
    mockedGetMyGroups.mockResolvedValue({
      data: [
        {
          id: 2,
          name: 'Band',
          description: null,
          createdByEmail: 'owner@example.com',
          createdAt: '2026-03-25T10:00:00Z',
          memberCount: 3,
        },
        {
          id: 5,
          name: 'Choir',
          description: null,
          createdByEmail: 'owner@example.com',
          createdAt: '2026-03-25T10:00:00Z',
          memberCount: 4,
        },
      ],
    } as AxiosResponse);
    mockedGetUpcoming.mockImplementation(async (groupId: number) => {
      if (groupId === 2) {
        return {
          data: [
            {
              id: 22,
              title: 'Band Jam',
              description: 'Bring your instrument',
              groupId: 2,
              groupName: 'Band',
              createdByEmail: 'owner@example.com',
              scheduledAt: '2026-04-10T19:00:00Z',
              createdAt: '2026-03-25T10:00:00Z',
            },
          ],
        } as AxiosResponse;
      }

      return {
        data: [
          {
            id: 11,
            title: 'Choir Warmup',
            description: 'Vocal prep',
            groupId: 5,
            groupName: 'Choir',
            createdByEmail: 'owner@example.com',
            scheduledAt: '2026-04-01T18:00:00Z',
            createdAt: '2026-03-25T10:00:00Z',
          },
        ],
      } as AxiosResponse;
    });

    renderWithProviders(
      <Routes>
        <Route path="/activities" element={<ActivityListPage />} />
      </Routes>,
      { route: '/activities' },
    );

    expect(await screen.findByText('Choir Warmup')).toBeInTheDocument();
    expect(screen.getByText('Band Jam')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedGetUpcoming).toHaveBeenCalledTimes(2);
    });

    const detailLinks = Array.from(
      document.querySelectorAll('a[href^="/activities/"]:not([href="/activities/new"])'),
    ).map((link) => link.getAttribute('href'));

    expect(detailLinks).toEqual(['/activities/11', '/activities/22']);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { ActivityDetailPage } from '@/pages/activities/ActivityDetailPage';
import { activitiesApi } from '@/api/activities';
import { groupsApi } from '@/api/groups';
import { RsvpStatus } from '@/api/types';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/api/activities', () => ({
  activitiesApi: {
    getActivity: vi.fn(),
    cancel: vi.fn(),
    getRsvps: vi.fn(),
    updateRsvp: vi.fn(),
  },
}));

vi.mock('@/api/groups', () => ({
  groupsApi: {
    getMembers: vi.fn(),
  },
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetActivity = vi.mocked(activitiesApi.getActivity);
const mockedCancelActivity = vi.mocked(activitiesApi.cancel);
const mockedGetRsvps = vi.mocked(activitiesApi.getRsvps);
const mockedUpdateRsvp = vi.mocked(activitiesApi.updateRsvp);
const mockedGetMembers = vi.mocked(groupsApi.getMembers);

describe('ActivityDetailPage', () => {
  it('renders the activity details and attendee sections', async () => {
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
    mockedGetActivity.mockResolvedValue({
      data: {
        id: 12,
        title: 'Karaoke Night',
        description: 'Bring your favorite song',
        groupId: 4,
        groupName: 'Choir',
        createdByEmail: 'owner@example.com',
        scheduledAt: '2026-04-05T18:30:00Z',
        canceled: false,
        createdAt: '2026-03-25T10:00:00Z',
      },
    } as AxiosResponse);
    mockedGetRsvps.mockResolvedValue({
      data: [
        {
          userId: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          status: RsvpStatus.ACCEPTED,
        },
        {
          userId: 2,
          email: 'jamie@example.com',
          firstName: 'Jamie',
          lastName: 'Stone',
          status: RsvpStatus.DECLINED,
        },
        {
          userId: 3,
          email: 'sam@example.com',
          firstName: 'Sam',
          lastName: 'Lee',
          status: RsvpStatus.OPEN,
        },
      ],
    } as AxiosResponse);
    mockedGetMembers.mockResolvedValue({
      data: [
        {
          userId: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          status: 'ACTIVE',
          role: 'ADMIN',
          joinedAt: '2026-03-25T10:00:00Z',
        },
      ],
    } as AxiosResponse);

    renderWithProviders(
      <Routes>
        <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
      </Routes>,
      { route: '/activities/12' },
    );

    expect(await screen.findByText('Karaoke Night')).toBeInTheDocument();
    expect(screen.getByText('Bring your favorite song')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Choir' })).toHaveAttribute('href', '/groups/4');
    expect(await screen.findByRole('button', { name: 'Cancel Activity' })).toBeInTheDocument();
    expect(screen.getByText('Created by owner@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeEnabled();
    expect(screen.getByText('Jamie Stone')).toBeInTheDocument();
    expect(screen.getByText('Sam Lee')).toBeInTheDocument();
  });

  it('updates the user RSVP when a new status is selected', async () => {
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
    mockedGetActivity.mockResolvedValue({
      data: {
        id: 12,
        title: 'Karaoke Night',
        description: null,
        groupId: 4,
        groupName: 'Choir',
        createdByEmail: 'owner@example.com',
        scheduledAt: '2026-04-05T18:30:00Z',
        canceled: false,
        createdAt: '2026-03-25T10:00:00Z',
      },
    } as AxiosResponse);
    mockedGetRsvps.mockResolvedValue({
      data: [
        {
          userId: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          status: RsvpStatus.OPEN,
        },
      ],
    } as AxiosResponse);
    mockedGetMembers.mockResolvedValue({
      data: [
        {
          userId: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          status: 'ACTIVE',
          role: 'ADMIN',
          joinedAt: '2026-03-25T10:00:00Z',
        },
      ],
    } as AxiosResponse);
    mockedUpdateRsvp.mockResolvedValue({} as AxiosResponse);

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
      </Routes>,
      { route: '/activities/12' },
    );

    await screen.findByText('Karaoke Night');
    await user.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => {
      expect(mockedUpdateRsvp).toHaveBeenCalledWith(12, RsvpStatus.ACCEPTED);
    });
  });

  it('cancels the activity and navigates back to the group page', async () => {
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
    mockedGetActivity.mockResolvedValue({
      data: {
        id: 12,
        title: 'Karaoke Night',
        description: null,
        groupId: 4,
        groupName: 'Choir',
        createdByEmail: 'owner@example.com',
        scheduledAt: '2026-04-05T18:30:00Z',
        canceled: false,
        createdAt: '2026-03-25T10:00:00Z',
      },
    } as AxiosResponse);
    mockedGetRsvps.mockResolvedValue({
      data: [
        {
          userId: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          status: RsvpStatus.OPEN,
        },
      ],
    } as AxiosResponse);
    mockedGetMembers.mockResolvedValue({
      data: [
        {
          userId: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          status: 'ACTIVE',
          role: 'ADMIN',
          joinedAt: '2026-03-25T10:00:00Z',
        },
      ],
    } as AxiosResponse);
    mockedCancelActivity.mockResolvedValue({} as AxiosResponse);

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
        <Route path="/groups/:groupId" element={<p>Group page</p>} />
      </Routes>,
      { route: '/activities/12' },
    );

    await screen.findByText('Karaoke Night');
    await user.click(await screen.findByRole('button', { name: 'Cancel Activity' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel Activity' }));

    await waitFor(() => {
      expect(mockedCancelActivity).toHaveBeenCalledWith(12);
    });
    expect(await screen.findByText('Group page')).toBeInTheDocument();
  });

  it('shows canceled state and hides RSVP actions for canceled activities', async () => {
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
    mockedGetActivity.mockResolvedValue({
      data: {
        id: 12,
        title: 'Karaoke Night',
        description: null,
        groupId: 4,
        groupName: 'Choir',
        createdByEmail: 'owner@example.com',
        scheduledAt: '2026-04-05T18:30:00Z',
        canceled: true,
        createdAt: '2026-03-25T10:00:00Z',
      },
    } as AxiosResponse);
    mockedGetRsvps.mockResolvedValue({
      data: [
        {
          userId: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          status: RsvpStatus.OPEN,
        },
      ],
    } as AxiosResponse);
    mockedGetMembers.mockResolvedValue({
      data: [
        {
          userId: 1,
          email: 'alex@example.com',
          firstName: 'Alex',
          lastName: 'Miller',
          status: 'ACTIVE',
          role: 'ADMIN',
          joinedAt: '2026-03-25T10:00:00Z',
        },
      ],
    } as AxiosResponse);

    renderWithProviders(
      <Routes>
        <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
      </Routes>,
      { route: '/activities/12' },
    );

    expect(await screen.findByText('Canceled')).toBeInTheDocument();
    expect(screen.getByText('RSVPs are closed because this activity has been canceled.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel Activity' })).not.toBeInTheDocument();
  });
});

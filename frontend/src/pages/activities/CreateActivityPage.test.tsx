import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

function formatDatePart(value: number) {
  return value.toString().padStart(2, '0');
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${formatDatePart(date.getMonth() + 1)}-${formatDatePart(date.getDate())}`;
}

function toTimeInputValue(date: Date) {
  return `${formatDatePart(date.getHours())}:${formatDatePart(date.getMinutes())}`;
}

function getMinimumScheduledAt(now = new Date()) {
  const nextMinute = new Date(now);
  nextMinute.setSeconds(0, 0);
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);

  return {
    date: toDateInputValue(nextMinute),
    time: toTimeInputValue(nextMinute),
  };
}

describe('CreateActivityPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-26T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
        scheduledAt: '2099-04-05T16:30:00.000Z',
        canceled: false,
        createdAt: '2099-03-25T10:00:00Z',
      },
    } as AxiosResponse);

    renderWithProviders(
      <Routes>
        <Route path="/activities/new" element={<CreateActivityPage />} />
        <Route path="/activities/:activityId" element={<div>Activity Detail Page</div>} />
      </Routes>,
      { route: '/activities/new?groupId=7' },
    );

    expect(await screen.findByRole('option', { name: 'Choir' })).toBeInTheDocument();
    expect(screen.getByLabelText('Group')).toHaveValue('7');

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Rehearsal' } });
    fireEvent.change(screen.getByLabelText('Description (optional)'), { target: { value: 'Bring sheet music' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2099-04-05' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '18:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Activity' }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({
        title: 'Rehearsal',
        description: 'Bring sheet music',
        groupId: 7,
        scheduledAt: new Date('2099-04-05T18:30').toISOString(),
      });
    });
    expect(await screen.findByText('Activity Detail Page')).toBeInTheDocument();
  });

  it('only accepts future date and time values', async () => {
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

    renderWithProviders(
      <Routes>
        <Route path="/activities/new" element={<CreateActivityPage />} />
      </Routes>,
      { route: '/activities/new' },
    );

    await screen.findByRole('option', { name: 'Choir' });

    const scheduledDateInput = screen.getByLabelText('Date') as HTMLInputElement;
    const scheduledTimeInput = screen.getByLabelText('Time') as HTMLInputElement;
    const minimumScheduledAt = getMinimumScheduledAt();

    expect(scheduledDateInput.min).toBe(minimumScheduledAt.date);
    expect(scheduledTimeInput).toHaveAttribute('step', '60');

    fireEvent.change(screen.getByLabelText('Group'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Rehearsal' } });
    fireEvent.change(scheduledDateInput, {
      target: { value: minimumScheduledAt.date },
    });

    expect(scheduledTimeInput.min).toBe(minimumScheduledAt.time);

    fireEvent.change(scheduledTimeInput, {
      target: { value: '11:59' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Activity' }));

    expect(await screen.findByText('Date and time must be in the future')).toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
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

    renderWithProviders(
      <Routes>
        <Route path="/activities/new" element={<CreateActivityPage />} />
      </Routes>,
      { route: '/activities/new' },
    );

    await screen.findByRole('option', { name: 'Choir' });
    fireEvent.change(screen.getByLabelText('Group'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Rehearsal' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2099-04-05' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '18:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Activity' }));

    expect(await screen.findByText('Failed to create activity')).toBeInTheDocument();
  });
});

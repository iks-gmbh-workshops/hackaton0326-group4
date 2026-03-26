import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { GroupDetailPage } from '@/pages/groups/GroupDetailPage';
import { groupsApi } from '@/api/groups';
import { activitiesApi } from '@/api/activities';
import { GroupRole, type ActivityResponse, type GroupResponse, type MemberResponse, type UserResponse } from '@/api/types';
import { useAuth } from '@/hooks/useAuth';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/api/groups', () => ({
  groupsApi: {
    getGroup: vi.fn(),
    getMembers: vi.fn(),
    leaveGroup: vi.fn(),
    deleteGroup: vi.fn(),
    kickMember: vi.fn(),
    changeRole: vi.fn(),
    invite: vi.fn(),
  },
}));

vi.mock('@/api/activities', () => ({
  activitiesApi: {
    getUpcoming: vi.fn(),
  },
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetGroup = vi.mocked(groupsApi.getGroup);
const mockedGetMembers = vi.mocked(groupsApi.getMembers);
const mockedKickMember = vi.mocked(groupsApi.kickMember);
const mockedChangeRole = vi.mocked(groupsApi.changeRole);
const mockedInvite = vi.mocked(groupsApi.invite);
const mockedGetUpcoming = vi.mocked(activitiesApi.getUpcoming);

function authUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    id: 1,
    email: 'alex@example.com',
    firstName: 'Alex',
    lastName: 'Miller',
    createdAt: '2026-03-25T10:00:00Z',
    ...overrides,
  };
}

function groupData(overrides: Partial<GroupResponse> = {}): GroupResponse {
  return {
    id: 10,
    name: 'Band',
    description: 'Weekly rehearsal',
    createdByEmail: 'alex@example.com',
    createdAt: '2026-03-25T10:00:00Z',
    memberCount: 3,
    ...overrides,
  };
}

function memberData(overrides: Partial<MemberResponse> = {}): MemberResponse {
  return {
    userId: 1,
    email: 'alex@example.com',
    firstName: 'Alex',
    lastName: 'Miller',
    status: 'ACTIVE',
    role: GroupRole.ADMIN,
    joinedAt: '2026-03-25T10:00:00Z',
    ...overrides,
  };
}

function activityData(overrides: Partial<ActivityResponse> = {}): ActivityResponse {
  return {
    id: 55,
    title: 'Jam Session',
    description: 'Bring your instrument',
    groupId: 10,
    groupName: 'Band',
    createdByEmail: 'alex@example.com',
    scheduledAt: '2026-04-05T18:30:00Z',
    canceled: false,
    createdAt: '2026-03-25T10:00:00Z',
    acceptedCount: 2,
    declinedCount: 1,
    openCount: 3,
    ...overrides,
  };
}

function mockPageData({
  user = authUser(),
  group = groupData(),
  members = [
    memberData(),
    memberData({
      userId: 2,
      email: 'jamie@example.com',
      firstName: 'Jamie',
      lastName: 'Stone',
      role: GroupRole.MEMBER,
    }),
  ],
  activities = [],
}: {
  user?: UserResponse;
  group?: GroupResponse;
  members?: MemberResponse[];
  activities?: ActivityResponse[];
} = {}) {
  mockedUseAuth.mockReturnValue({
    user,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  });
  mockedGetGroup.mockResolvedValue({ data: group } as AxiosResponse);
  mockedGetMembers.mockResolvedValue({ data: members } as AxiosResponse);
  mockedGetUpcoming.mockResolvedValue({ data: activities } as AxiosResponse);
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/groups/:groupId" element={<GroupDetailPage />} />
      <Route path="/groups" element={<div>Groups Page</div>} />
    </Routes>,
    { route: '/groups/10' },
  );
}

describe('GroupDetailPage', () => {
  it('shows admin-only controls and role actions for admins', async () => {
    mockPageData({
      members: [
        memberData(),
        memberData({
          userId: 2,
          email: 'jamie@example.com',
          firstName: 'Jamie',
          lastName: 'Stone',
          role: GroupRole.MEMBER,
        }),
        memberData({
          userId: 3,
          email: 'sam@example.com',
          firstName: 'Sam',
          lastName: 'Lee',
          role: GroupRole.ADMIN,
        }),
      ],
      activities: [activityData()],
    });

    renderPage();

    expect(await screen.findByText('Band')).toBeInTheDocument();
    expect(screen.getByText('Weekly rehearsal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Group' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Invite a member' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Activity' })).toHaveAttribute('href', '/activities/new?groupId=10');
    expect(screen.getByRole('button', { name: 'Promote' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Demote' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Kick' })).toHaveLength(2);
    expect(screen.getAllByText('Admin')).toHaveLength(2);
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('hides admin-only controls for regular members', async () => {
    mockPageData({
      user: authUser({
        id: 2,
        email: 'jamie@example.com',
        firstName: 'Jamie',
        lastName: 'Stone',
      }),
      members: [
        memberData(),
        memberData({
          userId: 2,
          email: 'jamie@example.com',
          firstName: 'Jamie',
          lastName: 'Stone',
          role: GroupRole.MEMBER,
        }),
      ],
    });

    renderPage();

    expect(await screen.findByText('Band')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Group' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Invite a member' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Promote' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Demote' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kick' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'New Activity' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave Group' })).toBeInTheDocument();
  });

  it('promotes a member to admin', async () => {
    mockPageData();
    mockedChangeRole.mockResolvedValue({
      data: memberData({
        userId: 2,
        email: 'jamie@example.com',
        firstName: 'Jamie',
        lastName: 'Stone',
        role: GroupRole.ADMIN,
      }),
    } as AxiosResponse);

    const { user } = renderPage();

    await screen.findByText('Jamie Stone');
    await user.click(screen.getByRole('button', { name: 'Promote' }));

    await waitFor(() => {
      expect(mockedChangeRole).toHaveBeenCalledWith(10, 2, GroupRole.ADMIN);
    });
  });

  it('demotes another admin to member', async () => {
    mockPageData({
      members: [
        memberData(),
        memberData({
          userId: 3,
          email: 'sam@example.com',
          firstName: 'Sam',
          lastName: 'Lee',
          role: GroupRole.ADMIN,
        }),
      ],
    });
    mockedChangeRole.mockResolvedValue({
      data: memberData({
        userId: 3,
        email: 'sam@example.com',
        firstName: 'Sam',
        lastName: 'Lee',
        role: GroupRole.MEMBER,
      }),
    } as AxiosResponse);

    const { user } = renderPage();

    await screen.findByText('Sam Lee');
    await user.click(screen.getByRole('button', { name: 'Demote' }));

    await waitFor(() => {
      expect(mockedChangeRole).toHaveBeenCalledWith(10, 3, GroupRole.MEMBER);
    });
  });

  it('kicks a member after confirmation', async () => {
    mockPageData();
    mockedKickMember.mockResolvedValue({} as AxiosResponse);

    const { user } = renderPage();

    await screen.findByText('Jamie Stone');
    await user.click(screen.getByRole('button', { name: 'Kick' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Kick' }));

    await waitFor(() => {
      expect(mockedKickMember).toHaveBeenCalledWith(10, 2);
    });
  });

  it('submits invites from the admin-only invite form', async () => {
    mockPageData();
    mockedInvite.mockResolvedValue({
      data: {
        token: 'token-123',
        invitedEmail: 'new@example.com',
        groupName: 'Band',
        expiresAt: '2026-03-27T10:00:00Z',
      },
    } as AxiosResponse);

    const { user } = renderPage();

    await screen.findByRole('heading', { name: 'Invite a member' });
    await user.type(screen.getByLabelText('Email address'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Invitation' }));

    await waitFor(() => {
      expect(mockedInvite).toHaveBeenCalledWith(10, { email: 'new@example.com' });
    });
    expect(await screen.findByText('Invitation sent to new@example.com')).toBeInTheDocument();
  });

  it('warns that leaving will delete the group for the last admin', async () => {
    mockPageData({
      members: [
        memberData(),
        memberData({
          userId: 2,
          email: 'jamie@example.com',
          firstName: 'Jamie',
          lastName: 'Stone',
          role: GroupRole.MEMBER,
        }),
      ],
    });

    const { user } = renderPage();

    await screen.findByText('Band');
    await user.click(screen.getByRole('button', { name: 'Leave Group' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('You are the last admin. Leaving will permanently delete the group and all its data.')).toBeInTheDocument();
  });
});

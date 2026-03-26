import api from './client';
import type { GroupResponse, GroupRole, MemberResponse, InviteResponse } from './types';

export const groupsApi = {
  create: (data: { name: string; description?: string }) =>
    api.post<GroupResponse>('/groups', data),

  getMyGroups: () => api.get<GroupResponse[]>('/groups'),

  getGroup: (groupId: number) => api.get<GroupResponse>(`/groups/${groupId}`),

  getMembers: (groupId: number) =>
    api.get<MemberResponse[]>(`/groups/${groupId}/members`),

  leaveGroup: (groupId: number) => api.delete(`/groups/${groupId}/members/me`),

  deleteGroup: (groupId: number) => api.delete(`/groups/${groupId}`),

  kickMember: (groupId: number, userId: number) =>
    api.delete(`/groups/${groupId}/members/${userId}`),

  changeRole: (groupId: number, userId: number, role: GroupRole) =>
    api.put<MemberResponse>(`/groups/${groupId}/members/${userId}/role`, { role }),

  invite: (groupId: number, data: { email: string }) =>
    api.post<InviteResponse>(`/groups/${groupId}/invite`, data),
};

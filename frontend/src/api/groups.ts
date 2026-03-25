import api from './client';
import type { GroupResponse, MemberResponse, InviteResponse } from './types';

export const groupsApi = {
  create: (data: { name: string; description?: string }) =>
    api.post<GroupResponse>('/groups', data),

  getMyGroups: () => api.get<GroupResponse[]>('/groups'),

  getGroup: (groupId: number) => api.get<GroupResponse>(`/groups/${groupId}`),

  getMembers: (groupId: number) =>
    api.get<MemberResponse[]>(`/groups/${groupId}/members`),

  leaveGroup: (groupId: number) => api.delete(`/groups/${groupId}/members/me`),

  invite: (groupId: number, data: { email: string }) =>
    api.post<InviteResponse>(`/groups/${groupId}/invite`, data),
};

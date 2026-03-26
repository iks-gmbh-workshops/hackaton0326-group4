import api from './client';
import type { ActivityResponse, RsvpResponse, RsvpStatus } from './types';

export const activitiesApi = {
  create: (data: {
    title: string;
    description?: string;
    groupId: number;
    scheduledAt: string;
  }) => api.post<ActivityResponse>('/activities', data),

  getUpcoming: (groupId: number) =>
    api.get<ActivityResponse[]>(`/groups/${groupId}/activities`),

  getActivity: (activityId: number) =>
    api.get<ActivityResponse>(`/activities/${activityId}`),

  update: (activityId: number, data: {
    title?: string;
    description?: string;
    scheduledAt?: string;
  }) => api.put<ActivityResponse>(`/activities/${activityId}`, data),

  cancel: (activityId: number) =>
    api.put(`/activities/${activityId}/cancel`),

  getRsvps: (activityId: number) =>
    api.get<RsvpResponse[]>(`/activities/${activityId}/rsvps`),

  updateRsvp: (activityId: number, status: RsvpStatus) =>
    api.put<RsvpResponse>(`/activities/${activityId}/rsvps/me`, { status }),
};

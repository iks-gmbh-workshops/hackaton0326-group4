import api from './client';

export const invitationsApi = {
  accept: (token: string) => api.post(`/invitations/${token}/accept`),
};

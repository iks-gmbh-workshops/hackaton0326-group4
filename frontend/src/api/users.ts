import api from './client';
import type { UserResponse } from './types';

export const usersApi = {
  getProfile: () => api.get<UserResponse>('/users/me'),

  updateProfile: (data: { firstName: string; lastName: string }) =>
    api.put<UserResponse>('/users/me', data),

  deleteAccount: () => api.delete('/users/me'),
};

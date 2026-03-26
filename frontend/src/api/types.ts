export interface AuthResponse {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface GroupResponse {
  id: number;
  name: string;
  description: string | null;
  createdByEmail: string;
  createdAt: string;
  memberCount: number;
}

export interface MemberResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  joinedAt: string;
}

export interface ActivityResponse {
  id: number;
  title: string;
  description: string | null;
  groupId: number;
  groupName: string;
  createdByEmail: string;
  scheduledAt: string;
  canceled: boolean;
  createdAt: string;
  acceptedCount: number;
  declinedCount: number;
  openCount: number;
}

export const RsvpStatus = {
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  OPEN: 'OPEN',
} as const;

export type RsvpStatus = (typeof RsvpStatus)[keyof typeof RsvpStatus];

export interface RsvpResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  status: RsvpStatus;
}

export interface InviteResponse {
  token: string;
  invitedEmail: string;
  groupName: string;
  expiresAt: string;
}

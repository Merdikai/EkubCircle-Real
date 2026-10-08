import { User } from './user.model';

export type JoinRequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | string;

export interface JoinRequest {
  id: number;
  circleId: number;
  circleName?: string;
  requestedUserId?: number;
  requestedUserName?: string;
  requestedUserEmail?: string;
  requestedByUserId?: number;
  requestedByUserName?: string;
  status: JoinRequestStatus;
  message?: string | null;
  createdAt?: string;
  requestedAt?: string;
  respondedAt?: string | null;
  
  // UI & mock compatibility
  userId?: number;
  user?: User;
}

export interface ReviewJoinRequestDto {
  requestId: number;
  action: 'Accept' | 'Reject';
}

export interface CreateJoinRequestDto {
  circleId: number;
  requestedUserId?: number;
  email?: string;
  message?: string;
}

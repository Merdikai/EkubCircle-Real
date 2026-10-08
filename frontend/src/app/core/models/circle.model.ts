import { CircleMember } from './member.model';

export type CircleStatus = 'Forming' | 'Active' | 'Completed';

export interface Circle {
  id: number;
  name: string;
  contributionAmount: number; // In ETB / Birr
  meetingLabel: string; // e.g. "Weekly", "Monthly", descriptive label only
  status: CircleStatus;
  createdByUserId: number;
  createdByUserName?: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  
  // Computed / UI metadata fields
  memberCount?: number;
  targetAmount?: number;
  totalSaved?: number;
  totalRounds?: number;
  currentRoundNumber?: number;
  nextContributionDays?: number;
  bannerImage?: string;
  accentColor?: 'burgundy' | 'blue' | 'charcoal';
  members?: CircleMember[];
}

export interface CreateCircleRequest {
  name: string;
  contributionAmount: number;
  meetingLabel: string;
  durationMonths?: number;
  targetAmount?: number;
}

export interface StartCircleResponse {
  id?: number;
  circleId?: number;
  name?: string;
  status: CircleStatus;
  startedAt?: string;
  totalRounds?: number;
  message?: string;
}

export interface CircleSummaryRound {
  roundNumber: number;
  status: string;
  receiverName: string;
  potAmount: number;
  paidOutAt?: string | null;
}

export interface CircleSummaryMember {
  memberId: number;
  fullName: string;
  email: string;
  memberOrder: number;
  hasReceived: boolean;
  totalContributionsPaid: number;
}

export interface CircleSummary {
  circleId: number;
  name: string;
  status: string;
  contributionAmount: number;
  meetingLabel: string;
  totalMembers: number;
  totalRounds: number;
  completedRoundsCount: number;
  totalPotDisbursed: number;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  rounds: CircleSummaryRound[];
  members: CircleSummaryMember[];
}

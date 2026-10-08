export type RoundStatus = 'Pending' | 'Open' | 'Drawn' | 'Closed' | 'PaidOut' | 'Paid Out';

export interface CurrentRoundMember {
  memberId: number;
  userId: number;
  fullName: string;
  email: string;
  memberOrder: number;
  hasReceived: boolean;
  hasPaidThisRound: boolean;
  amountPaid?: number | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  isLate: boolean;
}

export interface Round {
  id?: number;
  roundId?: number;
  circleId?: number;
  circleName?: string;
  roundNumber: number;
  totalRounds?: number;
  status: string;
  receiverMemberId: number;
  receiverName?: string;
  receiverFullName?: string;
  receiverEmail?: string;
  receiverMemberOrder?: number;
  receiverAvatar?: string;
  contributionAmount?: number;
  targetPotAmount?: number;
  currentPotAmount?: number;
  potAmount?: number;
  totalMembers?: number;
  totalMembersCount?: number;
  paidCount?: number;
  paidMembersCount?: number;
  isReadyForPayout?: boolean;
  isEligibleForPayout?: boolean;
  paidOutAt?: string | null;
  members?: CurrentRoundMember[];
}

export type CurrentRound = Round;
export type RoundSummary = Round;

export interface PayoutRoundRequest {
  roundId: number;
  notes?: string;
}

export interface PayoutRoundResponse {
  roundId: number;
  roundNumber: number;
  potAmount: number;
  receiverMemberId: number;
  receiverName: string;
  paidOutAt: string;
  roundStatus: string;
  circleStatus: string;
  nextRoundNumber?: number | null;
  message: string;
}

export interface DrawWinnerResponse {
  roundId: number;
  roundNumber: number;
  winnerMemberId: number;
  winnerName: string;
  winnerEmail: string;
  eligibleCandidatesCount: number;
  drawnAt: string;
  message: string;
}

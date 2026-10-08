export type PaymentStatus = 'Paid' | 'Completed' | 'Pending' | 'Failed';
export type PaymentType = 'Normal' | 'Extra' | 'Contribution' | 'Payout';

export interface Payment {
  id: number;
  roundId: number;
  roundNumber?: number;
  memberId?: number;
  circleMemberId?: number;
  memberName: string;
  amount: number;
  paymentType: PaymentType | string;
  chanceCount?: number;
  status: PaymentStatus | string;
  paymentMethod?: string;
  notes?: string | null;
  isLate?: boolean;
  paidAt: string;
  
  // UI helpers
  memberAvatar?: string;
  circleName?: string;
}

export interface RecordPaymentRequest {
  circleId?: number;
  roundId: number;
  memberId?: number;
  circleMemberId?: number;
  amount: number;
  paymentType?: PaymentType | string;
  paymentMethod?: string;
  notes?: string;
  isLate?: boolean;
}

export interface PaymentHistoryFilter {
  circleId?: number;
  roundId?: number;
  month?: string;
  status?: PaymentStatus;
}

export type NotificationType = 'JoinRequest' | 'PaymentReceived' | 'RoundStarted' | 'PayoutCompleted' | 'CircleCompleted' | string;

export interface EkubNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: number | null;
  circleId?: number;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface MarkNotificationReadRequest {
  id: number;
}

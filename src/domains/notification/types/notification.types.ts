import {
  NotificationType,
  NotificationChannel,
  FeedbackType,
} from "../../../../prisma/generated/prisma";

export interface NotificationCreateDto {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationUpdateDto {
  isRead?: boolean;
  readAt?: Date;
}

export interface NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  tenantId: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  channel?: NotificationChannel;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationPaginationResult {
  notifications: NotificationResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface FeedbackCreateDto {
  orderId: string;
  userId: string;
  type: FeedbackType;
  comment?: string;
  rating: number;
}

export interface FeedbackResponseDto {
  id: string;
  orderId: string;
  userId: string;
  type: FeedbackType;
  comment: string | null;
  rating: number;
  createdAt: Date;
  tenantId: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  order?: {
    id: string;
    total: number;
    restaurant?: {
      name: string;
    };
  };
}

export interface FeedbackFilters {
  type?: FeedbackType;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
  typeDistribution: {
    [key in FeedbackType]: number;
  };
}

export interface BulkNotificationDto {
  userIds: string[];
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

import api from './api';

export type NotificationType = 'booking' | 'quotation' | 'general' | 'success' | 'warning' | 'info';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    unreadCount: number;
  };
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

export const notificationService = {
  // Get all notifications for current user
  getNotifications: async (filters?: NotificationFilters): Promise<NotificationsResponse> => {
    const response = await api.get('/notifications', { params: filters });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ success: boolean; count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<NotificationResponse> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  // Clear all notifications
  clearAllNotifications: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  },
};

export default notificationService;

import api from './api';

export interface ActivityStats {
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  quotations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  reviews: {
    total: number;
    pending: number;
  };
}

export interface RecentActivity {
  _id: string;
  type: 'booking' | 'quotation' | 'review' | 'login';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export interface ActivityStatsResponse {
  success: boolean;
  data: ActivityStats;
}

export interface RecentActivityResponse {
  success: boolean;
  data: RecentActivity[];
}

export const activityService = {
  // Get activity stats for dashboard
  getActivityStats: async (): Promise<ActivityStatsResponse> => {
    const response = await api.get('/users/activity-stats');
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit: number = 10): Promise<RecentActivityResponse> => {
    const response = await api.get('/users/recent-activity', {
      params: { limit },
    });
    return response.data;
  },

  // Get admin dashboard stats
  getAdminStats: async (): Promise<{
    success: boolean;
    data: {
      totalUsers: number;
      totalBookings: number;
      totalQuotations: number;
      totalReviews: number;
      pendingBookings: number;
      pendingQuotations: number;
      pendingReviews: number;
      recentUsers: number;
    };
  }> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

export default activityService;

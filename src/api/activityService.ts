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

// Helper to normalize API responses
function normalizeResponse<T>(response: any, defaultData: T): { success: boolean; data: T } {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return response;
  }
  return {
    success: true,
    data: response ?? defaultData,
  };
}

export const activityService = {
  // Get activity stats for dashboard
  getActivityStats: async (): Promise<ActivityStatsResponse> => {
    const response = await api.get('/users/activity-stats');
    return normalizeResponse(response.data, {
      bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
      quotations: { total: 0, pending: 0, approved: 0, rejected: 0 },
      reviews: { total: 0, pending: 0 },
    });
  },

  // Get recent activity (user logins, etc.)
  // Uses /activity-logs endpoint which matches the website
  getRecentActivity: async (limit: number = 10): Promise<RecentActivityResponse> => {
    const response = await api.get('/activity-logs', {
      params: { limit },
    });
    return normalizeResponse(response.data, []);
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
    return normalizeResponse(response.data, {
      totalUsers: 0,
      totalBookings: 0,
      totalQuotations: 0,
      totalReviews: 0,
      pendingBookings: 0,
      pendingQuotations: 0,
      pendingReviews: 0,
      recentUsers: 0,
    });
  },
};

export default activityService;

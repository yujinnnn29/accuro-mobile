import api from './api';
import {
  DashboardStatsResponse,
  TodayScheduleResponse,
  PendingActionsResponse,
  RecentActivityResponse,
  LowStockResponse,
  BookingTrendsResponse,
  ConversionFunnelResponse,
  QuoteAnalyticsResponse,
  AnalyticsSummaryResponse,
} from '../types';

// Helper to normalize API responses (handle both wrapped and unwrapped formats)
function normalizeResponse<T>(response: any, isArray: boolean = false): { success: boolean; data: T } {
  // If response already has success and data properties, return as-is
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return response;
  }
  // Otherwise, wrap the response
  return {
    success: true,
    data: response ?? (isArray ? [] : null) as T,
  };
}

class AnalyticsService {
  // Get dashboard stats (today's bookings, pending approval, low stock, completed this month)
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const response = await api.get('/analytics/dashboard');
    return normalizeResponse(response.data, false);
  }

  // Get today's schedule (bookings for today)
  async getTodaySchedule(): Promise<TodayScheduleResponse> {
    const response = await api.get('/analytics/today-schedule');
    return normalizeResponse(response.data, true);
  }

  // Get pending actions (quotations, reviews needing approval)
  async getPendingActions(): Promise<PendingActionsResponse> {
    const response = await api.get('/analytics/pending-actions');
    return normalizeResponse(response.data, true);
  }

  // Get recent activity with optional limit
  async getRecentActivity(limit: number = 10): Promise<RecentActivityResponse> {
    const response = await api.get('/analytics/recent-activity', {
      params: { limit },
    });
    return normalizeResponse(response.data, true);
  }

  // Get low stock items
  async getLowStockItems(threshold?: number): Promise<LowStockResponse> {
    const response = await api.get('/analytics/low-stock', {
      params: threshold ? { threshold } : undefined,
    });
    return normalizeResponse(response.data, true);
  }

  // Get booking trends for a period (7, 14, or 30 days)
  async getBookingTrends(period: 7 | 14 | 30 = 30): Promise<BookingTrendsResponse> {
    const response = await api.get<BookingTrendsResponse>('/analytics/booking-trends', {
      params: { period },
    });
    return response.data;
  }

  // Get conversion funnel data
  async getConversionFunnel(): Promise<ConversionFunnelResponse> {
    const response = await api.get<ConversionFunnelResponse>('/analytics/conversion-funnel');
    return response.data;
  }

  // Get quote analytics
  async getQuoteAnalytics(): Promise<QuoteAnalyticsResponse> {
    const response = await api.get<QuoteAnalyticsResponse>('/analytics/quotes');
    return response.data;
  }

  // Get analytics summary (for analytics page header)
  async getAnalyticsSummary(): Promise<AnalyticsSummaryResponse> {
    const response = await api.get<AnalyticsSummaryResponse>('/analytics/summary');
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

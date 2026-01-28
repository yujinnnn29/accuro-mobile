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

class AnalyticsService {
  // Get dashboard stats (today's bookings, pending approval, low stock, completed this month)
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const response = await api.get<DashboardStatsResponse>('/analytics/dashboard');
    return response.data;
  }

  // Get today's schedule (bookings for today)
  async getTodaySchedule(): Promise<TodayScheduleResponse> {
    const response = await api.get<TodayScheduleResponse>('/analytics/today-schedule');
    return response.data;
  }

  // Get pending actions (quotations, reviews needing approval)
  async getPendingActions(): Promise<PendingActionsResponse> {
    const response = await api.get<PendingActionsResponse>('/analytics/pending-actions');
    return response.data;
  }

  // Get recent activity with optional limit
  async getRecentActivity(limit: number = 10): Promise<RecentActivityResponse> {
    const response = await api.get<RecentActivityResponse>('/analytics/recent-activity', {
      params: { limit },
    });
    return response.data;
  }

  // Get low stock items
  async getLowStockItems(threshold?: number): Promise<LowStockResponse> {
    const response = await api.get<LowStockResponse>('/analytics/low-stock', {
      params: threshold ? { threshold } : undefined,
    });
    return response.data;
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

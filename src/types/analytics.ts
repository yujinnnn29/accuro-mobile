// Analytics Types for Admin Dashboard

export type ActivityType = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'login' | 'logout';

export interface DashboardStats {
  todaysBookings: number;
  pendingApproval: number;
  lowStockItems: number;
  completedThisMonth: number;
}

export interface TodayScheduleItem {
  _id: string;
  time: string;
  company: string;
  contactName: string;
  product: string;
  status: 'pending' | 'confirmed';
}

export interface PendingAction {
  _id: string;
  type: 'quotation' | 'review' | 'booking';
  title: string;
  description: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ActivityItem {
  _id: string;
  action: ActivityType;
  resource: string;
  resourceType: 'booking' | 'quotation' | 'review' | 'user' | 'product' | 'contact';
  resourceId: string;
  description: string;
  user?: {
    _id: string;
    name: string;
    email?: string;
  } | string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LowStockItem {
  _id: string;
  name: string;
  category: string;
  stockQuantity: number;
  lowStockThreshold: number;
  image?: string;
}

export interface BookingTrendData {
  date: string;
  count: number;
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface QuoteAnalytics {
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  approvalRate: number;
  avgResponseTime: number; // in hours
}

export interface AnalyticsSummary {
  totalBookings: number;
  totalUsers: number;
  totalQuotes: number;
  totalContacts: number;
  bookingGrowth: number; // percentage
  userGrowth: number;
  quoteGrowth: number;
  contactGrowth: number;
}

// API Response Types
export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

export interface TodayScheduleResponse {
  success: boolean;
  data: TodayScheduleItem[];
}

export interface PendingActionsResponse {
  success: boolean;
  data: PendingAction[];
}

export interface RecentActivityResponse {
  success: boolean;
  data: ActivityItem[];
}

export interface LowStockResponse {
  success: boolean;
  data: LowStockItem[];
}

export interface BookingTrendsResponse {
  success: boolean;
  data: BookingTrendData[];
}

export interface ConversionFunnelResponse {
  success: boolean;
  data: ConversionFunnelData[];
}

export interface QuoteAnalyticsResponse {
  success: boolean;
  data: QuoteAnalytics;
}

export interface AnalyticsSummaryResponse {
  success: boolean;
  data: AnalyticsSummary;
}

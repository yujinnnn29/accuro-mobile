import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Users,
  FileText,
  Mail,
  Clock,
  AlertCircle,
  RefreshCw,
  Target,
  Activity,
  ArrowRight,
  BarChart3,
} from 'lucide-react-native';
import { analyticsService } from '../../api';
import { colors } from '../../theme';
import { LoadingSpinner, Card } from '../../components/common';
import { LineChart, BarChart, DonutChart } from '../../components/admin/ChartComponents';
import { BookingTrendData, ActivityItem } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PeriodFilter = 7 | 14 | 30;

// Helper functions matching website
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getTimeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getStatusColor = (status: string) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: '#dcfce7', text: '#166534' },
    completed: { bg: '#dcfce7', text: '#166534' },
    pending: { bg: '#fef9c3', text: '#854d0e' },
    cancelled: { bg: '#fee2e2', text: '#991b1b' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
    sent: { bg: '#dbeafe', text: '#1e40af' },
    accepted: { bg: '#dcfce7', text: '#166534' },
  };
  return statusColors[status?.toLowerCase()] || { bg: '#f3f4f6', text: '#374151' };
};

export const AnalyticsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>(30);

  // Data states matching website
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [bookingTrends, setBookingTrends] = useState<BookingTrendData[]>([]);
  const [pendingActions, setPendingActions] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<any>(null);
  const [quoteData, setQuoteData] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [dashboard, trends, pending, activity, funnel, quotes] = await Promise.all([
        analyticsService.getDashboardStats().catch(() => ({ data: null })),
        analyticsService.getBookingTrends(period).catch(() => ({ data: [] })),
        analyticsService.getPendingActions().catch(() => ({ data: null })),
        analyticsService.getRecentActivity(10).catch(() => ({ data: [] })),
        analyticsService.getConversionFunnel().catch(() => ({ data: null })),
        analyticsService.getQuoteAnalytics().catch(() => ({ data: null })),
      ]);

      setDashboardData(dashboard.data || null);
      setBookingTrends(trends.data || []);
      setPendingActions(pending.data || null);
      setRecentActivity(Array.isArray(activity.data) ? activity.data : []);
      setConversionFunnel(funnel.data || null);
      setQuoteData(quotes.data || null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const formatTrendLabels = (data: BookingTrendData[]) => {
    if (data.length <= 7) {
      return data.map((d) => formatDate(d.date));
    }
    return data
      .filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1)
      .map((d) => formatDate(d.date));
  };

  const getTrendChartData = (data: BookingTrendData[]) => {
    if (data.length <= 7) return data.map((t) => t.count);
    return data
      .filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1)
      .map((t) => t.count);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading analytics..." />;
  }

  const totalBookings = dashboardData?.totalBookings ?? 0;
  const totalUsers = dashboardData?.totalUsers ?? 0;
  const totalQuotes = dashboardData?.totalQuotes ?? 0;
  const totalContacts = dashboardData?.totalContacts ?? 0;
  const topServices = dashboardData?.products || [];

  // Build quote status data for donut chart
  const quoteStatusData = quoteData?.byStatus || [];
  const quoteTotal = quoteData?.total || 0;

  // Pending actions data
  const unconfirmedBookings = pendingActions?.unconfirmedBookings ?? 0;
  const pendingQuotes = pendingActions?.pendingQuotes ?? 0;
  const unreadContacts = pendingActions?.unreadContacts ?? 0;
  const todayBookings = pendingActions?.todayBookings ?? 0;

  // Conversion funnel
  const funnelStages = conversionFunnel?.funnel || [];
  const funnelQuotes = conversionFunnel?.quotes || {};
  const funnelBookings = conversionFunnel?.bookings || {};

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Analytics Overview</Text>
            <Text style={styles.headerSubtitle}>Business insights at a glance</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <RefreshCw size={16} color={colors.gray[600]} />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards - Gradient style matching website */}
        <View style={styles.section}>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.summaryBlue]}>
              <View style={styles.summaryCardContent}>
                <View>
                  <Text style={styles.summaryCardLabel}>Total Bookings</Text>
                  <Text style={styles.summaryCardValue}>{totalBookings}</Text>
                </View>
                <Calendar size={32} color="rgba(255,255,255,0.5)" />
              </View>
            </View>

            <View style={[styles.summaryCard, styles.summaryGreen]}>
              <View style={styles.summaryCardContent}>
                <View>
                  <Text style={styles.summaryCardLabel}>Total Users</Text>
                  <Text style={styles.summaryCardValue}>{totalUsers}</Text>
                </View>
                <Users size={32} color="rgba(255,255,255,0.5)" />
              </View>
            </View>

            <View style={[styles.summaryCard, styles.summaryPurple]}>
              <View style={styles.summaryCardContent}>
                <View>
                  <Text style={styles.summaryCardLabel}>Quote Requests</Text>
                  <Text style={styles.summaryCardValue}>{totalQuotes}</Text>
                </View>
                <FileText size={32} color="rgba(255,255,255,0.5)" />
              </View>
            </View>

            <View style={[styles.summaryCard, styles.summaryOrange]}>
              <View style={styles.summaryCardContent}>
                <View>
                  <Text style={styles.summaryCardLabel}>Contact Forms</Text>
                  <Text style={styles.summaryCardValue}>{totalContacts}</Text>
                </View>
                <Mail size={32} color="rgba(255,255,255,0.5)" />
              </View>
            </View>
          </View>
        </View>

        {/* Booking Trends */}
        <View style={styles.section}>
          <Card style={styles.chartCard} padding="md">
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.cardTitle}>Booking Trends</Text>
                <Text style={styles.cardSubtitle}>
                  Bookings over the last {period} days
                </Text>
              </View>
              <View style={styles.periodFilters}>
                {([7, 14, 30] as PeriodFilter[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.periodButton,
                      period === p && styles.periodButtonActive,
                    ]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        period === p && styles.periodButtonTextActive,
                      ]}
                    >
                      {p}D
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {bookingTrends.length > 0 ? (
              <LineChart
                data={{
                  labels: formatTrendLabels(bookingTrends),
                  data: getTrendChartData(bookingTrends),
                }}
                height={220}
                color={colors.primary[600]}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>No booking data for this period</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Pending Actions - List style matching website */}
        <View style={styles.section}>
          <Card style={styles.chartCard} padding="md">
            <View style={styles.cardTitleRow}>
              <AlertCircle size={18} color="#ca8a04" />
              <Text style={styles.cardTitle}>Pending Actions</Text>
            </View>

            <View style={styles.pendingList}>
              <View style={styles.pendingItem}>
                <View style={styles.pendingItemLeft}>
                  <View style={[styles.pendingIcon, { backgroundColor: '#fef3c7' }]}>
                    <Clock size={16} color="#ca8a04" />
                  </View>
                  <Text style={styles.pendingLabel}>Unconfirmed Bookings</Text>
                </View>
                <Text style={[styles.pendingValue, unconfirmedBookings > 0 && { color: '#ca8a04' }]}>
                  {unconfirmedBookings}
                </Text>
              </View>

              <View style={styles.pendingItem}>
                <View style={styles.pendingItemLeft}>
                  <View style={[styles.pendingIcon, { backgroundColor: '#f3e8ff' }]}>
                    <FileText size={16} color="#7c3aed" />
                  </View>
                  <Text style={styles.pendingLabel}>Pending Quotes</Text>
                </View>
                <Text style={[styles.pendingValue, pendingQuotes > 0 && { color: '#7c3aed' }]}>
                  {pendingQuotes}
                </Text>
              </View>

              <View style={styles.pendingItem}>
                <View style={styles.pendingItemLeft}>
                  <View style={[styles.pendingIcon, { backgroundColor: '#ffedd5' }]}>
                    <Mail size={16} color="#ea580c" />
                  </View>
                  <Text style={styles.pendingLabel}>Unread Contacts</Text>
                </View>
                <Text style={[styles.pendingValue, unreadContacts > 0 && { color: '#ea580c' }]}>
                  {unreadContacts}
                </Text>
              </View>

              <View style={[styles.pendingItem, styles.pendingItemHighlight]}>
                <View style={styles.pendingItemLeft}>
                  <View style={[styles.pendingIcon, { backgroundColor: '#dbeafe' }]}>
                    <Calendar size={16} color="#2563eb" />
                  </View>
                  <Text style={[styles.pendingLabel, { fontWeight: '600', color: '#1e40af' }]}>
                    Today's Bookings
                  </Text>
                </View>
                <Text style={[styles.pendingValue, { color: '#2563eb' }]}>
                  {todayBookings}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Top Services */}
        {topServices.length > 0 && (
          <View style={styles.section}>
            <Card style={styles.chartCard} padding="md">
              <View>
                <Text style={styles.cardTitle}>Top Services</Text>
                <Text style={styles.cardSubtitle}>Most requested calibration services</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                {topServices.slice(0, 5).map((service: any, index: number) => {
                  const maxCount = Math.max(...topServices.slice(0, 5).map((s: any) => s.count || 0), 1);
                  const barColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                  const barColor = barColors[index % barColors.length];
                  const barWidth = ((service.count || 0) / maxCount) * 100;
                  return (
                    <View key={service._id || index} style={styles.topServiceRow}>
                      <Text style={styles.topServiceName} numberOfLines={1}>
                        {service._id || 'Unknown'}
                      </Text>
                      <View style={styles.topServiceBarBg}>
                        <View
                          style={[
                            styles.topServiceBar,
                            { width: `${barWidth}%`, backgroundColor: barColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.topServiceCount}>{service.count || 0}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        )}

        {/* Quote Status */}
        {quoteStatusData.length > 0 && (
          <View style={styles.section}>
            <Card style={styles.chartCard} padding="md">
              <View>
                <Text style={styles.cardTitle}>Quote Status</Text>
                <Text style={styles.cardSubtitle}>Breakdown by status ({quoteTotal} total)</Text>
              </View>
              <View style={{ marginTop: 16 }}>
                <DonutChart
                  data={quoteStatusData.map((item: any) => {
                    const statusColors: Record<string, string> = {
                      pending: '#fbbf24',
                      sent: '#3b82f6',
                      accepted: '#10b981',
                      rejected: '#ef4444',
                    };
                    return {
                      value: item.count || 0,
                      color: statusColors[item._id] || '#6b7280',
                      label: (item._id || 'unknown').charAt(0).toUpperCase() + (item._id || 'unknown').slice(1),
                    };
                  })}
                  size={150}
                  strokeWidth={22}
                  centerValue={quoteTotal}
                  centerLabel="Total"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Conversion Funnel - Grid style matching website */}
        {funnelStages.length > 0 && (
          <View style={styles.section}>
            <Card style={styles.chartCard} padding="md">
              <View style={styles.cardTitleRow}>
                <Target size={18} color={colors.primary[600]} />
                <Text style={styles.cardTitle}>Conversion Funnel</Text>
              </View>

              <View style={styles.funnelGrid}>
                {funnelStages.map((stage: any, index: number) => (
                  <View key={index} style={styles.funnelGridItem}>
                    <View style={styles.funnelGridCard}>
                      <Text style={styles.funnelGridValue}>{stage.count}</Text>
                      <Text style={styles.funnelGridLabel}>{stage.stage}</Text>
                    </View>
                    {index < funnelStages.length - 1 && (
                      <ArrowRight size={14} color={colors.gray[400]} style={{ marginHorizontal: 2 }} />
                    )}
                  </View>
                ))}
              </View>

              {/* Conversion Rates */}
              <View style={styles.conversionRatesRow}>
                <View style={styles.conversionRate}>
                  <Text style={styles.conversionRateLabel}>Quote Acceptance</Text>
                  <Text style={[
                    styles.conversionRateValue,
                    (funnelQuotes.rate || 0) > 50 && { color: colors.success },
                  ]}>
                    {funnelQuotes.rate || 0}%
                  </Text>
                </View>
                <View style={styles.conversionRate}>
                  <Text style={styles.conversionRateLabel}>Booking Confirmation</Text>
                  <Text style={[
                    styles.conversionRateValue,
                    (funnelBookings.confirmationRate || 0) > 50 && { color: colors.success },
                  ]}>
                    {funnelBookings.confirmationRate || 0}%
                  </Text>
                </View>
                <View style={styles.conversionRate}>
                  <Text style={styles.conversionRateLabel}>Completion</Text>
                  <Text style={[
                    styles.conversionRateValue,
                    (funnelBookings.completionRate || 0) > 50 && { color: colors.success },
                  ]}>
                    {funnelBookings.completionRate || 0}%
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Recent Activity - Matching website */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <Card style={styles.chartCard} padding="md">
              <View style={styles.cardTitleRow}>
                <Activity size={18} color={colors.primary[600]} />
                <Text style={styles.cardTitle}>Recent Activity</Text>
              </View>

              <View style={styles.activityList}>
                {recentActivity.map((item, index) => {
                  const statusColor = getStatusColor(
                    (item as any).status || (item as any).action || ''
                  );
                  return (
                    <View key={item._id || index} style={styles.activityItem}>
                      <View style={styles.activityItemLeft}>
                        <View style={[styles.activityDot, {
                          backgroundColor: item.resourceType === 'booking' ? '#3b82f6'
                            : item.resourceType === 'quotation' ? '#8b5cf6'
                            : item.resourceType === 'contact' ? '#f59e0b'
                            : item.resourceType === 'user' ? '#10b981'
                            : '#6b7280',
                        }]} />
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityTitle} numberOfLines={1}>
                            {(item as any).title || item.description || `${item.action} ${item.resourceType}`}
                          </Text>
                          <Text style={styles.activitySubtitle} numberOfLines={1}>
                            {(item as any).subtitle ||
                              (typeof item.user === 'object' ? item.user?.name : '') ||
                              item.resource}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.activityItemRight}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
                            {(item as any).status || item.action || ''}
                          </Text>
                        </View>
                        <Text style={styles.activityTime}>
                          {getTimeAgo(item.timestamp || (item as any).date || '')}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },

  // Summary cards - gradient style
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryBlue: { backgroundColor: '#3b82f6' },
  summaryGreen: { backgroundColor: '#22c55e' },
  summaryPurple: { backgroundColor: '#8b5cf6' },
  summaryOrange: { backgroundColor: '#f97316' },
  summaryCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  summaryCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },

  // Period filters
  periodFilters: {
    flexDirection: 'row',
    gap: 6,
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.gray[100],
  },
  periodButtonActive: {
    backgroundColor: colors.primary[600],
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },

  chartCard: {
    marginTop: 0,
  },

  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: colors.gray[400],
  },

  // Pending Actions - List style
  pendingList: {
    gap: 10,
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 10,
  },
  pendingItemHighlight: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  pendingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingLabel: {
    fontSize: 13,
    color: colors.gray[700],
  },
  pendingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[500],
  },

  // Top Services
  topServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  topServiceName: {
    width: 100,
    fontSize: 12,
    color: colors.gray[600],
  },
  topServiceBarBg: {
    flex: 1,
    height: 20,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  topServiceBar: {
    height: '100%',
    borderRadius: 4,
  },
  topServiceCount: {
    width: 30,
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'right',
  },

  // Conversion Funnel - Grid style
  funnelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  funnelGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  funnelGridCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  funnelGridValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  funnelGridLabel: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },
  conversionRatesRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 14,
    gap: 8,
  },
  conversionRate: {
    flex: 1,
    alignItems: 'center',
  },
  conversionRateLabel: {
    fontSize: 11,
    color: colors.gray[500],
    textAlign: 'center',
  },
  conversionRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginTop: 4,
  },

  // Recent Activity
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.gray[50],
    borderRadius: 10,
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[800],
  },
  activitySubtitle: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 1,
  },
  activityItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  activityTime: {
    fontSize: 10,
    color: colors.gray[400],
  },

  bottomPadding: {
    height: 24,
  },
});

export default AnalyticsScreen;

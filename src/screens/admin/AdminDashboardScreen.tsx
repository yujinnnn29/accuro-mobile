import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { AdminDrawerParamList } from '../../navigation/types';
import {
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  FileText,
  Star,
} from 'lucide-react-native';
import { useAuth, useTheme } from '../../contexts';
import { bookingService } from '../../api';
import api from '../../api/api';
import { colors } from '../../theme';
import { LoadingSpinner } from '../../components/common';
import {
  DashboardStatCard,
  TodayScheduleCard,
  PendingActionsCard,
  RecentActivityCard,
} from '../../components/admin';
import {
  DashboardStats,
  TodayScheduleItem,
  PendingAction,
  ActivityItem,
} from '../../types';

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    todaysBookings: 0,
    pendingApproval: 0,
    lowStockItems: 0,
    completedThisMonth: 0,
  });

  // Dashboard data
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleItem[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [pendingQuotations, setPendingQuotations] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Use xhr adapter for all calls to avoid Axios fetch-adapter silent failure bug
      const [analyticsRes, quotationsRes, todayRes, completedMonthRes] = await Promise.all([
        api.get('/analytics/dashboard', { adapter: 'xhr' }).catch(() => ({ data: null })),
        api.get('/quotations', { params: { status: 'pending' }, adapter: 'xhr' }).catch(() => ({ data: null })),
        api.get('/bookings', { params: { startDate: today, endDate: today }, adapter: 'xhr' }).catch(() => ({ data: null })),
        api.get('/bookings', { params: { startDate: monthStart, endDate: monthEnd, status: 'completed' }, adapter: 'xhr' }).catch(() => ({ data: null })),
      ]);

      // Analytics response for pending count
      const analyticsData = analyticsRes.data?.data ?? analyticsRes.data ?? {};
      const statusesArr: { _id: string; count: number }[] = analyticsData.statuses || [];
      const getStatusCount = (s: string) =>
        statusesArr.find((x: any) => x._id === s)?.count ?? 0;

      const pendingBookingCount = getStatusCount('pending');

      // Today's bookings count
      const todayCount = todayRes.data?.count ?? todayRes.data?.data?.length ?? 0;

      // Completed this month (current month only)
      const completedThisMonth = completedMonthRes.data?.count ?? completedMonthRes.data?.data?.length ?? 0;

      setStats({
        todaysBookings: todayCount,
        pendingApproval: pendingBookingCount,
        lowStockItems: 0,
        completedThisMonth,
      });

      // Pending quotations count from quotations endpoint
      const quotationsData = quotationsRes.data?.data ?? quotationsRes.data ?? [];
      const pendingQuoteCount = Array.isArray(quotationsData) ? quotationsData.length : (quotationsRes.data?.count ?? 0);
      const pendingReviewCount = 0; // reviews endpoint not available
      setPendingQuotations(pendingQuoteCount);
      setPendingReviews(pendingReviewCount);

      // Today's schedule — from a fresh xhr call
      let todayData: any[] = [];
      try {
        const schedRes = await api.get('/bookings', {
          params: { startDate: today, endDate: today },
          adapter: 'xhr',
        });
        todayData = schedRes.data?.data || [];
      } catch { /* leave empty */ }
      setTodaySchedule(
        todayData.map((item: any) => ({
          _id: item._id || item.id,
          time: item.time || '09:00',
          company: item.company || 'Unknown',
          contactName: item.contactName || 'Unknown',
          product: item.product || 'N/A',
          status: item.status === 'confirmed' ? 'confirmed' : 'pending',
        }))
      );

      // Pending actions cards
      const actions: PendingAction[] = [];
      if (pendingBookingCount > 0) {
        actions.push({
          _id: 'pending-bookings',
          type: 'booking',
          title: 'Pending Approval',
          description: `${pendingBookingCount} booking(s) need confirmation`,
          createdAt: new Date().toISOString(),
          priority: 'high',
        });
      }
      if (pendingQuoteCount > 0) {
        actions.push({
          _id: 'pending-quotes',
          type: 'quotation',
          title: 'Pending Quotations',
          description: `${pendingQuoteCount} quotation(s) awaiting approval`,
          createdAt: new Date().toISOString(),
          priority: 'high',
        });
      }
      if (pendingReviewCount > 0) {
        actions.push({
          _id: 'pending-reviews',
          type: 'review',
          title: 'Pending Reviews',
          description: `${pendingReviewCount} review(s) awaiting moderation`,
          createdAt: new Date().toISOString(),
          priority: 'medium',
        });
      }
      setPendingActions(actions);

      // Recent activity — use xhr adapter to avoid fetch-adapter silent failure
      const activityRes = await api.get('/activity-logs', { params: { limit: 8 }, adapter: 'xhr' }).catch(() => ({ data: [] }));
      const rawActivity = activityRes.data?.data ?? activityRes.data ?? [];
      const activityData = Array.isArray(rawActivity) ? rawActivity : [];
      setRecentActivity(
        activityData.map((item: any) => ({
          _id: item._id || item.id,
          action: (item.action || item.type || 'update') as any,
          resource: item.resource || item.title || 'System',
          resourceType: item.resourceType || item.type || 'booking',
          resourceId: item.resourceId || item._id,
          description: item.description || item.subtitle || '',
          timestamp: item.timestamp || item.createdAt || item.date || new Date().toISOString(),
        }))
      );
    } catch (error: any) {
      const isNetworkIssue = !error.response && (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.code === 'ERR_NETWORK' || error.message === 'Aborted' || error.message === 'Network Error');
      if (!isNetworkIssue) console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleScheduleItemPress = (item: TodayScheduleItem) => {
    (navigation as any).navigate('AdminBookingDetail', { bookingId: item._id });
  };

  const handlePendingActionPress = (item: PendingAction) => {
    switch (item.type) {
      case 'quotation':
        navigation.navigate('AdminQuotations' as never);
        break;
      case 'review':
        navigation.navigate('AdminReviews' as never);
        break;
      case 'booking':
        navigation.navigate('AdminBookings' as never);
        break;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Admin'}</Text>
          <Text style={styles.role}>
            {user?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <DashboardStatCard
              title="Today's Bookings"
              value={stats.todaysBookings}
              icon={Calendar}
              color={colors.primary[600]}
              bgColor={colors.primary[100]}
              onPress={() => navigation.navigate('AdminBookings' as never)}
            />
            <DashboardStatCard
              title="Pending Approval"
              value={stats.pendingApproval}
              icon={Clock}
              color={colors.warning}
              bgColor={colors.warning + '20'}
              onPress={() => navigation.navigate('AdminBookings' as never)}
            />
            <DashboardStatCard
              title="Pending Quotes"
              value={pendingQuotations}
              icon={FileText}
              color={colors.error}
              bgColor={colors.error + '20'}
              onPress={() => navigation.navigate('AdminQuotations' as never)}
            />
            <DashboardStatCard
              title="Completed (Month)"
              value={stats.completedThisMonth}
              icon={CheckCircle}
              color={colors.success}
              bgColor={colors.success + '20'}
            />
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <TodayScheduleCard
            items={todaySchedule}
            onItemPress={handleScheduleItemPress}
            onViewAll={() => navigation.navigate('AdminBookings' as never)}
          />
        </View>

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <View style={styles.section}>
            <PendingActionsCard
              items={pendingActions}
              onItemPress={handlePendingActionPress}
              onViewAll={() => navigation.navigate('AdminQuotations' as never)}
            />
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <RecentActivityCard
            items={recentActivity}
            onViewAll={() => navigation.navigate('AdminActivityLogs' as never)}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={[styles.quickActions, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.quickAction, { borderBottomColor: theme.border }]}
              onPress={() => navigation.navigate('AdminBookings' as never)}
            >
              <Calendar size={20} color={colors.primary[600]} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Review Bookings</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { borderBottomColor: theme.border }]}
              onPress={() => navigation.navigate('AdminQuotations' as never)}
            >
              <FileText size={20} color={colors.primary[600]} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Approve Quotations</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, styles.lastQuickAction]}
              onPress={() => navigation.navigate('AdminReviews' as never)}
            >
              <Star size={20} color={colors.primary[600]} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Moderate Reviews</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>

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
    padding: 20,
    backgroundColor: colors.white,
  },
  greeting: {
    fontSize: 16,
    color: colors.gray[500],
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 4,
  },
  role: {
    fontSize: 14,
    color: colors.primary[600],
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActions: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  lastQuickAction: {
    borderBottomWidth: 0,
  },
  quickActionText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
    marginLeft: 12,
  },
  bottomPadding: {
    height: 24,
  },
});

export default AdminDashboardScreen;

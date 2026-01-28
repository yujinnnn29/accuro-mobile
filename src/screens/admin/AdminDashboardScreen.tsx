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
import {
  Calendar,
  Clock,
  Package,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react-native';
import { useAuth } from '../../contexts';
import { analyticsService, activityService, productService, bookingService } from '../../api';
import { colors } from '../../theme';
import { LoadingSpinner } from '../../components/common';
import {
  DashboardStatCard,
  TodayScheduleCard,
  PendingActionsCard,
  RecentActivityCard,
  LowStockAlertCard,
} from '../../components/admin';
import {
  DashboardStats,
  TodayScheduleItem,
  PendingAction,
  ActivityItem,
  LowStockItem,
} from '../../types';

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
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
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch all dashboard data in parallel
      const [
        statsResponse,
        scheduleResponse,
        actionsResponse,
        activityResponse,
        lowStockResponse,
      ] = await Promise.all([
        analyticsService.getDashboardStats().catch(() => ({ data: null })),
        analyticsService.getTodaySchedule().catch(() => ({ data: [] })),
        analyticsService.getPendingActions().catch(() => ({ data: [] })),
        analyticsService.getRecentActivity(10).catch(() => ({ data: [] })),
        analyticsService.getLowStockItems().catch(() => ({ data: [] })),
      ]);

      // If new analytics endpoints aren't ready, fallback to existing data
      if (statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        // Fallback: fetch from existing services
        const [adminStats, lowStockData, bookingsData] = await Promise.all([
          activityService.getAdminStats().catch(() => ({ data: null })),
          productService.getLowStockProducts().catch(() => ({ data: [] })),
          bookingService.getAll({ status: 'pending' }).catch(() => ({ data: [] })),
        ]);

        // Get today's bookings
        const today = new Date().toISOString().split('T')[0];
        const allBookings = await bookingService.getAll().catch(() => ({ data: [] }));
        const todaysBookings = allBookings.data?.filter(
          (b: any) => b.date?.split('T')[0] === today
        ) || [];

        setStats({
          todaysBookings: todaysBookings.length,
          pendingApproval: (adminStats.data?.pendingQuotations || 0) + (adminStats.data?.pendingReviews || 0),
          lowStockItems: lowStockData.data?.length || 0,
          completedThisMonth: adminStats.data?.totalBookings || 0,
        });

        // Convert today's bookings to schedule format
        const scheduleItems: TodayScheduleItem[] = todaysBookings.map((b: any) => ({
          _id: b._id,
          time: b.time || '09:00',
          company: b.company || 'Unknown',
          contactName: b.contactName || 'Unknown',
          product: b.product || 'N/A',
          status: b.status === 'confirmed' ? 'confirmed' : 'pending',
        }));
        setTodaySchedule(scheduleItems);

        // Convert low stock to correct format
        const lowStockFormatted: LowStockItem[] = (lowStockData.data || []).map((p: any) => ({
          _id: p._id,
          name: p.name,
          category: p.category,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          image: p.image,
        }));
        setLowStockItems(lowStockFormatted);

        // Build pending actions from existing data
        const actions: PendingAction[] = [];
        if (adminStats.data?.pendingQuotations) {
          actions.push({
            _id: 'pending-quotes',
            type: 'quotation',
            title: 'Pending Quotations',
            description: `${adminStats.data.pendingQuotations} quotation(s) awaiting approval`,
            createdAt: new Date().toISOString(),
            priority: 'high',
          });
        }
        if (adminStats.data?.pendingReviews) {
          actions.push({
            _id: 'pending-reviews',
            type: 'review',
            title: 'Pending Reviews',
            description: `${adminStats.data.pendingReviews} review(s) awaiting moderation`,
            createdAt: new Date().toISOString(),
            priority: 'medium',
          });
        }
        setPendingActions(actions);

        // Fetch recent activity from existing service
        const activityData = await activityService.getRecentActivity(10).catch(() => ({ data: [] }));
        const formattedActivity: ActivityItem[] = (activityData.data || []).map((a: any) => ({
          _id: a._id,
          action: a.title || a.type || 'update',
          resource: a.type || 'Booking',
          resourceType: a.type || 'booking',
          resourceId: a._id,
          description: a.description,
          timestamp: a.timestamp,
        }));
        setRecentActivity(formattedActivity);

        return;
      }

      setTodaySchedule(scheduleResponse.data || []);
      setPendingActions(actionsResponse.data || []);
      setRecentActivity(activityResponse.data || []);
      setLowStockItems(lowStockResponse.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const handleLowStockItemPress = (item: LowStockItem) => {
    (navigation as any).navigate('AdminProductForm', { productId: item._id });
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
          <Text style={styles.role}>
            {user?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
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
              onPress={() => navigation.navigate('AdminQuotations' as never)}
            />
            <DashboardStatCard
              title="Low Stock Items"
              value={stats.lowStockItems}
              icon={Package}
              color={colors.error}
              bgColor={colors.error + '20'}
              onPress={() => navigation.navigate('AdminProducts' as never)}
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

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <View style={styles.section}>
            <LowStockAlertCard
              items={lowStockItems}
              onItemPress={handleLowStockItemPress}
              onViewAll={() => navigation.navigate('AdminProducts' as never)}
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
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('AdminBookings' as never)}
            >
              <Calendar size={20} color={colors.primary[600]} />
              <Text style={styles.quickActionText}>Manage Bookings</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('AdminProducts' as never)}
            >
              <Package size={20} color={colors.primary[600]} />
              <Text style={styles.quickActionText}>Manage Products</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('AdminUsers' as never)}
            >
              <Users size={20} color={colors.primary[600]} />
              <Text style={styles.quickActionText}>Manage Users</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('AdminAnalytics' as never)}
            >
              <TrendingUp size={20} color={colors.primary[600]} />
              <Text style={styles.quickActionText}>View Analytics</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, styles.lastQuickAction]}
              onPress={() => navigation.navigate('AdminReports' as never)}
            >
              <FileText size={20} color={colors.primary[600]} />
              <Text style={styles.quickActionText}>Generate Reports</Text>
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

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Calendar,
  Clock,
  AlertCircle,
  ArrowRight,
  MapPin,
  Building,
  Package,
  User,
  Play,
  ClipboardList,
  ChevronRight,
  CheckCircle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useTheme } from '../../contexts';
import { bookingService } from '../../api/bookingService';
import { Booking } from '../../types';
import { colors } from '../../theme';
import { DashboardStatCard } from '../../components/admin';
import { TechnicianDrawerParamList } from '../../navigation/types';
import { DrawerNavigationProp } from '@react-navigation/drawer';

const CACHE_KEY = 'technician_assignments_cache';

type NavigationProp = DrawerNavigationProp<TechnicianDrawerParamList, 'TechnicianDashboard'>;

const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  confirmed:      { bg: '#dbeafe', text: '#1d4ed8', label: 'Confirmed' },
  in_progress:    { bg: '#fef9c3', text: '#b45309', label: 'In Progress' },
  pending_review: { bg: '#ede9fe', text: '#7c3aed', label: 'Pending Review' },
  completed:      { bg: '#dcfce7', text: '#15803d', label: 'Completed' },
  cancelled:      { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
};

export const TechnicianDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [assignments, setAssignments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await bookingService.getMyAssignments();
      const data = response.data || [];
      setAssignments(data);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
    } catch (error: any) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then(cached => {
      if (cached) { setAssignments(JSON.parse(cached)); setLoading(false); }
    }).catch(() => {});
    fetchAssignments();
  }, [fetchAssignments]);

  const handleRefresh = () => { setRefreshing(true); fetchAssignments(); };

  const handleStartBooking = async (id: string) => {
    try {
      setActionLoading(id);
      await bookingService.startBooking(id);
      fetchAssignments();
    } catch (error: any) {
      const { Alert } = require('react-native');
      Alert.alert('Error', error.response?.data?.message || 'Failed to start meeting');
    } finally {
      setActionLoading(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };
  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= today && d <= endOfWeek;
  };

  const todayAssignments = assignments.filter(a => isToday(a.date));
  const upcomingThisWeek = assignments.filter(
    a => isThisWeek(a.date) && !isToday(a.date) && ['confirmed', 'in_progress'].includes(a.status)
  );
  const pendingCompletion = assignments.filter(a => a.status === 'confirmed' || a.status === 'in_progress');
  const pendingReview = assignments.filter(a => a.status === 'pending_review');

  const profileIncomplete = !user?.firstName || !user?.lastName || !user?.phone;
  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || 'Technician';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderStatusBadge = (status: string) => {
    const s = STATUS_COLORS[status] || { bg: colors.gray[100], text: colors.gray[600], label: status };
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
      </View>
    );
  };

  const renderAssignmentCard = (booking: Booking) => (
    <View key={booking._id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <User size={14} color={colors.gray[400]} />
          <Text style={[styles.cardContact, { color: theme.text }]}>{booking.contactName}</Text>
        </View>
        {renderStatusBadge(booking.status)}
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Building size={13} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{booking.company}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={13} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{formatTime(booking.time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={13} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{booking.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Package size={13} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{booking.product}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {booking.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.startBtn]}
            onPress={() => handleStartBooking(booking._id)}
            disabled={actionLoading === booking._id}
          >
            <Play size={13} color="#fff" />
            <Text style={styles.actionBtnText}>
              {actionLoading === booking._id ? 'Starting...' : 'Start Meeting'}
            </Text>
          </TouchableOpacity>
        )}
        {booking.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.submitBtn]}
            onPress={() => navigation.navigate('TechnicianAssignments', { submitBookingId: booking._id })}
          >
            <ClipboardList size={13} color="#fff" />
            <Text style={styles.actionBtnText}>Submit Report</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.viewBtn, { backgroundColor: theme.background }]}
          onPress={() => navigation.navigate('TechnicianAssignments')}
        >
          <Text style={[styles.viewBtnText, { color: theme.textSecondary }]}>View All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Welcome Header — matches Admin Dashboard style */}
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
          <View style={styles.roleRow}>
            <Text style={styles.role}>Technician</Text>
            {user?.technicianNumber && (
              <View style={styles.techBadge}>
                <Text style={styles.techBadgeText}>#{user.technicianNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile completion banner */}
        {profileIncomplete && (
          <TouchableOpacity
            style={styles.profileBanner}
            onPress={() => navigation.navigate('TechnicianDashboard')}
          >
            <AlertCircle size={18} color="#b45309" />
            <View style={styles.profileBannerText}>
              <Text style={styles.profileBannerTitle}>Complete Your Profile</Text>
              <Text style={styles.profileBannerSub}>Customers will see your details when you're assigned to their bookings.</Text>
            </View>
            <ArrowRight size={16} color="#b45309" />
          </TouchableOpacity>
        )}

        {/* Stats — same DashboardStatCard as Admin */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <DashboardStatCard
              title="Today's Assignments"
              value={loading ? 0 : todayAssignments.length}
              icon={Calendar}
              color={colors.primary[600]}
              bgColor={colors.primary[100]}
              onPress={() => navigation.navigate('TechnicianAssignments')}
            />
            <DashboardStatCard
              title="Upcoming (Week)"
              value={loading ? 0 : upcomingThisWeek.length}
              icon={Clock}
              color="#059669"
              bgColor="#d1fae5"
            />
            <DashboardStatCard
              title="Pending Completion"
              value={loading ? 0 : pendingCompletion.length}
              icon={AlertCircle}
              color="#ea580c"
              bgColor="#fff7ed"
            />
            <DashboardStatCard
              title="Pending Review"
              value={loading ? 0 : pendingReview.length}
              icon={CheckCircle}
              color="#7c3aed"
              bgColor="#f5f3ff"
            />
          </View>
        </View>

        {/* Today's Assignments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Assignments</Text>
          </View>
          {loading ? (
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
          ) : todayAssignments.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Calendar size={40} color={colors.gray[300]} />
              <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No assignments for today</Text>
              <Text style={[styles.emptySub, { color: colors.gray[400] }]}>Check your upcoming assignments for the week</Text>
            </View>
          ) : (
            todayAssignments.map(renderAssignmentCard)
          )}
        </View>

        {/* Quick Actions — matches Admin Dashboard style */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={[styles.quickActions, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.quickAction, { borderBottomColor: theme.border }]}
              onPress={() => navigation.navigate('TechnicianAssignments')}
            >
              <ClipboardList size={20} color={colors.primary[600]} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>View All Assignments</Text>
              <ChevronRight size={16} color={colors.gray[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, styles.lastQuickAction]}
              onPress={() => navigation.navigate('TechnicianDashboard')}
            >
              <User size={20} color={colors.primary[600]} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>My Profile</Text>
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
  container: { flex: 1 },

  // Header — matches Admin Dashboard
  header: {
    padding: 20,
  },
  greeting: { fontSize: 16 },
  userName: { fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  role: { fontSize: 14, color: colors.primary[600], fontWeight: '500' },
  techBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  techBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Profile banner
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  profileBannerText: { flex: 1 },
  profileBannerTitle: { fontSize: 13, fontWeight: '600', color: '#92400e' },
  profileBannerSub: { fontSize: 12, color: '#b45309', marginTop: 2 },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  loadingText: { textAlign: 'center', padding: 20 },

  // Empty state
  emptyCard: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },

  // Assignment cards
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardContact: { fontSize: 15, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardDetails: { gap: 6, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  startBtn: { backgroundColor: colors.primary[600] },
  submitBtn: { backgroundColor: '#059669' },
  viewBtn: { backgroundColor: colors.gray[100] },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  viewBtnText: { fontSize: 12, fontWeight: '600' },

  // Quick Actions — matches Admin Dashboard
  quickActions: { borderRadius: 12, overflow: 'hidden' },
  quickAction: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, gap: 12,
  },
  lastQuickAction: { borderBottomWidth: 0 },
  quickActionText: { flex: 1, fontSize: 15, fontWeight: '500' },

  bottomPadding: { height: 32 },
});

export default TechnicianDashboardScreen;

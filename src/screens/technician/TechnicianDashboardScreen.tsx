import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  MapPin,
  Building,
  Package,
  User,
  Play,
  ClipboardList,
  LogOut,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts';
import { bookingService } from '../../api/bookingService';
import { Booking } from '../../types';

const CACHE_KEY = 'technician_assignments_cache';
import { colors } from '../../theme';
import { TechnicianTabParamList } from '../../navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type NavigationProp = BottomTabNavigationProp<TechnicianTabParamList, 'TechnicianDashboardTab'>;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };
  const [assignments, setAssignments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await bookingService.getMyAssignments();
      const data = response.data || [];
      setAssignments(data);
      // Cache fresh data so next load is instant
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
    } catch (error: any) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Show cached data immediately, then fetch fresh in background
    AsyncStorage.getItem(CACHE_KEY).then(cached => {
      if (cached) {
        setAssignments(JSON.parse(cached));
        setLoading(false);
      }
    }).catch(() => {});
    fetchAssignments();
  }, [fetchAssignments]);

  const handleRefresh = () => { setRefreshing(true); fetchAssignments(); };

  const handleStartBooking = async (id: string) => {
    try {
      setActionLoading(id);
      await bookingService.startBooking(id);
      Alert.alert('Success', 'Meeting started successfully');
      fetchAssignments();
    } catch (error: any) {
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

  const renderStatusBadge = (status: string) => {
    const s = STATUS_COLORS[status] || { bg: colors.gray[100], text: colors.gray[600], label: status };
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
      </View>
    );
  };

  const renderAssignmentCard = (booking: Booking) => (
    <View key={booking._id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <User size={14} color={colors.gray[400]} />
          <Text style={styles.cardContact}>{booking.contactName}</Text>
        </View>
        {renderStatusBadge(booking.status)}
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}><Building size={13} color={colors.gray[400]} /><Text style={styles.detailText}>{booking.company}</Text></View>
        <View style={styles.detailRow}><Clock size={13} color={colors.gray[400]} /><Text style={styles.detailText}>{formatTime(booking.time)}</Text></View>
        <View style={styles.detailRow}><MapPin size={13} color={colors.gray[400]} /><Text style={styles.detailText}>{booking.location}</Text></View>
        <View style={styles.detailRow}><Package size={13} color={colors.gray[400]} /><Text style={styles.detailText}>{booking.product}</Text></View>
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
            onPress={() => navigation.navigate('TechnicianAssignmentsTab', { submitBookingId: booking._id })}
          >
            <ClipboardList size={13} color="#fff" />
            <Text style={styles.actionBtnText}>Submit Report</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.viewBtn]}
          onPress={() => navigation.navigate('TechnicianAssignmentsTab')}
        >
          <Text style={styles.viewBtnText}>View All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerName}>Welcome, {displayName}</Text>
            {user?.technicianNumber && (
              <View style={styles.techBadge}>
                <Text style={styles.techBadgeText}>#{user.technicianNumber}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Manage your assignments and service reports</Text>
      </View>

      {/* Profile completion banner */}
      {profileIncomplete && (
        <TouchableOpacity style={styles.profileBanner} onPress={() => navigation.navigate('TechnicianProfileTab')}>
          <AlertCircle size={18} color="#b45309" />
          <View style={styles.profileBannerText}>
            <Text style={styles.profileBannerTitle}>Complete Your Profile</Text>
            <Text style={styles.profileBannerSub}>Customers will see your details when you're assigned to their bookings.</Text>
          </View>
          <ArrowRight size={16} color="#b45309" />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: "Today's", value: todayAssignments.length, color: '#2563eb', bg: '#dbeafe' },
            { label: 'This Week', value: upcomingThisWeek.length, color: '#059669', bg: '#d1fae5' },
            { label: 'Pending', value: pendingCompletion.length, color: '#d97706', bg: '#fef3c7' },
            { label: 'In Review', value: pendingReview.length, color: '#7c3aed', bg: '#ede9fe' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { borderLeftColor: stat.color }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{loading ? '—' : stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's Assignments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Today's Assignments</Text>
          </View>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : todayAssignments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Calendar size={40} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>No assignments for today</Text>
              <Text style={styles.emptySub}>Check your upcoming assignments for the week</Text>
            </View>
          ) : (
            todayAssignments.map(renderAssignmentCard)
          )}
        </View>

        {/* Quick actions */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('TechnicianAssignmentsTab')}
        >
          <View style={styles.quickActionIcon}>
            <ClipboardList size={20} color={colors.primary[600]} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>View All Assignments</Text>
            <Text style={styles.quickActionSub}>Manage your bookings and reports</Text>
          </View>
          <ArrowRight size={18} color={colors.gray[400]} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerName: { fontSize: 20, fontWeight: 'bold', color: '#fff', flexShrink: 1 },
  techBadge: { backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  techBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, marginLeft: 8 },
  headerSub: { color: '#9ca3af', fontSize: 14 },
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
  content: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statValue: { fontSize: 26, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: colors.gray[500], marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  loadingText: { textAlign: 'center', color: colors.gray[400], padding: 20 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[500], marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.gray[400], marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardContact: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardDetails: { gap: 6, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: colors.gray[600], flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  startBtn: { backgroundColor: '#2563eb' },
  submitBtn: { backgroundColor: '#059669' },
  viewBtn: { backgroundColor: colors.gray[100] },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  viewBtnText: { color: colors.gray[700], fontSize: 12, fontWeight: '600' },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 12,
    elevation: 1,
  },
  quickActionIcon: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    padding: 8,
  },
  quickActionText: { flex: 1 },
  quickActionTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  quickActionSub: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
});

export default TechnicianDashboardScreen;

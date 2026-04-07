import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  Package,
  User,
  Play,
  ClipboardList,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TechnicianTabParamList } from '../../navigation/types';
import { bookingService } from '../../api/bookingService';
import { Booking } from '../../types';

const CACHE_KEY = 'technician_assignments_cache';
import { colors } from '../../theme';

type FilterTab = 'today' | 'upcoming' | 'pending_completion' | 'pending_review' | 'completed' | 'all';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending_completion', label: 'Pending' },
  { key: 'pending_review', label: 'In Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  confirmed:      { bg: '#dbeafe', text: '#1d4ed8', label: 'Confirmed' },
  in_progress:    { bg: '#fef9c3', text: '#b45309', label: 'In Progress' },
  pending_review: { bg: '#ede9fe', text: '#7c3aed', label: 'Pending Review' },
  completed:      { bg: '#dcfce7', text: '#15803d', label: 'Completed' },
  cancelled:      { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
  pending:        { bg: '#f3f4f6', text: '#374151', label: 'Pending' },
};

const EMPTY_MESSAGES: Record<FilterTab, { title: string; subtitle: string }> = {
  today:              { title: 'No assignments for today', subtitle: 'Check your upcoming assignments' },
  upcoming:           { title: 'No upcoming assignments', subtitle: 'No scheduled assignments this week' },
  pending_completion: { title: 'No pending assignments', subtitle: 'All assignments are up to date' },
  pending_review:     { title: 'No reports pending review', subtitle: 'All submitted reports have been reviewed' },
  completed:          { title: 'No completed assignments', subtitle: 'Completed assignments will appear here' },
  all:                { title: 'No assignments found', subtitle: 'You have not been assigned any bookings yet' },
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

interface ReportModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSubmit: (report: ServiceReport) => void;
  submitting: boolean;
}

interface ServiceReport {
  workPerformed: string;
  equipmentUsed: string;
  issuesFound: string;
  recommendations: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, booking, onClose, onSubmit, submitting }) => {
  const [report, setReport] = useState<ServiceReport>({
    workPerformed: '',
    equipmentUsed: '',
    issuesFound: '',
    recommendations: '',
  });

  const handleSubmit = () => {
    if (!report.workPerformed.trim()) {
      Alert.alert('Required', 'Please describe the work performed.');
      return;
    }
    onSubmit(report);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Completion Report</Text>
          {booking && (
            <Text style={modalStyles.subtitle}>{booking.company} — {booking.contactName}</Text>
          )}
          <ScrollView style={modalStyles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={modalStyles.label}>Work Performed *</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              value={report.workPerformed}
              onChangeText={t => setReport(r => ({ ...r, workPerformed: t }))}
              placeholder="Describe the work performed..."
              multiline
              numberOfLines={4}
            />
            <Text style={modalStyles.label}>Equipment Used</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              value={report.equipmentUsed}
              onChangeText={t => setReport(r => ({ ...r, equipmentUsed: t }))}
              placeholder="List equipment used..."
              multiline
              numberOfLines={3}
            />
            <Text style={modalStyles.label}>Issues Found</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              value={report.issuesFound}
              onChangeText={t => setReport(r => ({ ...r, issuesFound: t }))}
              placeholder="Any issues found..."
              multiline
              numberOfLines={3}
            />
            <Text style={modalStyles.label}>Recommendations</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              value={report.recommendations}
              onChangeText={t => setReport(r => ({ ...r, recommendations: t }))}
              placeholder="Recommendations for follow-up..."
              multiline
              numberOfLines={3}
            />
          </ScrollView>
          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              <Send size={14} color="#fff" />
              <Text style={modalStyles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const TechnicianAssignmentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TechnicianTabParamList, 'TechnicianAssignmentsTab'>>();
  const submitBookingId = route.params?.submitBookingId;

  const [assignments, setAssignments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [reportModalBooking, setReportModalBooking] = useState<Booking | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await bookingService.getMyAssignments();
      const data = response.data || [];
      setAssignments(data);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then(cached => {
      if (cached) {
        setAssignments(JSON.parse(cached));
        setLoading(false);
      }
    }).catch(() => {});
    fetchAssignments();
    // Refresh when screen comes back into focus (no extra hook needed)
    const unsubscribe = (navigation as any).addListener('focus', () => {
      fetchAssignments();
    });
    return unsubscribe;
  }, [fetchAssignments, navigation]);

  // Auto-open report modal when navigated from dashboard with a submitBookingId
  useEffect(() => {
    if (submitBookingId && assignments.length > 0) {
      const booking = assignments.find(a => a._id === submitBookingId);
      if (booking && booking.status === 'in_progress') {
        setReportModalBooking(booking);
        setActiveTab('pending_completion');
      }
    }
  }, [submitBookingId, assignments]);

  const handleRefresh = () => { setRefreshing(true); fetchAssignments(); };

  const handleStartBooking = async (id: string) => {
    try {
      setActionLoading(id);
      await bookingService.startBooking(id);
      Alert.alert('Success', 'Meeting started successfully');
      fetchAssignments();
    } catch (error: any) {
      const msg: string = error.response?.data?.message || '';
      if (msg.toLowerCase().includes('in_progress') || msg.toLowerCase().includes('already')) {
        // Booking already started — just refresh so UI reflects server state
        fetchAssignments();
      } else {
        Alert.alert('Error', msg || 'Failed to start meeting');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReport = async (report: ServiceReport) => {
    if (!reportModalBooking) return;
    try {
      setSubmittingReport(true);
      // Submit completion proof via API
      const api = (await import('../../api/api')).default;
      await api.post('/completion-proofs', {
        bookingId: reportModalBooking._id,
        serviceReport: report,
      }, { adapter: 'xhr' });
      Alert.alert('Success', 'Completion report submitted successfully');
      setReportModalBooking(null);
      fetchAssignments();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
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
  const isUpcoming = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d > today;
  };

  const filteredAssignments = assignments.filter(a => {
    switch (activeTab) {
      case 'today':              return isToday(a.date);
      case 'upcoming':           return isUpcoming(a.date) && ['confirmed', 'in_progress'].includes(a.status);
      case 'pending_completion': return a.status === 'confirmed' || a.status === 'in_progress';
      case 'pending_review':     return a.status === 'pending_review';
      case 'completed':          return a.status === 'completed';
      default:                   return true;
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingCount = assignments.filter(a => a.status === 'confirmed' || a.status === 'in_progress').length;
  const reviewCount = assignments.filter(a => a.status === 'pending_review').length;

  const renderStatusBadge = (status: string) => {
    const s = STATUS_COLORS[status] || { bg: colors.gray[100], text: colors.gray[600], label: status };
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Assignments</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={loading || refreshing}
            style={styles.refreshBtn}
          >
            <RefreshCw size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Manage your bookings and service reports</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
            {tab.key === 'pending_completion' && pendingCount > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pendingCount}</Text></View>
            )}
            {tab.key === 'pending_review' && reviewCount > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: '#7c3aed' }]}><Text style={styles.tabBadgeText}>{reviewCount}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Assignments List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading assignments...</Text>
        ) : filteredAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>{EMPTY_MESSAGES[activeTab].title}</Text>
            <Text style={styles.emptySub}>{EMPTY_MESSAGES[activeTab].subtitle}</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {filteredAssignments.map(booking => {
              const isExpanded = expandedBooking === booking._id;
              return (
                <View key={booking._id} style={styles.card}>
                  {/* Card Top */}
                  <View style={styles.cardTop}>
                    <View style={styles.cardTopLeft}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardName}>{booking.contactName}</Text>
                        {renderStatusBadge(booking.status)}
                      </View>
                      <Text style={styles.cardDate}>
                        {formatDate(booking.date)} at {formatTime(booking.time)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setExpandedBooking(isExpanded ? null : booking._id)}
                      style={styles.expandBtn}
                    >
                      {isExpanded
                        ? <ChevronUp size={18} color={colors.gray[400]} />
                        : <ChevronDown size={18} color={colors.gray[400]} />
                      }
                    </TouchableOpacity>
                  </View>

                  {/* Quick Details */}
                  <View style={styles.quickDetails}>
                    {!!booking.company && <View style={styles.detailItem}><Building size={12} color={colors.gray[400]} /><Text style={styles.detailText} numberOfLines={1}>{booking.company}</Text></View>}
                    {!!booking.location && <View style={styles.detailItem}><MapPin size={12} color={colors.gray[400]} /><Text style={styles.detailText} numberOfLines={1}>{booking.location}</Text></View>}
                    {!!booking.product && <View style={styles.detailItem}><Package size={12} color={colors.gray[400]} /><Text style={styles.detailText} numberOfLines={1}>{booking.product}</Text></View>}
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedDetails}>
                      <View style={styles.expandedItem}>
                        <FileText size={12} color={colors.gray[400]} />
                        <Text style={styles.expandedLabel}>Purpose: </Text>
                        <Text style={styles.expandedValue}>{booking.purpose}</Text>
                      </View>
                      {booking.additionalInfo ? (
                        <View style={styles.expandedItem}>
                          <Info size={12} color={colors.gray[400]} />
                          <Text style={styles.expandedLabel}>Notes: </Text>
                          <Text style={styles.expandedValue}>{booking.additionalInfo}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actions}>
                    {booking.status === 'confirmed' && (
                      <TouchableOpacity
                        style={[styles.btn, styles.startBtn]}
                        onPress={() => handleStartBooking(booking._id)}
                        disabled={actionLoading === booking._id}
                      >
                        <Play size={13} color="#fff" />
                        <Text style={styles.btnText}>{actionLoading === booking._id ? 'Starting...' : 'Start Meeting'}</Text>
                      </TouchableOpacity>
                    )}
                    {booking.status === 'in_progress' && (
                      <TouchableOpacity
                        style={[styles.btn, styles.submitBtn]}
                        onPress={() => setReportModalBooking(booking)}
                      >
                        <ClipboardList size={13} color="#fff" />
                        <Text style={styles.btnText}>Submit Report</Text>
                      </TouchableOpacity>
                    )}
                    {booking.status === 'pending_review' && (
                      <View style={[styles.btn, styles.reviewingBtn]}>
                        <Clock size={13} color="#7c3aed" />
                        <Text style={[styles.btnText, { color: '#7c3aed' }]}>Awaiting Review</Text>
                      </View>
                    )}
                    {booking.status === 'completed' && (
                      <View style={[styles.btn, styles.completedBtn]}>
                        <CheckCircle size={13} color="#15803d" />
                        <Text style={[styles.btnText, { color: '#15803d' }]}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Completion Report Modal */}
      <ReportModal
        visible={!!reportModalBooking}
        booking={reportModalBooking}
        onClose={() => setReportModalBooking(null)}
        onSubmit={handleSubmitReport}
        submitting={submittingReport}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  refreshBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  headerSub: { color: '#9ca3af', fontSize: 13 },
  tabsContainer: { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 4,
  },
  activeTab: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  tabText: { fontSize: 12, fontWeight: '500', color: colors.gray[600] },
  activeTabText: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  list: { flex: 1 },
  listContent: { padding: 14, gap: 10 },
  loadingText: { textAlign: 'center', color: colors.gray[400], padding: 40 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[500], marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.gray[400], marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardTopLeft: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  cardDate: { fontSize: 12, color: colors.gray[500] },
  expandBtn: { padding: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  quickDetails: { flexDirection: 'column', gap: 4, marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: colors.gray[600], flex: 1, flexShrink: 1 },
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 10,
    marginBottom: 10,
    gap: 6,
  },
  expandedItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  expandedLabel: { fontSize: 12, fontWeight: '600', color: colors.gray[700] },
  expandedValue: { fontSize: 12, color: colors.gray[600], flex: 1 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  startBtn: { backgroundColor: '#2563eb' },
  submitBtn: { backgroundColor: '#059669' },
  reviewingBtn: { backgroundColor: '#ede9fe', borderWidth: 1, borderColor: '#c4b5fd' },
  completedBtn: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  btnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.gray[500], marginBottom: 16 },
  scroll: { maxHeight: 400 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.gray[900],
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default TechnicianAssignmentsScreen;

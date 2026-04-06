import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  X,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Package,
  FileText,
  ChevronRight,
  CheckCircle,
} from 'lucide-react-native';
import { bookingService } from '../../api';
import { Booking, BookingStatus } from '../../types';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { LoadingSpinner, FilterTabs, EmptyState } from '../../components/common';
import { BookingStatusBadge } from '../../components/booking';

type FilterKey = 'all' | BookingStatus;

const STATUSES: { key: BookingStatus; label: string; color: string; bg: string }[] = [
  { key: 'pending',       label: 'Pending',        color: '#92400e', bg: '#fef3c7' },
  { key: 'confirmed',     label: 'Confirmed',      color: '#065f46', bg: '#d1fae5' },
  { key: 'in_progress',   label: 'In Progress',    color: '#1e40af', bg: '#dbeafe' },
  { key: 'pending_review',label: 'Pending Review', color: '#92400e', bg: '#fef9c3' },
  { key: 'completed',     label: 'Completed',      color: '#065f46', bg: '#bbf7d0' },
  { key: 'rescheduled',   label: 'Rescheduled',    color: '#5b21b6', bg: '#ede9fe' },
  { key: 'cancelled',     label: 'Cancelled',      color: '#991b1b', bg: '#fee2e2' },
  { key: 'rejected',      label: 'Rejected',       color: '#7f1d1d', bg: '#fecaca' },
];

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'pending',       label: 'Pending' },
  { key: 'confirmed',     label: 'Confirmed' },
  { key: 'in_progress',   label: 'In Progress' },
  { key: 'pending_review',label: 'Pending Review' },
  { key: 'completed',     label: 'Completed' },
  { key: 'rescheduled',   label: 'Rescheduled' },
  { key: 'cancelled',     label: 'Cancelled' },
  { key: 'rejected',      label: 'Rejected' },
];

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const AdminBookingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>('pending');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = () => {
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingService.getAll();
      setBookings(response.data || []);
    } catch (error: any) {
      const isNetworkIssue = !error.response && (
        error.name === 'AbortError' ||
        error.code === 'ERR_CANCELED' ||
        error.code === 'ERR_NETWORK' ||
        error.message === 'Aborted' ||
        error.message === 'Network Error'
      );
      if (!isNetworkIssue) {
        console.error('Error fetching bookings:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const openDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedStatus(booking.status);
    setRescheduleDate('');
    setRescheduleTime('');
    setCancelReason('');
  };

  const closeDetail = () => {
    setSelectedBooking(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking) return;

    if (selectedStatus === 'rescheduled' && (!rescheduleDate.trim() || !rescheduleTime.trim())) {
      Alert.alert('Required', 'Please enter a new date and time for rescheduling.');
      return;
    }

    setUpdating(true);
    try {
      if (selectedStatus === 'rescheduled') {
        await bookingService.reschedule(
          selectedBooking._id,
          rescheduleDate.trim(),
          rescheduleTime.trim(),
          'Rescheduled by admin'
        );
      } else if (selectedStatus === 'cancelled') {
        await bookingService.cancel(
          selectedBooking._id,
          cancelReason.trim() || 'Cancelled by admin'
        );
      } else if (selectedStatus === 'completed') {
        await bookingService.complete(
          selectedBooking._id,
          cancelReason.trim() || 'Completed by admin'
        );
      } else {
        // confirmed / in_progress / pending_review / rejected / pending — generic PUT
        await bookingService.update(selectedBooking._id, { status: selectedStatus }, { adapter: 'xhr' });
      }
      await fetchBookings();
      closeDetail();
      showToast();
    } catch (error: any) {
      const data = error.response?.data ?? error.cause?.response?.data;
      const msg = data?.message || data?.error || error.message || 'Failed to update booking status';
      Alert.alert('Error', msg);
    } finally {
      setUpdating(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = selectedFilter === 'all' || b.status === selectedFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      b.contactName?.toLowerCase().includes(q) ||
      b.company?.toLowerCase().includes(q) ||
      b.contactEmail?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const getFilterCounts = () =>
    filterOptions.map((opt) => ({
      ...opt,
      count: opt.key === 'all'
        ? bookings.length
        : bookings.filter((b) => b.status === opt.key).length,
    }));

  if (loading) return <LoadingSpinner fullScreen text="Loading bookings..." />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
          <Search size={18} color={colors.gray[400]} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by name, company, or email..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <FilterTabs
          options={getFilterCounts()}
          selectedKey={selectedFilter}
          onSelect={(key) => setSelectedFilter(key as FilterKey)}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title="No Bookings Found"
            description={searchQuery ? 'No bookings match your search.' : 'There are no bookings to display.'}
          />
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface }]} onPress={() => openDetail(item)} activeOpacity={0.7}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={[styles.cardName, { color: theme.text }]}>{item.contactName}</Text>
                <Text style={[styles.cardCompany, { color: theme.textSecondary }]}>{item.company}</Text>
              </View>
              <BookingStatusBadge status={item.status} size="sm" />
            </View>
            <View style={styles.cardMeta}>
              <View style={styles.cardMetaRow}>
                <Calendar size={13} color={colors.gray[400]} />
                <Text style={[styles.cardMetaText, { color: theme.textSecondary }]}>{formatDate(item.date)} at {item.time}</Text>
              </View>
              <View style={styles.cardMetaRow}>
                <FileText size={13} color={colors.gray[400]} />
                <Text style={[styles.cardMetaText, { color: theme.textSecondary }]}>{item.purpose}</Text>
              </View>
            </View>
            <ChevronRight size={16} color={colors.gray[300]} style={styles.cardChevron} />
          </TouchableOpacity>
        )}
      />

      {/* Success Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <CheckCircle size={18} color={colors.white} />
        <Text style={styles.toastText}>Booking updated successfully!</Text>
      </Animated.View>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedBooking}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        {selectedBooking && (
          <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Booking Details</Text>
              <TouchableOpacity onPress={closeDetail} style={styles.modalClose}>
                <X size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status Badge */}
              <View style={styles.modalStatusRow}>
                <BookingStatusBadge status={selectedBooking.status} size="md" />
              </View>

              {/* Client Info */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Client Information</Text>
                <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                  <InfoRow icon={<User size={16} color={colors.primary[600]} />} label="Name" value={selectedBooking.contactName} />
                  <InfoRow icon={<Mail size={16} color={colors.primary[600]} />} label="Email" value={selectedBooking.contactEmail} />
                  <InfoRow icon={<Phone size={16} color={colors.primary[600]} />} label="Phone" value={selectedBooking.contactPhone} />
                  <InfoRow icon={<Building2 size={16} color={colors.primary[600]} />} label="Company" value={selectedBooking.company} last />
                </View>
              </View>

              {/* Schedule Info */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Schedule</Text>
                <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                  <InfoRow icon={<Calendar size={16} color={colors.primary[600]} />} label="Date" value={formatDate(selectedBooking.date)} />
                  <InfoRow icon={<Clock size={16} color={colors.primary[600]} />} label="Time" value={selectedBooking.time} />
                  <InfoRow icon={<FileText size={16} color={colors.primary[600]} />} label="Purpose" value={selectedBooking.purpose} />
                  <InfoRow icon={<MapPin size={16} color={colors.primary[600]} />} label="Location" value={selectedBooking.location || '—'} />
                  <InfoRow icon={<Package size={16} color={colors.primary[600]} />} label="Product" value={selectedBooking.product || '—'} last />
                </View>
              </View>

              {/* Additional Info */}
              {selectedBooking.additionalInfo ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Additional Information</Text>
                  <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.additionalText, { color: theme.text }]}>{selectedBooking.additionalInfo}</Text>
                  </View>
                </View>
              ) : null}

              {selectedBooking.rescheduleReason ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Reschedule Note</Text>
                  <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.additionalText, { color: theme.text }]}>{selectedBooking.rescheduleReason}</Text>
                  </View>
                </View>
              ) : null}

              {/* Status Selector */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Update Status</Text>
                <View style={styles.statusGrid}>
                  {STATUSES.map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.statusOption,
                        { borderColor: selectedStatus === s.key ? s.color : colors.gray[200] },
                        selectedStatus === s.key && { backgroundColor: s.bg },
                      ]}
                      onPress={() => setSelectedStatus(s.key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                      <Text style={[
                        styles.statusOptionText,
                        { color: selectedStatus === s.key ? s.color : colors.gray[600] },
                      ]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reschedule fields */}
                {selectedStatus === 'rescheduled' && (
                  <View style={styles.extraFields}>
                    <Text style={styles.extraFieldLabel}>New Date <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.extraInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.gray[400]}
                      value={rescheduleDate}
                      onChangeText={setRescheduleDate}
                    />
                    <Text style={styles.extraFieldLabel}>New Time <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.extraInput}
                      placeholder="e.g. 10:00"
                      placeholderTextColor={colors.gray[400]}
                      value={rescheduleTime}
                      onChangeText={setRescheduleTime}
                    />
                  </View>
                )}

                {/* Extra notes for specific statuses */}
                {(selectedStatus === 'cancelled' || selectedStatus === 'rejected' || selectedStatus === 'completed') && (
                  <View style={styles.extraFields}>
                    <Text style={styles.extraFieldLabel}>
                      {selectedStatus === 'completed' ? 'Conclusion / Notes (optional)' : 'Reason (optional)'}
                    </Text>
                    <TextInput
                      style={[styles.extraInput, { minHeight: 72, textAlignVertical: 'top' }]}
                      placeholder={
                        selectedStatus === 'completed'
                          ? 'Enter completion notes...'
                          : selectedStatus === 'rejected'
                          ? 'Enter reason for rejection...'
                          : 'Enter reason for cancellation...'
                      }
                      placeholderTextColor={colors.gray[400]}
                      value={cancelReason}
                      onChangeText={setCancelReason}
                      multiline
                    />
                  </View>
                )}
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Update Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.updateButton,
                  updating && styles.updateButtonDisabled,
                ]}
                onPress={handleUpdateStatus}
                disabled={updating}
                activeOpacity={0.8}
              >
                {updating
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.updateButtonText}>Update Status</Text>
                }
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}> = ({ icon, label, value, last }) => {
  const { theme } = useTheme();
  return (
    <View style={[infoRowStyles.row, !last && [infoRowStyles.border, { borderBottomColor: theme.border }]]}>
      <View style={infoRowStyles.iconWrap}>{icon}</View>
      <View style={infoRowStyles.content}>
        <Text style={infoRowStyles.label}>{label}</Text>
        <Text style={[infoRowStyles.value, { color: theme.text }]}>{value || '—'}</Text>
      </View>
    </View>
  );
};

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
    marginTop: 1,
  },
  content: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: colors.gray[900],
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  searchContainer: { padding: 12, backgroundColor: colors.white },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.gray[900] },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  listContent: { padding: 16, flexGrow: 1 },

  // List card
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardLeft: { flex: 1, marginRight: 8 },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  cardCompany: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  cardMeta: { gap: 4 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 13, color: colors.gray[600] },
  cardChevron: { position: 'absolute', right: 0, top: 14 },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  toastText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
  modal: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  modalClose: { padding: 4 },
  modalStatusRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: 'hidden',
  },
  additionalText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
    padding: 14,
  },

  // Status selector
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    minWidth: '45%',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Extra fields (reschedule / cancel)
  extraFields: { marginTop: 14, gap: 6 },
  extraFieldLabel: { fontSize: 13, fontWeight: '500', color: colors.gray[700] },
  required: { color: colors.error },
  extraInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },

  // Footer
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  updateButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonDisabled: { opacity: 0.6 },
  updateButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
});

export default AdminBookingsScreen;

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Building2,
  Mail,
  Phone,
  Package,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wrench,
  CalendarClock,
} from 'lucide-react-native';
import { AssignedTechnician } from '../../types';
import { bookingService } from '../../api';
import { Booking } from '../../types';
import { colors } from '../../theme';
import { useTheme } from '../../contexts';
import { Card, Button, LoadingSpinner } from '../../components/common';
import { BookingStatusBadge } from '../../components/booking';
import { BookingsStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<BookingsStackParamList, 'BookingDetail'>;

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

export const BookingDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { bookingId } = route.params;
  const { theme } = useTheme();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const fetchBooking = useCallback(async () => {
    try {
      const response = await bookingService.getById(bookingId);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooking();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const handleCancelConfirm = async () => {
    setActionLoading(true);
    try {
      await bookingService.cancel(bookingId, cancelReason.trim() || 'Cancelled by user');
      setShowCancelModal(false);
      setCancelReason('');
      Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
      fetchBooking();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate.trim()) {
      Alert.alert('Required', 'Please enter a new date.');
      return;
    }
    if (!rescheduleTime) {
      Alert.alert('Required', 'Please select a new time.');
      return;
    }
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(rescheduleDate.trim())) {
      Alert.alert('Invalid Date', 'Please enter date in YYYY-MM-DD format (e.g. 2026-05-15).');
      return;
    }
    setActionLoading(true);
    try {
      await bookingService.reschedule(bookingId, rescheduleDate.trim(), rescheduleTime, rescheduleReason.trim() || 'Rescheduled by user');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
      Alert.alert('Reschedule Requested', 'Your reschedule request has been submitted.');
      fetchBooking();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reschedule booking');
    } finally {
      setActionLoading(false);
    }
  };

  const canCancel =
    booking?.status === 'pending' ||
    booking?.status === 'confirmed' ||
    booking?.status === 'rescheduled';

  const canReschedule =
    booking?.status === 'pending' ||
    booking?.status === 'confirmed';

  const getStatusTimeline = () => {
    const statuses = [
      { key: 'pending', label: 'Submitted', icon: FileText },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'in_progress', label: 'In Progress', icon: RefreshCw },
      { key: 'completed', label: 'Completed', icon: CheckCircle },
    ];

    const status = booking?.status;
    const effectiveStatus =
      status === 'rescheduled' || status === 'pending_review' ? 'confirmed' : status;
    const currentIndex = statuses.findIndex((s) => s.key === effectiveStatus);
    const isCancelled = status === 'cancelled';

    return { statuses, currentIndex, isCancelled };
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Booking not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const { statuses, currentIndex, isCancelled } = getStatusTimeline();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Booking Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <Card style={styles.statusCard} padding="lg">
          <View style={styles.statusHeader}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>Status</Text>
            <BookingStatusBadge status={booking.status} size="lg" />
          </View>

          {/* Status Timeline */}
          {!isCancelled && (
            <View style={styles.timeline}>
              {statuses.map((status, index) => {
                const isCompleted = index <= currentIndex;
                const isActive = index === currentIndex;
                const StatusIcon = status.icon;

                return (
                  <View key={status.key} style={styles.timelineItem}>
                    <View style={styles.timelineIconContainer}>
                      <View
                        style={[
                          styles.timelineIcon,
                          isCompleted && styles.timelineIconCompleted,
                          isActive && styles.timelineIconActive,
                        ]}
                      >
                        <StatusIcon
                          size={16}
                          color={isCompleted ? colors.white : colors.gray[400]}
                        />
                      </View>
                      {index < statuses.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            isCompleted && styles.timelineLineCompleted,
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.timelineLabel,
                        { color: theme.textSecondary },
                        isCompleted && styles.timelineLabelCompleted,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {isCancelled && (
            <View style={styles.cancelledNote}>
              <XCircle size={20} color={colors.error} />
              <Text style={styles.cancelledText}>
                This booking was cancelled
              </Text>
            </View>
          )}

          {booking.status === 'pending_review' && (
            <View style={styles.reviewNote}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.reviewNoteText}>
                This booking is under review by our team
              </Text>
            </View>
          )}
        </Card>

        {/* Booking Info */}
        <Card style={styles.infoCard} padding="lg">
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Booking Information</Text>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <Calendar size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Date</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{formatDate(booking.date)}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <Clock size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Time</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{formatTime(booking.time)}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <MapPin size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Location</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{booking.location}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <FileText size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Purpose</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{booking.purpose}</Text>
            </View>
          </View>

          {booking.product && (
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <View style={styles.infoIcon}>
                <Package size={18} color={colors.primary[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Product Interest</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{booking.product}</Text>
              </View>
            </View>
          )}

          {booking.additionalInfo && (
            <View style={[styles.notesSection, { backgroundColor: theme.background }]}>
              <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>Additional Notes</Text>
              <Text style={[styles.notesText, { color: theme.text }]}>{booking.additionalInfo}</Text>
            </View>
          )}

          {booking.status === 'rescheduled' && booking.originalDate && (
            <View style={styles.rescheduleSection}>
              <View style={styles.rescheduleSectionHeader}>
                <RefreshCw size={16} color={colors.warning} />
                <Text style={styles.rescheduleTitle}>Rescheduled</Text>
              </View>
              <Text style={styles.rescheduleLabel}>Original Date</Text>
              <Text style={styles.rescheduleValue}>{formatDate(booking.originalDate)}{booking.originalTime ? ` at ${formatTime(booking.originalTime)}` : ''}</Text>
              {booking.rescheduleReason && (
                <>
                  <Text style={[styles.rescheduleLabel, { marginTop: 8 }]}>Reason</Text>
                  <Text style={styles.rescheduleValue}>{booking.rescheduleReason}</Text>
                </>
              )}
            </View>
          )}

          {booking.status === 'completed' && booking.conclusion && (
            <View style={styles.conclusionSection}>
              <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>Meeting Conclusion</Text>
              <Text style={[styles.notesText, { color: theme.text }]}>{booking.conclusion}</Text>
            </View>
          )}
        </Card>

        {/* Contact Info */}
        <Card style={styles.infoCard} padding="lg">
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <User size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{booking.contactName}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <Building2 size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Company</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{booking.company}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <Mail size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{booking.contactEmail}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <View style={styles.infoIcon}>
              <Phone size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{booking.contactPhone}</Text>
            </View>
          </View>
        </Card>

        {/* Assigned Technician */}
        {booking.assignedTechnician && typeof booking.assignedTechnician === 'object' && (
          <Card style={styles.infoCard} padding="lg">
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Assigned Technician</Text>
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <View style={styles.infoIcon}><Wrench size={18} color={colors.primary[600]} /></View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {(booking.assignedTechnician as AssignedTechnician).name}
                  {(booking.assignedTechnician as AssignedTechnician).technicianNumber
                    ? ` (#${(booking.assignedTechnician as AssignedTechnician).technicianNumber})`
                    : ''}
                </Text>
              </View>
            </View>
            {(booking.assignedTechnician as AssignedTechnician).specialization && (
              <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                <View style={styles.infoIcon}><FileText size={18} color={colors.primary[600]} /></View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Specialization</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {(booking.assignedTechnician as AssignedTechnician).specialization}
                  </Text>
                </View>
              </View>
            )}
            {(booking.assignedTechnician as AssignedTechnician).phone && (
              <View style={[styles.infoRow, styles.lastInfoRow]}>
                <View style={styles.infoIcon}><Phone size={18} color={colors.primary[600]} /></View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {(booking.assignedTechnician as AssignedTechnician).phone}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Actions */}
        {(canCancel || canReschedule) && (
          <View style={styles.actionsSection}>
            {canReschedule && (
              <TouchableOpacity
                style={[styles.rescheduleActionBtn, { borderColor: colors.warning }]}
                onPress={() => setShowRescheduleModal(true)}
                disabled={actionLoading}
              >
                <CalendarClock size={18} color={colors.warning} />
                <Text style={[styles.rescheduleActionText, { color: colors.warning }]}>Reschedule</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <Button
                title="Cancel Booking"
                onPress={() => setShowCancelModal(true)}
                variant="danger"
                fullWidth
                loading={actionLoading}
              />
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Cancel Booking</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Are you sure? Please provide a reason (optional).
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancelling..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => { setShowCancelModal(false); setCancelReason(''); }}
                disabled={actionLoading}
              >
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleCancelConfirm}
                disabled={actionLoading}
              >
                <Text style={styles.modalConfirmText}>{actionLoading ? 'Cancelling...' : 'Yes, Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={showRescheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Reschedule Booking</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter a new date and time for your booking.
            </Text>
            <Text style={[styles.modalLabel, { color: theme.text }]}>New Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              placeholder="e.g. 2026-05-15"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={[styles.modalLabel, { color: theme.text }]}>New Time *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotsScroll}>
              {TIME_SLOTS.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlotBtn,
                    { borderColor: theme.border, backgroundColor: theme.background },
                    rescheduleTime === slot && styles.timeSlotBtnSelected,
                  ]}
                  onPress={() => setRescheduleTime(slot)}
                >
                  <Text style={[styles.timeSlotBtnText, rescheduleTime === slot && styles.timeSlotBtnTextSelected]}>
                    {formatTime(slot)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.modalLabel, { color: theme.text }]}>Reason (optional)</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              placeholder="Reason for rescheduling..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={2}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => { setShowRescheduleModal(false); setRescheduleDate(''); setRescheduleTime(''); setRescheduleReason(''); }}
                disabled={actionLoading}
              >
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalRescheduleBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleRescheduleConfirm}
                disabled={actionLoading}
              >
                <Text style={styles.modalConfirmText}>{actionLoading ? 'Submitting...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerRight: {
    width: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 16,
  },
  statusCard: {
    margin: 16,
    marginBottom: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: colors.success,
  },
  timelineIconActive: {
    backgroundColor: colors.primary[600],
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    top: 32,
    width: 100,
    height: 2,
    backgroundColor: colors.gray[200],
    marginLeft: 16,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineLabel: {
    fontSize: 12,
    color: colors.gray[400],
    textAlign: 'center',
  },
  timelineLabelCompleted: {
    color: colors.gray[700],
    fontWeight: '500',
  },
  cancelledNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelledText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  reviewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  reviewNoteText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500',
    flex: 1,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  lastInfoRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: colors.gray[900],
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  rescheduleSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  rescheduleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rescheduleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
  },
  rescheduleLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 2,
  },
  rescheduleValue: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  conclusionSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  actionsSection: {
    padding: 16,
    gap: 10,
  },
  rescheduleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  rescheduleActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 24,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 48,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  timeSlotsScroll: {
    marginBottom: 8,
  },
  timeSlotBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginVertical: 4,
  },
  timeSlotBtnSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  timeSlotBtnText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  timeSlotBtnTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalRescheduleBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});

export default BookingDetailScreen;

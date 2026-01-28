import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
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
} from 'lucide-react-native';
import { bookingService } from '../../api';
import { Booking } from '../../types';
import { colors } from '../../theme';
import { Card, Button, LoadingSpinner } from '../../components/common';
import { BookingStatusBadge } from '../../components/booking';
import { BookingsStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<BookingsStackParamList, 'BookingDetail'>;

export const BookingDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await bookingService.cancel(bookingId, 'Cancelled by user');
              Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
              fetchBooking();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const canCancel = booking?.status === 'pending' || booking?.status === 'confirmed';

  const getStatusTimeline = () => {
    const statuses = [
      { key: 'pending', label: 'Submitted', icon: FileText },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'completed', label: 'Completed', icon: CheckCircle },
    ];

    const currentIndex = statuses.findIndex((s) => s.key === booking?.status);
    const isCancelled = booking?.status === 'cancelled';

    return { statuses, currentIndex, isCancelled };
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const { statuses, currentIndex, isCancelled } = getStatusTimeline();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
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
            <Text style={styles.statusLabel}>Status</Text>
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
        </Card>

        {/* Booking Info */}
        <Card style={styles.infoCard} padding="lg">
          <Text style={styles.sectionTitle}>Booking Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(booking.date)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Clock size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(booking.time)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MapPin size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{booking.location}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FileText size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Purpose</Text>
              <Text style={styles.infoValue}>{booking.purpose}</Text>
            </View>
          </View>

          {booking.product && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Package size={18} color={colors.primary[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Product Interest</Text>
                <Text style={styles.infoValue}>{booking.product}</Text>
              </View>
            </View>
          )}

          {booking.additionalInfo && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Additional Notes</Text>
              <Text style={styles.notesText}>{booking.additionalInfo}</Text>
            </View>
          )}
        </Card>

        {/* Contact Info */}
        <Card style={styles.infoCard} padding="lg">
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <User size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{booking.contactName}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Building2 size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Company</Text>
              <Text style={styles.infoValue}>{booking.company}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Mail size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{booking.contactEmail}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <View style={styles.infoIcon}>
              <Phone size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{booking.contactPhone}</Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        {canCancel && (
          <View style={styles.actionsSection}>
            <Button
              title="Cancel Booking"
              onPress={handleCancelBooking}
              variant="danger"
              fullWidth
              loading={actionLoading}
            />
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
  actionsSection: {
    padding: 16,
  },
  bottomPadding: {
    height: 24,
  },
});

export default BookingDetailScreen;

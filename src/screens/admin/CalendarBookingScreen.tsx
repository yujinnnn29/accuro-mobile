import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Calendar as CalendarIcon,
  List,
  Clock,
  MapPin,
  User,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { bookingService } from '../../api';
import { Booking, BookingStatus } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner, Card, Badge, Button } from '../../components/common';
import { BookingCalendar } from '../../components/admin';

type ViewMode = 'calendar' | 'list';

export const CalendarBookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingService.getAll();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date);
  };

  const handleConfirmBooking = async (booking: Booking) => {
    Alert.alert(
      'Confirm Booking',
      `Are you sure you want to confirm booking for ${booking.company}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(booking._id);
            try {
              await bookingService.update(booking._id, { status: 'confirmed' });
              fetchBookings();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to confirm booking');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleCancelBooking = async (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel booking for ${booking.company}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(booking._id);
            try {
              await bookingService.cancel(booking._id, 'Cancelled by admin');
              fetchBookings();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleCompleteBooking = async (booking: Booking) => {
    Alert.alert(
      'Complete Booking',
      `Mark booking for ${booking.company} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setActionLoading(booking._id);
            try {
              await bookingService.complete(booking._id, 'Completed successfully');
              fetchBookings();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to complete booking');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getSelectedDateBookings = (): Booking[] => {
    if (!selectedDate) return [];
    return bookings.filter((b) => b.date.split('T')[0] === selectedDate);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <Badge label="Confirmed" variant="success" size="sm" />;
      case 'pending':
        return <Badge label="Pending" variant="warning" size="sm" />;
      case 'completed':
        return <Badge label="Completed" variant="info" size="sm" />;
      case 'cancelled':
        return <Badge label="Cancelled" variant="error" size="sm" />;
      case 'rescheduled':
        return <Badge label="Rescheduled" variant="primary" size="sm" />;
      default:
        return null;
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isLoading = actionLoading === item._id;

    return (
      <Card style={styles.bookingCard} padding="md">
        <View style={styles.bookingHeader}>
          <View style={styles.bookingHeaderLeft}>
            <Text style={styles.companyName}>{item.company}</Text>
            {getStatusBadge(item.status)}
          </View>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('AdminBookingDetail', { bookingId: item._id })}
          >
            <ChevronRight size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Clock size={14} color={colors.gray[500]} />
            <Text style={styles.detailText}>{formatTime(item.time)}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={14} color={colors.gray[500]} />
            <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <User size={14} color={colors.gray[500]} />
            <Text style={styles.detailText}>{item.contactName}</Text>
          </View>
        </View>

        {item.product && (
          <View style={styles.productTag}>
            <Text style={styles.productText}>{item.product}</Text>
          </View>
        )}

        {/* Quick Actions */}
        {(item.status === 'pending' || item.status === 'confirmed') && (
          <View style={styles.quickActions}>
            {item.status === 'pending' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => handleConfirmBooking(item)}
                disabled={isLoading}
              >
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.actionButtonText, { color: colors.success }]}>Confirm</Text>
              </TouchableOpacity>
            )}
            {item.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleCompleteBooking(item)}
                disabled={isLoading}
              >
                <CheckCircle size={16} color={colors.info} />
                <Text style={[styles.actionButtonText, { color: colors.info }]}>Complete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(item)}
              disabled={isLoading}
            >
              <XCircle size={16} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading bookings..." />;
  }

  const selectedDateBookings = getSelectedDateBookings();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
          onPress={() => setViewMode('calendar')}
        >
          <CalendarIcon
            size={18}
            color={viewMode === 'calendar' ? colors.white : colors.gray[600]}
          />
          <Text
            style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}
          >
            Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <List
            size={18}
            color={viewMode === 'list' ? colors.white : colors.gray[600]}
          />
          <Text
            style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}
          >
            List
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'calendar' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Calendar */}
          <View style={styles.calendarContainer}>
            <BookingCalendar
              bookings={bookings}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </View>

          {/* Selected Date Bookings */}
          {selectedDate && (
            <View style={styles.selectedDateSection}>
              <Text style={styles.selectedDateTitle}>
                {formatDate(selectedDate)}
              </Text>
              <Text style={styles.selectedDateSubtitle}>
                {selectedDateBookings.length} booking{selectedDateBookings.length !== 1 ? 's' : ''}
              </Text>

              {selectedDateBookings.length > 0 ? (
                selectedDateBookings.map((booking) => (
                  <View key={booking._id}>
                    {renderBookingCard({ item: booking })}
                  </View>
                ))
              ) : (
                <View style={styles.noBookings}>
                  <Text style={styles.noBookingsText}>No bookings on this date</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.noBookings}>
              <Text style={styles.noBookingsText}>No bookings found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.white,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary[600],
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  toggleTextActive: {
    color: colors.white,
  },
  calendarContainer: {
    padding: 16,
  },
  selectedDateSection: {
    padding: 16,
    paddingTop: 0,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  selectedDateSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
    marginBottom: 12,
  },
  bookingCard: {
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  bookingDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.gray[600],
    flex: 1,
  },
  productTag: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  productText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: colors.success + '15',
  },
  completeButton: {
    backgroundColor: colors.info + '15',
  },
  cancelButton: {
    backgroundColor: colors.error + '15',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  noBookings: {
    padding: 32,
    alignItems: 'center',
  },
  noBookingsText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  bottomPadding: {
    height: 24,
  },
});

export default CalendarBookingScreen;

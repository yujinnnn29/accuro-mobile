import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { bookingService } from '../../api';
import { Booking, BookingStatus } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner, FilterTabs, EmptyState, Card, Button } from '../../components/common';
import { BookingCard, BookingStatusBadge } from '../../components/booking';

type FilterKey = 'all' | BookingStatus;

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const AdminBookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const params = selectedFilter !== 'all' ? { status: selectedFilter } : undefined;
      const response = await bookingService.getAll(params);
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleConfirmBooking = async (bookingId: string) => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await bookingService.update(bookingId, { status: 'confirmed' });
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

  const handleCompleteBooking = async (bookingId: string) => {
    Alert.prompt(
      'Complete Booking',
      'Enter a conclusion note for this booking:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async (conclusion: string | undefined) => {
            setActionLoading(bookingId);
            try {
              await bookingService.complete(bookingId, conclusion || 'Booking completed');
              fetchBookings();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to complete booking');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await bookingService.cancel(bookingId, 'Cancelled by admin');
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

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getFilterCounts = () => {
    return filterOptions.map((option) => ({
      ...option,
      count: option.key === 'all'
        ? bookings.length
        : bookings.filter((b) => b.status === option.key).length,
    }));
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard} padding="md">
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingName}>{item.contactName}</Text>
          <Text style={styles.bookingCompany}>{item.company}</Text>
        </View>
        <BookingStatusBadge status={item.status} size="sm" />
      </View>

      <View style={styles.bookingDetails}>
        <Text style={styles.bookingDate}>
          {new Date(item.date).toLocaleDateString()} at {item.time}
        </Text>
        <Text style={styles.bookingPurpose}>{item.purpose}</Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <Button
            title="Confirm"
            onPress={() => handleConfirmBooking(item._id)}
            size="sm"
            loading={actionLoading === item._id}
            style={styles.actionButton}
          />
          <Button
            title="Cancel"
            onPress={() => handleCancelBooking(item._id)}
            variant="danger"
            size="sm"
            loading={actionLoading === item._id}
            style={styles.actionButton}
          />
        </View>
      )}

      {item.status === 'confirmed' && (
        <View style={styles.actionButtons}>
          <Button
            title="Mark Complete"
            onPress={() => handleCompleteBooking(item._id)}
            size="sm"
            loading={actionLoading === item._id}
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="calendar"
      title="No Bookings Found"
      description={
        searchQuery
          ? 'No bookings match your search.'
          : 'There are no bookings to display.'
      }
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading bookings..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, company, or email..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FilterTabs
          options={getFilterCounts()}
          selectedKey={selectedFilter}
          onSelect={(key) => setSelectedFilter(key as FilterKey)}
        />
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: colors.gray[900],
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
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
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  bookingCompany: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  bookingDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  bookingDate: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 4,
  },
  bookingPurpose: {
    fontSize: 14,
    color: colors.gray[500],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flex: 1,
  },
});

export default AdminBookingsScreen;

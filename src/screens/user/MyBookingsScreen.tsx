import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { bookingService } from '../../api';
import { Booking, BookingStatus } from '../../types';
import { colors } from '../../theme';
import { LoadingSpinner, FilterTabs, EmptyState } from '../../components/common';
import { BookingCard } from '../../components/booking';
import { BookingsStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<BookingsStackParamList>;

type FilterKey = 'all' | BookingStatus;

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');

  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingService.getMyBookings();
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

  const filteredBookings = bookings.filter((booking) => {
    if (selectedFilter === 'all') return true;
    return booking.status === selectedFilter;
  });

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('BookingDetail', { bookingId: booking._id });
  };

  const getFilterCounts = () => {
    return filterOptions.map((option) => ({
      ...option,
      count: option.key === 'all'
        ? bookings.length
        : bookings.filter((b) => b.status === option.key).length,
    }));
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <BookingCard
      booking={item}
      onPress={() => handleBookingPress(item)}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="calendar"
      title={selectedFilter === 'all' ? 'No Bookings Yet' : `No ${selectedFilter} Bookings`}
      description={
        selectedFilter === 'all'
          ? 'You haven\'t made any bookings yet. Schedule a meeting with our team to get started.'
          : `You don't have any ${selectedFilter} bookings.`
      }
      actionLabel={selectedFilter === 'all' ? 'Book Now' : undefined}
      onAction={
        selectedFilter === 'all'
          ? () => navigation.getParent()?.navigate('HomeTab', { screen: 'Booking' })
          : undefined
      }
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading bookings..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} total
        </Text>
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
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
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
});

export default MyBookingsScreen;

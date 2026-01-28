import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme';
import { Booking, BookingStatus } from '../../types';

interface BookingCalendarProps {
  bookings: Booking[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange?: (month: { year: number; month: number }) => void;
}

const getStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case 'confirmed':
      return colors.success;
    case 'pending':
      return colors.warning;
    case 'completed':
      return colors.info;
    case 'cancelled':
      return colors.error;
    case 'rescheduled':
      return colors.primary[500];
    default:
      return colors.gray[400];
  }
};

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  selectedDate,
  onDateSelect,
  onMonthChange,
}) => {
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    // Group bookings by date
    const bookingsByDate: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      const date = booking.date.split('T')[0];
      if (!bookingsByDate[date]) {
        bookingsByDate[date] = [];
      }
      bookingsByDate[date].push(booking);
    });

    // Create marked dates with dots
    Object.entries(bookingsByDate).forEach(([date, dateBookings]) => {
      // Get unique statuses for this date
      const statuses = [...new Set(dateBookings.map((b) => b.status))];
      const dots = statuses.slice(0, 3).map((status) => ({
        key: status,
        color: getStatusColor(status),
      }));

      marked[date] = {
        dots,
        marked: true,
      };
    });

    // Mark selected date
    if (selectedDate) {
      if (marked[selectedDate]) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: colors.primary[600],
        };
      } else {
        marked[selectedDate] = {
          selected: true,
          selectedColor: colors.primary[600],
        };
      }
    }

    return marked;
  }, [bookings, selectedDate]);

  const handleDayPress = (day: DateData) => {
    onDateSelect(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    onMonthChange?.({
      year: month.year,
      month: month.month,
    });
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        markingType="multi-dot"
        markedDates={markedDates}
        enableSwipeMonths
        theme={{
          backgroundColor: colors.white,
          calendarBackground: colors.white,
          textSectionTitleColor: colors.gray[500],
          selectedDayBackgroundColor: colors.primary[600],
          selectedDayTextColor: colors.white,
          todayTextColor: colors.primary[600],
          todayBackgroundColor: colors.primary[50],
          dayTextColor: colors.gray[900],
          textDisabledColor: colors.gray[300],
          dotColor: colors.primary[600],
          selectedDotColor: colors.white,
          arrowColor: colors.primary[600],
          monthTextColor: colors.gray[900],
          indicatorColor: colors.primary[600],
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
          textMonthFontWeight: '600',
          textDayFontWeight: '400',
          textDayHeaderFontWeight: '500',
        }}
        renderArrow={(direction) => (
          direction === 'left'
            ? <ChevronLeft size={20} color={colors.primary[600]} />
            : <ChevronRight size={20} color={colors.primary[600]} />
        )}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Confirmed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Cancelled</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.gray[600],
  },
});

export default BookingCalendar;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react-native';
import { Booking } from '../../types';
import { colors } from '../../theme';
import { Card } from '../common';
import BookingStatusBadge from './BookingStatusBadge';
import { useTheme } from '../../contexts';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
}) => {
  const { theme } = useTheme();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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

  return (
    <Card
      onPress={onPress}
      style={styles.card}
      padding="md"
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.purpose, { color: theme.text }]}>{booking.purpose}</Text>
          <BookingStatusBadge status={booking.status} size="sm" />
        </View>
        {onPress && (
          <ChevronRight size={20} color={colors.gray[400]} />
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{formatDate(booking.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{formatTime(booking.time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{booking.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <User size={16} color={colors.gray[400]} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{booking.contactName}</Text>
        </View>
      </View>

      {booking.product && (
        <View style={[styles.productTag, { borderTopColor: theme.border }]}>
          <Text style={styles.productText}>{booking.product}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  purpose: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray[600],
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
});

export default BookingCard;
